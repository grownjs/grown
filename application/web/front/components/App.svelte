<script>
  import { Router, Route, Link } from 'svero';

  import NotFound from './pages/Error.svelte';
  import Login from './pages/Auth.svelte';
  import Home from './pages/Home.svelte';
</script>

<Router>
  <Route path="*" component={NotFound} />
  <Route path="/" component={Home} />
  <Route path="/login" component={Login} />
</Router>

<Link href="/">Home</Link>
<Link href="/login">Log In</Link>
