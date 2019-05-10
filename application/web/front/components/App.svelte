<script>
import { Router, Route, Link } from 'svero';
import Login from './Session/Login';
</script>

<Router>
  <Route path="/login" component={Login} />
</Router>

<Link href="/login">Log In</Link>

<!--<Login>
  <h1>Hello world</h1>
</Login>
-->
