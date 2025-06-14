jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
  verify: jest.fn()
}));

describe('auth.middleware', () => {
  let authenticate, checkRole, jwt, req, res, next;

  beforeEach(() => {
    jest.resetModules();
    process.env.JWT_SECRET = 'secret';
    jwt = require('jsonwebtoken');
    ({ authenticate, checkRole } = require('src/middlewares/auth.middleware'));
    req = { headers: {}, cookies: {}, method: 'GET', originalUrl: '/api/some' };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('authenticate', () => {
    it('should call next for logout POST', () => {
      req.method = 'POST';
      req.originalUrl = '/api/auth/logout';
      authenticate(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('should return 401 if no token', () => {
      authenticate(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: expect.stringMatching(/no proporcionado/i) });
    });

    it('should extract token from Authorization header', () => {
      req.headers.authorization = 'Bearer mytoken';
      jwt.verify.mockImplementation((token, secret, cb) => cb(null, { id: 1, role: 'admin' }));
      authenticate(req, res, next);
      expect(jwt.verify).toHaveBeenCalledWith('mytoken', 'secret', expect.any(Function));
      expect(next).toHaveBeenCalled();
      expect(req.user).toEqual({ id: 1, role: 'admin' });
    });

    it('should extract token from cookies', () => {
      req.cookies.auth = 'cookietoken';
      jwt.verify.mockImplementation((token, secret, cb) => cb(null, { id: 2, role: 'waiter' }));
      authenticate(req, res, next);
      expect(jwt.verify).toHaveBeenCalledWith('cookietoken', 'secret', expect.any(Function));
      expect(next).toHaveBeenCalled();
      expect(req.user).toEqual({ id: 2, role: 'waiter' });
    });

    it('should handle expired token', () => {
      req.headers.authorization = 'Bearer expired';
      jwt.verify.mockImplementation((token, secret, cb) => cb({ name: 'TokenExpiredError' }));
      authenticate(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: expect.stringMatching(/expirado/i) });
    });

    it('should handle invalid token', () => {
      req.headers.authorization = 'Bearer invalid';
      jwt.verify.mockImplementation((token, secret, cb) => cb({ name: 'JsonWebTokenError' }));
      authenticate(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: expect.stringMatching(/inválido/i) });
    });

    it('should handle missing decoded fields', () => {
      req.headers.authorization = 'Bearer bad';
      jwt.verify.mockImplementation((token, secret, cb) => cb(null, {}));
      authenticate(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: expect.stringMatching(/incompletos/i) });
    });
  });

  describe('checkRole', () => {
    it('should return 403 if no user', () => {
      req.user = undefined;
      const mw = checkRole('admin');
      mw(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: expect.stringMatching(/denegado/i) });
    });

    it('should return 403 if role does not match', () => {
      req.user = { role: 'waiter' };
      const mw = checkRole('admin');
      mw(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: expect.stringMatching(/permisos/i) });
    });

    it('should call next if role matches', () => {
      req.user = { role: 'admin' };
      const mw = checkRole('admin');
      mw(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });
});
