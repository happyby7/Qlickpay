import type { PageLoad } from "./$types";

export const load: PageLoad = async ({ url }: { url: URL }) => {
    let isRegistering = url.searchParams.get("register") === "true";
    let restaurantId = url.searchParams.get("restaurantId") || "";
    let tableId = url.searchParams.get("tableId") || "";

    if (typeof window !== "undefined") {
        restaurantId = restaurantId || sessionStorage.getItem("restaurantId") || "";
        tableId = tableId || sessionStorage.getItem("tableId") || "";

        if (restaurantId && tableId) {
            sessionStorage.setItem("restaurantId", restaurantId);
            sessionStorage.setItem("tableId", tableId);
        } 
    }
    return { isRegistering, restaurantId, tableId };
};
