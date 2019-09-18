<script>
  import { Router, Route, Link } from 'svero';
  import { setupClient } from 'svql';

  import ResetPassword from './pages/ResetPassword.svelte';
  import NotFound from './pages/NotFound.svelte';
  import Home from './pages/Home.svelte';

  import Auth from './session/Auth.svelte';
  import Login from './session/Login.svelte';
  import Logout from './session/Logout.svelte';

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
    <Auth />
    <Route path="#*" component={NotFound} />
    <Route path="*" component={NotFound} />
    <Route path="/" component={Home} />
    <Route path="/reset-password/:token" component={ResetPassword} />
  </Router>
</main>
