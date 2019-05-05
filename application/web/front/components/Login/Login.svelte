<script>
import { onMount } from 'svelte';
import Catch from '../Catch';
// import Password from '../Password';
// import PasswordRecovery from '../PasswordRecovery';

import { session, state } from '../../shared/stores';
import { query, mutation } from '../../shared/graphql';
import { ME_INFO, LOGIN_REQUEST, LOGOUT_REQUEST } from '../../shared/queries';

let email = null;
let password = null;

onMount(() => {
  const unsubscribe = session.subscribe(data => {
    if (data.info && !(data.info instanceof Promise)) {
      unsubscribe();

      session.set({
        loggedIn: true,
        info: data.info,
      });
    }
  });

  session.set({
    info: query(ME_INFO),
  });
});

function cancel(e) {
  e.preventDefault();
}

const doLogin = mutation(LOGIN_REQUEST, commit => function login$() {
  session.set({
    login: commit({ email, password }, data => {
      localStorage.setItem('session', JSON.stringify(data.login));
      session.set({ loggedIn: true });
      setTimeout(() => {
        location.reload();
      });
    }),
  });
});

const doLogout = mutation(LOGOUT_REQUEST, commit => function logout$() {
  session.set({
    logout: commit(() => {
      localStorage.clear();
      setTimeout(() => {
        location.reload();
      });
    }),
  });
});

</script>

<!-- move login/logout into a component -->
{#if $session.logout}
  {#await $session.logout}
    <p>Deleting current session...</p>
  {:then}
    <p>Welcome, plase wait...</p>
  {:catch errors}
    <Catch {errors} />
  {/await}
{/if}

{#if $session.login}
  {#await $session.login}
    <p>Requesting a new session...</p>
  {:then}
    <p>Successfully logged out...</p>
  {:catch errors}
    <Catch {errors} />
  {/await}
{/if}

<!-- once the user is logged in -->
{#if $session.info}
  {#await $session.info}
    <h3>Verifying session...</h3>
  {:then data}
    <h3>Welcome</h3>

    <p>E-mail: {data.user.email}</p>
    <p>Expires: {data.expirationDate}</p>

    <button on:click={doLogout}>Log out</button>

    <!-- <Password /> -->

    <slot />
  {:catch errors}
    <Catch label="Hey, please log in." {errors} />
  {/await}
{/if}

{#if !$session.loggedIn && !$session.logout && !$session.login}
  <form on:submit={cancel} class:loading={$state.loading}>
    <label>
      Email: <input type="email" bind:value={email} />
    </label>
    <label>
      Password: <input type="password" bind:value={password} />
    </label>
    <button on:click={doLogin}>Log in</button>
  </form>

  <!--<PasswordRecovery />-->
{/if}
