<script>
import { onMount } from 'svelte';
import Catch from '../Catch';
import Status from '../Status';
import Password from '../Password';
import PasswordRecovery from '../PasswordRecovery';

import { session, state } from '../../shared/stores';
import { query, mutation } from '../../shared/graphql';
import { ME_INFO, LOGIN_REQUEST, LOGOUT_REQUEST } from '../../shared/queries';

let login;
let logout;
let email = null;
let password = null;

onMount(() => {
  const done = session.subscribe(data => {
    if (data.info && !(data.info instanceof Promise)) {
      $session.loggedIn = done() || true;
    }
  });

  $session.info = query(ME_INFO);
});

function cancel(e) {
  e.preventDefault();
}

const doLogin = mutation(LOGIN_REQUEST, commit => function login$() {
  login = commit({ email, password }, data => {
    localStorage.setItem('session', JSON.stringify(data.login));
    $session.loggedIn = true;
    location.reload();
  });
});

const doLogout = mutation(LOGOUT_REQUEST, commit => function logout$() {
  logout = commit(() => {
    localStorage.clear();
    location.reload();
  });
});

</script>

{#if $session.info}
  {#await $session.info}
    <h3>Verifying session...</h3>
  {:then data}
    <h3>Welcome</h3>

    <p>E-mail: {data.user.email}</p>
    <p>Expires: {data.expirationDate}</p>

    <button on:click={doLogout}>Log out</button>

    <Status
      from={logout}
      pending="Deleting current session..."
      otherwise="Successfully logged out..."
    />

    <Password />

    <slot />
  {:catch errors}
    <Catch label="Hey, please log in." {errors} />
  {/await}
{/if}

{#if !$session.loggedIn}
  <form on:submit={cancel} class:loading={$state.loading}>
    <label>
      Email: <input type="email" bind:value={email} />
    </label>
    <label>
      Password: <input type="password" bind:value={password} />
    </label>
    <button on:click={doLogin}>Log in</button>
  </form>

  <Status
    from={login}
    pending="Requesting a new session..."
    otherwise="Welcome, plase wait..."
  />

  <PasswordRecovery />
{/if}
