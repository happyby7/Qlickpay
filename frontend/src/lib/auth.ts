import { writable } from 'svelte/store';
import { apiFetch } from '../lib/api';
import { jwtDecode } from "jwt-decode";

export const auth = writable<string | null>(null);

export const login = async (email: string, password: string) => {
    try {
        const data = await apiFetch('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });

        if (data.token) {
            document.cookie = `auth=${data.token}; path=/`;
            auth.set(data.token);
            const decoded: any = jwtDecode(data.token);
            return { role: decoded.role};
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
        return { success: true };
    } catch (error) {
        return { success: false, message: "Error en el registro" };
    }
};
export const logout = async () => {
  try {
    await apiFetch("/api/auth/logout", { method: "POST" });
  } catch (error) {
    console.error("Error al cerrar sesión en el servidor:", error);
  }
  auth.set(null);
  sessionStorage.removeItem("isGuest");
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  return { restaurantId: sessionStorage.getItem("restaurantId") || "", tableId: sessionStorage.getItem("tableId") || "" };
};

export const getTokenFromCookies = async (cookie: string, fetchFn: typeof fetch) => {
    try {
      const data = await apiFetch("/api/auth/get-cookies", { cookie }, fetchFn);
      return data.cookies || null;
    } catch (error) {
      console.error("❌ Error al obtener el token en SSR:", error);
      return null;
    }
  };
  
