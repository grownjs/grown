const sizes = {
  desktop: [1024, 768],
  tablet: [800, 600],
};

export default {
  before: {
    resize: ({ media }) => async t => {
      if (media && sizes[media]) {
        await t.resizeWindow(...sizes[media]);
      }
    },
  },
};
