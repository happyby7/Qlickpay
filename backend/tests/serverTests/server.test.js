jest.mock('src/websockets/websocket.js', () => ({
  initWebSocket: jest.fn(() => ({
    newOrderEvent: jest.fn(),
    updateStatusTable: jest.fn(),
    updateBill: jest.fn(),
  })),
}));

const http = require('http');

describe('server.js', () => {
  let serverMock, wsServerMock, createServerSpy;

  beforeEach(() => {
    process.env.PORT = '3000';
    process.env.WS_PORT = '4000';

    serverMock = { listen: jest.fn().mockReturnThis(), on: jest.fn().mockReturnThis() };
    wsServerMock = { listen: jest.fn().mockReturnThis(), on: jest.fn().mockReturnThis() };

    createServerSpy = jest
      .spyOn(http, 'createServer')
      .mockImplementationOnce(() => serverMock)
      .mockImplementationOnce(() => wsServerMock);

    jest.clearAllMocks();
    jest.resetModules();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    delete require.cache[require.resolve('src/server')];
  });

  it('should start API and WebSocket servers and set global.websocket', () => {
    require('src/server');
    const websocket = require('src/websockets/websocket.js');
    expect(createServerSpy).toHaveBeenCalledTimes(2);
    expect(serverMock.listen).toHaveBeenCalledWith('3000', '0.0.0.0', expect.any(Function));
    expect(wsServerMock.listen).toHaveBeenCalledWith('4000', '0.0.0.0', expect.any(Function));
    expect(websocket.initWebSocket).toHaveBeenCalledWith(wsServerMock);
    expect(global.websocket).toBeDefined();
  });
});