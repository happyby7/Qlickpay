const request = require('supertest');
const express = require('express');
const ordersController = require('../../src/controllers/orders.controller');

jest.mock('pg', () => {
  const mPool = {
    query: jest.fn(),
  };
  return { Pool: jest.fn(() => mPool) };
});
jest.mock('../../src/models/orders.model', () => ({
  uuidv4: jest.fn(),
  findTableRestaurant: jest.fn(),
  insertOrder: jest.fn(),
  insertOrderItems: jest.fn(),
  fetchMenuItem: jest.fn(),
  getStatusByTable: jest.fn(),
}));

const { Pool } = require('pg');
const pool = new Pool();
const {
  uuidv4,
  findTableRestaurant,
  insertOrder,
  insertOrderItems,
  fetchMenuItem,
  getStatusByTable,
} = require('../../src/models/orders.model');

describe('orders.controller', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.post('/orders', ordersController.placeOrder);
    app.get('/orders/status/:restaurantId/:tableId', ordersController.getTableStatus);
    jest.clearAllMocks();
    uuidv4.mockReturnValue('order-uuid');
  });

  describe('placeOrder', () => {
    it('should return 400 if missing table_id or items', async () => {
      let res = await request(app).post('/orders').send({});
      expect(res.status).toBe(400);

      res = await request(app).post('/orders').send({ table_id: 1, items: [] });
      expect(res.status).toBe(400);
    });

    it('should return 404 if table not found', async () => {
      findTableRestaurant.mockResolvedValue(null);
      const res = await request(app).post('/orders').send({ table_id: 1, items: [{ menu_item_id: 1, quantity: 1 }] });
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 if no valid items', async () => {
      findTableRestaurant.mockResolvedValue(10);
      fetchMenuItem.mockResolvedValue(null);
      const res = await request(app).post('/orders').send({ table_id: 1, items: [{ menu_item_id: 1, quantity: 1 }] });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should place order and return success', async () => {
      findTableRestaurant.mockResolvedValue(10);
      fetchMenuItem.mockResolvedValue({ menu_item_id: 1, price: 5, restaurant_id: 10 });
      pool.query.mockResolvedValue();
      insertOrder.mockResolvedValue();
      insertOrderItems.mockResolvedValue();

      const res = await request(app).post('/orders').send({
        table_id: 1,
        items: [{ menu_item_id: 1, quantity: 2 }],
      });

      expect(pool.query).toHaveBeenCalledWith('BEGIN');
      expect(insertOrder).toHaveBeenCalled();
      expect(insertOrderItems).toHaveBeenCalled();
      expect(pool.query).toHaveBeenCalledWith('COMMIT');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.orderId).toBe('order-uuid');
    });

    it('should call websocket events if global.websocket exists', async () => {
      findTableRestaurant.mockResolvedValue(10);
      fetchMenuItem.mockResolvedValue({ menu_item_id: 1, price: 5, restaurant_id: 10 });
      pool.query.mockResolvedValue();
      insertOrder.mockResolvedValue();
      insertOrderItems.mockResolvedValue();

      global.websocket = {
        newOrderEvent: jest.fn(),
        updateStatusTable: jest.fn(),
      };

      const res = await request(app).post('/orders').send({
        table_id: 1,
        items: [{ menu_item_id: 1, quantity: 2 }],
      });

      expect(global.websocket.newOrderEvent).toHaveBeenCalled();
      expect(global.websocket.updateStatusTable).toHaveBeenCalled();
      expect(res.status).toBe(200);

      delete global.websocket;
    });

    it('should handle errors and return 500', async () => {
      findTableRestaurant.mockResolvedValue(10);
      fetchMenuItem.mockResolvedValue({ menu_item_id: 1, price: 5, restaurant_id: 10 });
      pool.query.mockResolvedValue();
      insertOrder.mockRejectedValue(new Error('DB error'));

      const res = await request(app).post('/orders').send({
        table_id: 1,
        items: [{ menu_item_id: 1, quantity: 2 }],
      });

      expect(pool.query).toHaveBeenCalledWith('ROLLBACK');
      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
    });
  });

  describe('getTableStatus', () => {
    it('should return 400 if missing params', async () => {
      const res = await request(app).get('/orders/status//');
      expect(res.status).toBe(404); // Express route not matched
    });

    it('should return 404 if table not found', async () => {
      getStatusByTable.mockResolvedValue(null);
      const res = await request(app).get('/orders/status/1/2');
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Mesa no encontrada.');
    });

    it('should return status if found', async () => {
      getStatusByTable.mockResolvedValue('occupied');
      const res = await request(app).get('/orders/status/1/2');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('occupied');
    });

    it('should handle errors and return 500', async () => {
      getStatusByTable.mockRejectedValue(new Error('DB error'));
      const res = await request(app).get('/orders/status/1/2');
      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Error al obtener estado de la mesa.');
    });
  });
});