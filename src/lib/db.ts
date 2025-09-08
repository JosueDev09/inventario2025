import mysql from 'mysql2/promise';

 const pool = mysql.createPool({ 
  user: process.env.DB_USER || 'admin',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_DATABASE || 'dbAlmacen',
  port: parseInt(process.env.DB_PORT || '3306'),
 });  

 export const db = pool;