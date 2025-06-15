import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';

vi.mock('$lib/menu', () => {
  const fetchMenuMock = vi.fn();
  return {
    fetchMenu: fetchMenuMock,
    __mocks: { fetchMenuMock }
  };
});
vi.mock('$lib/order', () => {
  const sendOrderMock = vi.fn();
  return {
    sendOrder: sendOrderMock,
    __mocks: { sendOrderMock }
  };
});

import MenuPage from '../routes/menu/+page.svelte';

const menuLib = await import('$lib/menu') as typeof import('$lib/menu') & { __mocks: any };
const orderLib = await import('$lib/order') as typeof import('$lib/order') & { __mocks: any };
const { fetchMenuMock } = menuLib.__mocks;
const { sendOrderMock } = orderLib.__mocks;

const defaultData = {
  sessionExpired: false,
  mesaSinSesion: false,
  mesaNoActiva: false,
  errorValidacion: false,
  user: null,
  token: null,
  restaurantId: '1',
  tableId: '2',
  hasQRParams: true,
  restaurantName: 'Test Restaurante',
  error: null
};
const fakeMenu = [
  { id: 1, name: 'Pizza', description: 'Queso y tomate', price: 10 },
  { id: 2, name: 'Pasta', description: 'Con salsa', price: 8 }
];

describe('+page.svelte (menu)', () => {
  beforeEach(() => {
    fetchMenuMock.mockReset();
    sendOrderMock.mockReset();
  });

  it('muestra el nombre del restaurante', async () => {
    fetchMenuMock.mockResolvedValue({ menuItems: [] });
    const { getByText } = render(MenuPage, { data: { ...defaultData } });
    expect(getByText('Menú Test Restaurante')).toBeTruthy();
  });

  it('muestra mensaje si no hay menú', async () => {
    fetchMenuMock.mockResolvedValue({ menuItems: [] });
    const { findByText } = render(MenuPage, { data: { ...defaultData } });
    expect(await findByText('Este restaurante aún no tiene un menú disponible.')).toBeTruthy();
  });

  it('muestra los items del menú', async () => {
    fetchMenuMock.mockResolvedValue({ menuItems: fakeMenu });
    const { findByText } = render(MenuPage, { data: { ...defaultData } });
    expect(await findByText('Pizza')).toBeTruthy();
    expect(await findByText('Pasta')).toBeTruthy();
  });

  it('puede sumar y restar productos al pedido', async () => {
    fetchMenuMock.mockResolvedValue({ menuItems: fakeMenu });
    const { findByText, getAllByText } = render(MenuPage, { data: { ...defaultData } });
    await findByText('Pizza');
    const plusButtons = getAllByText('+');
    const minusButtons = getAllByText('-');
    await fireEvent.click(plusButtons[0]);
    expect(getAllByText('1')[0]).toBeTruthy();
    await fireEvent.click(minusButtons[0]);
    expect(getAllByText('0')[0]).toBeTruthy();
  });

  it('muestra el resumen de pedido y permite cerrarlo', async () => {
    fetchMenuMock.mockResolvedValue({ menuItems: fakeMenu });
    const { findByText, getByText, queryByText, getAllByText } = render(MenuPage, { data: { ...defaultData } });
    await findByText('Pizza');
    await fireEvent.click(getAllByText('+')[0]);
    await fireEvent.click(getByText('🛒 Hacer Pedido'));
    expect(getByText('Resumen del Pedido')).toBeTruthy();
    await fireEvent.click(getByText('Cerrar'));
    expect(queryByText('Resumen del Pedido')).toBeNull();
  });

  it('muestra advertencia si intentas confirmar sin productos', async () => {
    fetchMenuMock.mockResolvedValue({ menuItems: fakeMenu });
    const { getByText, findByText } = render(MenuPage, { data: { ...defaultData } });
    await fireEvent.click(getByText('🛒 Hacer Pedido'));
    await fireEvent.click(getByText('Confirmar Pedido'));
    expect(await findByText('Seleccione al menos un producto antes de confirmar su pedido.')).toBeTruthy();
  });

  it('envía el pedido correctamente y muestra mensaje de éxito', async () => {
    fetchMenuMock.mockResolvedValue({ menuItems: fakeMenu });
    sendOrderMock.mockResolvedValue({});
    const { getByText, findByText, getAllByText } = render(MenuPage, { data: { ...defaultData } });
    await findByText('Pizza');
    await fireEvent.click(getAllByText('+')[0]);
    await fireEvent.click(getByText('🛒 Hacer Pedido'));
    await fireEvent.click(getByText('Confirmar Pedido'));
    expect(sendOrderMock).toHaveBeenCalled();
    expect(await findByText('Pedido enviado a cocina!')).toBeTruthy();
  });

  it('muestra error si fetchMenu falla', async () => {
    fetchMenuMock.mockRejectedValue(new Error('fail'));
    const { findByText } = render(MenuPage, { data: { ...defaultData } });
    expect(await findByText('Error al cargar el menú.')).toBeTruthy();
  });

  it('muestra error si sendOrder falla', async () => {
    fetchMenuMock.mockResolvedValue({ menuItems: fakeMenu });
    sendOrderMock.mockRejectedValue(new Error('fail'));
    const { getByText, findByText, getAllByText } = render(MenuPage, { data: { ...defaultData } });
    await findByText('Pizza');
    await fireEvent.click(getAllByText('+')[0]);
    await fireEvent.click(getByText('🛒 Hacer Pedido'));
    await fireEvent.click(getByText('Confirmar Pedido'));
    expect(await findByText('No se pudo completar el pedido.')).toBeTruthy();
  });

  it('no permite sumar/restar productos si no hay QR params', async () => {
    fetchMenuMock.mockResolvedValue({ menuItems: fakeMenu });
    const { findByText, queryAllByText } = render(MenuPage, { data: { ...defaultData, hasQRParams: false } });
    await findByText('Pizza');
    expect(queryAllByText('+')).toHaveLength(0);
    expect(queryAllByText('-')).toHaveLength(0);
  });
});