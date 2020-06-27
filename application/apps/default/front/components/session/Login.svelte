<script>
  import { Route, Link, navigateTo } from 'yrv';

  import {
    In, Status, saveSession, useToken, mutation, state,
  } from 'svql';

  import Auth from './Auth.svelte';
  import CreateAccount from '../user/CreateAccount.svelte';
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

  let visible;
</script>

<Status
  fixed nodebug
  from={login}
  label="Invalid or missing credentials"
  pending="Requesting a new session..."
  otherwise="Welcome, plase wait..."
/>

{#if !$state.isLogged}
  <Link href="/sign-up">Create a new account</Link>
  <Link href="/login">{label}</Link>

  <div class="menu">
    <Auth nodebug />
    Try requesting for a <Link href="/password-recovery">password recovery</Link>.
  </div>

  <RecoverPassword />
  <Route exact path="/sign-up" component={CreateAccount} />
  <Route exact path="/login">
    <In modal visible autofocus id="login" on:cancel={clear} on:submit={doLogin}>
      <div>
        <button nofocus on:click={clear}>&times;</button>
        <h2>Login</h2>
        <label>
          Email: <input type="email" bind:value={email} required autocomplete="current-email" />
        </label>
        <label>
          Password: <input type="password" bind:value={password} required autocomplete="current-password" />
        </label>
        <span>
          <button {disabled} type="submit">Log in</button> or <Link href={back} on:click={clear}>cancel</Link>
        </span>
        <hr />
        <a href="/auth/facebook">Login with Facebook</a>
      </div>
    </In>
  </Route>
{/if}
