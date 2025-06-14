jest.mock('stripe', () => {
  const expire = jest.fn().mockResolvedValue();
  return jest.fn(() => ({
    checkout: { sessions: { expire } }
  }));
});

jest.mock('pg', () => {
  const mClient = {
    query: jest.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
    release: jest.fn()
  };
  const mPool = {
    connect: jest.fn().mockResolvedValue(mClient),
    query: jest.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
    end: jest.fn()
  };
  return { Pool: jest.fn(() => mPool), __esModule: true, mPool, mClient };
});

describe('payments.model', () => {
  let paymentsModel, stripe, mPool, mClient;

  beforeEach(() => {
    jest.resetModules();
    paymentsModel = require('src/models/payments.model');
    stripe = require('stripe')();
    global.websocket = undefined;
    // Accede a los mocks así:
    const pg = require('pg');
    mPool = pg.mPool;
    mClient = pg.mClient;
    jest.clearAllMocks();
    mClient.query.mockReset();
    mClient.release.mockReset();
    mPool.connect.mockClear();
  });

  describe('createCheckoutSession', () => {
    it('should lock and set timeout, and expire session after timeout', () => {
      jest.useFakeTimers();
      const expireSpy = jest.spyOn(stripe.checkout.sessions, 'expire');
      paymentsModel.createCheckoutSession.lock(1, 'sessid');
      expect(paymentsModel.createCheckoutSession.isActive(1)).toBe(true);
      jest.advanceTimersByTime(3 * 60 * 1000);
      expect(paymentsModel.createCheckoutSession.isActive(1)).toBe(false);
      expect(expireSpy).toHaveBeenCalledWith('sessid');
      jest.useRealTimers();
    });

    it('should release lock', () => {
      paymentsModel.createCheckoutSession.lock(2, 'sessid2');
      expect(paymentsModel.createCheckoutSession.isActive(2)).toBe(true);
      paymentsModel.releaseCheckoutLock(2);
      expect(paymentsModel.createCheckoutSession.isActive(2)).toBe(false);
    });
  });

  describe('handleSuccessfulPayment', () => {
    it('should handle split mode', async () => {
      mClient.query.mockResolvedValue({ rows: [], rowCount: 0 });
      const meta = { items: JSON.stringify([{ name: 'Taco', quantity: 2 }]), custom_amount: 0 };
      await expect(paymentsModel.handleSuccessfulPayment(1, 'split', meta)).resolves.toBeUndefined();
      expect(mClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mClient.release).toHaveBeenCalled();
    });

    it('should handle custom mode', async () => {
      mClient.query.mockResolvedValue({ rows: [], rowCount: 0 });
      const meta = { items: '[]', custom_amount: 10 };
      await expect(paymentsModel.handleSuccessfulPayment(1, 'custom', meta)).resolves.toBeUndefined();
      expect(mClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mClient.release).toHaveBeenCalled();
    });

    it('should handle default mode', async () => {
      mClient.query.mockResolvedValue({ rows: [], rowCount: 0 });
      const meta = { items: '[]', custom_amount: 0 };
      await expect(paymentsModel.handleSuccessfulPayment(1, 'other', meta)).resolves.toBeUndefined();
      expect(mClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mClient.release).toHaveBeenCalled();
    });

    it('should call websocket.updateBill if global.websocket exists', async () => {
      global.websocket = { updateBill: jest.fn() };
      mClient.query.mockResolvedValue({ rows: [], rowCount: 0 });
      const meta = { items: '[]', custom_amount: 0 };
      await paymentsModel.handleSuccessfulPayment(1, 'other', meta);
      expect(global.websocket.updateBill).toHaveBeenCalled();
      global.websocket = undefined;
    });

    it('should rollback and throw on error', async () => {
      mClient.query
        .mockImplementationOnce(() => Promise.resolve())
        .mockImplementationOnce(() => { throw new Error('fail'); });
      const meta = { items: '[]', custom_amount: 0 };
      await expect(paymentsModel.handleSuccessfulPayment(1, 'other', meta)).rejects.toThrow('fail');
      expect(mClient.query).toHaveBeenCalledWith('ROLLBACK');
      expect(mClient.release).toHaveBeenCalled();
    });
  });
});