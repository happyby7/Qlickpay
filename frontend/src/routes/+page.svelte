<script>
  import { auth } from '../lib/auth';
  import { goto } from '$app/navigation';
  import { browser } from '$app/environment';
  

  function goToAuth(mode = 'login') {
    if (browser) {
     sessionStorage.setItem('isRegistering', mode === 'register' ? 'true' : 'false');
    }
    goto('/auth'); 
  }
  
  function enterAsGuest() {
    if(browser){
      sessionStorage.setItem('isGuest', 'true');
      goto('/dashboard');
    }  
  }
</script>

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
</style>
  
{#if !$auth}
  <div class="bienvenida">
    <h1>Bienvenido a QlickPay</h1>
    <button class="register" on:click={() => goToAuth('register')}>Registrarse</button>
    <button class="login" on:click={() => goToAuth('login')}>Iniciar Sesión</button>
    <button class="guest" on:click={enterAsGuest}>Entrar como Invitado</button>
  </div>
{:else}
 <p>Ya estás autenticado. <a href="/dashboard">Ir al Dashboard</a></p>
{/if}
  