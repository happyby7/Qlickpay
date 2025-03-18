import type { PageServerLoad } from "./$types";
import { getTokenFromCookies } from "$lib/auth";
import { jwtDecode } from "jwt-decode";
import type { TokenPayload } from "$lib/types";
import { redirect } from "@sveltejs/kit";

export const load: PageServerLoad = async ({ url, cookies, fetch }) => {
  const restaurantId = url.searchParams.get("restaurantId") || "";
  const tableId = url.searchParams.get("tableId") || "";
  const hasQRParams = !!(restaurantId && tableId);

  const authCookie = cookies.get("auth") || "";
  let token: string | null | { auth: string } = await getTokenFromCookies(authCookie, fetch);

  if (token && typeof token === "object" && "auth" in token) {
    token = token.auth;
  }

  let user: TokenPayload | null = null;
  if (token && typeof token === "string") {
    try {
      user = jwtDecode<TokenPayload>(token);
    } catch (error) {
      console.error("Error al decodificar el token:", error);
      throw redirect(302, "/auth");
    }
    if (user && user.role !== "customer") {
      throw redirect(302, `/dashboard/${user.role}`);
    }
  } else {
    user = { id: "0", role: "Usuario", name: "invitado" };
  }

  return { user, restaurantId, tableId, hasQRParams };
};