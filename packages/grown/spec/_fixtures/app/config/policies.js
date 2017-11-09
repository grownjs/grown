module.exports = {
  roles: [
    'Guest.User.Editor.Admin',
  ],
  resources: {
    Website: '/**',
    'A.Secret': '/foo',
    'Nested.Too': '/*/*/bar',
  },
  permissions: {
    Website: {
      Guest: 'allow',
      Unknown: 'deny',
    },
    'A.Secret': {
      Unknown: 'allow',
    },
    'Nested.Too': {
      Unknown: 'deny',
    },
    'Secret.view': {
      Editor: 'allow',
    },
    Home: 'inherit',
  },
};
