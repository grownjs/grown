<script>
  import {
    In, Status, mutation, state,
  } from 'svql';

  import { Route, Link, navigateTo } from 'yrv';
  import { UPDATE_PASSWORD_REQUEST } from '../../shared/queries';

  let disabled;
  let cssClass = '';

  export let id = '';
  export let className = '';
  export { cssClass as class };

  export let back = '/';
  export let label = 'change your password';

  let updating = null;
  let password = null;
  let newPassword = null;
  let confirmPassword = null;

  function clear() {
    updating = null;
    password = null;
    newPassword = null;
    confirmPassword = null;
    navigateTo(back);
  }

  const doUpdate = mutation(UPDATE_PASSWORD_REQUEST, commit => function updatePasswordRequest$() {
    disabled = true;
    updating = commit({
      oldPassword: password,
      newPassword,
      confirmPassword,
    }, () => {
      password = null;
      newPassword = null;
      confirmPassword = null;

      navigateTo(back);
      setTimeout(() => {
        updating = null;
        disabled = false;
      }, 1000);
    }, () => {
      disabled = false;
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
  <slot />
  {#if !$state.me.platform}
    <Link href="/password-change">{label}</Link>
  {/if}
</div>

<Route path="/password-change">
  <In modal visible autofocus id="password-change" on:cancel={clear} on:submit={doUpdate}>
    <div>
      <button type="button" nofocus on:click={clear}>&times;</button>
      <h2>Change password</h2>
      <label>
        Current password: <input type="password" bind:value={password} required autocomplete="current-password" />
      </label>
      <label>
        New password: <input type="password" bind:value={newPassword} required autocomplete="new-password" />
      </label>
      <label>
        Confirm new password: <input type="password" bind:value={confirmPassword} required autocomplete="confirm-password" />
      </label>
      <span>
        <button {disabled} type="submit">Update</button> or <Link href={back} on:click={clear}>cancel</Link>
      </span>
    </div>
  </In>
</Route>
