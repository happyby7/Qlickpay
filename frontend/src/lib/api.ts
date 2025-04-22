import { browser } from "$app/environment";
export const API_URL = browser? import.meta.env.VITE_API_URL: import.meta.env.VITE_BACKEND_API_URL;

export async function apiFetch( endpoint: string, options: RequestInit & { cookie?: string; skipAuth?: boolean } = {},fetchFn: typeof fetch = fetch) {
  const { cookie, skipAuth, headers: optHeaders, ...rest } = options;
  let token: string | null = null;

  if (browser) {
    token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("auth="))
      ?.split("=")[1] || null;
  }

  const customHeaders = (optHeaders ?? {}) as Record<string, string>;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(cookie ? { cookie: `auth=${cookie}` } : {}),
    ...(!skipAuth && token ? { Authorization: `Bearer ${token}` } : {}),
    ...customHeaders,
  };

  const response = await fetchFn(`${API_URL}${endpoint}`, { credentials: "include",  headers, ...rest,});

  if (endpoint === "/api/auth/logout" && response.status === 401) return { success: true };
  
  let payloadText = await response.text();
  let payload: any;
  try {
      payload = JSON.parse(payloadText);
    } catch {
      payload = null;
    }
  
    if (!response.ok) {
      const msg = payload?.error 
        ? payload.error 
        : `Error en la API: ${response.status} ${response.statusText}`;
     throw new Error(msg);
    }

    try {
      return payload ?? (await JSON.parse(payloadText));
    } catch {
       return JSON.parse(payloadText);
    }
}
