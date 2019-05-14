<script>
  import { session } from '../../shared/stores';
</script>

<h1>HOME</h1>

{#if $session.me}
  <p>Glad you're back!</p>
  <pre>{JSON.stringify($session.me, null, 2)}</pre>
{/if}
