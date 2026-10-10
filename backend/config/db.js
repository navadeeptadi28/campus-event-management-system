import sqlite3 from 'sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Always resolve the environment file relative to backend/, not the current terminal directory.
dotenv.config({ path: path.resolve(__dirname, '..', '.env'), override: false });
const dataDir = path.resolve(__dirname, '..', 'data');
fs.mkdirSync(dataDir, { recursive: true });
const dbPath = path.resolve(dataDir, process.env.SQLITE_DB || 'college_event_management.db');
const sqlite = sqlite3.verbose();
const db = new sqlite.Database(dbPath);
db.configure('busyTimeout', 5000);

function run(sql, params = []) {
  return new Promise((resolve, reject) => db.run(sql, params, function (err) {
    if (err) {
      if (err.code === 'SQLITE_CONSTRAINT' || /UNIQUE constraint failed/i.test(err.message || '')) err.code = 'ER_DUP_ENTRY';
      return reject(err);
    }
    resolve({ insertId: this.lastID, affectedRows: this.changes, changes: this.changes });
  }));
}
function all(sql, params = []) { return new Promise((resolve, reject) => db.all(sql, params, (err, rows) => err ? reject(err) : resolve(rows))); }
function exec(sql) { return new Promise((resolve, reject) => db.exec(sql, err => err ? reject(err) : resolve())); }
function isRead(sql) { const n = sql.trim().toUpperCase(); return n.startsWith('SELECT') || n.startsWith('WITH') || n.startsWith('PRAGMA') || n.startsWith('EXPLAIN'); }
function normalizeSql(sql) { return sql.replace(/\bCURDATE\(\)/gi, "date('now','localtime')").replace(/\bNOW\(\)/gi, "datetime('now','localtime')").replace(/INSERT\s+IGNORE\s+INTO/gi, 'INSERT OR IGNORE INTO'); }
async function execute(sql, params = []) { const n = normalizeSql(sql); return isRead(n) ? all(n, params) : run(n, params); }
class Connection {
  async execute(sql, params = []) { const n = normalizeSql(sql); return isRead(n) ? [await all(n, params), []] : [await run(n, params), []]; }
  async beginTransaction() { await run('BEGIN IMMEDIATE TRANSACTION'); }
  async commit() { await run('COMMIT'); }
  async rollback() { try { await run('ROLLBACK'); } catch (_) {} }
  release() {}
}
export const pool = { async getConnection() { return new Connection(); } };
export async function query(sql, params = []) { return execute(sql, params); }

