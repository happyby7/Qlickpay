const request = require('supertest');
const express = require('express');
const restaurantController = require('../../src/controllers/restaurant.controller');

jest.mock('../../src/models/restaurant.model', () => ({
  findAllRestaurants: jest.fn(),
}));

const { findAllRestaurants } = require('../../src/models/restaurant.model');

describe('restaurant.controller', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.get('/restaurants', restaurantController.getRestaurants);
    jest.clearAllMocks();
  });

  it('should return restaurants on success', async () => {
    findAllRestaurants.mockResolvedValue([{ id: 1, name: 'Testaurant' }]);
    const res = await request(app).get('/restaurants');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.restaurants)).toBe(true);
  });

  it('should handle errors and return 500', async () => {
    findAllRestaurants.mockRejectedValue(new Error('fail'));
    const res = await request(app).get('/restaurants');
    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/Error al obtener los restaurantes/);
  });
});