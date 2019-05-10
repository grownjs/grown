<script>
import Status from '../Status';
import { conn } from '../../shared/stores';
import { mutation } from '../../shared/graphql';
import { UPDATE_PASSWORD_REQUEST } from '../../shared/queries';

let update = null;
let editing = null;
let password = null;
let newPassword = null;
let confirmPassword = null;

function clear() {
  editing = false;
  password = null;
  newPassword = null;
  confirmPassword = null;
}

function changeMe() {
  editing = true;
}

const doUpdate = mutation(UPDATE_PASSWORD_REQUEST, commit => function update$() {
  update = commit({
    oldPassword: password,
    newPassword,
    confirmPassword,
  }, () => {
    clear();
  });
});
</script>

<p>
  <a href="#" on:click={changeMe}>Change my password?</a>
</p>

{#if editing}
  <form on:submit|preventDefault class:loading={$conn.loading}>
    <label>
      Current password: <input type="password" bind:value={password} autocomplete="current-password" />
    </label>
    <label>
      New password: <input type="password" bind:value={newPassword} autocomplete="new-password" />
    </label>
    <label>
      Confirm new password: <input type="password" bind:value={confirmPassword} autocomplete="confirm-password" />
    </label>
    <button on:click={doUpdate}>Update</button> or <a href="#" on:click|preventDefault={clear}>cancel</a>
  </form>
{/if}

<Status
  from={update}
  pending="Updating your password..."
  otherwise="Password was successfully set..."
/>
