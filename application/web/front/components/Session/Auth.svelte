<script>
  import { onMount } from 'svelte';

  import Catch from '../async/Catch.svelte';
  import Status from '../async/Status.svelte';

  import Password from './Password.svelte';

  import { session } from '../../shared/stores';
  import { query, mutation } from '../../shared/graphql';
  import { ME_INFO, LOGOUT_REQUEST } from '../../shared/queries';

  export let label = 'Hey, please log in.';

  let logout;

  onMount(() => {
    const done = session.subscribe(data => {
      if (data.info && !(data.info instanceof Promise)) {
        $session.loggedIn = done() || true;
      }
    });

    $session.info = query(ME_INFO);
  });

  const doLogout = mutation(LOGOUT_REQUEST, commit => function logout$() {
    logout = commit(() => {
      localStorage.clear();
      location.href = '/';
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

    <button on:click|preventDefault={doLogout}>Log out</button>

    <Status
      from={logout}
      pending="Deleting current session..."
      otherwise="Successfully logged out..."
    />

    <Password />
  {:catch error}
    <Catch {label} {error} />
  {/await}
{/if}
