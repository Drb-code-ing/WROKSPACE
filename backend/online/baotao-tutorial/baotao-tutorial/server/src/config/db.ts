import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
};

const pool = mysql.createPool({
  ...dbConfig,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export const testConnection = async (): Promise<void> => {
  console.log('\n========== DATABASE CONNECTION TEST ==========');
  console.log(`Host: ${dbConfig.host || '(not set)'}`);
  console.log(`Port: ${dbConfig.port}`);
  console.log(`User: ${dbConfig.user || '(not set)'}`);
  console.log(`Database: ${dbConfig.database || '(not set)'}`);
  console.log('===============================================\n');

  if (!dbConfig.host || !dbConfig.user || !dbConfig.database) {
    throw new Error(
      'Missing database configuration. Please check your .env file.\n' +
      'Required: DB_HOST, DB_USER, DB_PASSWORD, DB_NAME'
    );
  }

  try {
    const connection = await pool.getConnection();
    console.log('✓ Database connected successfully!');
    connection.release();
  } catch (error: any) {
    if (error.code === 'ECONNREFUSED') {
      throw new Error(
        `Cannot connect to MySQL at ${dbConfig.host}:${dbConfig.port}\n` +
        'Please check:\n' +
        '  1. MySQL server is running\n' +
        '  2. Host and port are correct\n' +
        '  3. Firewall allows the connection'
      );
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      throw new Error(
        'Access denied. Please check your DB_USER and DB_PASSWORD'
      );
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      throw new Error(
        `Database "${dbConfig.database}" does not exist. Please create it first.`
      );
    }
    throw error;
  }
};

export default pool;
