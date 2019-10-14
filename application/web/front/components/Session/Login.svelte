<script>
  import { Route, Link, navigateTo } from 'svero';

  import {
    In, Status,
    saveSession, mutation, state,
  } from 'svql';

  import PasswordRecovery from './PasswordRecovery.svelte';
  import { LOGIN_REQUEST } from '../../shared/queries';

  export let label = 'Login';

  let login;
  let email = null;
  let password = null;

  function clear() {
    login = null;
    email = null;
    password = null;
    navigateTo('/');
  }

  const doLogin = mutation(LOGIN_REQUEST, commit => function login$() {
    login = commit({ email, password }, data => {
      saveSession(data.login);
      setTimeout(() => {
        location.href = '/';
      }, 1000);
    });
  });
</script>

<Status
  fixed
  from={login}
  pending="Requesting a new session..."
  otherwise="Welcome, plase wait..."
/>

{#if !$state.isLogged}
  <Link href="/login">{label}</Link>

  <PasswordRecovery class="menu">
    or
  </PasswordRecovery>

  <Route path="/login">
    <In modal autofocus id="login" on:cancel={clear}>
      <h2>Login</h2>
      <label>
        Email: <input type="email" bind:value={email} autocomplete="current-email" />
      </label>
      <label>
        Password: <input type="password" bind:value={password} autocomplete="current-password" />
      </label>
      <button on:click={doLogin}>Log in</button> or <Link href="/" on:click={clear}>cancel</Link>

      <hr />

      <a href="/auth/facebook">Login with Facebook</a>
    </In>
  </Route>
{/if}
