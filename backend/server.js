import express from 'express'; import cors from 'cors'; import dotenv from 'dotenv'; import path from 'path'; import { fileURLToPath } from 'url'; import bcrypt from 'bcryptjs';
import {query,pool,initDatabase} from './config/db.js'; import authRoutes from './routes/auth.js'; import eventRoutes from './routes/events.js'; import registrationRoutes from './routes/registrations.js'; import organizerRoutes from './routes/organizer.js'; import adminRoutes from './routes/admin.js'; import notificationRoutes from './routes/notifications.js'; import studentRoutes from './routes/student.js'; import {notFound,errorHandler} from './middleware/error.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Load backend/.env regardless of whether the app was started from the root or backend folder.
dotenv.config({ path: path.join(__dirname, '.env'), override: false });
if (!process.env.JWT_SECRET || !process.env.JWT_SECRET.trim()) {
  throw new Error('JWT_SECRET is missing. Add JWT_SECRET=your_long_random_secret to backend/.env and restart the backend.');
}
const app=express();
app.use(cors({ origin: process.env.CLIENT_URL }));
app.get('/api/health',(req,res)=>res.json({status:'ok',service:'College Event Management API'}));
app.use('/api/auth',authRoutes);app.use('/api/events',eventRoutes);app.use('/api/registrations',registrationRoutes);app.use('/api/organizer',organizerRoutes);app.use('/api/admin',adminRoutes);app.use('/api/notifications',notificationRoutes); app.use('/api/student',studentRoutes);
app.use(notFound);app.use(errorHandler);
async function seedAdmin(){const rows=await query('SELECT id,role,is_system_admin FROM users WHERE email=?',['admin@college.edu']);if(!rows.length){const hash=await bcrypt.hash('Admin@123',12);await query('INSERT INTO users(email,password_hash,role,full_name,mobile,is_system_admin) VALUES(?,?,?,?,?,?)',['admin@college.edu',hash,'admin','System Administrator',null,1]);console.log('Default admin created: admin@college.edu / Admin@123');}else if(rows[0].role!=='admin'){await query("UPDATE users SET role='admin',is_system_admin=1,full_name='System Administrator' WHERE id=?",[rows[0].id]);console.log('Default admin role repaired for admin@college.edu');}}
const port=Number(process.env.PORT||5000);initDatabase().then(()=>seedAdmin()).then(()=>app.listen(port,()=>console.log(`API running at http://localhost:${port}`))).catch(err=>{console.error('Database startup failed:',err.message);process.exit(1)});
