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

describe('auth.model', () => {
  let authModel, mPool;

  beforeEach(() => {
    jest.resetModules();
    authModel = require('src/models/auth.model');
    mPool = require('pg').mPool;
    jest.clearAllMocks();
    mPool.query.mockReset();
  });

  describe('createUser', () => {
    it('should insert user with correct params', async () => {
      mPool.query.mockResolvedValue();
      await authModel.createUser({
        full_name: 'n',
        email: 'e',
        password_hash: 'h',
        role: 'r'
      });
      expect(mPool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO users'),
        ['n', 'e', 'h', 'r']
      );
    });
  });

  describe('findRestaurantIdByUserId', () => {
    it('should return restaurant_id if found', async () => {
      mPool.query.mockResolvedValue({ rows: [{ restaurant_id: 5 }] });
      const id = await authModel.findRestaurantIdByUserId(1);
      expect(mPool.query).toHaveBeenCalledWith(
        expect.stringContaining('FROM user_restaurant'),
        [1]
      );
      expect(id).toBe(5);
    });

    it('should return null if not found', async () => {
      mPool.query.mockResolvedValue({ rows: [] });
      const id = await authModel.findRestaurantIdByUserId(1);
      expect(id).toBeNull();
    });
  });

  describe('getTokenTable', () => {
    it('should return token row if found', async () => {
      mPool.query.mockResolvedValue({
        rows: [{ session_token: 'abc', session_expires_at: 'date' }]
      });
      const row = await authModel.getTokenTable({
        restaurantId: 1,
        tableId: 2
      });
      expect(mPool.query).toHaveBeenCalledWith(
        expect.stringContaining('FROM tables'),
        [1, 2]
      );
      expect(row).toEqual({
        session_token: 'abc',
        session_expires_at: 'date'
      });
    });

    it('should return null if not found', async () => {
      mPool.query.mockResolvedValue({ rows: [] });
      const row = await authModel.getTokenTable({
        restaurantId: 1,
        tableId: 2
      });
      expect(row).toBeNull();
    });
  });
});