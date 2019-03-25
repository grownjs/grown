<h3>{label || 'An error has ocurred.'}</h3>

{#if errors}<ul>
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
