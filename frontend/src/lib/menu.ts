import { apiFetch } from "./api";
import type { MenuItem } from "./types";

export async function fetchMenu(restaurantId: string): Promise<{ menuItems: MenuItem[], error?: string }> {
    if (!restaurantId) throw new Error("No se encontró el restaurante.");

    try {
        const response = await apiFetch(`/api/menu/${restaurantId}`);
        return { menuItems: response.menuItems };
    } catch (err: any) {
        if (err.message.includes("404")) {
            return { menuItems: [], error: "Este restaurante aún no tiene un menú disponible." };
        }
        return { menuItems: [], error: "Error al obtener el menú." };
    }
}


export async function fetchMenuItems(restaurantId: number) {
    return await apiFetch(`/api/menu?restaurantId=${restaurantId}`);
}

export async function addMenuItem(restaurantId: number, name: string, description: string, price: number, category: string) {
    return await apiFetch("/api/menu", {
        method: "POST",
        body: JSON.stringify({ restaurantId, name, description, price, category }),
    });
}

export async function deleteMenuItem(itemId: number) {
    return await apiFetch(`/api/menu/${itemId}`, {
        method: "DELETE",
    });
}



