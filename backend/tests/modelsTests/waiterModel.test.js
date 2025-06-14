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

describe('waiter.model', () => {
  let waiterModel, mPool;

  beforeEach(() => {
    jest.resetModules();
    waiterModel = require('src/models/waiter.model');
    mPool = require('pg').mPool;
    jest.clearAllMocks();
    mPool.query.mockReset();
  });

  describe('findTablesByRestaurant', () => {
    it('should return tables for restaurant', async () => {
      mPool.query.mockResolvedValue({ rows: [{ id: 1, table_number: 2 }] });
      const rows = await waiterModel.findTablesByRestaurant(1);
      expect(mPool.query).toHaveBeenCalledWith(expect.stringContaining('FROM tables t'), [1]);
      expect(rows).toEqual([{ id: 1, table_number: 2 }]);
    });
  });

  describe('findPendingOrdersByTable', () => {
    it('should return pending orders', async () => {
      mPool.query.mockResolvedValue({ rows: [{ id: 'order1' }] });
      const rows = await waiterModel.findPendingOrdersByTable(2);
      expect(mPool.query).toHaveBeenCalledWith(expect.stringContaining('FROM orders'), [2]);
      expect(rows).toEqual([{ id: 'order1' }]);
    });
  });

  describe('deletePendingOrdersByTable', () => {
    it('should delete order_items and orders', async () => {
      mPool.query.mockResolvedValue();
      await waiterModel.deletePendingOrdersByTable(['id1', 'id2']);
      expect(mPool.query).toHaveBeenCalledWith(expect.stringContaining('DELETE FROM order_items'), [['id1', 'id2']]);
      expect(mPool.query).toHaveBeenCalledWith(expect.stringContaining('DELETE FROM orders'), [['id1', 'id2']]);
    });
  });

  describe('updateTableStatusInDb', () => {
    it('should update table status', async () => {
      mPool.query.mockResolvedValue();
      await waiterModel.updateTableStatusInDb(1, 'occupied');
      expect(mPool.query).toHaveBeenCalledWith(expect.stringContaining('UPDATE tables SET status='), ['occupied', 1]);
    });
  });

  describe('findWaitersByRestaurant', () => {
    it('should return waiters for restaurant', async () => {
      mPool.query.mockResolvedValue({ rows: [{ id: 3, role: 'waiter' }] });
      const rows = await waiterModel.findWaitersByRestaurant(1);
      expect(mPool.query).toHaveBeenCalledWith(expect.stringContaining('FROM users'), [1]);
      expect(rows).toEqual([{ id: 3, role: 'waiter' }]);
    });
  });

  describe('insertWaiter', () => {
    it('should insert waiter and user_restaurant', async () => {
      mPool.query
        .mockResolvedValueOnce({ rows: [{ id: 10 }] })
        .mockResolvedValueOnce({});
      await waiterModel.insertWaiter({
        fullName: 'A', email: 'a', phone: '1', hashedPassword: 'h', restaurantId: 2
      });
      expect(mPool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO users'),
        ['A', 'a', '1', 'h']
      );
      expect(mPool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO user_restaurant'),
        [10, 2]
      );
    });
  });

  describe('findWaiterById', () => {
    it('should return waiter if found', async () => {
      mPool.query.mockResolvedValue({ rows: [{ id: 5 }] });
      const waiter = await waiterModel.findWaiterById(5);
      expect(mPool.query).toHaveBeenCalledWith(expect.stringContaining('FROM users'), [5]);
      expect(waiter).toEqual({ id: 5 });
    });
    it('should return null if not found', async () => {
      mPool.query.mockResolvedValue({ rows: [] });
      const waiter = await waiterModel.findWaiterById(5);
      expect(waiter).toBeNull();
    });
  });

  describe('deleteWaiterById', () => {
    it('should delete from user_restaurant and users', async () => {
      mPool.query.mockResolvedValue();
      await waiterModel.deleteWaiterById(7);
      expect(mPool.query).toHaveBeenCalledWith(expect.stringContaining('DELETE FROM user_restaurant'), [7]);
      expect(mPool.query).toHaveBeenCalledWith(expect.stringContaining('DELETE FROM users'), [7]);
    });
  });

  describe('findOrderItemForRemoval', () => {
    it('should return order item if found', async () => {
      mPool.query.mockResolvedValue({ rows: [{ id: 1, quantity: 2, subtotal: 10, price: 5 }] });
      const row = await waiterModel.findOrderItemForRemoval('oid', 'Taco');
      expect(mPool.query).toHaveBeenCalledWith(expect.stringContaining('FROM order_items oi'), ['oid', 'Taco']);
      expect(row).toEqual({ id: 1, quantity: 2, subtotal: 10, price: 5 });
    });
    it('should return null if not found', async () => {
      mPool.query.mockResolvedValue({ rows: [] });
      const row = await waiterModel.findOrderItemForRemoval('oid', 'Taco');
      expect(row).toBeNull();
    });
  });

  describe('updateItem', () => {
    it('should update order item', async () => {
      mPool.query.mockResolvedValue();
      await waiterModel.updateItem(1, 2, 20);
      expect(mPool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE order_items SET quantity ='),
        [2, 20, 1]
      );
    });
  });

  describe('removeOrderItemById', () => {
    it('should delete order item by id', async () => {
      mPool.query.mockResolvedValue();
      await waiterModel.removeOrderItemById(3);
      expect(mPool.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM order_items'),
        [3]
      );
    });
  });

  describe('updateOrderItemsTotals', () => {
    it('should update order total if total > 0', async () => {
      mPool.query
        .mockResolvedValueOnce({ rows: [{ total: 15 }] })
        .mockResolvedValueOnce({});
      await waiterModel.updateOrderItemsTotals(1);
      expect(mPool.query).toHaveBeenCalledWith(expect.stringContaining('SELECT COALESCE(SUM(subtotal)'), [1]);
      expect(mPool.query).toHaveBeenCalledWith(expect.stringContaining('UPDATE orders SET total_price ='), [15, 1]);
    });
    it('should delete order if total = 0', async () => {
      mPool.query
        .mockResolvedValueOnce({ rows: [{ total: 0 }] })
        .mockResolvedValueOnce({});
      await waiterModel.updateOrderItemsTotals(1);
      expect(mPool.query).toHaveBeenCalledWith(expect.stringContaining('DELETE FROM orders'), [1]);
    });
  });

  describe('clearSessionTokenForTable', () => {
    it('should update table to clear session token', async () => {
      mPool.query.mockResolvedValue();
      await waiterModel.clearSessionTokenForTable(1, 2);
      expect(mPool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE tables'),
        [2, 1]
      );
    });
  });

  describe('generateSessionTokenForTable', () => {
    it('should update table with session token and expiration', async () => {
      mPool.query.mockResolvedValue();
      await waiterModel.generateSessionTokenForTable(1, 2, 'token', 'exp');
      expect(mPool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE tables'),
        ['token', 'exp', 1, 2]
      );
    });
  });

  describe('clearTableOrders', () => {
    it('should delete orders for table', async () => {
      mPool.query.mockResolvedValue();
      await waiterModel.clearTableOrders(1, 2);
      expect(mPool.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM orders o'),
        [1, 2]
      );
    });
  });
});