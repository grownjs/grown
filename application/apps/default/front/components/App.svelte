<script>//
  import {
    Router, Route, Link, navigateTo,
  } from 'yrv';

  import { useToken, setupClient } from 'svql';

  import NotFound from './pages/NotFound.svelte';
  import Home from './pages/Home.svelte';

  import Login from './session/Login.svelte';
  import Logout from './session/Logout.svelte';
  import ValidateToken from './user/ValidateToken.svelte';
  import ResetPassword from './user/ResetPassword.svelte';

  if (window.location.search) {
    const matches = window.location.search.match(/token=([^=]+)/);

    if (matches) {
      useToken(matches[1]);
      setTimeout(() => {
        navigateTo('/');
      });
    }
  }

  setupClient({
    url: '/api/v1/graphql',
  });
</script>

<nav class="menu">
  <Router nofallback>
    <ul class="flex reset">
      <li class="auto">
        <Link href="/">Home</Link>
      </li>
      <li>
        <Login />
        <Logout />
      </li>
    </ul>
  </Router>
</nav>

<main class="body">
  <Router>
    <Route path="/" component={Home} />
    <Route exact path="/reset-password/:token" component={ResetPassword} />
    <Route exact path="/validate-access/:token" component={ValidateToken} />
    <Route fallback component={NotFound} />
  </Router>
</main>
