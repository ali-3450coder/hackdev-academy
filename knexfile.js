require('dotenv').config();
const path = require('path');
const fs   = require('fs');

const dbClient = process.env.DB_CLIENT || 'sqlite3';

// SQLite için veritabanı dosyasının klasörünü otomatik oluştur
function resolveSqlitePath(envPath, fallback) {
  const filePath = envPath || fallback;
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    try { fs.mkdirSync(dir, { recursive: true }); } catch (_) {}
  }
  // Klasör oluşturulamadıysa (izin yok vb.) güvenli fallback kullan
  if (!fs.existsSync(dir)) {
    return path.resolve(fallback);
  }
  return path.resolve(filePath);
}

module.exports = {
  development: {
    client: 'sqlite3',
    connection: {
      filename: resolveSqlitePath(process.env.DB_FILENAME, './dev.sqlite3')
    },
    migrations: {
      directory: './server/db/migrations'
    },
    seeds: {
      directory: './server/db/seeds'
    },
    useNullAsDefault: true
  },

  production: {
    client: dbClient,
    connection: dbClient === 'pg'
      ? process.env.DATABASE_URL
      : { filename: resolveSqlitePath(process.env.DB_FILENAME, './prod.sqlite3') },
    migrations: {
      directory: './server/db/migrations'
    },
    useNullAsDefault: true,
    ...(dbClient === 'pg' ? {
      pool: { min: 2, max: 10 },
      acquireConnectionTimeout: 10000
    } : {})
  }
};
