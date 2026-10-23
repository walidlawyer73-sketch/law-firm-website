module.exports = (req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString(), path: req.url });
};