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

function cancel(e) {
  e.preventDefault();
}

function closeMe(e) {
  cancel(e);
  clear();
}

function changeMe(e) {
  cancel(e);
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
  <form on:submit={cancel} class:loading={$conn.loading}>
    <label>
      Current password: <input type="password" bind:value={password} />
    </label>
    <label>
      New password: <input type="password" bind:value={newPassword} />
    </label>
    <label>
      Confirm new password: <input type="password" bind:value={confirmPassword} />
    </label>
    <button on:click={doUpdate}>Update</button> or <a href="#" on:click={closeMe}>cancel</a>
  </form>
{/if}

<Status
  from={update}
  pending="Updating your password..."
  otherwise="Password was successfully set..."
/>
