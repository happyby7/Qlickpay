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

describe('admin.model', () => {
  let adminModel, mPool;

  beforeEach(() => {
    jest.resetModules();
    adminModel = require('src/models/admin.model');
    mPool = require('pg').mPool;
    jest.clearAllMocks();
    mPool.query.mockReset();
  });

  describe('findUserByEmail', () => {
    it('should return user if found', async () => {
      mPool.query.mockResolvedValue({ rows: [{ id: 1, email: 'a' }] });
      const user = await adminModel.findUserByEmail('a');
      expect(mPool.query).toHaveBeenCalledWith(
        expect.stringContaining('FROM users'),
        ['a']
      );
      expect(user).toEqual({ id: 1, email: 'a' });
    });

    it('should return null if not found', async () => {
      mPool.query.mockResolvedValue({ rows: [] });
      const user = await adminModel.findUserByEmail('a');
      expect(user).toBeNull();
    });
  });

  describe('findRestaurantByName', () => {
    it('should return restaurant if found', async () => {
      mPool.query.mockResolvedValue({ rows: [{ id: 2 }] });
      const rest = await adminModel.findRestaurantByName('b');
      expect(mPool.query).toHaveBeenCalledWith(
        expect.stringContaining('FROM restaurants'),
        ['b']
      );
      expect(rest).toEqual({ id: 2 });
    });

    it('should return null if not found', async () => {
      mPool.query.mockResolvedValue({ rows: [] });
      const rest = await adminModel.findRestaurantByName('b');
      expect(rest).toBeNull();
    });
  });

  describe('createUserId', () => {
    it('should insert user and return id', async () => {
      mPool.query.mockResolvedValue({ rows: [{ id: 3 }] });
      const id = await adminModel.createUserId({
        full_name: 'n',
        email: 'e',
        phone: 'p',
        password_hash: 'h'
      });
      expect(mPool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO users'),
        ['n', 'e', 'p', 'h']
      );
      expect(id).toEqual({ id: 3 });
    });
  });

  describe('createRestaurant', () => {
    it('should insert restaurant and return id', async () => {
      mPool.query.mockResolvedValue({ rows: [{ id: 4 }] });
      const id = await adminModel.createRestaurant({
        restaurant_name: 'r',
        email: 'e',
        phone: 'p'
      });
      expect(mPool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO restaurants'),
        ['r', 'e', 'p']
      );
      expect(id).toEqual({ id: 4 });
    });
  });

  describe('assignOwnerToRestaurant', () => {
    it('should insert into user_restaurant', async () => {
      mPool.query.mockResolvedValue();
      await adminModel.assignOwnerToRestaurant(1, 2);
      expect(mPool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO user_restaurant'),
        [1, 2]
      );
    });
  });
});