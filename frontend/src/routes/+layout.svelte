<script lang="ts">
    import { browser } from '$app/environment';
    import { auth } from '$lib/auth';
    import ButtonLogout from '../components/ButtonLogout.svelte';

    let isGuest = false;
    
    if (browser) {
        isGuest = sessionStorage.getItem('isGuest') === 'true';
    }
</script>
  
<nav>
    <a href="/">Inicio</a>
    {#if $auth || isGuest}
      <a href="/dashboard">Dashboard</a>
    {/if}
    {#if $auth}
      <ButtonLogout />
    {/if}
  </nav>
  
  
<slot />
  
<style>
    nav {
      display: flex;
      align-items: center;
      padding: 1rem;
      background: #f5f5f5;
      border-bottom: 1px solid #ddd;
    }
    nav a {
      margin-right: 1rem;
      text-decoration: none;
      color: #007BFF;
    }
</style>
  