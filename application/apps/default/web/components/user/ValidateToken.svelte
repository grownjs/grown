<script>//
  import { In, Status, mutation } from 'svql';
  import { Link, navigateTo } from 'yrv';
  import { CONFIRM_ACCESS_TOKEN } from '../../shared/queries';

  let cssClass = '';

  export let id = '';
  export let className = '';
  export { cssClass as class };

  export let back = '/';
  export let router = null;
  export let label = 'Confirm your e-mail address';

  let updating = null;
  let confirmEmail = null;

  function clear() {
    updating = null;
    confirmEmail = null;
    navigateTo(back);
  }

  const doConfirm = mutation(CONFIRM_ACCESS_TOKEN, commit => function validateTokenRequest$() {
    updating = commit({
      email: confirmEmail,
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
  pending="Validating your access token..."
  otherwise="Access is granted now, thank you!"
/>

<div {id} class={className || cssClass}>
  <In modal visible autofocus id="validate-token" on:cancel={clear}>
    <h2>{label}</h2>
    <label>
      E-mail: <input type="email" bind:value={confirmEmail} />
    </label>
    <button on:click={doConfirm}>Confirm</button> or <Link href={back}>cancel</Link>
  </In>
</div>
