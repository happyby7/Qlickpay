const request = require('supertest');
const express = require('express');
const paymentsController = require('../../src/controllers/payments.controller');

jest.mock('stripe', () => {
  const checkout = {
    sessions: {
      create: jest.fn(),
      retrieve: jest.fn(),
    },
  };
  return jest.fn(() => ({ checkout }));
});
jest.mock('../../src/models/payments.model', () => ({
  createCheckoutSession: {
    isActive: jest.fn(),
    lock: jest.fn(),
  },
  releaseCheckoutLock: jest.fn(),
  cancelCheckoutLock: jest.fn(),
  handleSuccessfulPayment: jest.fn(),
}));

const stripe = require('stripe');
const { 
  createCheckoutSession, 
  releaseCheckoutLock, 
  cancelCheckoutLock, 
  handleSuccessfulPayment 
} = require('../../src/models/payments.model');

describe('payments.controller', () => {
  let app;
  const OLD_ENV = process.env;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.post('/payments/checkout', paymentsController.StripeCheckoutSession);
    app.get('/payments/success', paymentsController.StripeConfirmSuccess);
    app.get('/payments/cancel-checkout', paymentsController.cancelCheckoutSession);

    jest.clearAllMocks();
    process.env = { ...OLD_ENV, FRONTEND_URL: 'http://frontend', BACKEND_URL: 'http://backend' };
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  describe('StripeCheckoutSession', () => {
    it('should return 409 if session is active', async () => {
      createCheckoutSession.isActive.mockReturnValue(true);
      const res = await request(app)
        .post('/payments/checkout')
        .send({ amount: 10, orderId: 'order-1-2', metadata: {} });
      expect(res.status).toBe(409);
      expect(res.body.error).toMatch(/Ya hay un pago en curso/);
    });

    it('should create a checkout session and return url', async () => {
      createCheckoutSession.isActive.mockReturnValue(false);
      stripe().checkout.sessions.create.mockResolvedValue({ id: 'sess_123', url: 'http://stripe-session' });

      const res = await request(app)
        .post('/payments/checkout')
        .send({ amount: 10, orderId: 'order-1-2', metadata: { foo: 'bar' } });

      expect(stripe().checkout.sessions.create).toHaveBeenCalled();
      expect(createCheckoutSession.lock).toHaveBeenCalled();
      expect(res.status).toBe(200);
      expect(res.body.url).toBe('http://stripe-session');
    });

    it('should handle errors and return 500', async () => {
      createCheckoutSession.isActive.mockReturnValue(false);
      stripe().checkout.sessions.create.mockRejectedValue(new Error('Stripe error'));

      const res = await request(app)
        .post('/payments/checkout')
        .send({ amount: 10, orderId: 'order-1-2', metadata: {} });

      expect(res.status).toBe(500);
      expect(res.body.error).toMatch(/No se pudo crear la sesión de pago/);
    });
  });

  describe('StripeConfirmSuccess', () => {
    it('should redirect if session_id is missing', async () => {
      const res = await request(app).get('/payments/success');
      expect(res.status).toBe(302);
      expect(res.headers.location).toMatch(/Falta el session_id/);
    });

    it('should confirm payment and return success', async () => {
      stripe().checkout.sessions.retrieve.mockResolvedValue({
        metadata: { table_id: '2', mode: 'pay', foo: 'bar' }
      });
      handleSuccessfulPayment.mockResolvedValue();

      const res = await request(app).get('/payments/success?session_id=sess_123');
      expect(stripe().checkout.sessions.retrieve).toHaveBeenCalledWith('sess_123');
      expect(handleSuccessfulPayment).toHaveBeenCalledWith(2, 'pay', { table_id: '2', mode: 'pay', foo: 'bar' });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should redirect on error', async () => {
      stripe().checkout.sessions.retrieve.mockRejectedValue(new Error('Stripe error'));
      const res = await request(app).get('/payments/success?session_id=sess_123');
      expect(res.status).toBe(302);
      expect(res.headers.location).toMatch(/Stripe error/);
    });

    it('should always release lock if tableId is number', async () => {
      stripe().checkout.sessions.retrieve.mockResolvedValue({
        metadata: { table_id: '2', mode: 'pay' }
      });
      handleSuccessfulPayment.mockResolvedValue();

      await request(app).get('/payments/success?session_id=sess_123');
      expect(releaseCheckoutLock).toHaveBeenCalledWith(2);
    });
  });

  describe('cancelCheckoutSession', () => {
    it('should cancel checkout lock and redirect', async () => {
      const res = await request(app).get('/payments/cancel-checkout?orderId=order-1-2');
      expect(cancelCheckoutLock).toHaveBeenCalledWith(2);
      expect(res.status).toBe(302);
      expect(res.headers.location).toMatch(/orderId=order-1-2/);
    });

    it('should append error to redirect url if present', async () => {
      const res = await request(app).get('/payments/cancel-checkout?orderId=order-1-2&error=fail');
      expect(res.status).toBe(302);
      expect(res.headers.location).toMatch(/error=fail/);
    });
  });
});