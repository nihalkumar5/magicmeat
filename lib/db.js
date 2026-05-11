const mysql = require('mysql2/promise');

let pool;

function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME || 'test',
      port: process.env.DB_PORT || 4000,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      ssl: {
        rejectUnauthorized: true,
        minVersion: 'TLSv1.2'
      },
      connectTimeout: 20000
    });
  }
  return pool;
}

module.exports = { getPool };
