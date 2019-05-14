<script>
  import { Route, Link } from 'svero';
  import Status from '../Status.svelte';

  import { conn } from '../../shared/stores';
  import { mutation } from '../../shared/graphql';
  import { RECOVER_PASSWORD_REQUEST } from '../../shared/queries';

  let email = null;
  let updating = null;

  function clear() {
    email = null;
    updating = null;
  }

  const doUpdate = mutation(RECOVER_PASSWORD_REQUEST, commit => function recoverPasswordRequest$() {
    updating = commit({ email }, () => {
      email = null;
    });
  });
</script>

<h3>Can't remember your password?</h3>

<p>
  <Link href="#password-recovery">Request a password recovery</Link>
</p>

<Status
  from={updating}
  pending="Sending password-recovery request..."
  otherwise="Password recovery was successfully sent..."
/>

<Route path="#password-recovery">
  <form id="password-recovery" on:submit|preventDefault class:loading={$conn.loading}>
   <label>
     E-mail address: <input type="email" bind:value={email} autocomplete="current-email" />
   </label>
   <button on:click={doUpdate}>Request change</button> or <Link href="" on:click={clear}>cancel</Link>
  </form>
</Route>
