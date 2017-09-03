module.exports = state => `
<!doctype html>
<html>
  <head>
    <base href="/">
    <meta lang="en">
    <meta charset="utf-8">

    <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">
    <meta name="HandheldFriendly" content="true">
    <meta name="viewport" content="width=device-width, initial-scale=1,maximum-scale=1,user-scalable=no">

    <!--[if lt IE 9]>
    <script src="//html5shim.googlecode.com/svn/trunk/html5.js"></script>
    <script src="//css3-mediaqueries-js.googlecode.com/svn/trunk/css3-mediaqueries.js"></script>
    <![endif]-->

    <meta name="csrf-token" content="${state.csrf_token}">
    <link rel="stylesheet" href="stylesheets/application.css">
    <title>Untitled</title>
  </head>
  <body>
    <main>${state.yield}</main>
    <script src="javascripts/session.js"></script>
  </body>
</html>
`;
