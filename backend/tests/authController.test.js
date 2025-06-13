const request = require('supertest');
const express = require('express');
const cookieParser = require('cookie-parser');
const authController = require('../../src/controllers/auth.controller');

jest.mock('../../src/models/auth.model', () => ({
  createUser: jest.fn(),
  findRestaurantIdByUserId: jest.fn(),
  getTokenTable: jest.fn(),
}));
jest.mock('../../src/models/admin.model', () => ({
  findUserByEmail: jest.fn(),
}));
jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
}));

const { createUser, findRestaurantIdByUserId, getTokenTable } = require('../../src/models/auth.model');
const { findUserByEmail } = require('../../src/models/admin.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

describe('auth.controller', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use(cookieParser());
    app.post('/register', authController.register);
    app.post('/login', authController.login);
    app.get('/cookies', authController.cookies);
    app.post('/logout', authController.logout);
    app.get('/session-token', authController.getSessionTokenTable);
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'testsecret';
    process.env.NODE_ENV = 'test';
  });

  describe('register', () => {
    it('should register user and return 201', async () => {
      bcrypt.hash.mockResolvedValue('hashedpass');
      createUser.mockResolvedValue();

      const res = await request(app)
        .post('/register')
        .send({ full_name: 'Test', email: 'test@mail.com', password: 'pass', role: 'user' });

      expect(res.status).toBe(201);
      expect(res.body.message).toMatch(/Usuario registrado correctamente/);
    });

    it('should handle errors and return 500', async () => {
      bcrypt.hash.mockResolvedValue('hashedpass');
      createUser.mockRejectedValue(new Error('DB error'));

      const res = await request(app)
        .post('/register')
        .send({ full_name: 'Test', email: 'test@mail.com', password: 'pass', role: 'user' });

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Error al registrar usuario');
    });
  });

  describe('login', () => {
    it('should return 400 if missing credentials', async () => {
      const res = await request(app).post('/login').send({});
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Faltan credenciales.');
    });

    it('should return 401 if user not found or password invalid', async () => {
      findUserByEmail.mockResolvedValue(null);

      let res = await request(app).post('/login').send({ email: 'a', password: 'b' });
      expect(res.status).toBe(401);

      findUserByEmail.mockResolvedValue({ password_hash: 'hash' });
      bcrypt.compare.mockResolvedValue(false);

      res = await request(app).post('/login').send({ email: 'a', password: 'b' });
      expect(res.status).toBe(401);
    });

    it('should login and return token', async () => {
      findUserByEmail.mockResolvedValue({ id: 1, role: 'user', full_name: 'Test', password_hash: 'hash' });
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue('token');

      const res = await request(app).post('/login').send({ email: 'a', password: 'b' });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBe('token');
    });

    it('should handle errors and return 500', async () => {
      findUserByEmail.mockRejectedValue(new Error('DB error'));

      const res = await request(app).post('/login').send({ email: 'a', password: 'b' });
      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Error en el servidor.');
    });
  });

  describe('cookies', () => {
    it('should return cookies', async () => {
      const res = await request(app).get('/cookies').set('Cookie', ['auth=token']);
      expect(res.body.cookies).toBeDefined();
    });
  });

  describe('logout', () => {
    it('should clear cookie and return success', async () => {
      const res = await request(app).post('/logout');
      expect(res.body.success).toBe(true);
    });
  });

  describe('getSessionTokenTable', () => {
    it('should return 400 if missing params', async () => {
      const res = await request(app).get('/session-token');
      expect(res.status).toBe(400);
    });

    it('should return 404 if table not found', async () => {
      getTokenTable.mockResolvedValue(null);
      const res = await request(app).get('/session-token?restaurantId=1&tableId=2');
      expect(res.status).toBe(404);
    });

    it('should return 403 if session expired or not active', async () => {
      getTokenTable.mockResolvedValue({ session_token: null, session_expires_at: new Date(Date.now() - 1000).toISOString() });
      const res = await request(app).get('/session-token?restaurantId=1&tableId=2');
      expect(res.status).toBe(403);
    });

    it('should return token if session is valid', async () => {
      getTokenTable.mockResolvedValue({ session_token: 'abc', session_expires_at: new Date(Date.now() + 10000).toISOString() });
      const res = await request(app).get('/session-token?restaurantId=1&tableId=2');
      expect(res.status).toBe(200);
      expect(res.body.token).toBe('abc');
    });

    it('should handle errors and return 500', async () => {
      getTokenTable.mockRejectedValue(new Error('DB error'));
      const res = await request(app).get('/session-token?restaurantId=1&tableId=2');
      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Error interno del servidor.');
    });
  });
});