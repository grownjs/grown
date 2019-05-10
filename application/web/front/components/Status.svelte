<script>
import Catch from './Catch';

export let from = null;
export let pending = null;
export let otherwise = null;
</script>

{#if from}
  {#await from}
    <p>{pending}</p>
  {:then}
    <p>{otherwise}</p>
  {:catch error}
    <Catch {error} />
  {/await}
{/if}
