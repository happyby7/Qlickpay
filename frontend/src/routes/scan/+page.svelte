<script lang="ts">
  export let data;
</script>

{#if data.error}
  <p style="color: red;">{data.error}</p>
{/if}

<p>Redirigiendo...</p>
