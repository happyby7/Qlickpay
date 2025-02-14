<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { auth } from '$lib/auth';
    import { get } from 'svelte/store';
    import { browser } from '$app/environment';
    import { jwtDecode  }from 'jwt-decode';


    interface TokenPayload {
      id: number;
      role: string;
      name: string;
    }
  
    let user: TokenPayload | null = null;
  
    onMount(() => {
        if (browser) {
            const token = get(auth);
            const isGuest = sessionStorage.getItem('isGuest') === 'true';
            if (!token && !isGuest) {
                  goto('/');
            } else if (token) {
                try {
                  user = jwtDecode<TokenPayload>(token);
                } catch (error) {
                  console.error('Error al decodificar el token:', error);
                  goto('/');
                }
            } else if (isGuest) {
              user = { id: 0, role: 'Usuario', name: 'invitado' };
            }
        }
    });

</script>
  
  <div class="dasboard-container">
    <h1>Dashboard</h1>
    {#if user}
      <p>Bienvenido {user.name}, tu rol es de '{user.role}'</p>
    {:else}
      <p>Cargando información...</p>
    {/if}
  </div>
  
  <style>
    .dasboard-container {
      padding: 2rem;
      max-width: 600px;
      margin: 0 auto;
      text-align: center;
    }
  </style>
  