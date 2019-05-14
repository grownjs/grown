<script>
  import Catch from './Catch.svelte';

  export let from = null;
  export let label = null;
  export let pending = null;
  export let otherwise = null;
</script>

<style>
  div {
    background-color: white;
    position: fixed;
    padding: 10px;
    width: 100%;
    left: 0;
    bottom: 0;
    z-index: 1;
  }
</style>

{#if from}
  <div>
    {#await from}
      <h3>{pending}</h3>
    {:then}
      <h3>{otherwise}</h3>
    {:catch error}
      <Catch {label} {error} />
    {/await}
  </div>
{/if}
