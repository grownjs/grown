<script>
import Status from '../Status';
import { conn } from '../../shared/stores';
import { mutation } from '../../shared/graphql';
import { RECOVER_PASSWORD_REQUEST } from '../../shared/queries';

let email = null;
let update = null;
let editing = null;

function clear() {
  email = null;
  editing = false;
}

function changeMe() {
  editing = true;
}

const doUpdate = mutation(RECOVER_PASSWORD_REQUEST, commit => function update$() {
  update = commit({
    email,
  }, () => {
    clear();
  });
});
</script>

<h3>Can't remember your password?</h3>

<p>
  <a href="#" on:click={changeMe}>Request a password recovery</a>
</p>

{#if editing}
  <form on:submit|preventDefault class:loading={$conn.loading}>
    <label>
      E-mail address: <input type="email" bind:value={email} autocomplete="current-email" />
    </label>
    <button on:click={doUpdate}>Request change</button> or <a href="#" on:click|preventDefault={clear}>cancel</a>
  </form>
{/if}

<Status
  from={update}
  pending="Sending password-recovery request..."
  otherwise="Password recovery was successfully sent..."
/>
