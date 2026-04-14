const express = require('express');
const router = express.Router();
const publicController = require('../controllers/publicController');

router.get('/cadastros', publicController.getCadastros);
router.get('/perguntas/:formulario', publicController.getPerguntas);
router.post('/respostas/exame', publicController.postRespostaExame);
router.post('/respostas/ccp-cap', publicController.postRespostaCcpCap);

module.exports = router;
