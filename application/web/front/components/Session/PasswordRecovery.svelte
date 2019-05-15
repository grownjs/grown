<script>
  import { Route, Link } from 'svero';

  import Form from '../async/Form.svelte';
  import Status from '../async/Status.svelte';

  import { mutation } from '../../shared/graphql';
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
  }

  const doUpdate = mutation(RECOVER_PASSWORD_REQUEST, commit => function recoverPasswordRequest$() {
    updating = commit({ email }, () => {
      email = null;
    });
  });
</script>

<Status
  from={updating}
  pending="Sending password-recovery request..."
  otherwise="Password recovery was successfully sent..."
/>

<div {id} class={className || cssClass}>
  <slot />
  <Link href="#password-recovery">{label}</Link>
</div>

<Route path="#password-recovery">
  <Form modal id="password-recovery" on:cancel={clear}>
    <label>
      E-mail address: <input type="email" bind:value={email} autocomplete="current-email" />
    </label>
    <button on:click={doUpdate}>Request change</button> or <Link href="" on:click={clear}>cancel</Link>
  </Form>
</Route>
