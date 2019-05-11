<script>
  import { Router, Route, Link } from 'svero';

  import ResetPassword from './pages/ResetPassword.svelte';
  import NotFound from './pages/Error.svelte';
  import Home from './pages/Home.svelte';

  import Auth from './session/Auth.svelte';
  import Login from './session/Login.svelte';
</script>

<nav>
  <ul>
    <li>
      <Link href="/">Home</Link>
    </li>
    <li>
      <Auth />
      <Login />
    </li>
  </ul>
</nav>

<main>
  <Router>
    <Route path="*" component={NotFound} />
    <Route path="/" component={Home} />
    <Route path="/reset-password/:token" component={ResetPassword} />
  </Router>
</main>
