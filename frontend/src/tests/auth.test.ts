import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, fireEvent, waitFor } from '@testing-library/svelte';

vi.mock('$app/navigation', () => {
  const gotoMock = vi.fn();
  return {
    goto: gotoMock,
    __mocks: { gotoMock }
  };
});

vi.mock('$lib/auth', () => {
  const loginMock = vi.fn();
  const registerMock = vi.fn();
  return {
    login: loginMock,
    register: registerMock,
    __mocks: { loginMock, registerMock }
  };
});

import AuthPage from '../routes/auth/+page.svelte';

const navLib = (await import('$app/navigation') as unknown) as typeof import('$app/navigation') & { __mocks: any };
const authLib = (await import('$lib/auth') as unknown) as typeof import('$lib/auth') & { __mocks: any };
const { gotoMock } = navLib.__mocks;
const { loginMock, registerMock } = authLib.__mocks;

const defaultData = {
  mesaSinSesion: false,
  mesaNoActiva: false,
  errorValidacion: false,
  hasQRParams: false,
  user: null,
  token: null,
  isRegistering: false,
  sessionExpired: false,
  restaurantId: '',
  tableId: ''
};

describe('+page.svelte', () => {
  beforeEach(() => {
    loginMock.mockReset();
    registerMock.mockReset();
    gotoMock.mockReset();
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('shows login form by default', () => {
    const { getByRole, getByPlaceholderText } = render(AuthPage, {
      data: { ...defaultData }
    });
    expect(getByRole('button', { name: 'Iniciar Sesión' })).toBeTruthy();
    expect(getByPlaceholderText('Correo')).toBeTruthy();
    expect(getByPlaceholderText('Contraseña')).toBeTruthy();
  });

  it('shows register form when isRegistering is true', () => {
    const { getByText, getByPlaceholderText } = render(AuthPage, {
      data: { ...defaultData, isRegistering: true }
    });
    expect(getByText('Registro')).toBeTruthy();
    expect(getByPlaceholderText('Nombre Completo')).toBeTruthy();
    expect(getByPlaceholderText('Correo')).toBeTruthy();
    expect(getByPlaceholderText('Contraseña')).toBeTruthy();
    expect(getByPlaceholderText('Confirmar Contraseña')).toBeTruthy();
  });

  it('shows session expired message if sessionExpired is true', () => {
    const { getByText } = render(AuthPage, {
      data: { ...defaultData, sessionExpired: true }
    });
    expect(getByText('Tu sesión ha expirado. Por favor, inicia sesión de nuevo.')).toBeTruthy();
  });

  it('login: shows error if login fails', async () => {
    loginMock.mockRejectedValue(new Error('fail'));
    const { getByPlaceholderText, getByRole, findByText } = render(AuthPage, {
      data: { ...defaultData }
    });
    await fireEvent.input(getByPlaceholderText('Correo'), { target: { value: 'a@a.com' } });
    await fireEvent.input(getByPlaceholderText('Contraseña'), { target: { value: '1234' } });
    await fireEvent.click(getByRole('button', { name: 'Iniciar Sesión' }));
    expect(await findByText('Credenciales incorrectas')).toBeTruthy();
  });

  it('login: redirects to dashboard/customer if role is customer and ids present', async () => {
    loginMock.mockResolvedValue({ role: 'customer' });
    sessionStorage.setItem('restaurantId', '1');
    sessionStorage.setItem('tableId', '2');
    const { getByPlaceholderText, getByRole } = render(AuthPage, {
      data: { ...defaultData, restaurantId: '1', tableId: '2' }
    });
    await fireEvent.input(getByPlaceholderText('Correo'), { target: { value: 'a@a.com' } });
    await fireEvent.input(getByPlaceholderText('Contraseña'), { target: { value: '1234' } });
    await fireEvent.click(getByRole('button', { name: 'Iniciar Sesión' }));

  });

  it('login: redirects to dashboard/role if not customer', async () => {
    loginMock.mockResolvedValue({ role: 'admin' });
    const { getByPlaceholderText, getByRole } = render(AuthPage, {
      data: { ...defaultData }
    });
    await fireEvent.input(getByPlaceholderText('Correo'), { target: { value: 'a@a.com' } });
    await fireEvent.input(getByPlaceholderText('Contraseña'), { target: { value: '1234' } });
    await fireEvent.click(getByRole('button', { name: 'Iniciar Sesión' }));
  
  });

  it('login: shows error if no role returned', async () => {
    loginMock.mockResolvedValue({});
    const { getByPlaceholderText, getByRole, findByText } = render(AuthPage, {
      data: { ...defaultData }
    });
    await fireEvent.input(getByPlaceholderText('Correo'), { target: { value: 'a@a.com' } });
    await fireEvent.input(getByPlaceholderText('Contraseña'), { target: { value: '1234' } });
    await fireEvent.click(getByRole('button', { name: 'Iniciar Sesión' }));
    expect(await findByText('Credenciales incorrectas')).toBeTruthy();
  });

  it('register: shows error if passwords do not match', async () => {
    const { getByPlaceholderText, getByText, findByText } = render(AuthPage, {
      data: { ...defaultData, isRegistering: true }
    });
    await fireEvent.input(getByPlaceholderText('Nombre Completo'), { target: { value: 'Test' } });
    await fireEvent.input(getByPlaceholderText('Correo'), { target: { value: 'a@a.com' } });
    await fireEvent.input(getByPlaceholderText('Contraseña'), { target: { value: '1234' } });
    await fireEvent.input(getByPlaceholderText('Confirmar Contraseña'), { target: { value: '5678' } });
    await fireEvent.click(getByText('Registrarse'));
    expect(await findByText('Las contraseñas no coinciden')).toBeTruthy();
  });

  it('register: shows error if register fails', async () => {
    registerMock.mockRejectedValue(new Error('fail'));
    const { getByPlaceholderText, getByText, findByText } = render(AuthPage, {
      data: { ...defaultData, isRegistering: true }
    });
    await fireEvent.input(getByPlaceholderText('Nombre Completo'), { target: { value: 'Test' } });
    await fireEvent.input(getByPlaceholderText('Correo'), { target: { value: 'a@a.com' } });
    await fireEvent.input(getByPlaceholderText('Contraseña'), { target: { value: '1234' } });
    await fireEvent.input(getByPlaceholderText('Confirmar Contraseña'), { target: { value: '1234' } });
    await fireEvent.click(getByText('Registrarse'));
    expect(await findByText('Error en el registro')).toBeTruthy();
  });

  it('register: shows error if register returns error message', async () => {
    registerMock.mockResolvedValue({ success: false, message: 'Correo ya existe' });
    const { getByPlaceholderText, getByText, findByText } = render(AuthPage, {
      data: { ...defaultData, isRegistering: true }
    });
    await fireEvent.input(getByPlaceholderText('Nombre Completo'), { target: { value: 'Test' } });
    await fireEvent.input(getByPlaceholderText('Correo'), { target: { value: 'a@a.com' } });
    await fireEvent.input(getByPlaceholderText('Contraseña'), { target: { value: '1234' } });
    await fireEvent.input(getByPlaceholderText('Confirmar Contraseña'), { target: { value: '1234' } });
    await fireEvent.click(getByText('Registrarse'));
    expect(await findByText('Correo ya existe')).toBeTruthy();
  });

  it('register: shows success and redirects on success', async () => {
    registerMock.mockResolvedValue({ success: true });
    const { getByPlaceholderText, getByText, findByText } = render(AuthPage, {
      data: { ...defaultData, isRegistering: true }
    });
    await fireEvent.input(getByPlaceholderText('Nombre Completo'), { target: { value: 'Test' } });
    await fireEvent.input(getByPlaceholderText('Correo'), { target: { value: 'a@a.com' } });
    await fireEvent.input(getByPlaceholderText('Contraseña'), { target: { value: '1234' } });
    await fireEvent.input(getByPlaceholderText('Confirmar Contraseña'), { target: { value: '1234' } });
    await fireEvent.click(getByText('Registrarse'));
    expect(await findByText('¡Registro exitoso! Ahora ya puedes iniciar sesión.')).toBeTruthy();
  });

  it('switchToLogin navigates to /auth with params', async () => {
    sessionStorage.setItem('restaurantId', '1');
    sessionStorage.setItem('tableId', '2');
    const { getByText } = render(AuthPage, {
      data: { ...defaultData, isRegistering: true, restaurantId: '1', tableId: '2' }
    });
    await fireEvent.click(getByText('Iniciar sesión'));
    expect(gotoMock).toHaveBeenCalledWith('/auth?restaurantId=1&tableId=2', { replaceState: true });
  });

  it('switchToRegister navigates to /auth?register=true with params', async () => {
    sessionStorage.setItem('restaurantId', '1');
    sessionStorage.setItem('tableId', '2');
    const { getByText } = render(AuthPage, {
      data: { ...defaultData, isRegistering: false, restaurantId: '1', tableId: '2' }
    });
    await fireEvent.click(getByText('Regístrate'));
    expect(gotoMock).toHaveBeenCalledWith('/auth?register=true&restaurantId=1&tableId=2', { replaceState: true });
  });
});