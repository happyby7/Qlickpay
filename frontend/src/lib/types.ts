export interface MenuItem {
    id: number;
    name: string;
    description: string;
    price: number;
    category: string;
}

export interface Restaurant {
    id: number;
    name: string;
    description: string;
}

export interface Table {
    id: number;
    table_number: number;
    status: 'available' | 'occupied' | 'paid';
    orders_count: number;
    newOrders: number;
}

export interface Waiter {
    id: number;
    full_name: string;
    email: string;
    phone: string;
}

export interface TokenPayload {
    id: string;
    role: string;
    name?: string;
    restaurantId?: number | null;
}
