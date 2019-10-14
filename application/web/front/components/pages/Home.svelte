<script>
  import { state } from 'svql';
</script>

<h1>HOME</h1>

{#if $state.me}
  <h2>Glad you're back!</h2>
{/if}
