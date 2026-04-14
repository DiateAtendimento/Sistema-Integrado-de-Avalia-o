const dotenv = require('dotenv');
dotenv.config();

module.exports = {
  port: process.env.PORT || 3000,
  googleSheetId: process.env.GOOGLE_SHEET_ID,
  googleCredentials: process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS,
  jwtSecret: process.env.JWT_SECRET || 'default_secret',
  adminUser: process.env.ADMIN_USER || 'admin',
  adminPassword: process.env.ADMIN_PASSWORD || 'senha123',
  corsOrigin: process.env.CORS_ORIGIN || '*'
};
