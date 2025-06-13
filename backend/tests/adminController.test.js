const request = require('supertest');
const express = require('express');
const adminController = require('../../src/controllers/admin.controller');

jest.mock('../../src/models/admin.model', () => ({
  findUserByEmail: jest.fn(),
  findRestaurantByName: jest.fn(),
  createUserId: jest.fn(),
  createRestaurant: jest.fn(),
  assignOwnerToRestaurant: jest.fn(),
}));

const { 
  findUserByEmail, 
  findRestaurantByName, 
  createUserId, 
  createRestaurant, 
  assignOwnerToRestaurant 
} = require('../../src/models/admin.model');

const bcrypt = require('bcryptjs');
jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
}));

describe('admin.controller', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.post('/register-owner', adminController.registerOwner);
    jest.clearAllMocks();
  });

  it('should return 403 if role is not owner', async () => {
    const res = await request(app)
      .post('/register-owner')
      .send({ role: 'user' });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('should return 409 if email already exists', async () => {
    findUserByEmail.mockResolvedValue(true);

    const res = await request(app)
      .post('/register-owner')
      .send({ role: 'owner', email: 'test@mail.com' });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('should return 409 if restaurant already exists', async () => {
    findUserByEmail.mockResolvedValue(false);
    findRestaurantByName.mockResolvedValue(true);

    const res = await request(app)
      .post('/register-owner')
      .send({ role: 'owner', email: 'test@mail.com', restaurant_name: 'Test' });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('should register owner and return success', async () => {
    findUserByEmail.mockResolvedValue(false);
    findRestaurantByName.mockResolvedValue(false);
    bcrypt.hash.mockResolvedValue('hashedpass');
    createUserId.mockResolvedValue({ id: 1 });
    createRestaurant.mockResolvedValue({ id: 2 });
    assignOwnerToRestaurant.mockResolvedValue();

    const res = await request(app)
      .post('/register-owner')
      .send({
        full_name: 'Test Owner',
        email: 'test@mail.com',
        phone: '123456789',
        password: 'pass',
        restaurant_name: 'Test',
        role: 'owner'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/Dueño Test Owner registrado con éxito/);
  });

  it('should handle errors and return 500', async () => {
    findUserByEmail.mockRejectedValue(new Error('DB error'));

    const res = await request(app)
      .post('/register-owner')
      .send({
        full_name: 'Test Owner',
        email: 'test@mail.com',
        phone: '123456789',
        password: 'pass',
        restaurant_name: 'Test',
        role: 'owner'
      });

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });
});