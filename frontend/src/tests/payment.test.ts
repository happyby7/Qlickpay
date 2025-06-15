import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';

vi.mock('$app/navigation', () => {
  const gotoMock = vi.fn();
  return {
    goto: gotoMock,
    __mocks: { gotoMock }
  };
});

import OwnerDashboard from '../routes/dashboard/owner/+page.svelte';

const navLib = await import('$app/navigation') as unknown as typeof import('$app/navigation') & { __mocks: any };
const { gotoMock } = navLib.__mocks;

const defaultData = {
  sessionExpired: false,
  mesaSinSesion: false,
  mesaNoActiva: false,
  errorValidacion: false,
  tableId: null,
  hasQRParams: false,
  user: null,
  token: null,
  restaurantId: 123
};

describe('+page.svelte (owner dashboard)', () => {
  beforeEach(() => {
    gotoMock.mockReset();
  });

  it('muestra el panel si hay restaurantId', () => {
    const { getByText } = render(OwnerDashboard, { data: { ...defaultData } });
    expect(getByText('Panel de Dueño de restaurante')).toBeTruthy();
    expect(getByText('Gestionar QR')).toBeTruthy();
    expect(getByText('Gestionar Meseros')).toBeTruthy();
    expect(getByText('Gestionar Menús')).toBeTruthy();
  });

  it('redirige correctamente al pulsar los botones', async () => {
    const { getByText } = render(OwnerDashboard, { data: { ...defaultData } });
    await fireEvent.click(getByText('Gestionar QR'));
    expect(gotoMock).toHaveBeenCalledWith('/dashboard/owner/qr_gestion?restaurantId=123');
    await fireEvent.click(getByText('Gestionar Meseros'));
    expect(gotoMock).toHaveBeenCalledWith('/dashboard/owner/waiters_gestion?restaurantId=123');
    await fireEvent.click(getByText('Gestionar Menús'));
    expect(gotoMock).toHaveBeenCalledWith('/dashboard/owner/menu_gestion?restaurantId=123');
  });

  it('muestra error si no hay restaurantId', () => {
    const { getByText } = render(OwnerDashboard, { data: { ...defaultData, restaurantId: null } });   
    expect(getByText('No tienes un restaurante asignado.')).toBeTruthy();
  });
});