const { google } = require('googleapis');
const config = require('../config');

let authClient;
let sheetsClient;
let driveClient;

function createAuth() {
  if (authClient) {
    return authClient;
  }

  let credentials;
  try {
    credentials = JSON.parse(config.googleCredentials);
  } catch (error) {
    throw new Error('Google Service Account credentials inválidas. Verifique o .env.');
  }

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive.readonly'
    ]
  });

  authClient = auth;
  return authClient;
}

function createSheetsClient() {
  if (sheetsClient) {
    return sheetsClient;
  }
  sheetsClient = google.sheets({ version: 'v4', auth: createAuth() });
  return sheetsClient;
}

function createDriveClient() {
  if (driveClient) {
    return driveClient;
  }
  driveClient = google.drive({ version: 'v3', auth: createAuth() });
  return driveClient;
}

async function readSheet(sheetName) {
  const sheets = createSheetsClient();
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
  const sheets = createSheetsClient();
  const response = await sheets.spreadsheets.values.append({
    spreadsheetId: config.googleSheetId,
    range: sheetName,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values: [values] }
  });
  return response.data;
}

async function exportSpreadsheetXlsx() {
  const drive = createDriveClient();
  const response = await drive.files.export(
    {
      fileId: config.googleSheetId,
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    },
    { responseType: 'arraybuffer' }
  );
  return Buffer.from(response.data);
}

function normalizeFormKey(value) {
  return (value || '')
    .toString()
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\/_\s]+/g, '-')
    .replace(/-+/g, '-');
}

function getFormularioAliases(formulario) {
  const normalized = normalizeFormKey(formulario);
  const aliasMap = {
    'exame-provas': ['exame-provas', 'exame-por-provas', 'exameprovas', 'exame'],
    'ccp-cap': ['ccp-cap', 'ccpcap', 'ccp/cap', 'ccp-capacitacao', 'cap-ccp']
  };

  const matchedEntry = Object.entries(aliasMap).find(([, aliases]) => aliases.includes(normalized));
  if (!matchedEntry) {
    return [normalized];
  }

  const [canonical, aliases] = matchedEntry;
  return [canonical, ...aliases];
}

async function getPerguntas(formulario) {
  const rows = await getSheetObjects('DICIONARIO_PERGUNTAS');
  const aliases = getFormularioAliases(formulario);
  return rows.filter((item) => aliases.includes(normalizeFormKey(item.Formulario)));
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
  exportSpreadsheetXlsx,
  getPerguntas,
  getCadastros,
  readSheet
};
