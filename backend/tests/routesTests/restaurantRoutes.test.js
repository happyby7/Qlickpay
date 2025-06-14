const request = require('supertest');
const express = require('express');

describe('restaurant.routes', () => {
  let app;
  let getRestaurants;
  let restaurantRoutes;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();  
 
    jest.mock('src/controllers/restaurant.controller', () => ({
      getRestaurants: jest.fn((req, res) => res.json({ called: 'getRestaurants' })),
    }));

    ({ getRestaurants } = require('src/controllers/restaurant.controller'));
    restaurantRoutes = require('src/routes/restaurant.routes');
    
    app = express();
    app.disable('etag');
    app.use(express.json());
    app.use('/restaurants', restaurantRoutes);
    
  });

  it('should call getRestaurants on GET /restaurants/all', async () => {
    const res = await request(app).get('/restaurants/all');
    expect(getRestaurants).toHaveBeenCalled();
    expect(res.body.called).toBe('getRestaurants');
  });
});