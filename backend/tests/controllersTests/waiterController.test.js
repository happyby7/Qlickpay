const request = require('supertest');
const express = require('express');
const waiterController = require('src/controllers/waiter.controller');
jest.setTimeout(20000);

jest.mock('src/models/admin.model', () => ({
  findUserByEmail: jest.fn(),
}));
jest.mock('src/models/waiter.model', () => ({
  findTablesByRestaurant: jest.fn(),
  deletePendingOrdersByTable: jest.fn(),
  updateTableStatusInDb: jest.fn(),
  findWaitersByRestaurant: jest.fn(),
  findWaiterById: jest.fn(),
  insertWaiter: jest.fn(),
  deleteWaiterById: jest.fn(),
  findPendingOrdersByTable: jest.fn(),
  findOrderItemForRemoval: jest.fn(),
  updateItem: jest.fn(),
  removeOrderItemById: jest.fn(),
  updateOrderItemsTotals: jest.fn(),
  clearSessionTokenForTable: jest.fn(),
  generateSessionTokenForTable: jest.fn(),
  clearTableOrders: jest.fn(),
}));

jest.mock('pg', () => {
  const mPool = {
    connect: jest.fn().mockResolvedValue(),
    query: jest.fn().mockResolvedValue({ rows: [] }),
    end: jest.fn()
  };
  return { Pool: jest.fn(() => mPool) };
});
jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
}));

const { Pool } = require('pg');
const pool = new Pool();
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const {
  findUserByEmail,
} = require('src/models/admin.model');
const waiterModel = require('src/models/waiter.model');

