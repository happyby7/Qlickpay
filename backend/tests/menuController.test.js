const request = require('supertest');
const express = require('express');
const menuController = require('../../src/controllers/menu.controller');

jest.mock('../../src/models/menu.model', () => ({
  findMenuByRestaurant: jest.fn(),
  createMenuItem: jest.fn(),
  removeMenuItem: jest.fn(),
}));

const { findMenuByRestaurant, createMenuItem, removeMenuItem } = require('../../src/models/menu.model');

describe('menu.controller', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.get('/menu/:restaurantId', menuController.getMenuByRestaurant);
    app.post('/menu', menuController.addMenuItem);
    app.delete('/menu/:itemId', menuController.deleteMenuItem);
    jest.clearAllMocks();
  });

  describe('getMenuByRestaurant', () => {
    it('should return 400 if restaurantId is missing', async () => {
      const res = await request(app).get('/menu/');
      expect(res.status).toBe(404); // Express will not match route without param
    });

    it('should return 404 if menu is empty', async () => {
      findMenuByRestaurant.mockResolvedValue([]);
      const res = await request(app).get('/menu/1');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('should return menu items if found', async () => {
      findMenuByRestaurant.mockResolvedValue([{ id: 1, name: 'Taco' }]);
      const res = await request(app).get('/menu/1');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.menuItems)).toBe(true);
    });

    it('should handle errors and return 500', async () => {
      findMenuByRestaurant.mockRejectedValue(new Error('DB error'));
      const res = await request(app).get('/menu/1');
      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
    });
  });

  describe('addMenuItem', () => {
    it('should return 400 if missing fields', async () => {
      const res = await request(app).post('/menu').send({});
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 if price is not a number', async () => {
      const res = await request(app).post('/menu').send({
        restaurantId: 1, name: 'Taco', description: 'desc', price: 'abc', category: 'main'
      });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should add menu item and return success', async () => {
      createMenuItem.mockResolvedValue();
      const res = await request(app).post('/menu').send({
        restaurantId: 1, name: 'Taco', description: 'desc', price: 10, category: 'main'
      });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should handle errors and return 500', async () => {
      createMenuItem.mockRejectedValue(new Error('DB error'));
      const res = await request(app).post('/menu').send({
        restaurantId: 1, name: 'Taco', description: 'desc', price: 10, category: 'main'
      });
      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
    });
  });

  describe('deleteMenuItem', () => {
    it('should delete menu item and return success', async () => {
      removeMenuItem.mockResolvedValue();
      const res = await request(app).delete('/menu/1');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should handle errors and return 500', async () => {
      removeMenuItem.mockRejectedValue(new Error('DB error'));
      const res = await request(app).delete('/menu/1');
      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
    });
  });
});