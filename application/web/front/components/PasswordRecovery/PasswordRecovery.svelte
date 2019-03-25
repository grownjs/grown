<h3>Can't remember your password?</h3>

<p>
  <a href="#" on:click="changeMe(event)">Request a password recovery</a>
</p>

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

<script src="script.js"></script>
