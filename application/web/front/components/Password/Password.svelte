<p>
  <a href="#" on:click="changeMe(event)">Change my password?</a>
</p>

{#if editing}
  <form on:submit="cancel(event)" class:loading="$loading">
    <label>
      Current password: <input type="password" bind:value="password" />
    </label>
    <label>
      New password: <input type="password" bind:value="newPassword" />
    </label>
    <label>
      Confirm new password: <input type="password" bind:value="confirmPassword" />
    </label>
    <button on:click="doUpdate()">Update</button> or <a href="#" on:click="closeMe(event)">cancel</a>
  </form>

  {#if $update}
    {#await $update}
      <p>Updating account password...</p>
    {:then}
    {:catch errors}
      <Catch {errors} />
    {/await}
  {/if}
{/if}

<script src="script.js"></script>
