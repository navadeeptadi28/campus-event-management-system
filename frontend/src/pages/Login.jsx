import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const u = await login(form.email, form.password, 'admin');
      if (u.role !== 'admin') {
        setError('This page is for administrators only.');
        return;
      }
      nav(loc.state?.from?.pathname || '/admin', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid administrator email or password.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={submit}>
        <span className="eyebrow">CAMPUS EVENTS · ADMINISTRATION</span>
        <h1>Admin Sign in</h1>
        <p className="muted">Students can browse events and register directly without signing in.</p>
        
        {error && <div className="alert error">{error}</div>}
        
        <label>
          Administrator Email
          <input
            type="email"
            required
            autoComplete="username"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="Enter administrator Mail"
          />
        </label>
        
        <label style={{ marginBottom: '1.25rem' }}>
          Password
          <div className="password-input-wrap">
            <input
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="current-password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Enter administrator password"
            />
            <button
              type="button"
              className="password-toggle"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              title={showPassword ? 'Hide password' : 'Show password'}
              onClick={() => setShowPassword((v) => !v)}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </label>
        
        <div style={{ marginTop: '1.25rem' }}>
          <button className="btn btn-primary btn-full" disabled={busy}>
            {busy ? 'Signing in...' : 'Sign in as Admin'}
          </button>
        </div>
        
        <p className="auth-foot muted">
          <Link to="/events">Browse public events</Link>
        </p>
      </form>
    </div>
  );
}