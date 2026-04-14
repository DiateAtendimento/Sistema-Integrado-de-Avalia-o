const jwt = require('jsonwebtoken');
const config = require('../config');

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '').trim();
  if (!token) {
    return res.status(401).json({ error: 'Token não fornecido.' });
  }

  try {
    const payload = jwt.verify(token, config.jwtSecret);
    req.user = payload;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token inválido ou expirado.' });
  }
};
