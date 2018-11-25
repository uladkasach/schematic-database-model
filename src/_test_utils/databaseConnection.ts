import dotenv from 'dotenv';
import mysql, { Connection, ConnectionOptions } from 'mysql2/promise';

dotenv.config(); // load from .env file into process.env

const promiseToCreateDatabaseConnection = async (): Promise<Connection> => {
  const dbConfig: ConnectionOptions = {
    host: process.env.TEST_DATABASE_HOST,
    user: process.env.TEST_DATABASE_USER,
    password: process.env.TEST_DATABASE_PASS,
    database: process.env.TEST_DATABASE_NAME,
    port: (process.env.TEST_DATABASE_PORT) ? parseInt(process.env.TEST_DATABASE_PORT, 10) : 3306,
  };
  const connection = await mysql.createConnection(dbConfig);
  return connection;
};

export default promiseToCreateDatabaseConnection;
