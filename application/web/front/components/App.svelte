<script>
  import {
    Router, Route, Link, navigateTo,
  } from 'yrv';

  import { useToken, setupClient } from 'svql';

  import ResetPassword from './pages/ResetPassword.svelte';
  import NotFound from './pages/NotFound.svelte';
  import Home from './pages/Home.svelte';

  import Auth from './session/Auth.svelte';
  import Login from './session/Login.svelte';
  import Logout from './session/Logout.svelte';

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
  <Router exact nofallback>
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
    <Auth nodebug />
    <Route path="/" component={Home} />
    <Route exact path="/reset-password/:token" component={ResetPassword} />
    <Route fallback component={NotFound} />
  </Router>
</main>
