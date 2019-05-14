<script>
  import { conn } from '../../shared/stores';

  export let id;
</script>

<form {id} on:submit|preventDefault class:loading={$conn.loading}>
  <slot />
</form>
