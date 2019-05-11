<script>
  import Status from './Status.svelte';

  export let from = null;
  export let label = null;
  export let active = null;
  export let pending = null;
  export let otherwise = null;

  /* eslint-disable */
  $: props = { from, label, pending, otherwise };
  /* eslint-enable */
</script>

{#if active !== null}
  {#if active}
    <Status {...props} />
    <slot />
  {/if}
{:else}
  <Status {...props} />
{/if}
