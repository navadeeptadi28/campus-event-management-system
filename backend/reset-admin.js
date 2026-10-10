import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import {query, initDatabase} from './config/db.js';
dotenv.config();
const email='admin@college.edu';
const password='Admin@123';
await initDatabase();
const hash=await bcrypt.hash(password,12);
const rows=await query('SELECT id FROM users WHERE email=?',[email]);
if(rows.length){
  await query("UPDATE users SET password_hash=?, role='admin', full_name='System Administrator', is_active=1, is_system_admin=1 WHERE id=?",[hash,rows[0].id]);
  console.log('System Administrator password reset successfully.');
}else{
  await query('INSERT INTO users(email,password_hash,role,full_name,is_active,is_system_admin) VALUES(?,?,?,?,?,?)',[email,hash,'admin','System Administrator',1,1]);
  console.log('System Administrator created successfully.');
}
console.log('Email: admin@college.edu');
console.log('Password: Admin@123');
process.exit(0);
