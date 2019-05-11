<script>
  import Block from '../Block.svelte';

  import { conn } from '../../shared/stores';
  import { mutation } from '../../shared/graphql';
  import { UPDATE_PASSWORD_REQUEST } from '../../shared/queries';

  let updating = null;
  let isEditing = null;

  let password = null;
  let newPassword = null;
  let confirmPassword = null;

  function clear() {
    isEditing = false;
    password = null;
    newPassword = null;
    confirmPassword = null;
  }

  function changeMe() {
    isEditing = true;
  }

  const doUpdate = mutation(UPDATE_PASSWORD_REQUEST, commit => function updatePasswordRequest$() {
    updating = commit({
      oldPassword: password,
      newPassword,
      confirmPassword,
    }, () => {
      clear();
    });
  });
</script>

<p>
  <a href="#password-change" on:click|preventDefault={changeMe}>Change my password?</a>
</p>

<Block
  from={updating}
  active={isEditing}
  pending="Updating your password..."
  otherwise="Password was successfully set..."
>
  <form id="password-change" on:submit|preventDefault class:loading={$conn.loading}>
    <label>
      Current password: <input type="password" bind:value={password} autocomplete="current-password" />
    </label>
    <label>
      New password: <input type="password" bind:value={newPassword} autocomplete="new-password" />
    </label>
    <label>
      Confirm new password: <input type="password" bind:value={confirmPassword} autocomplete="confirm-password" />
    </label>
    <button on:click={doUpdate}>Update</button> or <a href="#password-change" on:click|preventDefault={clear}>cancel</a>
  </form>
</Block>
