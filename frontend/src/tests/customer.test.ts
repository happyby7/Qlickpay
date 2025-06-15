import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';

vi.mock('$app/navigation', () => {
  const gotoMock = vi.fn();
  return {
    goto: gotoMock,
    __mocks: { gotoMock }
  };
});

import CustomerDashboard from '../routes/dashboard/customer/+page.svelte';

const navLib = await import('$app/navigation') as unknown as typeof import('$app/navigation') & { __mocks: any };
const { gotoMock } = navLib.__mocks;

const user = { id: 'abc123', name: 'Juan', email: 'juan@a.com', role: 'customer' };
const defaultData = {
  sessionExpired: false,
  mesaSinSesion: false,
  mesaNoActiva: false,
  errorValidacion: false,
  token: null,
  user,
  restaurantId: '1',
  tableId: '2',
  hasQRParams: true
};

describe('+page.svelte (customer dashboard)', () => {
  beforeEach(() => {
    gotoMock.mockReset();
  });

  it('muestra el nombre del usuario', () => {
    const { getByText } = render(CustomerDashboard, { data: { ...defaultData } });
    expect(getByText('Bienvenido Juan')).toBeTruthy();
  });

  it('muestra botones de pedir y pagar si hay QR', () => {
    const { getByText } = render(CustomerDashboard, { data: { ...defaultData } });
    expect(getByText('📜 Ver Carta y Pedir')).toBeTruthy();
    expect(getByText('💳 Pagar la Cuenta')).toBeTruthy();
  });

  it('redirige a menú al pulsar Ver Carta y Pedir', async () => {
    const { getByText } = render(CustomerDashboard, { data: { ...defaultData } });
    await fireEvent.click(getByText('📜 Ver Carta y Pedir'));
    expect(gotoMock).toHaveBeenCalledWith('/menu?restaurantId=1&tableId=2');
  });

  it('redirige a order al pulsar Pagar la Cuenta', async () => {
    const { getByText } = render(CustomerDashboard, { data: { ...defaultData } });
    await fireEvent.click(getByText('💳 Pagar la Cuenta'));
    expect(gotoMock).toHaveBeenCalledWith('/order?restaurantId=1&tableId=2');
  });

  it('muestra modo explorador si no hay QR', () => {
    const { getByText } = render(CustomerDashboard, { data: { ...defaultData, hasQRParams: false } });
    expect(getByText('Explora nuestros restaurantes antes de llegar.')).toBeTruthy();
    expect(getByText('🍽️ Explorar Restaurantes')).toBeTruthy();
    expect(getByText('Para pedir o pagar, escanea un código QR en el restaurante.')).toBeTruthy();
  });

  it('redirige a restaurantes al pulsar Explorar Restaurantes', async () => {
    const { getByText } = render(CustomerDashboard, { data: { ...defaultData, hasQRParams: false } });
    await fireEvent.click(getByText('🍽️ Explorar Restaurantes'));
    expect(gotoMock).toHaveBeenCalledWith('/restaurants');
  });
});