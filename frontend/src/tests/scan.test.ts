import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render } from '@testing-library/svelte';
import '@testing-library/jest-dom/vitest';

vi.mock('$app/navigation', () => {
  const gotoMock = vi.fn();
  return {
    goto: gotoMock,
    __mocks: { gotoMock }
  };
});

const baseData = {
  sessionExpired: false,
  mesaSinSesion: false,
  mesaNoActiva: false,
  errorValidacion: false,
  hasQRParams: false,
  user: null,
  restaurantId: '1',
  tableId: '2',
  token: null as string | null,
};

const navLib = await import('$app/navigation') as unknown as typeof import('$app/navigation') & { __mocks: any };
const { gotoMock } = navLib.__mocks;

beforeEach(() => {
  gotoMock.mockReset();
});

import ScanPage from '../routes/scan/+page.svelte';

describe('+page.svelte (scan)', () => {
  it('redirige si hay token', async () => {
    render(ScanPage, { data: { ...baseData, token: 'abc123' } });
    expect(gotoMock).toHaveBeenCalledWith('/?restaurantId=1&tableId=2', { replaceState: true });
  });

  it('muestra error si hay error', () => {
    const { getByText } = render(ScanPage, { data: { ...baseData, token: null, error: 'Error grave' } });
    expect(getByText('Error grave')).toBeInTheDocument();
  });

  it('muestra mensaje de mesa no activada si no hay token ni error', () => {
    const { getByText } = render(ScanPage, { data: { ...baseData, token: null, error: undefined } });
    expect(getByText(/Esta mesa no ha sido activada/)).toBeInTheDocument();
  });

  it('muestra mensaje de redirigiendo si hay token y no error', () => {
    const { getByText } = render(ScanPage, { data: { ...baseData, token: 'abc123', error: undefined } });
    expect(getByText('Redirigiendo...')).toBeInTheDocument();
  });
});