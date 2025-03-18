<script lang="ts">
    import { goto } from '$app/navigation';
    import { logout } from '$lib/auth';
  
    async function handleLogout() {
        const { restaurantId, tableId } = await logout(); 

        if (restaurantId && tableId) {
            goto(`/auth?restaurantId=${restaurantId}&tableId=${tableId}`);
        } else {
            goto("/auth");
        }
    }

</script>
  
<button on:click={handleLogout}>Cerrar Sesión</button>
  
<style>
    button {
      background-color: #f44336;
      color: white;
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
</style>
  