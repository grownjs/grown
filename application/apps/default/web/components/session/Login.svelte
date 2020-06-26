<script>
  import { Route, Link, navigateTo } from 'yrv';

  import {
    In, Status, saveSession, useToken, mutation, state,
  } from 'svql';

  import Auth from './Auth.svelte';
  import SignUp from '../pages/SignUp.svelte';
  import RecoverPassword from '../user/RecoverPassword.svelte';
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
        window.location.reload();
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
  <Link href="/sign-up">Create a new account</Link> | <Link href="/login">{label}</Link>

  <div class="menu">
    <Auth nodebug />
    <RecoverPassword>Try requesting for a</RecoverPassword>
  </div>

  <Route exact path="/sign-up" component={SignUp} />

  <Route exact path="/login">
    <In modal visible autofocus id="login" on:cancel={clear} on:submit={doLogin}>
      <h2>Login</h2>
      <label>
        Email: <input type="email" bind:value={email} required autocomplete="current-email" />
      </label>
      <label>
        Password: <input type="password" bind:value={password} required autocomplete="current-password" />
      </label>
      <button {disabled} type="submit">Log in</button> or <Link href={back} on:click={clear}>cancel</Link>

      <hr />

      <a href="/auth/facebook">Login with Facebook</a>
    </In>
  </Route>
{/if}
