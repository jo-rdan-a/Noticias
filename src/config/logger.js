// Logger mínimo: usa apenas console
module.exports = {
  info: (...args) => console.log(...args),
  error: (...args) => console.error(...args),
  debug: (...args) => { if (process.env.NODE_ENV !== 'production') console.log(...args); }
};
