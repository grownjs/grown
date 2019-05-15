<script>
  import { onMount } from 'svelte';

  import Catch from '../async/Catch.svelte';

  import { session } from '../../shared/stores';
  import { query } from '../../shared/graphql';
  import { ME_INFO } from '../../shared/queries';

  export let label = 'Hey, please log in.';

  onMount(() => {
    const done = session.subscribe(data => {
      if (data.info && !(data.info instanceof Promise)) {
        $session.isLogged = done() || true;
        $session.me = data.info.user;
      }
    });

    $session.info = query(ME_INFO);
  });
</script>

{#if $session.info}
  {#await $session.info}
    <h3>Verifying session...</h3>
  {:then data}
    <slot me={data.user} />
  {:catch error}
    <Catch {label} {error} />
  {/await}
{/if}
