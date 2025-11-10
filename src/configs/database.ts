import mysql from 'mysql2/promise';
import dotenv from 'dotenv'
dotenv.config({ path: './src/configs/secrets.env' })



interface PoolConfig {
    host: string;
    user: string;
    password: string;
    database: string;
    waitForConnections: boolean;
    connectionLimit: number;
    queueLimit: number;
}


const db = mysql.createPool({
    host: process.env.dbHost,
    user: process.env.dbUser,
    password: process.env.dbPassword,
    database: process.env.dbName,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
} as PoolConfig);

export default db;