describe('waiter.controller', () => {
  let app;
  beforeEach(() => {
    app = express();
    app.disable('etag'); 
    app.use(express.json());
    app.get('/tables', waiterController.getTables);
    app.patch('/tables/:table_id', waiterController.updateTableStatus);
    app.get('/waiters', waiterController.getWaiters);
    app.post('/waiters', waiterController.registerWaiter);
    app.delete('/waiters/:id', waiterController.deleteWaiter);
    app.patch('/orders/item', waiterController.updateOrderItem);
    app.post('/tables/session-token', waiterController.generateTableSessionToken);
    app.post('/tables/clear', waiterController.clearTable);
    jest.clearAllMocks();  
    jest.resetModules();
    process.env.SESSION_SECRET = 'testsecret';
  });

  describe('getTables', () => {
    it('should return 400 if missing restaurantId', async () => {
      const res = await request(app).get('/tables');
      expect(res.status).toBe(400);
    });
    it('should return tables', async () => {
      waiterModel.findTablesByRestaurant.mockResolvedValue([{ id: 1 }]);
      const res = await request(app).get('/tables?restaurantId=1');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
    it('should handle errors', async () => {
      waiterModel.findTablesByRestaurant.mockRejectedValue(new Error('fail'));
      const res = await request(app).get('/tables?restaurantId=1');
      expect(res.status).toBe(500);
    });
  });

  describe('updateTableStatus', () => {
    it('should return 400 for invalid status', async () => {
      const res = await request(app).patch('/tables/1').send({ status: 'invalid' });
      expect(res.status).toBe(400);
    });
    it('should update table status and clean orders', async () => {
      pool.query.mockResolvedValue();
      waiterModel.findPendingOrdersByTable.mockResolvedValue([{ id: 1 }]);
      waiterModel.deletePendingOrdersByTable.mockResolvedValue();
      waiterModel.updateTableStatusInDb.mockResolvedValue();
      const res = await request(app).patch('/tables/1').send({ status: 'available' });
      expect(pool.query).toHaveBeenCalledWith('BEGIN');
      expect(pool.query).toHaveBeenCalledWith('COMMIT');
      expect(res.status).toBe(200);
    });
    it('should handle errors and rollback', async () => {
      pool.query.mockResolvedValue();
      waiterModel.findPendingOrdersByTable.mockRejectedValue(new Error('fail'));
      const res = await request(app).patch('/tables/1').send({ status: 'available' });
      expect(pool.query).toHaveBeenCalledWith('ROLLBACK');
      expect(res.status).toBe(500);
    });

    // Cobertura línea 155-156: error en deletePendingOrdersByTable
    it('should handle errors in deletePendingOrdersByTable and rollback', async () => {
      pool.query.mockResolvedValue();
      waiterModel.findPendingOrdersByTable.mockResolvedValue([{ id: 1 }]);
      waiterModel.deletePendingOrdersByTable.mockRejectedValue(new Error('fail'));
      const res = await request(app).patch('/tables/1').send({ status: 'available' });
      expect(pool.query).toHaveBeenCalledWith('ROLLBACK');
      expect(res.status).toBe(500);
    });

    // Cobertura línea 165: error en updateTableStatusInDb
    it('should handle errors in updateTableStatusInDb and rollback', async () => {
      pool.query.mockResolvedValue();
      waiterModel.findPendingOrdersByTable.mockResolvedValue([{ id: 1 }]);
      waiterModel.deletePendingOrdersByTable.mockResolvedValue();
      waiterModel.updateTableStatusInDb.mockRejectedValue(new Error('fail'));
      const res = await request(app).patch('/tables/1').send({ status: 'available' });
      expect(pool.query).toHaveBeenCalledWith('ROLLBACK');
      expect(res.status).toBe(500);
    });
  });

  describe('getWaiters', () => {
    it('should return 400 if missing restaurantId', async () => {
      const res = await request(app).get('/waiters');
      expect(res.status).toBe(400);
    });
    it('should return waiters', async () => {
      waiterModel.findWaitersByRestaurant.mockResolvedValue([{ id: 1 }]);
      const res = await request(app).get('/waiters?restaurantId=1');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
    it('should handle errors', async () => {
      waiterModel.findWaitersByRestaurant.mockRejectedValue(new Error('fail'));
      const res = await request(app).get('/waiters?restaurantId=1');
      expect(res.status).toBe(500);
    });
  });

  describe('registerWaiter', () => {
    it('should return 400 if missing fields', async () => {
      const res = await request(app).post('/waiters').send({});
      expect(res.status).toBe(400);
    });
    it('should return 409 if email exists', async () => {
      bcrypt.hash.mockResolvedValue('hash');
      findUserByEmail.mockResolvedValue(true);
      const res = await request(app).post('/waiters').send({
        restaurantId: 1, fullName: 'A', email: 'a', phone: '1', password: 'p'
      });
      expect(res.status).toBe(409);
    });
    it('should register waiter', async () => {
      bcrypt.hash.mockResolvedValue('hash');
      findUserByEmail.mockResolvedValue(false);
      waiterModel.insertWaiter.mockResolvedValue();
      const res = await request(app).post('/waiters').send({
        restaurantId: 1, fullName: 'A', email: 'a', phone: '1', password: 'p'
      });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
    it('should handle errors', async () => {
      bcrypt.hash.mockResolvedValue('hash');
      findUserByEmail.mockRejectedValue(new Error('fail'));
      const res = await request(app).post('/waiters').send({
        restaurantId: 1, fullName: 'A', email: 'a', phone: '1', password: 'p'
      });
      expect(res.status).toBe(500);
    });
  });

  describe('deleteWaiter', () => {
    it('should return 404 if waiter not found', async () => {
      waiterModel.findWaiterById.mockResolvedValue(null);
      const res = await request(app).delete('/waiters/1');
      expect(res.status).toBe(404);
    });
    it('should delete waiter', async () => {
      waiterModel.findWaiterById.mockResolvedValue({ id: 1 });
      waiterModel.deleteWaiterById.mockResolvedValue();
      const res = await request(app).delete('/waiters/1');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
    it('should handle errors', async () => {
      waiterModel.findWaiterById.mockRejectedValue(new Error('fail'));
      const res = await request(app).delete('/waiters/1');
      expect(res.status).toBe(500);
    });
  });

  describe('updateOrderItem', () => {
    it('should return 400 if missing params', async () => {
      const res = await request(app).patch('/orders/item').send({});
      expect(res.status).toBe(400);
    });
    it('should return 400 if invalid quantity', async () => {
      const res = await request(app).patch('/orders/item').send({
        restaurantId: 1, tableId: 1, itemName: 'A', removalQuantity: 0
      });
      expect(res.status).toBe(400);
    });
    it('should return 404 if no pending orders', async () => {
      pool.query.mockResolvedValue();
      waiterModel.findPendingOrdersByTable.mockResolvedValue([]);
      const res = await request(app).patch('/orders/item').send({
        restaurantId: 1, tableId: 1, itemName: 'A', removalQuantity: 1
      });
      expect(pool.query).toHaveBeenCalledWith('ROLLBACK');
      expect(res.status).toBe(404);
    });
    it('should update order item and return success', async () => {
      pool.query.mockResolvedValue();
      waiterModel.findPendingOrdersByTable.mockResolvedValue([{ id: 1 }]);
      waiterModel.findOrderItemForRemoval.mockResolvedValue({ id: 1, quantity: 2, price: 10 });
      waiterModel.updateItem.mockResolvedValue();
      waiterModel.updateOrderItemsTotals.mockResolvedValue();
      waiterModel.findPendingOrdersByTable.mockResolvedValueOnce([{ id: 1 }]).mockResolvedValueOnce([]);
      waiterModel.clearSessionTokenForTable.mockResolvedValue();
      const res = await request(app).patch('/orders/item').send({
        restaurantId: 1, tableId: 1, itemName: 'A', removalQuantity: 1
      });
      expect(pool.query).toHaveBeenCalledWith('COMMIT');
      expect(res.status).toBe(200);
    });
    it('should handle errors and rollback', async () => {
      pool.query.mockResolvedValue();
      waiterModel.findPendingOrdersByTable.mockRejectedValue(new Error('fail'));
      const res = await request(app).patch('/orders/item').send({
        restaurantId: 1, tableId: 1, itemName: 'A', removalQuantity: 1
      });
      expect(pool.query).toHaveBeenCalledWith('ROLLBACK');
      expect(res.status).toBe(500);
    });
  });

  describe('generateTableSessionToken', () => {
    it('should return 400 if missing params', async () => {
      const res = await request(app).post('/tables/session-token').send({});
      expect(res.status).toBe(400);
    });
    it('should generate token and return it', async () => {
      waiterModel.generateSessionTokenForTable.mockResolvedValue();
      const res = await request(app).post('/tables/session-token').send({ restaurantId: 1, tableId: 2 });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).not.toHaveLength(0);
    });
    it('should handle errors', async () => {
      waiterModel.generateSessionTokenForTable.mockRejectedValue(new Error('fail'));
      const res = await request(app).post('/tables/session-token').send({ restaurantId: 1, tableId: 2 });
      expect(res.status).toBe(500);
    });
  });

  describe('clearTable', () => {
    it('should return 400 if params invalid', async () => {
      const res = await request(app).post('/tables/clear').send({});
      expect(res.status).toBe(400);
    });
    it('should clear table and return success', async () => {
      waiterModel.clearSessionTokenForTable.mockResolvedValue();
      waiterModel.clearTableOrders.mockResolvedValue();
      const res = await request(app).post('/tables/clear').send({ restaurantId: 1, tableId: 2 });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
    it('should handle errors', async () => {
      waiterModel.clearSessionTokenForTable.mockRejectedValue(new Error('fail'));
      const res = await request(app).post('/tables/clear').send({ restaurantId: 1, tableId: 2 });
      expect(res.status).toBe(500);
    });
  });
});