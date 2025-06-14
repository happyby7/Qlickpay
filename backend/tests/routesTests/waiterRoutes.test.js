const request = require('supertest');
const express = require('express');

describe('waiter.routes', () => {
  let app;
  let waiterRoutes;
  let {
    getTables, updateTableStatus, getWaiters,
    registerWaiter, deleteWaiter,
    updateOrderItem, generateTableSessionToken, clearTable
  } = {};
  let { authenticate, checkRole } = {};


  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();  
    
    jest.mock('src/controllers/waiter.controller', () => ({
      getTables: jest.fn((req, res) => res.json({ called: 'getTables' })),
      updateTableStatus: jest.fn((req, res) => res.json({ called: 'updateTableStatus' })),
      getWaiters: jest.fn((req, res) => res.json({ called: 'getWaiters' })),
      registerWaiter: jest.fn((req, res) => res.json({ called: 'registerWaiter' })),
      deleteWaiter: jest.fn((req, res) => res.json({ called: 'deleteWaiter' })),
      updateOrderItem: jest.fn((req, res) => res.json({ called: 'updateOrderItem' })),
      generateTableSessionToken: jest.fn((req, res) => res.json({ called: 'generateTableSessionToken' })),
      clearTable: jest.fn((req, res) => res.json({ called: 'clearTable' })),
    }));

    ({
      getTables, updateTableStatus, getWaiters,
      registerWaiter, deleteWaiter,
      updateOrderItem, generateTableSessionToken, clearTable
    } = require('src/controllers/waiter.controller'));

    jest.mock('src/middlewares/auth.middleware', () => ({
      authenticate: jest.fn((req, res, next) => next()),
      checkRole: jest.fn((role) => (req, res, next) => next()),
    }));

    ({ authenticate, checkRole } = require('src/middlewares/auth.middleware'));
    waiterRoutes = require('src/routes/waiter.routes');

    app = express();
    app.disable('etag');
    app.use(express.json());
    app.use('/waiter', waiterRoutes);
    
  });

  it('should call getTables on GET /waiter/all', async () => {
    const res = await request(app).get('/waiter/all');
    expect(authenticate).toHaveBeenCalled();
    expect(checkRole).toHaveBeenCalledWith('waiter');
    expect(getTables).toHaveBeenCalled();
    expect(res.body.called).toBe('getTables');
  });

  it('should call updateTableStatus on PUT /waiter/:table_id/status', async () => {
    const res = await request(app).put('/waiter/1/status').send({});
    expect(authenticate).toHaveBeenCalled();
    expect(checkRole).toHaveBeenCalledWith('waiter');
    expect(updateTableStatus).toHaveBeenCalled();
    expect(res.body.called).toBe('updateTableStatus');
  });

  it('should call getWaiters on GET /waiter/', async () => {
    const res = await request(app).get('/waiter/');
    expect(authenticate).toHaveBeenCalled();
    expect(checkRole).toHaveBeenCalledWith('owner');
    expect(getWaiters).toHaveBeenCalled();
    expect(res.body.called).toBe('getWaiters');
  });

  it('should call registerWaiter on POST /waiter/register', async () => {
    const res = await request(app).post('/waiter/register').send({});
    expect(authenticate).toHaveBeenCalled();
    expect(checkRole).toHaveBeenCalledWith('owner');
    expect(registerWaiter).toHaveBeenCalled();
    expect(res.body.called).toBe('registerWaiter');
  });

  it('should call deleteWaiter on DELETE /waiter/:id', async () => {
    const res = await request(app).delete('/waiter/1');
    expect(authenticate).toHaveBeenCalled();
    expect(checkRole).toHaveBeenCalledWith('owner');
    expect(deleteWaiter).toHaveBeenCalled();
    expect(res.body.called).toBe('deleteWaiter');
  });

  it('should call updateOrderItem on POST /waiter/update-order-item', async () => {
    const res = await request(app).post('/waiter/update-order-item').send({});
    expect(authenticate).toHaveBeenCalled();
    expect(checkRole).toHaveBeenCalledWith('waiter');
    expect(updateOrderItem).toHaveBeenCalled();
    expect(res.body.called).toBe('updateOrderItem');
  });

  it('should call generateTableSessionToken on POST /waiter/generate-session-token-table', async () => {
    const res = await request(app).post('/waiter/generate-session-token-table').send({});
    expect(authenticate).toHaveBeenCalled();
    expect(checkRole).toHaveBeenCalledWith('waiter');
    expect(generateTableSessionToken).toHaveBeenCalled();
    expect(res.body.called).toBe('generateTableSessionToken');
  });

  it('should call clearTable on POST /waiter/clear-session-token-table', async () => {
    const res = await request(app).post('/waiter/clear-session-token-table').send({});
    expect(authenticate).toHaveBeenCalled();
    expect(checkRole).toHaveBeenCalledWith('waiter');
    expect(clearTable).toHaveBeenCalled();
    expect(res.body.called).toBe('clearTable');
  });
});