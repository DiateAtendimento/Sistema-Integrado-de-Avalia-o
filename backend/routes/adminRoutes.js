const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middlewares/auth');

router.post('/login', adminController.login);
router.get('/dashboard', authMiddleware, adminController.getDashboard);
router.get('/respostas', authMiddleware, adminController.getRespostas);
router.get('/respostas/:id', authMiddleware, adminController.getRespostaById);
router.get('/alertas', authMiddleware, adminController.getAlertas);
router.get('/relatorios', authMiddleware, adminController.getRelatorios);

module.exports = router;
