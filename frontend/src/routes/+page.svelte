<script lang="ts">
  import { auth } from "$lib/auth";
  import { goto } from "$app/navigation";
  import { jwtDecode } from "jwt-decode";
  import { onMount } from "svelte";

  let restaurantId = "";
  let tableId = "";
  if (typeof window !== "undefined") {
    restaurantId = sessionStorage.getItem("restaurantId") || "";
    tableId = sessionStorage.getItem("tableId") || "";
  }

  const token = $auth;
  const role = token ? (jwtDecode($auth) as { role?: string })?.role || "customer" : "customer";

  function goToAuth(mode = "login") {
    sessionStorage.setItem("isRegistering", mode === "register" ? "true" : "false");

    if (restaurantId && tableId) {
      if (mode === "register") {
        goto(`/auth?register=true&restaurantId=${restaurantId}&tableId=${tableId}`);
      } else {
        goto(`/auth?restaurantId=${restaurantId}&tableId=${tableId}`);
      }
    } else {
      if (mode === "register") {
        goto("/auth?register=true");
      } else {
        goto("/auth");
      }
    }
  }

  function enterAsGuest() {
    sessionStorage.setItem("isGuest", "true");
    if (restaurantId && tableId) {
      goto(`/dashboard/customer?restaurantId=${restaurantId}&tableId=${tableId}`);
    } else {
      goto(`/dashboard/customer`);
    }
  }

  function goToDashboard() {
    if (role === "customer") {
      if (restaurantId && tableId) {
        goto(`/dashboard/customer?restaurantId=${restaurantId}&tableId=${tableId}`);
      } else {
        goto(`/dashboard/customer`);
      }
    } else {
      goto(`/dashboard/${role}`);
    }
  }

  onMount(() => {
    window.addEventListener('pageshow', (event) => {
      if (event.persisted) {
        location.reload();
      }
    });  
  });
</script>

{#if !$auth}
  <div class="bienvenida">
    <h1>QlickPay</h1>
    <button class="register" on:click={() => goToAuth('register')}>Registrarse</button>
    <button class="login" on:click={() => goToAuth('login')}>Iniciar Sesión</button>
    <button class="guest" on:click={enterAsGuest}>Entrar como Invitado</button>
    <p class="warning">En caso de malfuncionamiento, por favor recargue la página.</p>
  </div>
{:else}
  <p>Ya estás autenticado.</p>
  <button on:click={goToDashboard}>Ir al Dashboard</button>
{/if}

<style>
  .bienvenida {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    gap: 1rem;
  }
  button {
    padding: 1rem 2rem;
    font-size: 1.1rem;
    border: none;
    border-radius: 5px;
    cursor: pointer;
  }
  .register { background-color: #4CAF50; color: white; }
  .login { background-color: #2196F3; color: white; }
  .guest { background-color: #f44336; color: white; }
  .warning {
    font-size: 0.9em;
    color: gray;
    margin-top: 5px;
    text-align: center;
  }
</style>