async function hasColumn(table, column) {
  const rows = await all(`PRAGMA table_info(${table})`);
  return rows.some(r => r.name === column);
}
async function ensureColumn(table, column, definition) {
  if (!(await hasColumn(table, column))) await run(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
}

export async function initDatabase() {
  await exec('PRAGMA foreign_keys = ON;');
  await exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('student','organizer','admin')),
      full_name TEXT NOT NULL,
      mobile TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      is_system_admin INTEGER NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL UNIQUE,
      student_id TEXT NOT NULL UNIQUE,
      department TEXT NOT NULL,
      course TEXT NOT NULL,
      year TEXT NOT NULL,
      section TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS organizers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL UNIQUE,
      employee_id TEXT UNIQUE,
      department TEXT,
      designation TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      organizer_id INTEGER NOT NULL,
      category_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      poster TEXT,
      venue TEXT NOT NULL,
      event_date TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      registration_start TEXT NOT NULL,
      registration_end TEXT NOT NULL,
      max_participants INTEGER NOT NULL,
      eligibility TEXT,
      rules TEXT,
      contact_information TEXT,
      organizer_display_name TEXT,
      organization_type TEXT,
      organization_name TEXT,
      organization_details TEXT,
      organization_website TEXT,
      organization_linkedin TEXT,
      sponsor_name TEXT,
      sponsor_details TEXT,
      sponsor_website TEXT,
      sponsor_linkedin TEXT,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected','cancelled')),
      rejection_reason TEXT,
      deleted_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(organizer_id) REFERENCES organizers(id) ON DELETE CASCADE,
      FOREIGN KEY(category_id) REFERENCES categories(id) ON DELETE RESTRICT
    );
    CREATE INDEX IF NOT EXISTS idx_events_date_status ON events(event_date,status);
    CREATE INDEX IF NOT EXISTS idx_events_deleted ON events(deleted_at);
    CREATE TABLE IF NOT EXISTS event_registrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      registration_code TEXT NOT NULL UNIQUE,
      student_id INTEGER NOT NULL,
      event_id INTEGER NOT NULL,
      registration_date TEXT DEFAULT CURRENT_TIMESTAMP,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected','cancelled')),
      FOREIGN KEY(student_id) REFERENCES students(id) ON DELETE CASCADE,
      FOREIGN KEY(event_id) REFERENCES events(id) ON DELETE CASCADE,
      UNIQUE(student_id,event_id)
    );
    CREATE INDEX IF NOT EXISTS idx_reg_event ON event_registrations(event_id);
    CREATE INDEX IF NOT EXISTS idx_reg_student ON event_registrations(student_id);
    CREATE TABLE IF NOT EXISTS team_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      registration_id INTEGER NOT NULL,
      member_index INTEGER NOT NULL,
      full_name TEXT NOT NULL,
      student_id TEXT NOT NULL,
      department TEXT,
      course TEXT,
      year TEXT,
      email TEXT,
      mobile TEXT,
      section TEXT,
      details_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(registration_id) REFERENCES event_registrations(id) ON DELETE CASCADE,
      UNIQUE(registration_id, member_index)
    );
    CREATE INDEX IF NOT EXISTS idx_team_members_registration ON team_members(registration_id, member_index);
    CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      registration_id INTEGER NOT NULL UNIQUE,
      status TEXT NOT NULL CHECK(status IN ('Present','Absent')),
      marked_by INTEGER NOT NULL,
      marked_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(registration_id) REFERENCES event_registrations(id) ON DELETE CASCADE,
      FOREIGN KEY(marked_by) REFERENCES users(id) ON DELETE RESTRICT
    );
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      is_read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id,created_at);
  `);

  // Safe migrations for databases created by earlier SQLite ZIP versions.
  await ensureColumn('users', 'is_system_admin', 'INTEGER NOT NULL DEFAULT 0');
  await ensureColumn('events', 'deleted_at', 'TEXT');
  await ensureColumn('events', 'organizer_display_name', 'TEXT');
  await ensureColumn('events', 'organization_type', 'TEXT');
  await ensureColumn('events', 'organization_name', 'TEXT');
  await ensureColumn('events', 'organization_details', 'TEXT');
  await ensureColumn('events', 'organization_website', 'TEXT');
  await ensureColumn('events', 'organization_linkedin', 'TEXT');
  await ensureColumn('events', 'sponsor_name', 'TEXT');
  await ensureColumn('events', 'sponsor_details', 'TEXT');
  await ensureColumn('events', 'sponsor_website', 'TEXT');
  await ensureColumn('events', 'sponsor_linkedin', 'TEXT');
  await ensureColumn('events', 'campus_scope', "TEXT NOT NULL DEFAULT 'hosting_only'");
  await ensureColumn('events', 'participation_type', "TEXT NOT NULL DEFAULT 'individual'");
  await ensureColumn('events', 'team_min_size', 'INTEGER NOT NULL DEFAULT 2');
  await ensureColumn('events', 'team_max_size', 'INTEGER NOT NULL DEFAULT 5');
  await ensureColumn('events', 'registration_config_json', "TEXT NOT NULL DEFAULT '{}'");
  await ensureColumn('event_registrations', 'college_name', 'TEXT');
  await ensureColumn('event_registrations', 'campus_type', "TEXT NOT NULL DEFAULT 'hosting'");
  await ensureColumn('event_registrations', 'full_name_snapshot', 'TEXT');
  await ensureColumn('event_registrations', 'student_id_snapshot', 'TEXT');
  await ensureColumn('event_registrations', 'email_snapshot', 'TEXT');
  await ensureColumn('event_registrations', 'mobile_snapshot', 'TEXT');
  await ensureColumn('event_registrations', 'department_snapshot', 'TEXT');
  await ensureColumn('event_registrations', 'course_snapshot', 'TEXT');
  await ensureColumn('event_registrations', 'year_snapshot', 'TEXT');
  await ensureColumn('event_registrations', 'section_snapshot', 'TEXT');
  await ensureColumn('event_registrations', 'custom_answers_json', "TEXT NOT NULL DEFAULT '{}'");
  await ensureColumn('event_registrations', 'team_name', 'TEXT');
  await ensureColumn('event_registrations', 'team_members_json', "TEXT NOT NULL DEFAULT '[]'");
  // Backfill normalized team-member rows from earlier JSON-only registrations.
  const teamRegs = await all("SELECT id,team_members_json FROM event_registrations WHERE team_name IS NOT NULL AND team_name<>''");
  for (const tr of teamRegs) {
    const leader=(await all('SELECT r.full_name_snapshot,r.student_id_snapshot,r.department_snapshot,r.course_snapshot,r.year_snapshot,r.email_snapshot,r.mobile_snapshot,r.section_snapshot FROM event_registrations r WHERE r.id=?',[tr.id]))[0]||{};
    await run(`INSERT OR IGNORE INTO team_members(registration_id,member_index,full_name,student_id,department,course,year,email,mobile,section,details_json) VALUES(?,?,?,?,?,?,?,?,?,?,?)`,[tr.id,1,leader.full_name_snapshot||'Team Leader',leader.student_id_snapshot||`LEADER-${tr.id}`,leader.department_snapshot||'',leader.course_snapshot||'',leader.year_snapshot||'',leader.email_snapshot||'',leader.mobile_snapshot||'',leader.section_snapshot||'',JSON.stringify({...leader,teamLeader:true})]);
    let members=[]; try { members=JSON.parse(tr.team_members_json||'[]'); } catch {}
    for (let i=0;i<members.length;i++) {
      const m=members[i]||{};
      await run(`INSERT OR IGNORE INTO team_members(registration_id,member_index,full_name,student_id,department,course,year,email,mobile,section,details_json) VALUES(?,?,?,?,?,?,?,?,?,?,?)`,[tr.id,i+2,String(m.fullName||'Member').trim(),String(m.studentId||`UNKNOWN-${tr.id}-${i+2}`).trim(),m.department||'',m.course||'',m.year||'',m.email||'',m.mobile||'',m.section||'',JSON.stringify(m)]);
    }
  }
  await run("UPDATE users SET is_system_admin=1 WHERE email='admin@college.edu' AND role='admin'");

  const categories = [
    ['Technical','Technical events and technology activities'],['Cultural','Cultural and creative activities'],['Sports','Indoor and outdoor sports'],
    ['Workshop','Hands-on learning workshops'],['Seminar','Talks, seminars and guest sessions'],['Hackathon','Collaborative coding and innovation events'],
    ['Competition','Academic and non-academic competitions'],['Other','Other college activities']
  ];
  for (const [name, description] of categories) await run('INSERT OR IGNORE INTO categories(name,description) VALUES(?,?)', [name, description]);
  console.log(`SQLite database ready: ${dbPath}`);
}
