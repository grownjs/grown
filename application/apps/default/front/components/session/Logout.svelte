<script>
  import {
    Status, saveSession, mutation, state,
  } from 'svql';

  import { navigateTo } from 'yrv';

  import UpdatePassword from '../user/UpdatePassword.svelte';
  import { LOGOUT_REQUEST } from '../../shared/queries';

  export let back = '/';

  let logout;
  let disabled;

  const doLogout = mutation(LOGOUT_REQUEST, commit => function logout$() {
    disabled = true;
    logout = commit(() => {
      $state.me = null;
      $state.isLogged = false;

      saveSession();
      navigateTo(back);
      setTimeout(() => {
        logout = null;
        disabled = false;
      }, 1000);
    });
  });
</script>

<Status
  fixed
  from={logout}
  pending="Deleting current session..."
  otherwise="Successfully logged out..."
/>

{#if $state.me}
  <span>
    Hello, {$state.me.email}
  </span>
  <UpdatePassword class="menu">
    <button {disabled} on:click|preventDefault={doLogout}>Log out</button>
    {#if !$state.me.platform} or {/if}
  </UpdatePassword>
{/if}
