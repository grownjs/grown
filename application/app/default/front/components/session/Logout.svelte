<script>
  import {
    Status, saveSession, mutation, state,
  } from 'svql';

  import { navigateTo } from 'yrv';

  import UpdatePassword from '../user/UpdatePassword.svelte';
  import { LOGOUT } from '~/etc/schema/generated/queries';

  export let back = '/';

  let logout;
  let disabled;

  const doLogout = mutation(LOGOUT, commit => function logout$() {
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
    {#if $state.me.picture}
      <figure>
        <img height="96" alt={$state.me.name} src={$state.me.picture} />
        {#if $state.me.name}<figcaption>{$state.me.name}</figcaption>{/if}
      </figure>
    {/if}
    <button {disabled} on:click|preventDefault={doLogout}>Log out</button>
    {#if !$state.me.platform} or {/if}
  </UpdatePassword>
{/if}
