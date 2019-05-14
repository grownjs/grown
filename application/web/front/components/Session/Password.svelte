<script>
  import { Route, Link } from 'svero';

  import Form from '../async/Form.svelte';
  import Status from '../async/Status.svelte';

  import { mutation } from '../../shared/graphql';
  import { UPDATE_PASSWORD_REQUEST } from '../../shared/queries';

  export let label = 'Change my password?';

  let updating = null;
  let password = null;
  let newPassword = null;
  let confirmPassword = null;

  function clear() {
    updating = null;
    password = null;
    newPassword = null;
    confirmPassword = null;
  }

  const doUpdate = mutation(UPDATE_PASSWORD_REQUEST, commit => function updatePasswordRequest$() {
    updating = commit({
      oldPassword: password,
      newPassword,
      confirmPassword,
    }, () => {
      password = null;
      newPassword = null;
      confirmPassword = null;
    });
  });
</script>

<p>
  <Link href="#password-change">{label}</Link>
</p>

<Route path="#password-change">
  <Form modal id="password-change">
    <Status
      from={updating}
      pending="Updating your password..."
      otherwise="Password was successfully set..."
    />

    <label>
      Current password: <input type="password" bind:value={password} autocomplete="current-password" />
    </label>
    <label>
      New password: <input type="password" bind:value={newPassword} autocomplete="new-password" />
    </label>
    <label>
      Confirm new password: <input type="password" bind:value={confirmPassword} autocomplete="confirm-password" />
    </label>
    <button on:click={doUpdate}>Update</button> or <Link href="" on:click={clear}>cancel</Link>
  </Form>
</Route>
