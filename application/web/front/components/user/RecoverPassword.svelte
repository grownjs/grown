<script>
  import {
    In, Status, mutation,
  } from 'svql';

  import { Route, Link, navigateTo } from 'yrv';
  import { RECOVER_PASSWORD_REQUEST } from '../../shared/queries';

  let disabled;
  let cssClass = '';

  export let id = '';
  export let className = '';
  export { cssClass as class };

  export let back = '/';
  export let label = 'password recovery';

  let email = null;
  let updating = null;

  function clear() {
    email = null;
    updating = null;
    navigateTo(back);
  }

  const doUpdate = mutation(RECOVER_PASSWORD_REQUEST, commit => function recoverPasswordRequest$() {
    disabled = true;
    updating = commit({ email }, () => {
      email = null;

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
  pending="Sending password-recovery request..."
  otherwise="Password recovery was successfully sent..."
/>

<div {id} class={className || cssClass}>
  <slot />
  <Link href="/password-recovery">{label}</Link>
</div>

<Route path="/password-recovery">
  <In modal visible autofocus id="password-recovery" on:cancel={clear} on:submit={doUpdate}>
    <h2>Password recovery</h2>
    <label>
      E-mail address: <input type="email" bind:value={email} required autocomplete="current-email" />
    </label>
    <button {disabled} type="submit">Request change</button> or <Link href={back} on:click={clear}>cancel</Link>
  </In>
</Route>
