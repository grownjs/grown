import buildFactory from '../_factory';

export default ($) => {
  $.ctx.mount = (callback) => {
    $.pipeline.push(buildFactory(callback, $.otps, 'mount'));
  };
};
