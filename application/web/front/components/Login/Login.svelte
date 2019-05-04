<script>

import { onMount } from 'svelte';

import Catch from '../Catch';
// import Password from '../Password';
// import PasswordRecovery from '../PasswordRecovery';

import store from '../../shared/stores';
import { query, mutation } from '../../shared/graphql';

import { ME_INFO, LOGIN_REQUEST, LOGOUT_REQUEST } from '../../shared/queries';

let email = null;
let password = null;

onMount(() => {
  // FIXME: use subscriptions on <App> to globally handle this, or inside store?
  // store.on('state', ({ changed, current }) => {
  //   if (changed.loggedIn && current.loggedIn) {
  //     localStorage.setItem('session', JSON.stringify(current.login));
  //     location.reload();
  //   } else if (changed.info && !current.loading) {
  //     store.set({
  //       loggedIn: true,
  //     });
  //   }
  // });

  store.set({
    info: query(ME_INFO),
  });
});

function cancel(e) {
  e.preventDefault();
}

const doLogin = mutation(LOGIN_REQUEST, commit => function login$() {
  store.set({
    login: commit({ email, password }, () => {
      store.set({ loggedIn: true });
    }),
  });
});

const doLogout = mutation(LOGOUT_REQUEST, commit => function logout$(e) {
  e.target.disabled = true;

  store.set({
    logout: commit(() => {
      localStorage.clear();
      location.reload();
    }),
  });
});

</script>


{#if $store.info}
  {#await $store.info}
    <h3>Verifying session...</h3>
  {:then session}
    <h3>Welcome</h3>
    <p>E-mail: {session.user.email}</p>
    <p>Expires: {session.expirationDate}</p>

    <button on:click={doLogout}>Log out</button>

    <!-- <Password /> -->

    {#if $store.logout}
      {#await $store.logout}
        <p>Deleting current session...</p>
      {:then}
        OK
      {:catch errors}
        <Catch {errors} />
      {/await}
    {/if}

    <slot />
  {:catch errors}
    <Catch label="Hey, please log in." {errors} />
  {/await}
{/if}

{#if !$store.loggedIn}
  <form on:submit={cancel} class:loading={$store.loading}>
    <label>
      Email: <input type="email" bind:value={email} />
    </label>
    <label>
      Password: <input type="password" bind:value={password} />
    </label>
    <button on:click={doLogin}>Log in</button>
  </form>

  <!-- <PasswordRecovery /> -->

  {#if $store.login}
    {#await $store.login}
      <p>Requesting a new session...</p>
    {:then}
      OK
    {:catch errors}
      <Catch {errors} />
    {/await}
  {/if}
{/if}
