<script>
  import Block from '../Block.svelte';

  import { conn } from '../../shared/stores';
  import { mutation } from '../../shared/graphql';
  import { RECOVER_PASSWORD_REQUEST } from '../../shared/queries';

  let email = null;
  let updating = null;
  let isEditing = null;

  function clear() {
    email = null;
    isEditing = false;
  }

  function changeMe() {
    isEditing = true;
  }

  const doUpdate = mutation(RECOVER_PASSWORD_REQUEST, commit => function recoverPasswordRequest$() {
    updating = commit({
      email,
    }, () => {
      clear();
    });
  });
</script>

<h3>Can't remember your password?</h3>

<p>
  <a href="#password-recovery" on:click|preventDefault={changeMe}>Request a password recovery</a>
</p>

<Block
  from={updating}
  active={isEditing}
  pending="Sending password-recovery request..."
  otherwise="Password recovery was successfully sent..."
>
  <form id="password-recovery" on:submit|preventDefault class:loading={$conn.loading}>
    <label>
      E-mail address: <input type="email" bind:value={email} autocomplete="current-email" />
    </label>
    <button on:click={doUpdate}>Request change</button> or <a href="#password-recovery" on:click|preventDefault={clear}>cancel</a>
  </form>
</Block>
