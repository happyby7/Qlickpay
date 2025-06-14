const request = require('supertest');
const express = require('express');

describe('orders.routes', () => {
  let app;
  let placeOrder, getTableStatus, ordersRoutes;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();  

    jest.mock('src/controllers/orders.controller', () => ({
      placeOrder: jest.fn((req, res) => res.json({ called: 'placeOrder' })),
      getTableStatus: jest.fn((req, res) => res.json({ called: 'getTableStatus' })),
    }));

    ({ placeOrder, getTableStatus } = require('src/controllers/orders.controller'));
    ordersRoutes = require('src/routes/orders.routes');

    app = express();
    app.disable('etag');
    app.use(express.json());
    app.use('/orders', ordersRoutes);
    
  });

  it('should call placeOrder on POST /orders', async () => {
    const res = await request(app).post('/orders').send({});
    expect(placeOrder).toHaveBeenCalled();
    expect(res.body.called).toBe('placeOrder');
  });

  it('should call getTableStatus on GET /orders/status-table/:restaurantId/:tableId', async () => {
    const res = await request(app).get('/orders/status-table/1/2');
    expect(getTableStatus).toHaveBeenCalled();
    expect(res.body.called).toBe('getTableStatus');
  });
});