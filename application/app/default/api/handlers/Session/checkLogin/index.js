module.exports = ({ http, User, Session }) => async function checkLogin({ request }) {
  const { params: { type, auth } } = request;

  const [user] = await User.findOrCreate({
    where: {
      platform: type,
      identifier: auth.id,
    },
    defaults: {
      email: auth.email,
      name: auth.name,
      role: 'GUEST',
      verified: true,
    },
    hooks: false,
  });

  if (!user.picture && auth.picture) {
    const filePath = `${user.platform}_${user.identifier}_${Date.now()}.png`;
    const destFile = await http.download(auth.picture, filePath);

    await user.update({ picture: destFile });
  }

  const session = await Session.create({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  return {
    user: {
      id: session.userId,
      role: session.role,
      email: session.email,
      name: user.name,
      picture: user.picture,
      platform: user.platform,
    },
    token: session.token,
    expirationDate: session.expirationDate,
  };
};
