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

jest.mock('uuid', () => ({
  v4: jest.fn().mockReturnValue('mock-uuid')
}));

describe('orders.model', () => {
  let ordersModel, mPool;

  beforeEach(() => {
    jest.resetModules();
    ordersModel = require('src/models/orders.model');
    mPool = require('pg').mPool;
    jest.clearAllMocks();
    mPool.query.mockReset();
  });

  describe('findTableRestaurant', () => {
    it('should return restaurant_id if found', async () => {
      mPool.query.mockResolvedValue({ rows: [{ restaurant_id: 10 }] });
      const id = await ordersModel.findTableRestaurant(1);
      expect(mPool.query).toHaveBeenCalledWith(
        expect.stringContaining('FROM tables'),
        [1]
      );
      expect(id).toBe(10);
    });

    it('should return null if not found', async () => {
      mPool.query.mockResolvedValue({ rows: [] });
      const id = await ordersModel.findTableRestaurant(1);
      expect(id).toBeNull();
    });
  });

  describe('fetchMenuItem', () => {
    it('should return menu item if found', async () => {
      mPool.query.mockResolvedValue({ rows: [{ price: 5, restaurant_id: 1 }] });
      const item = await ordersModel.fetchMenuItem(2);
      expect(mPool.query).toHaveBeenCalledWith(
        expect.stringContaining('FROM menu_items'),
        [2]
      );
      expect(item).toEqual({ price: 5, restaurant_id: 1 });
    });

    it('should return null if not found', async () => {
      mPool.query.mockResolvedValue({ rows: [] });
      const item = await ordersModel.fetchMenuItem(2);
      expect(item).toBeNull();
    });
  });

  describe('insertOrder', () => {
    it('should insert order with correct params', async () => {
      mPool.query.mockResolvedValue();
      await ordersModel.insertOrder({
        orderId: 'id',
        table_id: 1,
        user_id: 2,
        order_type: 'qr',
        totalPrice: 10
      });
      expect(mPool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO orders'),
        ['id', 1, 2, 'qr', 10]
      );
    });
  });

  describe('insertOrderItems', () => {
    it('should insert order items with correct placeholders', async () => {
      mPool.query.mockResolvedValue();
      const items = [
        ['oid', 1, 2, 20],
        ['oid', 2, 1, 10]
      ];
      await ordersModel.insertOrderItems(items);
      expect(mPool.query).toHaveBeenCalled();
      const [query, values] = mPool.query.mock.calls[0];
      expect(query).toMatch(/INSERT INTO order_items/);
      expect(values).toEqual(['oid', 1, 2, 20, 'oid', 2, 1, 10]);
    });
  });

  describe('getStatusByTable', () => {
    it('should return status if found', async () => {
      mPool.query.mockResolvedValue({ rows: [{ status: 'occupied' }] });
      const status = await ordersModel.getStatusByTable(1, 2);
      expect(mPool.query).toHaveBeenCalledWith(
        expect.stringContaining('FROM tables'),
        [2, 1]
      );
      expect(status).toBe('occupied');
    });

    it('should return null if not found', async () => {
      mPool.query.mockResolvedValue({ rows: [] });
      const status = await ordersModel.getStatusByTable(1, 2);
      expect(status).toBeNull();
    });
  });

  it('should export uuidv4', () => {
    expect(typeof ordersModel.uuidv4).toBe('function');
    expect(ordersModel.uuidv4()).toBe('mock-uuid');
  });
});