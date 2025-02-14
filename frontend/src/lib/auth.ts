import { writable } from 'svelte/store';
import { apiFetch } from '../lib/api';
import { goto } from '$app/navigation';

export const auth = writable<string | null>(null);

export const checkAuth = () => {
    const token = document.cookie.split('; ').find(row => row.startsWith('auth='))?.split('=')[1];
    auth.set(token || null);
};

export const login = async (email: string, password: string) => {
    try {
        const data = await apiFetch('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
        if (data.token) {
            document.cookie = `auth=${data.token}; path=/`;
            auth.set(data.token);
            alert("Inicio de sesión exitoso. Redirigiendo...");
            goto('/dashboard');
        }
    } catch (error) {
        throw new Error("Error en autenticación");
    }
};

export const register = async (full_name: string, email: string, password: string, role: string = 'customer') => {
    try {
        await apiFetch('/api/auth/register', {
            method: 'POST',
            body: JSON.stringify({ full_name, email, password, role })
        });
        alert("¡Registro exitoso! Ya puedes iniciar sesión en Qlickpay.");
        goto('/dashboard');
    } catch (error) {
        throw new Error("Error en registro");
    }
};

export const logout = async () => {
    try {
        document.cookie = "auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        auth.set(null);
        goto('/auth');
    } catch (error) {
        throw new Error("Error al cerrar sesión");
    }
};
