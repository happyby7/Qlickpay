import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';

vi.mock('$lib/admin', () => {
  const registerOwnerMock = vi.fn();
  return {
    registerOwner: registerOwnerMock,
    __mocks: { registerOwnerMock }
  };
});

import AdminDashboard from '../routes/dashboard/admin/+page.svelte';

const adminLib = await import('$lib/admin') as typeof import('$lib/admin') & { __mocks: any };
const { registerOwnerMock } = adminLib.__mocks;

describe('+page.svelte (admin dashboard)', () => {
  beforeEach(() => {
    registerOwnerMock.mockReset();
  });

  it('muestra el formulario y los campos', () => {
    const { getByPlaceholderText, getByText } = render(AdminDashboard);
    expect(getByText('Panel del Administrador')).toBeTruthy();
    expect(getByPlaceholderText('Nombre Completo')).toBeTruthy();
    expect(getByPlaceholderText('Correo')).toBeTruthy();
    expect(getByPlaceholderText('Teléfono')).toBeTruthy();
    expect(getByPlaceholderText('Contraseña')).toBeTruthy();
    expect(getByPlaceholderText('Nombre del Restaurante')).toBeTruthy();
    expect(getByText('Registrar Dueño')).toBeTruthy();
  });

  it('muestra error si faltan campos', async () => {
    const { getByText, getByPlaceholderText } = render(AdminDashboard);
    await fireEvent.click(getByText('Registrar Dueño'));
    const input = getByPlaceholderText('Nombre Completo') as HTMLInputElement;
    expect(input.checkValidity()).toBe(false);
  });

  it('muestra error si registerOwner retorna error', async () => {
    registerOwnerMock.mockResolvedValue({ success: false, message: 'Correo ya registrado' });
    const { getByPlaceholderText, getByText, findByText } = render(AdminDashboard);
    await fireEvent.input(getByPlaceholderText('Nombre Completo'), { target: { value: 'Admin' } });
    await fireEvent.input(getByPlaceholderText('Correo'), { target: { value: 'admin@a.com' } });
    await fireEvent.input(getByPlaceholderText('Teléfono'), { target: { value: '123456789' } });
    await fireEvent.input(getByPlaceholderText('Contraseña'), { target: { value: '1234' } });
    await fireEvent.input(getByPlaceholderText('Nombre del Restaurante'), { target: { value: 'Mi Restaurante' } });
    await fireEvent.click(getByText('Registrar Dueño'));
    expect(await findByText('Correo ya registrado')).toBeTruthy();
  });

  it('muestra mensaje de éxito y limpia los campos', async () => {
    registerOwnerMock.mockResolvedValue({ success: true });
    const { getByPlaceholderText, getByText, findByText } = render(AdminDashboard);
    await fireEvent.input(getByPlaceholderText('Nombre Completo'), { target: { value: 'Admin' } });
    await fireEvent.input(getByPlaceholderText('Correo'), { target: { value: 'admin@a.com' } });
    await fireEvent.input(getByPlaceholderText('Teléfono'), { target: { value: '123456789' } });
    await fireEvent.input(getByPlaceholderText('Contraseña'), { target: { value: '1234' } });
    await fireEvent.input(getByPlaceholderText('Nombre del Restaurante'), { target: { value: 'Mi Restaurante' } });
    await fireEvent.click(getByText('Registrar Dueño'));
    expect(await findByText('Dueño registrado con éxito. Restaurante: Mi Restaurante.')).toBeTruthy();
    expect((getByPlaceholderText('Nombre Completo') as HTMLInputElement).value).toBe('');
    expect((getByPlaceholderText('Correo') as HTMLInputElement).value).toBe('');
    expect((getByPlaceholderText('Teléfono') as HTMLInputElement).value).toBe('');
    expect((getByPlaceholderText('Contraseña') as HTMLInputElement).value).toBe('');
    expect((getByPlaceholderText('Nombre del Restaurante') as HTMLInputElement).value).toBe('');
  });

  it('muestra error si ocurre excepción', async () => {
    registerOwnerMock.mockRejectedValue(new Error('fail'));
    const { getByPlaceholderText, getByText, findByText } = render(AdminDashboard);
    await fireEvent.input(getByPlaceholderText('Nombre Completo'), { target: { value: 'Admin' } });
    await fireEvent.input(getByPlaceholderText('Correo'), { target: { value: 'admin@a.com' } });
    await fireEvent.input(getByPlaceholderText('Teléfono'), { target: { value: '123456789' } });
    await fireEvent.input(getByPlaceholderText('Contraseña'), { target: { value: '1234' } });
    await fireEvent.input(getByPlaceholderText('Nombre del Restaurante'), { target: { value: 'Mi Restaurante' } });
    await fireEvent.click(getByText('Registrar Dueño'));
    expect(await findByText('Hubo un problema con la solicitud.')).toBeTruthy();
  });
});