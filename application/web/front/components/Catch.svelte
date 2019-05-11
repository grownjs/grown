<script>
  export let label = null;
  export let error = null;
</script>

{#if error instanceof Error}
  <h3>{label || error.description || error.message || error.toString()}</h3>
  {#if error.stack}<pre>{(error.stack || error.toString()).replace(/(Error:)(.+?)$/m, '$1')}</pre>{/if}
{:else}
  <h3>{label || 'An error has ocurred.'}</h3>

  {#if Array.isArray(error)}<ul>
    {#each error as e}
      <li>
        {#if e.description && e.message}
          <details>
            <pre>{e.description}</pre>
            <summary>{e.message}</summary>
          </details>
        {:else}
          {e.description || e.message}
        {/if}
      </li>
    {/each}
  </ul>{/if}
{/if}
