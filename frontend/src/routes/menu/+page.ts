import type { PageLoad } from "./$types";

export const load: PageLoad = async ({ url }: { url: URL }) => {
    const restaurantId = url.searchParams.get("restaurantId") || null;
    const tableId = url.searchParams.get("tableId") || null;

    const hasQRParams = !!(restaurantId && tableId); 

    if (!restaurantId) {
        console.error("❌ Error en `+page.ts`: restaurantId es null.");
        return { restaurantId: null, tableId: null, hasQRParams, error: "No se encontró el restaurante." };
    }

    return { restaurantId, tableId, hasQRParams, error: null };
};
