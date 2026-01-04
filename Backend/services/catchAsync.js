module.exports = fn => {
  return (req, res, next) => {
    if (typeof fn !== 'function') {
      throw new Error('Invalid route handler');
    }
    fn(req, res, next).catch(next);
  };
};