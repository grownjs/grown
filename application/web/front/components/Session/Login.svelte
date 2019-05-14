<script>
  import Form from './Form.svelte';
  import Status from '../Status.svelte';
  import PasswordRecovery from './PasswordRecovery.svelte';

  import { session } from '../../shared/stores';
  import { mutation } from '../../shared/graphql';
  import { LOGIN_REQUEST } from '../../shared/queries';

  let login;
  let email = null;
  let password = null;

  const doLogin = mutation(LOGIN_REQUEST, commit => function login$() {
    login = commit({ email, password }, data => {
      localStorage.setItem('session', JSON.stringify(data.login));
      $session.loggedIn = true;
      location.href = '/';
    });
  });
</script>

<Status
  from={login}
  pending="Requesting a new session..."
  otherwise="Welcome, plase wait..."
/>

{#if !$session.loggedIn}
  <Form id="login">
    <label>
      Email: <input type="email" bind:value={email} autocomplete="current-email" />
    </label>
    <label>
      Password: <input type="password" bind:value={password} autocomplete="current-password" />
    </label>
    <button on:click={doLogin}>Log in</button>
  </Form>

  <PasswordRecovery />
{/if}
