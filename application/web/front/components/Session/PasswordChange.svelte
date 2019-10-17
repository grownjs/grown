<script>
  import {
    In, Status, mutation,
    state,
  } from 'svql';

  import { Route, Link, navigateTo } from 'yrv';
  import { UPDATE_PASSWORD_REQUEST } from '../../shared/queries';

  let cssClass = '';

  export let id = '';
  export let className = '';
  export { cssClass as class };

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
    navigateTo('/');
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

      setTimeout(() => {
        navigateTo('/');
      }, 1000);
    });
  });
</script>

<Status
  fixed
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
  <In modal autofocus id="password-change" on:cancel={clear}>
    <h2>Change password</h2>
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
  </In>
</Route>
