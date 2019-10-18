<script>
  import { Route, Link, navigateTo } from 'yrv';

  import {
    In, Status,
    saveSession, useToken, mutation, state,
  } from 'svql';

  import PasswordRecovery from './PasswordRecovery.svelte';
  import { LOGIN_REQUEST } from '../../shared/queries';

  export let back = '/';
  export let label = 'Login';

  let login;
  let disabled;
  let email = null;
  let password = null;

  function clear() {
    login = null;
    email = null;
    password = null;
    navigateTo(back);
  }

  const doLogin = mutation(LOGIN_REQUEST, commit => function login$() {
    disabled = true;
    login = commit({ email, password }, data => {
      email = null;
      password = null;
      disabled = false;

      $state.me = data.login.user;
      $state.isLogged = true;

      useToken(data.login.token);
      saveSession(data.login);
      navigateTo(back);
      setTimeout(() => {
        login = null;
        location.reload();
      }, 1000);
    }, () => {
      disabled = false;
    });
  });
</script>

<Status
  fixed nodebug
  from={login}
  label="Invalid or missing credentials"
  pending="Requesting a new session..."
  otherwise="Welcome, plase wait..."
/>

{#if !$state.isLogged}
  <Link href="/login">{label}</Link>

  <PasswordRecovery class="menu">
    or
  </PasswordRecovery>

  <Route exact path="/login">
    <In modal autofocus id="login" on:cancel={clear}>
      <h2>Login</h2>
      <label>
        Email: <input type="email" bind:value={email} required autocomplete="current-email" />
      </label>
      <label>
        Password: <input type="password" bind:value={password} required autocomplete="current-password" />
      </label>
      <button {disabled} type="submit" on:click={doLogin}>Log in</button> or <Link href={back} on:click={clear}>cancel</Link>

      <hr />

      <a href="/auth/facebook">Login with Facebook</a>
    </In>
  </Route>
{/if}
