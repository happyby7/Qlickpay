import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render } from '@testing-library/svelte';

vi.mock('$lib/waiter', () => {
  const fetchTablesMock = vi.fn();
  return {
    fetchTables: fetchTablesMock,
    __mocks: { fetchTablesMock }
  };
});
vi.mock('$lib/qr', () => {
  return {
    fetchBill: vi.fn(),
    fetchBillPaid: vi.fn(),
    __mocks: {}
  };
});
vi.mock('$lib/storeWebSocket', () => {
  return {
    connectWebSocket: vi.fn(),
    newOrders: { subscribe: (fn: any) => { fn({}); return () => {}; }, update: vi.fn() },
    tableStatuses: { subscribe: (fn: any) => { fn({}); return () => {}; }, set: vi.fn() },
    __mocks: {}
  };
});

import WaiterDashboard from '../routes/dashboard/waiter/+page.svelte';

const waiterLib = await import('$lib/waiter') as typeof import('$lib/waiter') & { __mocks: any };
const { fetchTablesMock } = waiterLib.__mocks;

const defaultData = {
  sessionExpired: false,
  mesaSinSesion: false,
  mesaNoActiva: false,
  errorValidacion: false,
  tableId: null,
  hasQRParams: false,
  user: null,
  token: null,
  restaurantId: 1
};
const tables = [
  { id: 1, table_number: 1, status: 'available' },
  { id: 2, table_number: 2, status: 'occupied' }
];

describe('+page.svelte (waiter dashboard)', () => {
  beforeEach(() => {
    fetchTablesMock.mockReset();
    fetchTablesMock.mockResolvedValue(tables);
  });

  it('muestra las mesas', async () => {
    const { findByText } = render(WaiterDashboard, { data: { ...defaultData } });
    expect(await findByText('Mesa 1')).toBeTruthy();
    expect(await findByText('Mesa 2')).toBeTruthy();
  });

  it('muestra error si no hay restaurantId', () => {
    const { getByText } = render(WaiterDashboard, { data: { ...defaultData, restaurantId: null } });
    expect(getByText('No tienes un restaurante asignado.')).toBeTruthy();
  });
});