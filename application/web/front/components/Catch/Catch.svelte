<script>
export let label = null;
export let errors = null;
</script>

{#if errors instanceof Error}
  <h3>{label || errors.description || errors.message || errors.toString()}</h3>
  {#if errors.stack}<pre>{(errors.stack || errors.toString()).replace(/(Error:)(.+?)$/m, '$1')}</pre>{/if}
{:else}
  <h3>{label || 'An error has ocurred.'}</h3>

  {#if Array.isArray(errors)}<ul>
    {#each errors as e}
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
