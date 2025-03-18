import type { PageLoad } from "./$types";

export const load: PageLoad = async ({ url }) => {
    const restaurantId = url.searchParams.get("restaurantId");
    const tableId = url.searchParams.get("tableId");

    if (!restaurantId || !tableId) {
        console.error("🚨 Parámetros faltantes en la URL.");
        return { restaurantId: null, tableId: null };
    }

    return { restaurantId, tableId };
};
