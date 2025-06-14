jest.mock('pg', () => {
  const mPool = {
    query: jest.fn().mockResolvedValue({ rows: [] }),
    connect: jest.fn().mockResolvedValue({
      query: jest.fn().mockResolvedValue({ rows: [] }),
      release: jest.fn()
    }),
    end: jest.fn()
  };
  return { Pool: jest.fn(() => mPool), __esModule: true, mPool };
});

jest.mock('src/config/db.config', () => ({
  query: jest.fn()
}));

describe('restaurant.model', () => {
  let restaurantModel, mPool;

  beforeEach(() => {
    jest.resetModules();
    restaurantModel = require('src/models/restaurant.model');
    mPool = require('pg').mPool;
    jest.clearAllMocks();
    mPool.query.mockReset();
  });

  describe('findAllRestaurants', () => {
    it('should return all restaurants', async () => {
      mPool.query.mockResolvedValue({
        rows: [
          { id: 1, name: 'A' },
          { id: 2, name: 'B' }
        ]
      });
      const rows = await restaurantModel.findAllRestaurants();
      expect(mPool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT id, name FROM restaurants')
      );
      expect(rows).toEqual([
        { id: 1, name: 'A' },
        { id: 2, name: 'B' }
      ]);
    });

    it('should return empty array if no restaurants', async () => {
      mPool.query.mockResolvedValue({ rows: [] });
      const rows = await restaurantModel.findAllRestaurants();
      expect(rows).toEqual([]);
    });
  });
});