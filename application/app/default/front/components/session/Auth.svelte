<script>
  import { Failure, state, query } from 'svql';
  import { INFO } from '~/etc/schema/generated/queries';

  export let label = 'Do you have an account?';
  export let nodebug = false;

  $state.info = query(INFO, result => {
    $state.me = result.info && result.info.user;
    $state.isLogged = true;
  });
</script>

{#if $state.info}
  {#await $state.info}
    <h3>Verifying session...</h3>
  {:then data}
    <slot me={data.user} />
  {:catch error}
    <Failure {nodebug} {label} {error} />
  {/await}
{/if}
