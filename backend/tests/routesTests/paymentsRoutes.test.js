const request = require('supertest');
const express = require('express');

describe('payments.routes', () => {
  let app;
  let StripeCheckoutSession, StripeConfirmSuccess, cancelCheckoutSession, paymentsRoutes;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();  
    
    jest.mock('src/controllers/payments.controller.js', () => ({
      StripeCheckoutSession: jest.fn((req, res) => res.json({ called: 'StripeCheckoutSession' })),
      StripeConfirmSuccess: jest.fn((req, res) => res.json({ called: 'StripeConfirmSuccess' })),
      cancelCheckoutSession: jest.fn((req, res) => res.json({ called: 'cancelCheckoutSession' })),
    }));

    ({ StripeCheckoutSession, StripeConfirmSuccess, cancelCheckoutSession } =
      require('src/controllers/payments.controller.js'));
    paymentsRoutes = require('src/routes/payments.routes');

    app = express();
    app.disable('etag');
    app.use(express.json());
    app.use('/payments', paymentsRoutes);
    
  });

  it('should call StripeCheckoutSession on POST /payments/stripe-checkout-session', async () => {
    const res = await request(app).post('/payments/stripe-checkout-session').send({});
    expect(StripeCheckoutSession).toHaveBeenCalled();
    expect(res.body.called).toBe('StripeCheckoutSession');
  });

  it('should call StripeConfirmSuccess on GET /payments/confirm-success', async () => {
    const res = await request(app).get('/payments/confirm-success');
    expect(StripeConfirmSuccess).toHaveBeenCalled();
    expect(res.body.called).toBe('StripeConfirmSuccess');
  });

  it('should call cancelCheckoutSession on GET /payments/cancel-checkout', async () => {
    const res = await request(app).get('/payments/cancel-checkout');
    expect(cancelCheckoutSession).toHaveBeenCalled();
    expect(res.body.called).toBe('cancelCheckoutSession');
  });
});