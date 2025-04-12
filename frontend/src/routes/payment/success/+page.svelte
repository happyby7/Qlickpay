<script lang="ts">
   import { page } from '$app/stores';
   import { onMount } from 'svelte';
   import { confirmStripeSuccess } from '$lib/payment';
   import { goto } from '$app/navigation';

 
   onMount(() => { 
    const redirectOnBack = () => goto('/');

    window.addEventListener('popstate', redirectOnBack);

    (async () => {
       const sessionId = $page.url.searchParams.get('session_id');

       if (sessionId) {
          try {
             await confirmStripeSuccess(sessionId);
            } catch (err) {
             console.error("❌ Error confirmando pago:", err);
            }
         }

         sessionStorage.removeItem('restaurantId');
         sessionStorage.removeItem('tableId');
         localStorage.clear();
         document.cookie = "auth=; Max-Age=0; path=/";
  })();

  return () => window.removeEventListener('popstate', redirectOnBack);
});
 </script>

 <h1>✅ ¡Enhorabuena! Pago completado.</h1>
 <p>Gracias por tu pedido.</p>
 