jest.mock('pg', () => {
  const mPool = {
    query: jest.fn().mockResolvedValue({ rows: [] }),
    connect: jest.fn().mockResolvedValue({
      query: jest.fn().mockResolvedValue({ rows: [] }),
      release: jest.fn()
    }),
    end: jest.fn()
  };
  return { Pool: jest.fn(() => mPool), __esModule: true, mPool };
});

jest.mock('src/config/db.config', () => ({
  query: jest.fn()
}));

describe('qr.model', () => {
  let qrModel, mPool;

  beforeEach(() => {
    jest.resetModules();
    qrModel = require('src/models/qr.model');
    mPool = require('pg').mPool;
    jest.clearAllMocks();
    mPool.query.mockReset();
  });

  describe('ensureQRCode', () => {
    it('should return id if QR exists', async () => {
      mPool.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });
      const id = await qrModel.ensureQRCode(1, 'code');
      expect(mPool.query).toHaveBeenCalledWith(
        expect.stringContaining('FROM qr_codes'),
        ['code', 1]
      );
      expect(id).toBe(1);
    });

    it('should insert and return id if QR does not exist', async () => {
      mPool.query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ id: 2 }] });
      const id = await qrModel.ensureQRCode(1, 'code');
      expect(mPool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO qr_codes'),
        ['code', 1]
      );
      expect(id).toBe(2);
    });
  });

  describe('upsertTableQR', () => {
    it('should insert or update table QR', async () => {
      mPool.query.mockResolvedValue();
      await qrModel.upsertTableQR(1, 2, 3);
      expect(mPool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO tables'),
        [1, 2, 3]
      );
    });
  });

  describe('getTableId', () => {
    it('should return table id', async () => {
      mPool.query.mockResolvedValue({ rows: [{ id: 5 }] });
      const id = await qrModel.getTableId(1, 2);
      expect(mPool.query).toHaveBeenCalledWith(
        expect.stringContaining('FROM tables'),
        [1, 2]
      );
      expect(id).toBe(5);
    });
  });

  describe('fetchTableBill', () => {
    it('should return bill rows', async () => {
      mPool.query.mockResolvedValue({ rows: [{ order_id: 1, items: [] }] });
      const rows = await qrModel.fetchTableBill(1, 2, 'pending');
      expect(mPool.query).toHaveBeenCalledWith(
        expect.stringContaining('FROM orders'),
        [1, 2, 'pending']
      );
      expect(rows).toEqual([{ order_id: 1, items: [] }]);
    });
  });

  describe('markTableOccupiedIfNeeded', () => {
    it('should do nothing if statusFilter is not pending', async () => {
      await qrModel.markTableOccupiedIfNeeded(1, 'paid', 1);
      expect(mPool.query).not.toHaveBeenCalled();
    });

    it('should do nothing if billCount is 0', async () => {
      await qrModel.markTableOccupiedIfNeeded(1, 'pending', 0);
      expect(mPool.query).not.toHaveBeenCalled();
    });

    it('should update table if status is available', async () => {
      mPool.query
        .mockResolvedValueOnce({ rows: [{ status: 'available' }] })
        .mockResolvedValueOnce({});
      await qrModel.markTableOccupiedIfNeeded(1, 'pending', 2);
      expect(mPool.query).toHaveBeenCalledWith(
        expect.stringContaining('FROM tables'),
        [1]
      );
      expect(mPool.query).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE tables SET status = 'occupied'"),
        [1]
      );
    });

    it('should not update table if status is not available', async () => {
      mPool.query.mockResolvedValueOnce({ rows: [{ status: 'occupied' }] });
      await qrModel.markTableOccupiedIfNeeded(1, 'pending', 2);
      expect(mPool.query).toHaveBeenCalledWith(
        expect.stringContaining('FROM tables'),
        [1]
      );
      expect(mPool.query).toHaveBeenCalledTimes(1);
    });
  });
});