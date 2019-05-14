<script>
  import { conn } from '../../shared/stores';

  let cssClass = '';
  let fixedClass = '';

  export let id = null;
  export let modal = false;
  export let className = '';
  export { cssClass as class };

  /* eslint-disable */
  $: fixedClass = modal ? 'overlay' : 'inline';
  /* eslint-enable */
</script>

<style>
  .overlay {
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    position: absolute;
    align-items: center;
    justify-content: center;
    background-color: rgba(0, 0, 0, .3);
  }

  .overlay > form {
    padding: 10px;
    background-color: white;
    transform: translate3d(0, -25vh, 0);
  }

  .inline {
    display: inline-block;
  }
</style>

<div class={fixedClass}>
  <form {id} class="{className || cssClass}" on:submit|preventDefault class:loading={$conn.loading}>
    <slot />
  </form>
</div>
