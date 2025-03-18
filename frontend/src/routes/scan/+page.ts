import type { PageLoad } from "./$types";
import { redirect } from "@sveltejs/kit";

export const load: PageLoad = async ({ url }) => {
    const restaurantId = url.searchParams.get("restaurantId") || "";
    const tableId = url.searchParams.get("tableId") || "";

    if (!restaurantId || !tableId) {
        return { error: "QR inválido. Inténtalo de nuevo." };
    }

    throw redirect(307, `/?restaurantId=${restaurantId}&tableId=${tableId}`);
};
