let app;
try {
  app = require('../server.js');
} catch (err) {
  app = (req, res) => {
    res.status(500).json({
      bootstrapError: err.message,
      stack: (err.stack || '').split('\n').slice(0, 8)
    });
  };
}
module.exports = app;