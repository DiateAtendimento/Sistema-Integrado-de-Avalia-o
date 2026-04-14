const { google } = require('googleapis');
const config = require('../config');

let sheetsClient;

function createAuth() {
  if (sheetsClient) {
    return sheetsClient;
  }

  let credentials;
  try {
    credentials = JSON.parse(config.googleCredentials);
  } catch (error) {
    throw new Error('Google Service Account credentials inválidas. Verifique o .env.');
  }

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
  });

  sheetsClient = google.sheets({ version: 'v4', auth });
  return sheetsClient;
}

async function readSheet(sheetName) {
  const sheets = createAuth();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: config.googleSheetId,
    range: `${sheetName}`
  });
  const rows = response.data.values || [];
  return rows;
}

function normalizeRows(rows) {
  if (!rows || rows.length === 0) {
    return [];
  }
  const headers = rows[0].map((header) => header.toString().trim());
  return rows.slice(1).map((row) => {
    const item = {};
    headers.forEach((header, index) => {
      item[header] = row[index] !== undefined ? row[index] : '';
    });
    return item;
  });
}

async function getSheetObjects(sheetName) {
  const rows = await readSheet(sheetName);
  return normalizeRows(rows);
}

async function getHeaders(sheetName) {
  const rows = await readSheet(sheetName);
  return rows[0] || [];
}

async function appendRow(sheetName, values) {
  const sheets = createAuth();
  const response = await sheets.spreadsheets.values.append({
    spreadsheetId: config.googleSheetId,
    range: sheetName,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values: [values] }
  });
  return response.data;
}

async function getPerguntas(formulario) {
  const rows = await getSheetObjects('DICIONARIO_PERGUNTAS');
  return rows.filter((item) => item.Formulario && item.Formulario.toString().toLowerCase() === formulario.toLowerCase());
}

async function getCadastros() {
  const cadastroTabs = [
    'CAD_ENTIDADES_CERTIFICADORAS',
    'CAD_TIPOS_CERTIFICACAO',
    'CAD_NIVEIS_CERTIFICACAO',
    'CAD_MODALIDADE_PROVA',
    'CAD_MODALIDADE_CCP_CAP',
    'CAD_ESCALA_NOTAS'
  ];

  const data = {};
  await Promise.all(cadastroTabs.map(async (tab) => {
    data[tab] = await getSheetObjects(tab);
  }));
  return data;
}

module.exports = {
  getSheetObjects,
  getHeaders,
  appendRow,
  getPerguntas,
  getCadastros,
  readSheet
};
