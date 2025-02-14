export const API_URL = import.meta.env.VITE_API_URL || "http://qlickpay-backend:5000";

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {}) 
        },
        credentials: "include"
    });

    if (!response.ok) throw new Error(`Error en la API: ${response.statusText}`);
    return response.json();
}

