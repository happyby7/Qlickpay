import { apiFetch } from "$lib/api";

export async function sendOrder(pedido: { table_id: string; order_type: string; items: { menu_item_id: string; quantity: number; subtotal: string }[] }) {
    if (!pedido.table_id || !pedido.items.length) throw new Error("Faltan datos del pedido.");
    
    return await apiFetch(`/api/order`, {
        method: "POST",
        body: JSON.stringify(pedido),
    });
}
