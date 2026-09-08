const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

module.exports = {
  PORT: process.env.PORT || 5000,
  TURSO_DATABASE_URL: process.env.TURSO_DATABASE_URL || 'file:courier_crm.db',
  TURSO_AUTH_TOKEN: process.env.TURSO_AUTH_TOKEN || '',
  JWT_SECRET: process.env.JWT_SECRET || 'couriercrm_super_secret_jwt_key_2026_prod',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  META_VERIFY_TOKEN: process.env.META_VERIFY_TOKEN || 'meta_couriercrm_verify_secret',
  META_ACCESS_TOKEN: process.env.META_ACCESS_TOKEN || '',
  WHATSAPP_PHONE_NUMBER_ID: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
  WHATSAPP_ACCESS_TOKEN: process.env.WHATSAPP_ACCESS_TOKEN || '',
  NODE_ENV: process.env.NODE_ENV || 'development'
};
