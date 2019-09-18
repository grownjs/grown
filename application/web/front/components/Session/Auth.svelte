<script>
  import {
    Failure,
    mutation, state, query,
  } from 'svql';

  import { onMount } from 'svelte';

  import { ME_INFO } from '../../shared/queries';

  export let label = 'Hey, please log in.';

  onMount(() => {
    $state.info = query(ME_INFO, result => {
      $state.me = result.info && result.info.user;
      $state.isLogged = true;
    });
  });
</script>

{#if $state.info}
  {#await $state.info}
    <h3>Verifying session...</h3>
  {:then data}
    <slot me={data.user} />
  {:catch error}
    <Failure {label} {error} />
  {/await}
{/if}
