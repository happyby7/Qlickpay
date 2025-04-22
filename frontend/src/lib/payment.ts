import { apiFetch } from "./api";

export async function createCheckoutSession(orderId: string, amount: number, metadata: Record<string,string>): Promise<{ url: string }> {
    try {
      return await apiFetch('/api/payment/stripe-checkout-session', {
        method: 'POST',
        body: JSON.stringify({ orderId, amount, metadata }),
      });
    } catch (error) {
      console.error("Error al crear sesión de pago:", error);
      throw error;
    }
}

export async function confirmStripeSuccess(sessionId: string): Promise<void> {
  await apiFetch(`/api/payment/confirm-success?session_id=${sessionId}`);
}
  