const request = require('supertest');
const express = require('express');


describe('admin.routes', () => {
  let app;
  let registerOwner, authenticate, checkRole, adminRoutes;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();  
   
    jest.mock('src/controllers/admin.controller', () => ({
      registerOwner: jest.fn((req, res) => res.json({ called: true })),
    }));
    jest.mock('src/middlewares/auth.middleware', () => ({
      authenticate: jest.fn((req, res, next) => next()),
      checkRole: jest.fn(() => (req, res, next) => next()),
    }));

    ({ registerOwner } = require('src/controllers/admin.controller'));
    ({ authenticate, checkRole } = require('src/middlewares/auth.middleware'));
    adminRoutes = require('src/routes/admin.routes');

    app = express();
    app.disable('etag');
    app.use(express.json());
    app.use('/admin', adminRoutes);
   
  });

  it('should call middlewares and registerOwner on POST /admin/register-owner', async () => {
    const res = await request(app)
      .post('/admin/register-owner')
      .send({ foo: 'bar' });

    expect(authenticate).toHaveBeenCalled();
    expect(checkRole).toHaveBeenCalledWith('admin');
    expect(registerOwner).toHaveBeenCalled();
    expect(res.body.called).toBe(true);
  });
});