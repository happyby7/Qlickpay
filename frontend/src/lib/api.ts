export const API_URL = browser ? import.meta.env.VITE_API_URL : "http://backend:5000";
import { browser } from "$app/environment";

export async function apiFetch(endpoint: string, options: RequestInit & { cookie?: string } = {}, fetchFn: typeof fetch = fetch) {
    let token: string | null = null;

    if (browser) token = document.cookie.split("; ").find(row => row.startsWith("auth="))?.split("=")[1] || null;

    const headers = {
        "Content-Type": "application/json",
        ...(options.cookie ? { cookie: `auth=${options.cookie}` } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {})
    };

    const response = await fetchFn(`${API_URL}${endpoint}`, {
        ...options,
        headers,
        credentials: "include"
    });

    if (!response.ok)
        throw new Error(`Error en la API: ${response.statusText}`);
    return response.json();
}