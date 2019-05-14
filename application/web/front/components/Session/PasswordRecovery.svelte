<script>
  import { Route, Link } from 'svero';

  import Form from '../Form.svelte';
  import Status from '../Status.svelte';

  import { mutation } from '../../shared/graphql';
  import { RECOVER_PASSWORD_REQUEST } from '../../shared/queries';

  let email = null;
  let updating = null;

  function clear() {
    email = null;
    updating = null;
  }

  const doUpdate = mutation(RECOVER_PASSWORD_REQUEST, commit => function recoverPasswordRequest$() {
    updating = commit({ email }, () => {
      email = null;
    });
  });
</script>

<h3>Can't remember your password?</h3>

<p>
  <Link href="#password-recovery">Request a password recovery</Link>
</p>

<Route path="#password-recovery">
  <Form modal id="password-recovery">
    <Status
      from={updating}
      pending="Sending password-recovery request..."
      otherwise="Password recovery was successfully sent..."
    />

    <label>
      E-mail address: <input type="email" bind:value={email} autocomplete="current-email" />
    </label>
    <button on:click={doUpdate}>Request change</button> or <Link href="" on:click={clear}>cancel</Link>
  </Form>
</Route>
