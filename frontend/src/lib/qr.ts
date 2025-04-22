import { apiFetch } from "$lib/api";

export async function generateQRCodes(restaurantId: number, tableCount: number) {
    try {
        const response = await apiFetch("/api/qr/generate", {
            method: "POST",
            body: JSON.stringify({ restaurantId, tableCount }),
        });

        if (!response.success) {
            throw new Error("Error al generar los códigos QR.");
        }

        return response.qrCodes; 
    } catch (error) {
        console.error("❌ Error al generar QR:", error);
        return null;
    }
}

export async function fetchBill(restaurantId: string, tableId: string) {
    return fetchBillByStatus(restaurantId, tableId, "pending");
}

export async function fetchBillPaid(restaurantId: string, tableId: string) {
    return fetchBillByStatus(restaurantId, tableId, "paid");
}

async function fetchBillByStatus(restaurantId: string,tableId: string,status: "pending" | "paid"): Promise<{ total_price: number; items: { name: string; quantity: number; subtotal: number }[] } | null> {
    if (!restaurantId || !tableId) {
        console.error("❌ Faltan parámetros en la solicitud.");
        return null;
    }

    try {
        const data = await apiFetch(`/api/qr/bill/${restaurantId}/${tableId}?status=${status}`);

        if (!data.success || !data.bills) {
            console.error("⚠️ La API no devolvió una cuenta válida:", data);
            return null;
        }

        let total_price = 0;
        const itemsMap = new Map<string, { name: string; quantity: number; subtotal: number }>();

        data.bills.forEach((bill: any) => {
            total_price += parseFloat(bill.total_price);
            bill.items.forEach((item: any) => {
                const sub = parseFloat(item.subtotal);
                if (itemsMap.has(item.name)) {
                    const e = itemsMap.get(item.name)!;
                    e.quantity += item.quantity;
                    e.subtotal += sub;
                } else {
                    itemsMap.set(item.name, {
                        name: item.name,
                        quantity: item.quantity,
                        subtotal: sub
                    });
                }
            });
        });

        return {total_price,items: Array.from(itemsMap.values())};
    } catch (error) {
        console.error(`❌ Error al cargar la cuenta (${status}):`, error);
        return null;
    }
}
