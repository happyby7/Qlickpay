import { apiFetch } from "$lib/api";

export async function registerOwner(full_name: string, email: string, phone: string, password: string, restaurant_name: string) {
    return await apiFetch("/api/admin/register-owner", {
        method: "POST",
        body: JSON.stringify({ full_name, email, phone, password, restaurant_name, role: "owner" }),
    });
}
