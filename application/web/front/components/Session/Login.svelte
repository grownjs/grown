<script>
  import { Route, Link } from 'svero';

  import Form from '../async/Form.svelte';
  import Status from '../async/Status.svelte';

  import PasswordRecovery from './PasswordRecovery.svelte';

  import { session } from '../../shared/stores';
  import { mutation } from '../../shared/graphql';
  import { LOGIN_REQUEST } from '../../shared/queries';

  export let label = 'Login';

  let login;
  let email = null;
  let password = null;

  function clear() {
    login = null;
    email = null;
    password = null;
  }

  const doLogin = mutation(LOGIN_REQUEST, commit => function login$() {
    login = commit({ email, password }, data => {
      localStorage.setItem('session', JSON.stringify(data.login));

      $session.isLogged = true;
      $session.info = data.login;
      $session.me = data.login.user;

      setTimeout(() => {
        location.href = '/';
      }, 100);
    });
  });
</script>

<Status
  from={login}
  pending="Requesting a new session..."
  otherwise="Welcome, plase wait..."
/>

{#if !$session.isLogged}
  <Link href="#login">{label}</Link>

  <PasswordRecovery class="menu">
    or
  </PasswordRecovery>

  <Route path="#login">
    <Form modal id="login" on:cancel={clear}>
      <label>
        Email: <input type="email" bind:value={email} autocomplete="current-email" />
      </label>
      <label>
        Password: <input type="password" bind:value={password} autocomplete="current-password" />
      </label>
      <button on:click={doLogin}>Log in</button> or <Link href="" on:click={clear}>cancel</Link>
    </Form>
  </Route>
{/if}
