<script lang="ts">
  import type { PageData } from './$types';
  export let data: PageData;
</script>

<div class="cancel-container">
  <h1>¡Algo ha salido mal! Pago cancelado.</h1>
  <p>Puedes volver a intentarlo cuando quieras.</p>
  {#if data.errorMsg}
    <p class="error-small">{data.errorMsg}</p>
  {/if}
</div>

<style>
  .cancel-container {
    max-width: 400px;
    margin: 2rem auto;
    padding: 1rem;
    background: #fff;
    border-radius: 8px;
  }
  .error-small {
    color: #b91c1c;
    background: #fde2e2;
    border: 1px solid #f5c2c7;
    border-radius: 4px;
    padding: 0.5rem;
    font-size: 0.85rem;
    margin-bottom: 1rem;
  }
</style>
