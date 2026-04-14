const jwt = require('jsonwebtoken');
const config = require('../config');
const googleSheetsService = require('../services/googleSheetsService');

function createToken() {
  return jwt.sign({ role: 'admin' }, config.jwtSecret, { expiresIn: '8h' });
}

function normalizeList(rows) {
  return rows.map((item, index) => ({ ...item, _rowIndex: index + 1 }));
}

exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (username !== config.adminUser || password !== config.adminPassword) {
      return res.status(401).json({ error: 'Usuário ou senha incorretos.' });
    }
    const token = createToken();
    res.json({ token, user: username });
  } catch (error) {
    next(error);
  }
};

exports.getDashboard = async (req, res, next) => {
  try {
    const [exameBase, ccpBase, consolidadoExame, consolidadoCcp] = await Promise.all([
      googleSheetsService.getSheetObjects('BASE_EXAME_PROVAS'),
      googleSheetsService.getSheetObjects('BASE_CCP_CAP'),
      googleSheetsService.getSheetObjects('CONSOLIDADO_EXAME_ENTIDADE'),
      googleSheetsService.getSheetObjects('CONSOLIDADO_CCP_CAP_ENTIDADE')
    ]);

    const totalAvaliacoes = exameBase.length + ccpBase.length;
    const exameCount = exameBase.length;
    const ccpCount = ccpBase.length;
    const criticaCount = exameBase.filter((item) => item.Flag_Critico === 'VERDADEIRO').length + ccpBase.filter((item) => item.Nota_Global_Ponderada && Number(item.Nota_Global_Ponderada) <= 2.5).length;

    const entidades = [...exameBase, ...ccpBase].reduce((acc, item) => {
      const key = item.Entidade_Certificadora || 'Não informada';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const topEntidades = Object.entries(entidades)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([entidade, total]) => ({ entidade, total }));

    const onlineCount = exameBase.filter((item) => item.Modalidade_Prova && item.Modalidade_Prova.toLowerCase().includes('online')).length;
    const presencialCount = exameBase.filter((item) => item.Modalidade_Prova && item.Modalidade_Prova.toLowerCase().includes('presencial')).length;

    const ccpModalidadeGroups = ccpBase.reduce((acc, item) => {
      const key = item.Modalidade_CCP_CAP || 'Não informada';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    res.json({
      totalAvaliacoes,
      exameCount,
      ccpCount,
      criticaCount,
      topEntidades,
      onlineCount,
      presencialCount,
      ccpModalidadeGroups,
      consolidadoExame: consolidadoExame.slice(0, 8),
      consolidadoCcp: consolidadoCcp.slice(0, 8)
    });
  } catch (error) {
    next(error);
  }
};

exports.getRespostas = async (req, res, next) => {
  try {
    const [exameBase, ccpBase] = await Promise.all([
      googleSheetsService.getSheetObjects('BASE_EXAME_PROVAS'),
      googleSheetsService.getSheetObjects('BASE_CCP_CAP')
    ]);
    res.json({ exame: normalizeList(exameBase), ccp: normalizeList(ccpBase) });
  } catch (error) {
    next(error);
  }
};

exports.getRespostaById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [exameBase, ccpBase] = await Promise.all([
      googleSheetsService.getSheetObjects('BASE_EXAME_PROVAS'),
      googleSheetsService.getSheetObjects('BASE_CCP_CAP')
    ]);
    const item = exameBase.find((row) => row.ID_Avaliacao === id) || ccpBase.find((row) => row.ID_Avaliacao === id);
    if (!item) return res.status(404).json({ error: 'Avaliação não encontrada.' });
    res.json({ resposta: item });
  } catch (error) {
    next(error);
  }
};

exports.getAlertas = async (req, res, next) => {
  try {
    const [exameBase, ccpBase] = await Promise.all([
      googleSheetsService.getSheetObjects('BASE_EXAME_PROVAS'),
      googleSheetsService.getSheetObjects('BASE_CCP_CAP')
    ]);

    const exameCriticas = exameBase.filter((item) => item.Flag_Critico === 'VERDADEIRO');
    const ccpCriticas = ccpBase.filter((item) => Number(item.Nota_Global_Ponderada) <= 2.5);
    const comentarioCritico = [...exameBase, ...ccpBase].filter((item) => item.Observacoes_Finais && item.Observacoes_Finais.toLowerCase().includes('ruim'));

    res.json({ exameCriticas, ccpCriticas, comentarioCritico });
  } catch (error) {
    next(error);
  }
};

exports.getRelatorios = async (req, res, next) => {
  try {
    const [monitoramentoExame, monitoramentoCcp] = await Promise.all([
      googleSheetsService.getSheetObjects('MONITORAMENTO_EXAME'),
      googleSheetsService.getSheetObjects('MONITORAMENTO_CCP_CAP')
    ]);
    res.json({ monitoramentoExame, monitoramentoCcp });
  } catch (error) {
    next(error);
  }
};
