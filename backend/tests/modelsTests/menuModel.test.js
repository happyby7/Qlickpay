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

describe('menu.model', () => {
  let menuModel, mPool;

  beforeEach(() => {
    jest.resetModules();
    menuModel = require('src/models/menu.model');
    mPool = require('pg').mPool;
    jest.clearAllMocks();
    mPool.query.mockReset();
  });

  describe('findMenuByRestaurant', () => {
    it('should return menu items for restaurant', async () => {
      mPool.query.mockResolvedValue({ rows: [{ id: 1, name: 'Taco' }] });
      const rows = await menuModel.findMenuByRestaurant(1);
      expect(mPool.query).toHaveBeenCalledWith(expect.stringContaining('FROM menu_items'), [1]);
      expect(rows).toEqual([{ id: 1, name: 'Taco' }]);
    });
  });

  describe('createMenuItem', () => {
    it('should insert menu item with correct params', async () => {
      mPool.query.mockResolvedValue();
      await menuModel.createMenuItem({
        restaurantId: 1,
        name: 'Taco',
        description: 'desc',
        price: 10,
        category: 'main'
      });
      expect(mPool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO menu_items'),
        [1, 'Taco', 'desc', 10, 'main']
      );
    });
  });

  describe('removeMenuItem', () => {
    it('should delete menu item by id', async () => {
      mPool.query.mockResolvedValue();
      await menuModel.removeMenuItem(5);
      expect(mPool.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM menu_items'),
        [5]
      );
    });
  });
});