import { apiFetch } from "./api";
import type { Restaurant } from "./types";

export async function fetchRestaurants(): Promise<{ restaurants: Restaurant[] }> {
    return await apiFetch("/api/restaurant/all");
}
