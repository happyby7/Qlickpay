import { apiFetch } from './api';
import type { Table } from './types';

export async function fetchTables(restaurantId: number): Promise<Table[]> {
    try {
        return await apiFetch(`/api/waiter/all?restaurantId=${restaurantId}`);
    } catch (error) {
        console.error("Error obteniendo mesas:", error);
        return [];
    }
}

export async function changeTableStatus(tableId: number, status: 'available' | 'occupied' | 'paid'): Promise<void> {
    try {
        await apiFetch(`/api/waiter/${tableId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status }),
        });
    } catch (error) {
        console.error(`Error cambiando estado de la mesa ${tableId}:`, error);
    }
}

export async function fetchWaiters(restaurantId: number) {
    return await apiFetch(`/api/waiter?restaurantId=${restaurantId}`);
}

export async function addWaiter(restaurantId: number, fullName: string, email: string, phone: string, password: string) {
    return await apiFetch("/api/waiter/register", {
        method: "POST",
        body: JSON.stringify({ restaurantId, fullName, email, phone, password, role: "waiter" }),
    });
}

export async function deleteWaiter(waiterId: number) {
    return await apiFetch(`/api/waiter/${waiterId}`, {
        method: "DELETE",
    });
}

export async function updateOrderItem(restaurantId: string, tableId: string, itemName: string, removalQuantity: number): Promise<any> {
  try {
    return await apiFetch('/api/waiter/update-order-item', {
      method: 'POST',
      body: JSON.stringify({ restaurantId, tableId, itemName, removalQuantity })
    });
  } catch (error) {
    console.error("Error actualizando item del pedido:", error);
  }
}

export async function generateSessionTokenTable(restaurantId: string, tableId: string): Promise<any> {
    try {
      return await apiFetch('/api/waiter/generate-session-token-table', {
        method: 'POST',
        body: JSON.stringify({ restaurantId, tableId })
      });
    } catch (error) {
      console.error("Error generando el token de sesión:", error);
    }
}
  
export async function clearTable(tableId: number, restaurantId: number): Promise<any> {
    try {
      return await apiFetch(`/api/waiter/clear-session-token-table`, {
        method: 'POST',
        body: JSON.stringify({ tableId, restaurantId})
      });
    } catch (error) {
      console.error("Error al limpiar la mesa:", error);
    }
}
  


  