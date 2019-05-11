<script>
  import Catch from './Catch.svelte';

  export let from = null;
  export let label = null;
  export let pending = null;
  export let otherwise = null;
</script>

{#if from}
  {#await from}
    <h3>{pending}</h3>
  {:then}
    <h3>{otherwise}</h3>
  {:catch error}
    <Catch {label} {error} />
  {/await}
{/if}
