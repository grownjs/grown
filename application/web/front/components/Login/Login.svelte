{#if $info}
  {#await $info}
    <h3>Verifying session...</h3>
  {:then session}
    <h3>Welcome</h3>
    <p>E-mail: {session.user.email}</p>
    <p>Expires: {session.expirationDate}</p>

    <button on:click="doLogout(event)">Log out</button>

    <Password />

    {#if $logout}
      {#await $logout}
        <p>Deleting current session...</p>
      {:then}
      {:catch errors}
        <Catch {errors} />
      {/await}
    {/if}

    <slot />
  {:catch errors}
    <Catch label="Hey, please log in." {errors} />
  {/await}
{/if}

{#if !$loggedIn}
  <form on:submit="cancel(event)" class:loading="$loading">
    <label>
      Email: <input type="email" bind:value="email" />
    </label>
    <label>
      Password: <input type="password" bind:value="password" />
    </label>
    <button on:click="doLogin()">Log in</button>
  </form>

  <PasswordRecovery />

  {#if $login}
    {#await $login}
      <p>Requesting a new session...</p>
    {:then}
    {:catch errors}
      <Catch {errors} />
    {/await}
  {/if}
{/if}

<script src="script.js"></script>
