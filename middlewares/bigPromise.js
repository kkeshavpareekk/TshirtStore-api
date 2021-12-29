//  try catch and async-await || promise
module.exports = (func) => (req, res, next) =>
  Promise.resolve(func(req, res, next)).catch(next);
