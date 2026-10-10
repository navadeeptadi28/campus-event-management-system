import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, CalendarDays, ClipboardList, CheckCircle, Plus, Trash2, Eye, EyeOff, Edit3,
  FileSpreadsheet, FileText, BarChart3, UserPlus, Save, X, RotateCcw, Shield, Archive, UserX,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/StatCard';

/* ---------- constants & helpers ---------- */
const emptyAdmin = { id: null, fullName: '', email: '', mobile: '', password: '' };

const TABS = ['overview', 'events', 'users', 'admins', 'registrations', 'categories', 'reports', 'bin'];

const STANDARD_EXPORT_COLUMNS = [
  ['student_name', 'Student Name'], ['student_id', 'Roll Number'], ['email', 'Email'],
  ['mobile', 'Mobile'], ['department', 'Department'], ['course', 'Course'],
  ['year', 'Year'], ['section', 'Section'], ['college_name', 'College Name'],
  ['campus_type', 'Campus Type'], ['team_id', 'Team ID'], ['team_name', 'Team Name'], ['team_members', 'Team Members'],
  ['registration_date', 'Registration Date'], ['registration_code', 'Registration ID'], ['status', 'Status'],
];

const DEFAULT_EXPORT_COLUMNS = [
  'student_name', 'student_id', 'email', 'mobile', 'department', 'course',
  'year', 'section', 'college_name', 'registration_date',
];

// Team events get Team ID + Team Name pre-selected (the admin can still untick them).
const TEAM_DEFAULT_EXPORT_COLUMNS = ['team_id', 'team_name', ...DEFAULT_EXPORT_COLUMNS];

const MAIN_ADMIN_EMAIL = 'admin@college.edu';

const parseJSON = (value, fallback) => {
  try { return value ? JSON.parse(value) : fallback; } catch { return fallback; }
};
const normalize = (v) => String(v || '').trim().toLowerCase();
const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN');
const capitalize = (s) => s[0].toUpperCase() + s.slice(1);
const getErr = (e, fallback) => e.response?.data?.message || fallback;

