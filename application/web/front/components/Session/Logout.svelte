<script>
  import Password from './Password.svelte';

  import Status from '../async/Status.svelte';

  import { session } from '../../shared/stores';
  import { mutation } from '../../shared/graphql';
  import { LOGOUT_REQUEST } from '../../shared/queries';

  let logout;

  const doLogout = mutation(LOGOUT_REQUEST, commit => function logout$() {
    logout = commit(() => {
      $session.isLogged = false;
      $session.info = null;
      $session.me = null;

      localStorage.clear();

      setTimeout(() => {
        location.href = '/';
      }, 100);
    });
  });
</script>

<Status
  from={logout}
  pending="Deleting current session..."
  otherwise="Successfully logged out..."
/>

{#if $session.me}
  <span>Hello, {$session.me.email}</span>
  <Password class="menu">
    <button on:click|preventDefault={doLogout}>Log out</button> or
  </Password>
{/if}
