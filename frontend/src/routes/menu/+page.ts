import type { PageLoad } from "./$types";

export const load: PageLoad = async ({ data }) => {
    const { restaurantId, tableId } = data;
    const hasQRParams = Boolean(restaurantId && tableId);
    
    if (!restaurantId) {
        console.error("❌ Falta de parámetro restaurantId.");
        return { restaurantId: null, tableId: null, hasQRParams: false, error: "No se encontró el restaurante." };
    }

    return { restaurantId, tableId, hasQRParams, error: null };
};