export default function AdminDashboard() {
  const { user } = useAuth();

  /* ---------- data ---------- */
  const [d, setD] = useState({});
  const [users, setUsers] = useState([]);
  const [events, setEvents] = useState([]);
  const [trash, setTrash] = useState([]);
  const [regs, setRegs] = useState([]);
  const [cats, setCats] = useState([]);
  const [, setReports] = useState({ byCategory: [], attendance: {}, events: [] });

  /* ---------- ui state ---------- */
  const [tab, setTab] = useState('overview');
  const [cat, setCat] = useState({ name: '', description: '' });
  const [admin, setAdmin] = useState(emptyAdmin);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  /* ---------- registration filters ---------- */
  const [registrationEventFilter, setRegistrationEventFilter] = useState('');
  const [registrationSearch, setRegistrationSearch] = useState('');
  const [registrationCampusFilter, setRegistrationCampusFilter] = useState('');
  const [registrationScopeFilter, setRegistrationScopeFilter] = useState('');
  const [registrationDepartmentFilter, setRegistrationDepartmentFilter] = useState('');
  const [registrationYearFilter, setRegistrationYearFilter] = useState('');
  const [collegeFilter, setCollegeFilter] = useState('');

  /* ---------- analysis & export ---------- */
  const [selectedEventId, setSelectedEventId] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [exportDepartment, setExportDepartment] = useState('');
  const [exportYear, setExportYear] = useState('');
  const [exportCampusType, setExportCampusType] = useState('');
  const [exportColumns, setExportColumns] = useState(DEFAULT_EXPORT_COLUMNS);

  /* ---------- loading ---------- */
  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [a, b, c, r, k, p, t] = await Promise.all([
        api.get('/admin/dashboard'),
        api.get('/admin/users'),
        api.get('/admin/events'),
        api.get('/admin/registrations'),
        api.get('/admin/categories'),
        api.get('/admin/reports'),
        api.get('/admin/bin'),
      ]);
      setD(a.data); setUsers(b.data); setEvents(c.data); setRegs(r.data);
      setCats(k.data); setReports(p.data); setTrash(t.data);
    } catch (e) {
      setError(getErr(e, 'Unable to load admin data.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const flash = (s) => { setMsg(s); setTimeout(() => setMsg(''), 3500); };

  /* ---------- event actions ---------- */
  const decision = async (id, status) => {
    try { await api.put(`/admin/events/${id}/status`, { status }); flash(`Event ${status}`); load(); }
    catch (e) { setError(getErr(e, 'Unable to update event')); }
  };

  const deleteEvent = async (id) => {
    if (!confirm('Move this event to Bin? It can be restored later.')) return;
    try { await api.delete(`/admin/events/${id}`); flash('Event moved to Bin'); load(); }
    catch (e) { setError(getErr(e, 'Unable to move event to Bin')); }
  };

  const restore = async (id) => {
    try { await api.put(`/admin/events/${id}/restore`); flash('Event restored'); load(); }
    catch (e) { setError(getErr(e, 'Unable to restore event')); }
  };

  const permanentDelete = async (id) => {
    if (!confirm('PERMANENT DELETE: this removes the event and all registrations and attendance for it. This cannot be undone. Continue?')) return;
    try { await api.delete(`/admin/events/${id}/permanent`); flash('Event permanently deleted'); load(); }
    catch (e) { setError(getErr(e, 'Unable to permanently delete event')); }
  };

  /* ---------- user / category actions ---------- */
  const toggle = async (id) => {
    try { await api.put(`/admin/users/${id}/toggle`); load(); }
    catch (e) { setError(getErr(e, 'Unable to update user')); }
  };

  const createCat = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/categories', cat);
      setCat({ name: '', description: '' });
      flash('Category created');
      load();
    } catch (x) { setError(getErr(x, 'Category error')); }
  };

  const deleteCategory = async (id) => {
    if (!confirm('Delete category?')) return;
    try { await api.delete(`/admin/categories/${id}`); load(); }
    catch (e) { setError(getErr(e, 'Cannot delete category')); }
  };

  /* ---------- registration / attendance ---------- */
  const registrationDecision = async (id, status) => {
    try { await api.put(`/admin/registrations/${id}/status`, { status }); flash(`Registration ${status}`); load(); }
    catch (e) { setError(getErr(e, 'Unable to update registration')); }
  };

  const loadAnalysis = async (id) => {
    if (!id) { setAnalysis(null); return; }
    setAnalysisLoading(true);
    try {
      const r = await api.get(`/admin/events/${id}/analysis`);
      setAnalysis(r.data);
    } catch (e) {
      setError(getErr(e, 'Unable to analyse event'));
    } finally {
      setAnalysisLoading(false);
    }
  };

  const attendance = async (id, status) => {
    try {
      await api.put(`/admin/attendance/${id}`, { status });
      flash('Attendance updated');
      load();
      if (selectedEventId) loadAnalysis(selectedEventId);
    } catch (e) { setError(getErr(e, 'Unable to update attendance')); }
  };

  const selectEvent = (e) => {
    const id = e.target.value;
    setSelectedEventId(id);
    loadAnalysis(id);
    // Reset export columns to sensible defaults for the chosen event type.
    const ev = events.find((x) => String(x.id) === String(id));
    setExportColumns(ev?.participation_type === 'team' ? TEAM_DEFAULT_EXPORT_COLUMNS : DEFAULT_EXPORT_COLUMNS);
  };

  /* ---------- admin accounts ---------- */
  const isMainAdmin = Boolean(
    user?.isSystemAdmin || user?.is_system_admin || normalize(user?.email) === MAIN_ADMIN_EMAIL
  );

  const createAdmin = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/admins', admin);
      setAdmin(emptyAdmin);
      flash('New administrator created');
      load();
    } catch (x) { setError(getErr(x, 'Unable to create admin')); }
  };

  const updateAdmin = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/admin/admins/${admin.id}`, admin);
      flash('Administrator details updated');
      setAdmin(emptyAdmin);
      load();
    } catch (x) { setError(getErr(x, 'Unable to update admin')); }
  };

  const deleteAdmin = async (id) => {
    if (!isMainAdmin) { setError('Only the Main Administrator can delete administrator accounts.'); return; }
    if (!confirm('Delete this administrator account? This action cannot be undone.')) return;
    try {
      await api.delete(`/admin/admins/${id}`);
      flash('Administrator deleted successfully');
      await load();
    } catch (e) { setError(getErr(e, 'Unable to delete administrator')); }
  };

  /* ---------- export ---------- */
  const downloadEvent = async (format) => {
    if (!selectedEventId) return;
    if (!exportColumns.length) { setError('Select at least one export column.'); return; }
    try {
      const params = new URLSearchParams({
        format,
        columns: exportColumns.join(','),
        college: collegeFilter,
        department: exportDepartment,
        year: exportYear,
        campusType: exportCampusType,
      });
      const r = await api.get(`/admin/events/${selectedEventId}/export?${params.toString()}`, { responseType: 'blob' });
      const type = format === 'pdf'
        ? 'application/pdf'
        : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      const url = URL.createObjectURL(new Blob([r.data], { type }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(analysis?.event?.name || 'event').replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-participants.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      flash(`${format.toUpperCase()} downloaded`);
    } catch (e) {
      setError(getErr(e, `Unable to download ${format.toUpperCase()}`));
    }
  };

  /* ---------- early return ---------- */
  if (loading) return <div className="center-page"><div className="spinner" /></div>;

  /* ---------- derived values ---------- */
  const adminUsers = users.filter((u) => u.role === 'admin');

  const selectedEvent = events.find((e) => String(e.id) === String(selectedEventId));
  const selectedQuestions = parseJSON(selectedEvent?.registration_config_json, {}).questions || [];
  const selectedIsTeam = selectedEvent?.participation_type === 'team';

  // Team ID only makes sense for team events. Team members are always expanded into rows
  // for team events, so the packed "Team Members" column is hidden there.
  const exportColumnOptions = [
    ...STANDARD_EXPORT_COLUMNS.filter(([key]) => {
      if (key === 'team_id') return selectedIsTeam;
      if (key === 'team_members') return !selectedIsTeam;
      return true;
    }),
    ...selectedQuestions.map((q) => [`q:${q.id}`, q.label]),
  ];

  const filteredRegs = regs.filter((r) => {
    const q = registrationSearch.toLowerCase();
    return (
      (!registrationEventFilter || String(r.event_id) === registrationEventFilter) &&
      (!collegeFilter || String(r.college_name || '').toLowerCase().includes(collegeFilter.toLowerCase())) &&
      (!registrationCampusFilter || r.campus_type === registrationCampusFilter) &&
      (!registrationScopeFilter || r.campus_scope === registrationScopeFilter) &&
      (!registrationDepartmentFilter || String(r.department || '').toLowerCase().includes(registrationDepartmentFilter.toLowerCase())) &&
      (!registrationYearFilter || String(r.year || '') === registrationYearFilter) &&
      (!q || [r.student_name, r.student_id, r.email, r.team_name, r.registration_code].some((v) => String(v || '').toLowerCase().includes(q)))
    );
  });

  const questionLabel = (reg, key) => {
    const ev = events.find((x) => String(x.id) === String(reg.event_id));
    const questions = parseJSON(ev?.registration_config_json, {}).questions || [];
    return questions.find((q) => q.id === key)?.label || key;
  };

  /* ---------- render ---------- */
  return (
    <div className="container page">
      {/* Header */}
      <div className="page-header">
        <div>
          <span className="eyebrow">Admin console</span>
          <h1>College overview</h1>
          <p className="muted">
            Create and manage events, students, administrators, registrations, attendance and reports.
            Organizer, organization and sponsor details are entered directly while creating or editing an event.
          </p>
        </div>
        <Link to="/admin/events/new" className="btn btn-primary"><Plus size={18} /> Create Event</Link>
      </div>

      {/* Stats — all five cards in one row */}
      <div className="stats stats-5">
        <StatCard label="Students" value={d.students || 0} icon={<Users />} />
        <StatCard label="Organizers" value={d.organizers || 0} icon={<Users />} />
        <StatCard label="Events" value={d.events || 0} icon={<CalendarDays />} />
        <StatCard label="Registrations" value={d.event_registrations || 0} icon={<ClipboardList />} />
        <StatCard label="Upcoming" value={d.upcoming || 0} icon={<CheckCircle />} />
      </div>

      {/* Tabs */}
      <div className="tabs">
        {TABS.map((x) => (
          <button className={tab === x ? 'active' : ''} key={x} onClick={() => setTab(x)}>
            {x === 'bin' ? 'Bin' : capitalize(x)}
          </button>
        ))}
      </div>

      {msg && <div className="alert success">{msg}</div>}
      {error && <div className="alert error">{error}</div>}

      {/* ================= OVERVIEW ================= */}
      {tab === 'overview' && (
        <div className="two-col">
          <section className="panel">
            <h2>Quick actions</h2>
            <div className="quick-grid">
              <button className="quick" onClick={() => setTab('events')}>Manage Events</button>
              <button className="quick" onClick={() => setTab('users')}>Manage Users</button>
              <button className="quick" onClick={() => setTab('admins')}>Manage Administrators</button>
              <button className="quick" onClick={() => setTab('categories')}>Manage Categories</button>
              <button className="quick" onClick={() => setTab('reports')}>Analyze Event</button>
              <button className="quick" onClick={() => setTab('bin')}>Open Bin</button>
            </div>
            <div className="info-box">
              <b>Active organizers</b>
              <p>{d.organizers || 0}</p>
              <small>Organizer details are entered directly in the Event Creation form.</small>
            </div>
          </section>

          <section className="panel">
            <div className="panel-head">
              <div>
                <h2>System administration</h2>
                <p className="muted">Manage administrator accounts separately from event organizer details.</p>
              </div>
              <Shield size={25} />
            </div>
            <div className="info-box">
              <b>System Administrator</b>
              <p>
                {isMainAdmin
                  ? 'You can create, modify and delete newly created administrator accounts. The Main Administrator account is protected.'
                  : 'You can modify your own administrator profile. Only the Main Administrator can delete other admin accounts.'}
              </p>
            </div>
            <div style={{ marginTop: '1.25rem' }}>
              <Link to="/admin/events/new" className="btn btn-primary"><Plus size={16} /> Create Event</Link>
            </div>
          </section>
        </div>
      )}

      {/* ================= EVENTS ================= */}
      {tab === 'events' && (
        <section className="panel">
          <div className="panel-head">
            <div>
              <h2>Event Management</h2>
              <p className="muted">Edit event data whenever changes are required. Delete moves an event to Bin first.</p>
            </div>
            <Link to="/admin/events/new" className="btn btn-primary"><Plus size={16} /> Add Event</Link>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Event</th><th>Organizer</th><th>Date</th><th>Participation</th>
                  <th>Campus Scope</th><th>Status</th><th>Participants</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {events.map((e) => (
                  <tr key={e.id}>
                    <td><b>{e.name}</b><small>{e.category_name}</small></td>
                    <td>{e.organizer_name}</td>
                    <td>{fmtDate(e.event_date)}</td>
                    <td>{e.participation_type === 'team' ? `Team (${e.team_min_size}–${e.team_max_size})` : 'Individual'}</td>
                    <td>{e.campus_scope === 'all_campuses' ? 'All campuses' : 'Hosting only'}</td>
                    <td><span className={`status ${e.status}`}>{e.status}</span></td>
                    <td>
                      <Link to={`/admin/events/${e.id}/participants`} className="btn btn-secondary btn-sm">
                        <Eye size={14} /> {e.participant_count || 0}
                      </Link>
                    </td>
                    <td>
                      <div className="actions">
                        <Link className="btn btn-secondary btn-sm" to={`/admin/events/${e.id}/edit`}><Edit3 size={14} /> Edit</Link>
                        {e.status === 'pending' && (
                          <>
                            <button className="btn btn-success btn-sm" onClick={() => decision(e.id, 'approved')}>Approve</button>
                            <button className="btn btn-danger btn-sm" onClick={() => decision(e.id, 'rejected')}>Reject</button>
                          </>
                        )}
                        <button className="btn btn-danger btn-sm" onClick={() => deleteEvent(e.id)}><Archive size={14} /> Bin</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!events.length && <div className="empty">No active events.</div>}
          </div>
        </section>
      )}

      {/* ================= USERS ================= */}
      {tab === 'users' && (
        <section className="panel">
          <h2>Users</h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Name</th><th>Email</th><th>Phone</th><th>Role</th><th>Status</th><th>Action</th></tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>{u.full_name}</td>
                    <td>{u.email}</td>
                    <td>{u.mobile || '—'}</td>
                    <td><span className="badge">{u.role}</span></td>
                    <td>{u.is_active ? 'Active' : 'Disabled'}</td>
                    <td>
                      {u.role !== 'admin' && (
                        <button className="btn btn-secondary btn-sm" onClick={() => toggle(u.id)}>
                          {u.is_active ? 'Disable' : 'Enable'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ================= ADMINS ================= */}
      {tab === 'admins' && (
        <div className="two-col">
          <section className="panel">
            <div className="panel-head">
              <div>
                <h2>{admin.id ? 'Modify Admin' : 'Create New Admin'}</h2>
                <p className="muted">A new admin receives full Admin Dashboard access. Only System Administrator can delete an admin.</p>
              </div>
              {admin.id && (
                <button className="icon-btn" onClick={() => setAdmin(emptyAdmin)} aria-label="Cancel editing"><X size={18} /></button>
              )}
            </div>

            <form className="form-grid" onSubmit={admin.id ? updateAdmin : createAdmin}>
              <input
                placeholder="Full name" required value={admin.fullName}
                onChange={(e) => setAdmin({ ...admin, fullName: e.target.value })}
              />
              <input
                placeholder="Email" type="email" required value={admin.email}
                onChange={(e) => setAdmin({ ...admin, email: e.target.value })}
              />
              <input
                placeholder="Phone number" value={admin.mobile}
                onChange={(e) => setAdmin({ ...admin, mobile: e.target.value })}
              />
              <div className="password-input-wrap">
                <input
                  placeholder={admin.id ? 'New password (optional)' : 'Password'}
                  type={showPassword ? 'text' : 'password'}
                  required={!admin.id}
                  value={admin.password}
                  onChange={(e) => setAdmin({ ...admin, password: e.target.value })}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <button className="btn btn-primary">
                {admin.id ? <><Save size={16} /> Update Admin</> : <><UserPlus size={16} /> Create Admin</>}
              </button>
            </form>
          </section>

          <section className="panel">
            <div className="panel-head">
              <h2>Administrator Accounts</h2>
              <Shield size={22} />
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Name</th><th>Email</th><th>Phone</th><th>Type</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {adminUsers.map((a) => {
                    const isTargetSysAdmin = Boolean(a.is_system_admin || a.isSystemAdmin || normalize(a.email) === MAIN_ADMIN_EMAIL);
                    const isSelf = String(a.id) === String(user?.id) || normalize(a.email) === normalize(user?.email);
                    return (
                      <tr key={a.id}>
                        <td><b>{a.full_name}</b></td>
                        <td>{a.email}</td>
                        <td>{a.mobile || '—'}</td>
                        <td>{isTargetSysAdmin ? 'System Administrator' : 'Administrator'}</td>
                        <td>
                          <div className="actions">
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => setAdmin({ id: a.id, fullName: a.full_name, email: a.email, mobile: a.mobile || '', password: '' })}
                            >
                              <Edit3 size={14} /> Modify
                            </button>
                            {isMainAdmin && !isTargetSysAdmin && !isSelf && (
                              <button className="btn btn-danger btn-sm" onClick={() => deleteAdmin(a.id)}>
                                <UserX size={14} /> Delete
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {/* ================= REGISTRATIONS ================= */}
      {tab === 'registrations' && (
        <section className="panel">
          <h2>Event Registrations &amp; Attendance</h2>

          <div className="filters admin-reg-filters">
            <label>Event
              <select value={registrationEventFilter} onChange={(e) => setRegistrationEventFilter(e.target.value)}>
                <option value="">All events</option>
                {events.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </label>
            <label>Search
              <input value={registrationSearch} onChange={(e) => setRegistrationSearch(e.target.value)} placeholder="Name, roll no, email, team, team ID" />
            </label>
            <label>College
              <input value={collegeFilter} onChange={(e) => setCollegeFilter(e.target.value)} placeholder="College name" />
            </label>
            <label>Student campus
              <select value={registrationCampusFilter} onChange={(e) => setRegistrationCampusFilter(e.target.value)}>
                <option value="">All student campuses</option>
                <option value="hosting">Hosting college</option>
                <option value="external">External college</option>
              </select>
            </label>
            <label>Event scope
              <select value={registrationScopeFilter} onChange={(e) => setRegistrationScopeFilter(e.target.value)}>
                <option value="">All event scopes</option>
                <option value="hosting_only">Hosting campus only</option>
                <option value="all_campuses">All campuses allowed</option>
              </select>
            </label>
            <label>Department
              <input value={registrationDepartmentFilter} onChange={(e) => setRegistrationDepartmentFilter(e.target.value)} placeholder="Department" />
            </label>
            <label>Year
              <input value={registrationYearFilter} onChange={(e) => setRegistrationYearFilter(e.target.value)} placeholder="Year" />
            </label>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Student / Team</th><th>Event</th><th>Roll No</th><th>College</th>
                  <th>Registration ID</th><th>Status</th><th>Attendance</th><th>Custom Answers</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRegs.map((r) => {
                  const members = parseJSON(r.team_members_json, []);
                  const answers = parseJSON(r.custom_answers_json, {});
                  return (
                    <tr key={r.id}>
                      <td>
                        <b>{r.student_name}</b>
                        {r.team_name && (
                          <>
                            <small>Team: {r.team_name}</small>
                            <small>Team ID: {r.registration_code}</small>
                            <details className="team-details">
                              <summary>View team members</summary>
                              <div style={{ marginTop: '4px' }}>
                                {members.length ? members.map((m, i) => (
                                  <div className="team-detail-item" key={`${r.id}-${i}`}>
                                    <b>{i + 2}. {m.fullName || '—'}</b>
                                    <small>Roll No: {m.studentId || '—'} · {m.department || '—'} · {m.course || '—'} · {m.year || '—'}</small>
                                    {m.email && <small>{m.email}</small>}
                                    {m.mobile && <small>{m.mobile}</small>}
                                    {m.section && <small>Section: {m.section}</small>}
                                  </div>
                                )) : <small>No member details saved.</small>}
                              </div>
                            </details>
                          </>
                        )}
                        <small>{r.email}</small>
                        <small>{r.mobile || '—'} · {r.department || '—'} · {r.course || '—'} · {r.year || '—'} · {r.section || '—'}</small>
                      </td>
                      <td>{r.event_name}</td>
                      <td>{r.student_id || '—'}</td>
                      <td>{r.college_name || '—'}</td>
                      <td>{r.registration_code}</td>
                      <td><span className={`status ${r.status}`}>{r.status}</span></td>
                      <td>{r.attendance || 'Not marked'}</td>
                      <td>
                        {Object.entries(answers).map(([k, v]) => (
                          <div key={k}>
                            <b>{questionLabel(r, k)}:</b> {Array.isArray(v) ? v.join(', ') : String(v)}
                          </div>
                        ))}
                      </td>
                      <td>
                        <div className="actions">
                          {r.status === 'pending' && (
                            <>
                              <button className="btn btn-success btn-sm" onClick={() => registrationDecision(r.id, 'approved')}>Approve</button>
                              <button className="btn btn-danger btn-sm" onClick={() => registrationDecision(r.id, 'rejected')}>Reject</button>
                            </>
                          )}
                          {r.status === 'approved' && (
                            <>
                              <button className="btn btn-success btn-sm" onClick={() => attendance(r.id, 'Present')}>Present</button>
                              <button className="btn btn-danger btn-sm" onClick={() => attendance(r.id, 'Absent')}>Absent</button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {!regs.length && <div className="empty">No registrations yet.</div>}
          </div>
        </section>
      )}

      {/* ================= CATEGORIES ================= */}
      {tab === 'categories' && (
        <div className="two-col">
          <section className="panel">
            <h2>Add Category</h2>
            <form onSubmit={createCat} className="stack">
              <input placeholder="Category name" required value={cat.name} onChange={(e) => setCat({ ...cat, name: e.target.value })} />
              <input placeholder="Description" value={cat.description} onChange={(e) => setCat({ ...cat, description: e.target.value })} />
              <button className="btn btn-primary">Add Category</button>
            </form>
          </section>

          <section className="panel">
            <h2>Existing Categories</h2>
            {cats.map((c) => (
              <div className="list-row" key={c.id}>
                <div><b>{c.name}</b><span>{c.description}</span></div>
                <button className="icon-btn" onClick={() => deleteCategory(c.id)} aria-label={`Delete ${c.name}`}>
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </section>
        </div>
      )}

      {/* ================= REPORTS ================= */}
      {tab === 'reports' && (
        <div>
          <section className="panel">
            <div className="panel-head">
              <div>
                <h2>Analyze a Particular Event</h2>
                <p className="muted">Select one event to understand registration progress without mixing data from other events.</p>
              </div>
              <BarChart3 size={26} />
            </div>

            <div className="form-grid two">
              <label className="full">Select Event
                <select value={selectedEventId} onChange={selectEvent}>
                  <option value="">Select an event</option>
                  {events.map((e) => <option key={e.id} value={e.id}>{e.name} — {fmtDate(e.event_date)}</option>)}
                </select>
              </label>
            </div>

            {analysisLoading && <div className="center-page compact"><div className="spinner" /></div>}

            {analysis && !analysisLoading && (
              <div className="analysis-wrap">
                <div className="analysis-head">
                  <div>
                    <h3>{analysis.event.name}</h3>
                    <p className="muted">
                      {fmtDate(analysis.event.event_date)} · {analysis.event.category_name} · Organizer: {analysis.event.organizer_name}
                    </p>
                  </div>

                  <div className="export-options full">
                    <p className="muted" style={{ margin: '0 0 10px 0', fontSize: '0.9rem', lineHeight: 1.5 }}>
                      Select required columns to export
                      {selectedIsTeam && ' — team members are listed row by row, with one blank row between teams in Excel.'}
                    </p>
                    <div className="export-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <div><b>Export columns</b></div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          type="button" className="btn btn-secondary btn-sm"
                          onClick={() => setExportColumns(exportColumnOptions.map(([key]) => key))}
                        >
                          Select All
                        </button>
                        <button type="button" className="btn btn-secondary btn-sm" onClick={() => setExportColumns([])}>
                          Clear All
                        </button>
                      </div>
                    </div>

                    <div className="export-column-grid">
                      {exportColumnOptions.map(([key, label]) => (
                        <label className="check-line" key={key}>
                          <input
                            type="checkbox"
                            checked={exportColumns.includes(key)}
                            onChange={(ev) =>
                              setExportColumns((old) => (ev.target.checked ? [...old, key] : old.filter((x) => x !== key)))
                            }
                          />
                          {label}
                        </label>
                      ))}
                    </div>

                    <div className="form-grid two export-filters">
                      <label>College filter (optional)
                        <input value={collegeFilter} onChange={(e) => setCollegeFilter(e.target.value)} placeholder="Exact college name" />
                      </label>
                      <label>Department filter (optional)
                        <input value={exportDepartment} onChange={(e) => setExportDepartment(e.target.value)} placeholder="Department" />
                      </label>
                      <label>Year filter (optional)
                        <input value={exportYear} onChange={(e) => setExportYear(e.target.value)} placeholder="Year of study" />
                      </label>
                      <label>Campus type
                        <select value={exportCampusType} onChange={(e) => setExportCampusType(e.target.value)}>
                          <option value="">All campuses</option>
                          <option value="hosting">Hosting college</option>
                          <option value="external">External college</option>
                        </select>
                      </label>
                    </div>
                  </div>

                  <div className="actions">
                    <button className="btn btn-primary btn-sm" onClick={() => downloadEvent('xlsx')}>
                      <FileSpreadsheet size={15} /> Excel
                    </button>
                    <button className="btn btn-secondary btn-sm" onClick={() => downloadEvent('pdf')}>
                      <FileText size={15} /> PDF
                    </button>
                  </div>
                </div>

                <div className="stats analysis-stats">
                  <StatCard label="Total Registrations" value={analysis.summary.total || 0} icon={<ClipboardList />} />
                  <StatCard label="Approved" value={analysis.summary.approved || 0} icon={<CheckCircle />} />
                  <StatCard label="Pending" value={analysis.summary.pending || 0} icon={<CalendarDays />} />
                  <StatCard label="Present" value={analysis.summary.present || 0} icon={<Users />} />
                  <StatCard label="Absent" value={analysis.summary.absent || 0} icon={<Users />} />
                </div>

                <div className="two-col">
                  <section className="panel">
                    <h3>Registration Process</h3>
                    <div className="progress-row">
                      <span>Capacity used</span>
                      <b>{analysis.summary.total || 0} / {analysis.event.max_participants}</b>
                    </div>
                    <div className="progress-track">
                      <div
                        className="progress-fill"
                        style={{ width: `${Math.min(100, ((analysis.summary.total || 0) / Math.max(1, analysis.event.max_participants)) * 100)}%` }}
                      />
                    </div>
                    {['approved', 'pending'].map((k) => (
                      <div className="report-row" key={k}>
                        <span>{capitalize(k)}</span>
                        <b>{analysis.summary[k] || 0}</b>
                      </div>
                    ))}
                  </section>

                  <section className="panel">
                    <h3>Registrations by Branch</h3>
                    {analysis.byBranch?.length
                      ? analysis.byBranch.map((r) => (
                          <div className="report-row" key={r.branch}>
                            <span>{r.branch}</span><b>{r.registrations}</b>
                          </div>
                        ))
                      : <div className="empty">No registrations yet.</div>}
                  </section>
                </div>

                <section className="panel">
                  <h3>Registration Trend</h3>
                  {analysis.trend?.length
                    ? analysis.trend.map((r) => (
                        <div className="report-row" key={r.registration_date}>
                          <span>{fmtDate(r.registration_date)}</span><b>{r.registrations}</b>
                        </div>
                      ))
                    : <div className="empty">No registration activity yet.</div>}
                </section>
              </div>
            )}
          </section>
        </div>
      )}

      {/* ================= BIN ================= */}
      {tab === 'bin' && (
        <section className="panel">
          <div className="panel-head">
            <div>
              <h2>Event Bin</h2>
              <p className="muted">
                Deleted events stay here until restored or permanently removed.
                Permanent deletion removes registrations and attendance for that event.
              </p>
            </div>
            <Archive size={25} />
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Event</th><th>Organizer</th><th>Participants</th><th>Deleted</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {trash.map((e) => (
                  <tr key={e.id}>
                    <td><b>{e.name}</b><small>{e.category_name}</small></td>
                    <td>{e.organizer_name}</td>
                    <td>{e.participant_count || 0}</td>
                    <td>{e.deleted_at ? new Date(e.deleted_at).toLocaleString('en-IN') : ''}</td>
                    <td>
                      <div className="actions">
                        <button className="btn btn-success btn-sm" onClick={() => restore(e.id)}><RotateCcw size={14} /> Restore</button>
                        <button className="btn btn-danger btn-sm" onClick={() => permanentDelete(e.id)}><Trash2 size={14} /> Delete Permanently</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!trash.length && <div className="empty">Bin is empty.</div>}
          </div>
        </section>
      )}
    </div>
  );
}