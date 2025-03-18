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
    if (!restaurantId || !tableId) {
        console.error("❌ Faltan parámetros en la solicitud.");
        return null;
    }

    try {
        const data = await apiFetch(`/api/qr/bill/${restaurantId}/${tableId}`);

        if (!data.success || !data.bills) {
            console.error("⚠️ La API no devolvió una cuenta válida:", data);
            return null;
        }

        let total_price = 0;
        let itemsMap = new Map();

        data.bills.forEach((bill: any) => {
            total_price += parseFloat(bill.total_price);

            bill.items.forEach((item: any) => {
                if (itemsMap.has(item.name)) {
                    itemsMap.get(item.name).quantity += item.quantity;
                    itemsMap.get(item.name).subtotal += parseFloat(item.subtotal);
                } else {
                    itemsMap.set(item.name, {
                        name: item.name,
                        quantity: item.quantity,
                        subtotal: parseFloat(item.subtotal)
                    });
                }
            });
        });

        return {
            total_price,
            items: Array.from(itemsMap.values())
        };
    } catch (error) {
        console.error("❌ Error al cargar la cuenta:", error);
        return null;
    }
}
