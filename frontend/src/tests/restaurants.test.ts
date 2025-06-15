import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';

vi.mock('$lib/restaurant', () => {
  const fetchRestaurantsMock = vi.fn();
  return {
    fetchRestaurants: fetchRestaurantsMock,
    __mocks: { fetchRestaurantsMock }
  };
});
vi.mock('$app/navigation', () => {
  const gotoMock = vi.fn();
  return {
    goto: gotoMock,
    __mocks: { gotoMock }
  };
});

import RestaurantsPage from '../routes/restaurants/+page.svelte';

const restaurantLib = await import('$lib/restaurant') as typeof import('$lib/restaurant') & { __mocks: any };
const navLib = await import('$app/navigation') as unknown as typeof import('$app/navigation') & { __mocks: any };
const { fetchRestaurantsMock } = restaurantLib.__mocks;
const { gotoMock } = navLib.__mocks;

const fakeRestaurants = [
  { id: 1, name: 'Restaurante Uno' },
  { id: 2, name: 'Restaurante Dos' }
];

describe('+page.svelte (restaurants)', () => {
  beforeEach(() => {
    fetchRestaurantsMock.mockReset();
    gotoMock.mockReset();
  });

  it('muestra el título', () => {
    fetchRestaurantsMock.mockResolvedValue({ restaurants: [] });
    const { getByText } = render(RestaurantsPage);
    expect(getByText('Restaurantes Disponibles')).toBeTruthy();
  });

  it('muestra mensaje si no hay restaurantes', async () => {
    fetchRestaurantsMock.mockResolvedValue({ restaurants: [] });
    const { findByText } = render(RestaurantsPage);
    expect(await findByText('No hay restaurantes disponibles.')).toBeTruthy();
  });

  it('muestra los restaurantes', async () => {
    fetchRestaurantsMock.mockResolvedValue({ restaurants: fakeRestaurants });
    const { findByText } = render(RestaurantsPage);
    expect(await findByText('Restaurante Uno')).toBeTruthy();
    expect(await findByText('Restaurante Dos')).toBeTruthy();
  });

  it('redirige al menú al hacer click en Ver Menú', async () => {
    fetchRestaurantsMock.mockResolvedValue({ restaurants: fakeRestaurants });
    const { findByText, getAllByText } = render(RestaurantsPage);
    await findByText('Restaurante Uno');
    const buttons = getAllByText('Ver Menú');
    await fireEvent.click(buttons[0]);
    expect(gotoMock).toHaveBeenCalledWith('/menu?restaurantId=1&restaurantName=Restaurante%20Uno');
  });

  it('muestra error si fetchRestaurants falla', async () => {
    fetchRestaurantsMock.mockRejectedValue(new Error('fail'));
    const { findByText } = render(RestaurantsPage);
    expect(await findByText('Error al cargar los restaurantes.')).toBeTruthy();
  });
});