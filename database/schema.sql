-- SQLite schema for College Event Management System
-- The backend also creates/migrates these tables automatically.
PRAGMA foreign_keys = ON;

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
  id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL UNIQUE,
  student_id TEXT NOT NULL UNIQUE, department TEXT NOT NULL, course TEXT NOT NULL,
  year TEXT NOT NULL, section TEXT NOT NULL,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS organizers (
  id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL UNIQUE,
  employee_id TEXT UNIQUE, department TEXT, designation TEXT,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE, description TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT, organizer_id INTEGER NOT NULL, category_id INTEGER NOT NULL,
  name TEXT NOT NULL, description TEXT NOT NULL, poster TEXT, venue TEXT NOT NULL,
  event_date TEXT NOT NULL, start_time TEXT NOT NULL, end_time TEXT NOT NULL,
  registration_start TEXT NOT NULL, registration_end TEXT NOT NULL, max_participants INTEGER NOT NULL,
  eligibility TEXT, rules TEXT, contact_information TEXT,
  organizer_display_name TEXT, organization_type TEXT, organization_name TEXT, organization_details TEXT,
  organization_website TEXT, organization_linkedin TEXT, sponsor_name TEXT, sponsor_details TEXT,
  sponsor_website TEXT, sponsor_linkedin TEXT,
  campus_scope TEXT NOT NULL DEFAULT 'hosting_only', participation_type TEXT NOT NULL DEFAULT 'individual',
  team_min_size INTEGER NOT NULL DEFAULT 2, team_max_size INTEGER NOT NULL DEFAULT 5, registration_config_json TEXT NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected','cancelled')),
  rejection_reason TEXT, deleted_at TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(organizer_id) REFERENCES organizers(id) ON DELETE CASCADE,
  FOREIGN KEY(category_id) REFERENCES categories(id) ON DELETE RESTRICT
);
CREATE INDEX IF NOT EXISTS idx_events_date_status ON events(event_date,status);
CREATE INDEX IF NOT EXISTS idx_events_deleted ON events(deleted_at);
CREATE TABLE IF NOT EXISTS event_registrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT, registration_code TEXT NOT NULL UNIQUE,
  student_id INTEGER NOT NULL, event_id INTEGER NOT NULL, registration_date TEXT DEFAULT CURRENT_TIMESTAMP,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected','cancelled')),
  college_name TEXT, campus_type TEXT NOT NULL DEFAULT 'hosting', full_name_snapshot TEXT, student_id_snapshot TEXT, email_snapshot TEXT, mobile_snapshot TEXT, department_snapshot TEXT, course_snapshot TEXT, year_snapshot TEXT, section_snapshot TEXT, custom_answers_json TEXT NOT NULL DEFAULT '{}', team_name TEXT, team_members_json TEXT NOT NULL DEFAULT '[]',
  FOREIGN KEY(student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY(event_id) REFERENCES events(id) ON DELETE CASCADE, UNIQUE(student_id,event_id)
);
CREATE INDEX IF NOT EXISTS idx_reg_event ON event_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_reg_student ON event_registrations(student_id);
CREATE TABLE IF NOT EXISTS attendance (
  id INTEGER PRIMARY KEY AUTOINCREMENT, registration_id INTEGER NOT NULL UNIQUE,
  status TEXT NOT NULL CHECK(status IN ('Present','Absent')), marked_by INTEGER NOT NULL,
  marked_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(registration_id) REFERENCES event_registrations(id) ON DELETE CASCADE,
  FOREIGN KEY(marked_by) REFERENCES users(id) ON DELETE RESTRICT
);
CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, title TEXT NOT NULL,
  message TEXT NOT NULL, is_read INTEGER NOT NULL DEFAULT 0, created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id,created_at);

INSERT OR IGNORE INTO categories(name,description) VALUES
('Technical','Technical events and technology activities'),('Cultural','Cultural and creative activities'),('Sports','Indoor and outdoor sports'),
('Workshop','Hands-on learning workshops'),('Seminar','Talks, seminars and guest sessions'),('Hackathon','Collaborative coding and innovation events'),
('Competition','Academic and non-academic competitions'),('Other','Other college activities');
