<script>
  import { onMount } from 'svelte';

  import Catch from '../Catch.svelte';
  import Status from '../Status.svelte';
  import Password from './Password.svelte';
  import PasswordRecovery from './PasswordRecovery.svelte';

  import { session, conn } from '../../shared/stores';
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
  {:catch error}
    <Catch label="Hey, please log in." {error} />
  {/await}
{/if}

{#if !$session.loggedIn}
  <form on:submit|preventDefault class:loading={$conn.loading}>
    <label>
      Email: <input type="email" bind:value={email} autocomplete="current-email" />
    </label>
    <label>
      Password: <input type="password" bind:value={password} autocomplete="current-password" />
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
