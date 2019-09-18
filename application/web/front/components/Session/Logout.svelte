<script>
  import { navigateTo } from 'svero';
  import { Status, mutation, state } from 'svql';
  import Password from './Password.svelte';
  import { LOGOUT_REQUEST } from '../../shared/queries';

  let logout;

  const doLogout = mutation(LOGOUT_REQUEST, commit => function logout$() {
    logout = commit(() => {
      localStorage.clear();

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
  <Password class="menu">
    <button on:click|preventDefault={doLogout}>Log out</button> or
  </Password>
{/if}
