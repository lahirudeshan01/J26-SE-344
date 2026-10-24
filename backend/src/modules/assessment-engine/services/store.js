if (process.env.NODE_ENV === 'test') {
  module.exports = require('./store.memory');
} else {
  module.exports = require('./store.postgres');
}
