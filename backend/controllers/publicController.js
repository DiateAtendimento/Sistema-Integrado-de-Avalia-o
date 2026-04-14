const googleSheetsService = require('../services/googleSheetsService');
const { v4: uuidv4 } = require('uuid');

function parseNumber(value) {
  const number = Number(value);
  return Number.isNaN(number) ? null : number;
}

function buildResponseObject(headers, payload) {
  return headers.map((header) => payload[header] || '');
}

function calculateAverage(values) {
  const numeric = values.map(parseNumber).filter((value) => value !== null);
  if (!numeric.length) return 0;
  return numeric.reduce((acc, item) => acc + item, 0) / numeric.length;
}

function hasCriticalValue(values) {
  return values.some((value) => parseNumber(value) !== null && parseNumber(value) <= 2);
}

function flattenObject(payload) {
  return Object.entries(payload).reduce((acc, [key, value]) => {
    acc[key] = value;
    return acc;
  }, {});
}

exports.getCadastros = async (req, res, next) => {
  try {
    const cadastros = await googleSheetsService.getCadastros();
    res.json(cadastros);
  } catch (error) {
    next(error);
  }
};

exports.getPerguntas = async (req, res, next) => {
  try {
    const { formulario } = req.params;
    const perguntas = await googleSheetsService.getPerguntas(formulario);
    res.json({ perguntas });
  } catch (error) {
    next(error);
  }
};

exports.postRespostaExame = async (req, res, next) => {
  try {
    const data = flattenObject(req.body);
    const requiredFields = ['Entidade_Certificadora', 'Tipo_Certificacao', 'Nivel_Certificacao', 'Modalidade_Prova', 'Data_Exame'];
    const missing = requiredFields.filter((field) => !data[field]);
    if (missing.length) {
      return res.status(400).json({ error: `Campos obrigatórios ausentes: ${missing.join(', ')}` });
    }

    const headers = await googleSheetsService.getHeaders('BASE_EXAME_PROVAS');
    const id = `EX-${uuidv4()}`;
    const timestamp = new Date().toISOString();
    const blocoKeys = headers.filter((key) => key.startsWith('B') && key.includes('.'));
    const blocoValues = blocoKeys.map((key) => data[key] || '');
    const avg = calculateAverage(blocoValues);
    const flagCritico = hasCriticalValue(blocoValues) || avg <= 2.5;

    const output = {
      ...data,
      ID_Avaliacao: id,
      Data_Recebimento: timestamp,
      Media_Geral_Exame: avg.toFixed(2),
      Flag_Critico: flagCritico ? 'VERDADEIRO' : 'FALSO'
    };

    const row = buildResponseObject(headers, output);
    await googleSheetsService.appendRow('BASE_EXAME_PROVAS', row);
    res.json({ success: true, message: 'Avaliação de exame enviada com sucesso.', id });
  } catch (error) {
    next(error);
  }
};

exports.postRespostaCcpCap = async (req, res, next) => {
  try {
    const data = flattenObject(req.body);
    const requiredFields = ['Entidade_Certificadora', 'Modalidade_CCP_CAP', 'Tipo_Certificacao', 'Data_Curso'];
    const missing = requiredFields.filter((field) => !data[field]);
    if (missing.length) {
      return res.status(400).json({ error: `Campos obrigatórios ausentes: ${missing.join(', ')}` });
    }

    const headers = await googleSheetsService.getHeaders('BASE_CCP_CAP');
    const id = `CCP-${uuidv4()}`;
    const timestamp = new Date().toISOString();

    const eixo1Keys = headers.filter((key) => key.startsWith('E1_'));
    const eixo2Keys = headers.filter((key) => key.startsWith('E2_'));
    const eixo3Keys = headers.filter((key) => key.startsWith('E3_')); 

    const eixo1Avg = calculateAverage(eixo1Keys.map((key) => data[key] || ''));
    const eixo2Avg = calculateAverage(eixo2Keys.map((key) => data[key] || ''));
    const eixo3Avg = calculateAverage(eixo3Keys.map((key) => data[key] || ''));
    const weighted = ((eixo1Avg + eixo2Avg + eixo3Avg) / 3).toFixed(2);

    const output = {
      ...data,
      ID_Avaliacao: id,
      Data_Recebimento: timestamp,
      Media_Eixo1: eixo1Avg.toFixed(2),
      Media_Eixo2: eixo2Avg.toFixed(2),
      Media_Eixo3: eixo3Avg.toFixed(2),
      Nota_Global_Ponderada: weighted
    };

    const row = buildResponseObject(headers, output);
    await googleSheetsService.appendRow('BASE_CCP_CAP', row);
    res.json({ success: true, message: 'Avaliação CCP/CAP enviada com sucesso.', id });
  } catch (error) {
    next(error);
  }
};
