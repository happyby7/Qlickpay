const request = require('supertest');
const express = require('express');

describe('qr.routes', () => {
  let app;
  let generateQR, getTableBill;
  let authenticate, checkRole;
  let qrRoutes;  

  beforeEach(() => {
    jest.clearAllMocks();  
    jest.resetModules();

    jest.mock('src/controllers/qr.controller', () => ({
      generateQR: jest.fn((req, res) => res.json({ called: 'generateQR' })),
      getTableBill: jest.fn((req, res) => res.json({ called: 'getTableBill' })),
    }));
    jest.mock('src/middlewares/auth.middleware', () => ({
      authenticate: jest.fn((req, res, next) => next()),
      checkRole: jest.fn(() => (req, res, next) => next()),
    }));

    ({ generateQR, getTableBill } = require('src/controllers/qr.controller'));
    ({ authenticate, checkRole }   = require('src/middlewares/auth.middleware'));
    qrRoutes = require('src/routes/qr.routes');

    app = express();
    app.disable('etag');
    app.use(express.json());
    app.use('/qr', qrRoutes);
 
  });

  it('should call authenticate, checkRole, and generateQR on POST /qr/generate', async () => {
    const res = await request(app).post('/qr/generate').send({});
    expect(authenticate).toHaveBeenCalled();
    expect(checkRole).toHaveBeenCalledWith('owner');
    expect(generateQR).toHaveBeenCalled();
    expect(res.body.called).toBe('generateQR');
  });

  it('should call getTableBill on GET /qr/bill/:restaurantId/:tableId', async () => {
    const res = await request(app).get('/qr/bill/1/2');
    expect(getTableBill).toHaveBeenCalled();
    expect(res.body.called).toBe('getTableBill');
  });
});