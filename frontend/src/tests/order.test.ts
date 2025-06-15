import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render } from '@testing-library/svelte';

vi.mock('$lib/qr', () => {
  const fetchBillMock = vi.fn();
  const fetchBillPaidMock = vi.fn();
  return {
    fetchBill: fetchBillMock,
    fetchBillPaid: fetchBillPaidMock,
    __mocks: { fetchBillMock, fetchBillPaidMock }
  };
});
vi.mock('$lib/order', () => {
  const fetchTableStatusMock = vi.fn();
  return {
    fetchTableStatus: fetchTableStatusMock,
    __mocks: { fetchTableStatusMock }
  };
});
vi.mock('$lib/payment', () => {
  const createCheckoutSessionMock = vi.fn();
  return {
    createCheckoutSession: createCheckoutSessionMock,
    __mocks: { createCheckoutSessionMock }
  };
});
vi.mock('$lib/storeWebSocket', () => {
  const connectWebSocketMock = vi.fn();
  return {
    connectWebSocket: connectWebSocketMock,
    billUpdates: { subscribe: (fn: any) => { fn(0); return () => {}; } },
    __mocks: { connectWebSocketMock }
  };
});
vi.mock('$app/navigation', () => {
  const gotoMock = vi.fn();
  return {
    goto: gotoMock,
    __mocks: { gotoMock }
  };
});

import OrderPage from '../routes/order/+page.svelte';

const qrLib = await import('$lib/qr') as typeof import('$lib/qr') & { __mocks: any };
const { fetchBillMock, fetchBillPaidMock } = qrLib.__mocks;

const defaultData = {
  sessionExpired: false,
  mesaSinSesion: false,
  mesaNoActiva: false,
  errorValidacion: false,
  hasQRParams: true,
  user: null,
  token: null,
  restaurantId: '1',
  tableId: '2',
  error: null
};

describe('+page.svelte (order)', () => {
  beforeEach(() => {
    fetchBillMock.mockReset();
    fetchBillPaidMock.mockReset();
  });

  it('muestra mensaje de error si falta restaurantId o tableId', () => {
    const { getByText } = render(OrderPage, { data: { ...defaultData, restaurantId: '', tableId: '' } });
    expect(getByText('No se ha identificado la mesa.')).toBeTruthy();
  });
});