<script>
  import { In, Status, mutation } from 'svql';
  import { Link, navigateTo } from 'yrv';

  import { SIGNUP_REQUEST } from '../../shared/queries';

  let cssClass = '';

  export let id = '';
  export let back = '/';
  export { cssClass as class };

  let signUp;
  let disabled;
  let email = null;
  let password = null;
  let confirmPassword = null;

  function clear() {
    email = null;
    password = null;
    confirmPassword = null;
    disabled = false;
    navigateTo(back);
  }

  const doSignUp = mutation(SIGNUP_REQUEST, commit => function signUp$() {
    disabled = true;
    signUp = commit({ email, password, confirmPassword }, () => {
      clear();
      navigateTo(back);
    }, () => {
      disabled = false;
    });
  });
</script>

<Status
  fixed nodebug
  from={signUp}
  pending="Creating your account..."
  otherwise="Access was successfully granted..."
/>

<In {id} modal visible autofocus on:cancel={clear} on:submit={doSignUp}>
  <h2>Create a new account</h2>
  <label>
    Email: <input type="email" bind:value={email} required autocomplete="current-email" />
  </label>
  <label>
    Password: <input type="password" bind:value={password} required autocomplete="current-password" />
  </label>
  <label>
    Confirm new password: <input type="password" bind:value={confirmPassword} required autocomplete="confirm-password" />
  </label>
  <button {disabled} type="submit">Request for access</button> or <Link href={back} on:click={clear}>cancel</Link>
</In>
