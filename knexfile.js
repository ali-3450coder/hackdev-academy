require('dotenv').config();

const dbClient = process.env.DB_CLIENT || 'sqlite3';

module.exports = {
  development: {
    client: 'sqlite3',
    connection: {
      filename: process.env.DB_FILENAME || './dev.sqlite3'
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
      : { filename: process.env.DB_FILENAME || './prod.sqlite3' },
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
