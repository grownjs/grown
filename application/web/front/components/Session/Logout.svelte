<script>
  import {
    Status,
    saveSession, mutation, state,
  } from 'svql';

  import PasswordChange from './PasswordChange.svelte';
  import { LOGOUT_REQUEST } from '../../shared/queries';

  let logout;

  const doLogout = mutation(LOGOUT_REQUEST, commit => function logout$() {
    logout = commit(() => {
      saveSession();
      setTimeout(() => {
        location.href = '/';
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
  <span>Hello, {$state.me.email}</span>
  <PasswordChange class="menu">
    <button on:click|preventDefault={doLogout}>Log out</button>
    {#if !$state.me.platform} or {/if}
  </PasswordChange>
{/if}
