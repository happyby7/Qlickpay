const request = require('supertest');
const express = require('express');

describe('menu.routes', () => {
  let app;
  let getMenuByRestaurant, addMenuItem, deleteMenuItem;
  let authenticate, checkRole;
  let menuRoutes;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    
    jest.mock('src/controllers/menu.controller', () => ({
      getMenuByRestaurant: jest.fn((req, res) => res.json({ called: 'getMenuByRestaurant' })),
      addMenuItem: jest.fn((req, res) => res.json({ called: 'addMenuItem' })),
      deleteMenuItem: jest.fn((req, res) => res.json({ called: 'deleteMenuItem' })),
    }));
    jest.mock('src/middlewares/auth.middleware', () => ({
      authenticate: jest.fn((req, res, next) => next()),
      checkRole: jest.fn(() => (req, res, next) => next()),
    }));

    ({ getMenuByRestaurant, addMenuItem, deleteMenuItem } =
          require('src/controllers/menu.controller'));
    ({ authenticate, checkRole } =
          require('src/middlewares/auth.middleware'));
    menuRoutes = require('src/routes/menu.routes');

    app = express();
    app.disable('etag');
    app.use(express.json());
    app.use('/menu', menuRoutes);
    
  });

  it('should call getMenuByRestaurant on GET /menu/:restaurantId', async () => {
    const res = await request(app).get('/menu/1');
    expect(getMenuByRestaurant).toHaveBeenCalled();
    expect(res.body.called).toBe('getMenuByRestaurant');
  });

  it('should call authenticate, checkRole, and addMenuItem on POST /menu', async () => {
    const res = await request(app).post('/menu').send({});
    expect(authenticate).toHaveBeenCalled();
    expect(checkRole).toHaveBeenCalledWith('owner');
    expect(addMenuItem).toHaveBeenCalled();
    expect(res.body.called).toBe('addMenuItem');
  });

  it('should call authenticate, checkRole, and deleteMenuItem on DELETE /menu/:itemId', async () => {
    const res = await request(app).delete('/menu/123');
    expect(authenticate).toHaveBeenCalled();
    expect(checkRole).toHaveBeenCalledWith('owner');
    expect(deleteMenuItem).toHaveBeenCalled();
    expect(res.body.called).toBe('deleteMenuItem');
  });
});