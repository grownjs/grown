<script>
  import { In, Status, mutation } from 'svql';
  import { Route, Link, navigateTo } from 'svero';
  import { RECOVER_PASSWORD_REQUEST } from '../../shared/queries';

  let cssClass = '';

  export let id = '';
  export let className = '';
  export { cssClass as class };

  export let label = 'request a password recovery';

  let email = null;
  let updating = null;

  function clear() {
    email = null;
    updating = null;
    navigateTo('/');
  }

  const doUpdate = mutation(RECOVER_PASSWORD_REQUEST, commit => function recoverPasswordRequest$() {
    updating = commit({ email }, () => {
      email = null;
    });
  });
</script>

<Status
  fixed
  from={updating}
  pending="Sending password-recovery request..."
  otherwise="Password recovery was successfully sent..."
/>

<div {id} class={className || cssClass}>
  <slot />
  <Link href="/password-recovery">{label}</Link>
</div>

<Route path="/password-recovery">
  <In modal id="password-recovery" on:cancel={clear}>
    <h2>Password recovery</h2>
    <label>
      E-mail address: <input type="email" bind:value={email} autocomplete="current-email" />
    </label>
    <button on:click={doUpdate}>Request change</button> or <Link href="/" on:click={clear}>cancel</Link>
  </In>
</Route>
