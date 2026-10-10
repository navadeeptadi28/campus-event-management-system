import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query, pool } from '../config/db.js';

function tokenFor(user) {
  const secret = String(process.env.JWT_SECRET || '').trim();
  if (!secret) {
    const error = new Error('JWT_SECRET is missing. Add JWT_SECRET to backend/.env and restart the backend.');
    error.status = 500;
    throw error;
  }
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.full_name,
      isSystemAdmin: Boolean(user.is_system_admin)
    },
    secret,
    { expiresIn: '7d' }
  );
}

export async function registerStudent(req, res, next) {
  const { fullName, studentId, email, mobile, password, department, course, year, section } = req.body;
  try {
    if (!fullName || !studentId || !email || !mobile || !password || !department || !course || !year || !section) {
      return res.status(400).json({ message: 'All registration fields are required' });
    }
    if (password.length < 6) return res.status(400).json({ message: 'Password must contain at least 6 characters' });

    const normalizedEmail = email.trim().toLowerCase();
    const dupEmail = await query('SELECT id FROM users WHERE email=?', [normalizedEmail]);
    const dupStudent = await query('SELECT id FROM students WHERE student_id=?', [studentId.trim()]);
    if (dupEmail.length || dupStudent.length) {
      return res.status(409).json({ message: dupEmail.length ? 'Email already exists' : 'Student ID already exists' });
    }

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const hash = await bcrypt.hash(password, 12);
      const [u] = await conn.execute(
        'INSERT INTO users(email,password_hash,role,full_name,mobile) VALUES(?,?,?,?,?)',
        [normalizedEmail, hash, 'student', fullName.trim(), mobile.trim()]
      );
      await conn.execute(
        'INSERT INTO students(user_id,student_id,department,course,year,section) VALUES(?,?,?,?,?,?)',
        [u.insertId, studentId.trim(), department.trim(), course.trim(), String(year).trim(), section.trim()]
      );
      await conn.commit();
      return res.status(201).json({ message: 'Registration successful' });
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Email or Student ID already exists' });
    next(e);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password, role } = req.body;
    if (!email || !password || !role) return res.status(400).json({ message: 'Account type, email and password are required' });
    if (!['student', 'admin'].includes(role)) return res.status(400).json({ message: 'Choose Student Login or Admin Login' });

    const normalizedEmail = email.trim().toLowerCase();
    const rows = await query(
      'SELECT id,email,password_hash,role,full_name,mobile,is_active,is_system_admin FROM users WHERE email=? AND role=? LIMIT 1',
      [normalizedEmail, role]
    );
    if (!rows.length) return res.status(401).json({ message: role === 'admin' ? 'Invalid admin email or password' : 'Invalid student email or password' });

    const user = rows[0];
    const passwordOk = await bcrypt.compare(password, user.password_hash);
    if (!passwordOk) return res.status(401).json({ message: role === 'admin' ? 'Invalid admin email or password' : 'Invalid student email or password' });
    if (!user.is_active) return res.status(403).json({ message: 'Account is disabled' });

    return res.json({
      token: tokenFor(user),
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        fullName: user.full_name,
        mobile: user.mobile,
        isSystemAdmin: Boolean(user.is_system_admin)
      }
    });
  } catch (e) {
    next(e);
  }
}

export async function me(req, res, next) {
  try {
    const u = (await query(
      'SELECT id,email,role,full_name,mobile,is_system_admin,created_at FROM users WHERE id=?',
      [req.user.id]
    ))[0];
    if (!u) return res.status(404).json({ message: 'User not found' });

    let profile = {};
    if (u.role === 'student') {
      profile = (await query(
        'SELECT student_id,department,course,year,section FROM students WHERE user_id=?',
        [u.id]
      ))[0] || {};
    } else if (u.role === 'organizer') {
      profile = (await query(
        'SELECT employee_id,department,designation FROM organizers WHERE user_id=?',
        [u.id]
      ))[0] || {};
    }

    res.json({ user: { ...u, fullName: u.full_name, isSystemAdmin: Boolean(u.is_system_admin), profile } });
  } catch (e) {
    next(e);
  }
}
