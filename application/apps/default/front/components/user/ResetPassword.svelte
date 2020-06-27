<script>//
  import { In, Status, mutation } from 'svql';
  import { Link, navigateTo } from 'yrv';
  import { RESET_PASSWORD_REQUEST } from '../../shared/queries';

  let cssClass = '';

  export let id = '';
  export let className = '';
  export { cssClass as class };

  export let back = '/';
  export let router = null;
  export let label = 'Set a new password';

  let updating = null;
  let newPassword = null;
  let confirmPassword = null;

  function clear() {
    updating = null;
    newPassword = null;
    confirmPassword = null;
    navigateTo(back);
  }

  const doReset = mutation(RESET_PASSWORD_REQUEST, commit => function resetPasswordRequest$() {
    updating = commit({
      newPassword,
      confirmPassword,
      token: router.params.token,
    }, () => {
      newPassword = null;
      confirmPassword = null;

      setTimeout(() => {
        navigateTo(back);
      }, 1000);
    });
  });
</script>

<Status
  fixed nodebug
  from={updating}
  pending="Updating your password..."
  otherwise="Password was successfully set..."
/>

<div {id} class={className || cssClass}>
  <In modal visible autofocus id="password-reset" on:cancel={clear}>
    <div>
      <button nofocus on:click={clear}>&times;</button>
      <h2>{label}</h2>
      <label>
        New password: <input type="password" bind:value={newPassword} autocomplete="new-password" />
      </label>
      <label>
        Confirm new password: <input type="password" bind:value={confirmPassword} autocomplete="confirm-password" />
      </label>
      <button on:click={doReset}>Reset</button> or <Link href={back}>cancel</Link>
    </div>
  </In>
</div>
