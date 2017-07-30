module.exports = {
  roles: [
    'Guest.User.Admin',
  ],
  resources: {
    Website: '/**',
  },
  permissions: {
    Website: 'allow',
    Admin: 'allow',
  },
};
