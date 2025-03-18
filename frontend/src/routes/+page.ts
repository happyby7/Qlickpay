import type { PageLoad } from "./$types";

export const load: PageLoad = async ({ url }: { url: URL }) => {
    let restaurantId = url.searchParams.get("restaurantId") || "";
    let tableId = url.searchParams.get("tableId") || "";

    if (typeof window !== "undefined") {
        if (restaurantId && tableId) {
            sessionStorage.setItem("restaurantId", restaurantId);
            sessionStorage.setItem("tableId", tableId);
        } else {
            sessionStorage.removeItem("restaurantId");
            sessionStorage.removeItem("tableId");
        }
    }

    return { restaurantId, tableId };
};
