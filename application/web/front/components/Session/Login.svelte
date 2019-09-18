<script>
  import {
    Route, Link,
    navigateTo,
  } from 'svero';

  import {
    In, Status,
    mutation, state,
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
    history.back(-1);
  }

  const doLogin = mutation(LOGIN_REQUEST, commit => function login$() {
    login = commit({ email, password }, data => {
      localStorage.setItem('session', JSON.stringify(data.login));

      $state.isLogged = data.login !== null;
      $state.info = data.login;
      $state.me = data.login.user;

      setTimeout(() => {
        navigateTo('/');
      }, 100);
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
    <In modal id="login" on:cancel={clear}>
      <label>
        Email: <input type="email" bind:value={email} autocomplete="current-email" />
      </label>
      <label>
        Password: <input type="password" bind:value={password} autocomplete="current-password" />
      </label>
      <button on:click={doLogin}>Log in</button> or <Link href="/" on:click={clear}>cancel</Link>
    </In>
  </Route>
{/if}
