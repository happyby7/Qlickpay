const request = require('supertest');
const express = require('express');
const qrController = require('../../src/controllers/qr.controller');

jest.mock('../../src/models/qr.model', () => ({
  ensureQRCode: jest.fn(),
  upsertTableQR: jest.fn(),
  getTableId: jest.fn(),
  fetchTableBill: jest.fn(),
  markTableOccupiedIfNeeded: jest.fn(),
}));
jest.mock('qrcode', () => ({
  toDataURL: jest.fn(),
}));

const { ensureQRCode, upsertTableQR, getTableId, fetchTableBill, markTableOccupiedIfNeeded } = require('../../src/models/qr.model');
const QRCode = require('qrcode');

describe('qr.controller', () => {
  let app;
  const OLD_ENV = process.env;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.post('/qr/generate', qrController.generateQR);
    app.get('/qr/bill/:restaurantId/:tableId', qrController.getTableBill);
    jest.clearAllMocks();
    process.env = { ...OLD_ENV, FRONTEND_URL: 'http://frontend' };
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  describe('generateQR', () => {
    it('should return 400 if missing or invalid params', async () => {
      let res = await request(app).post('/qr/generate').send({});
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);

      res = await request(app).post('/qr/generate').send({ restaurantId: 1, tableCount: 0 });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should generate QR codes and return them', async () => {
      ensureQRCode.mockResolvedValue('qrid');
      upsertTableQR.mockResolvedValue();
      getTableId.mockResolvedValue('tid');
      QRCode.toDataURL.mockResolvedValue('data:image/png;base64,abc');

      const res = await request(app).post('/qr/generate').send({ restaurantId: 1, tableCount: 2 });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.qrCodes)).toBe(true);
      expect(res.body.qrCodes.length).toBe(2);
    });

    it('should handle errors and return 500', async () => {
      ensureQRCode.mockRejectedValue(new Error('fail'));
      const res = await request(app).post('/qr/generate').send({ restaurantId: 1, tableCount: 1 });
      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
    });
  });

  describe('getTableBill', () => {
    it('should return bills and set headers', async () => {
      fetchTableBill.mockResolvedValue([{ id: 1 }]);
      markTableOccupiedIfNeeded.mockResolvedValue();

      const res = await request(app).get('/qr/bill/1/2');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.bills)).toBe(true);
      expect(res.headers['cache-control']).toBeDefined();
      expect(res.headers['pragma']).toBeDefined();
      expect(res.headers['expires']).toBeDefined();
    });

    it('should handle errors and return 500', async () => {
      fetchTableBill.mockRejectedValue(new Error('fail'));
      const res = await request(app).get('/qr/bill/1/2');
      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
    });
  });
});