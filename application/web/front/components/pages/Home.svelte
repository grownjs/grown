<script>
  import { state } from 'svql';
</script>

<h1>HOME</h1>

{#if $state.me}
  <p>Glad you're back!</p>
  <pre>{JSON.stringify($state.me, null, 2)}</pre>
{/if}
