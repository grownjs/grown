module.exports = {
  admin: true,
  facebook: {
    clientID: process.env.FB_CLIENT_ID,
    clientSecret: process.env.FB_CLIENT_SECRET,
    callbackURL: `${process.env.BASE_URL || 'http://localhost:4001'}/auth/facebook/callback`,
    profileFields: ['id', 'displayName', 'email', 'picture.type(large)'],
  },
};
