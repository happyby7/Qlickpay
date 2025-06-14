const request = require('supertest');
const express = require('express');

describe('auth.routes', () => {
  let app;
  let register, login, cookies, logout, getSessionTokenTable;
  let authenticate;
  let authRoutes;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();  
    
    jest.mock('src/controllers/auth.controller', () => ({
      register: jest.fn((req, res) => res.json({ called: 'register' })),
      login: jest.fn((req, res) => res.json({ called: 'login' })),
      cookies: jest.fn((req, res) => res.json({ called: 'cookies' })),
      logout: jest.fn((req, res) => res.json({ called: 'logout' })),
      getSessionTokenTable: jest.fn((req, res) => res.json({ called: 'getSessionTokenTable' })),
    }));

    jest.mock('src/middlewares/auth.middleware', () => ({
      authenticate: jest.fn((req, res, next) => next()),
    }));

    ({ register, login, cookies, logout, getSessionTokenTable } =
      require('src/controllers/auth.controller'));
    ({ authenticate } =
      require('src/middlewares/auth.middleware'));
    authRoutes = require('src/routes/auth.routes');

    app = express();
    app.disable('etag');
    app.use(express.json());
    app.use('/auth', authRoutes);
 
  });

  it('should call register on POST /auth/register', async () => {
    const res = await request(app).post('/auth/register').send({});
    expect(register).toHaveBeenCalled();
    expect(res.body.called).toBe('register');
  });

  it('should call login on POST /auth/login', async () => {
    const res = await request(app).post('/auth/login').send({});
    expect(login).toHaveBeenCalled();
    expect(res.body.called).toBe('login');
  });

  it('should call cookies on GET /auth/get-cookies', async () => {
    const res = await request(app).get('/auth/get-cookies');
    expect(cookies).toHaveBeenCalled();
    expect(res.body.called).toBe('cookies');
  });

  it('should call authenticate and logout on POST /auth/logout', async () => {
    const res = await request(app).post('/auth/logout').send({});
    expect(authenticate).toHaveBeenCalled();
    expect(logout).toHaveBeenCalled();
    expect(res.body.called).toBe('logout');
  });

  it('should call getSessionTokenTable on GET /auth/get-session-token-table', async () => {
    const res = await request(app).get('/auth/get-session-token-table');
    expect(getSessionTokenTable).toHaveBeenCalled();
    expect(res.body.called).toBe('getSessionTokenTable');
  });
});