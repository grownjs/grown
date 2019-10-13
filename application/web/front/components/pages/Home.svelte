<script>
  import { state } from 'svql';
</script>

<h1>HOME</h1>

{#if $state.me}
  <h2>Glad you're back, {$state.me.firstName}!</h2>
{/if}
