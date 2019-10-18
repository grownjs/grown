<script>
  import { Route, Link, navigateTo } from 'yrv';

  import {
    In, Status,
    saveSession, mutation, state,
  } from 'svql';

  import PasswordRecovery from './PasswordRecovery.svelte';
  import { LOGIN_REQUEST } from '../../shared/queries';

  export let back = '/';
  export let label = 'Login';

  let login;
  let email = null;
  let password = null;


  function clear() {
    login = null;
    email = null;
    password = null;
    navigateTo(back);
  }

  const doLogin = mutation(LOGIN_REQUEST, commit => function login$() {
    login = commit({ email, password }, data => {
      saveSession(data.login);
      setTimeout(() => {
        location.href = back;
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
      <button type="submit" on:click={doLogin}>Log in</button> or <Link href={back}>cancel</Link>

      <hr />

      <a href="/auth/facebook">Login with Facebook</a>
    </In>
  </Route>
{/if}
