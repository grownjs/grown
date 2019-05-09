<script>
function changeMe(e) {
  e.preventDefault();
}

// import { mutation } from '../../shared/store';
// import { RECOVER_PASSWORD_REQUEST } from '../../shared/queries';

// export default {
//   components: {
//     Catch: '../Catch',
//   },
//   data() {
//     return {
//       email: null,
//     };
//   },
//   methods: {
//     cancel(e) {
//       e.preventDefault();
//     },
//     closeMe(e) {
//       e.preventDefault();

//       this.set({
//         editing: false,
//       });
//     },
//     changeMe(e) {
//       e.preventDefault();

//       this.set({
//         editing: true,
//       });
//     },
//     doUpdate: mutation(RECOVER_PASSWORD_REQUEST, commit => function update$() {
//       const { email } = this.get();

//       const payload = {
//         email,
//       };

//       this.store.set({
//         update: commit(payload, () => {
//           this.set({
//             editing: false,
//           });
//         }),
//       });
//     }),
//   },
// };

</script>

<h3>Can't remember your password?</h3>

<p>
  <a href="#" on:click={changeMe}>Request a password recovery</a>
</p>

<!--
{#if editing}
  <form on:submit="cancel(event)" class:loading="$loading">
    <label>
      E-mail address: <input type="email" bind:value="email" />
    </label>
    <button on:click="doUpdate()">Request change</button> or <a href="#" on:click="closeMe(event)">cancel</a>
  </form>

  {#if $update}
    {#await $update}
      <p>Sending password-recovery request...</p>
    {:then}
    {:catch errors}
      <Catch {errors} />
    {/await}
  {/if}
{/if}

-->
