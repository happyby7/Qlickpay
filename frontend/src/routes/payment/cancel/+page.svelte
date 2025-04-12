<script lang="ts">
    import { page } from '$app/stores';
    const orderId = $page.url.searchParams.get('orderId');
  </script>
  
  <h1>¡Algo ha salido mal! Pago cancelado.</h1>
  <p>Puedes volver a intentarlo cuando quieras. Mesa: {orderId}</p>
  