import { Link, useNavigate } from 'react-router-dom';
import { CalendarDays, Menu, LogOut, UserCircle, Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

const THEME_KEY = 'campusevents-theme';

function getInitialTheme() {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch { /* storage unavailable */ }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState(getInitialTheme);
  const navigate = useNavigate();
  const privilegedUser = user && ['admin', 'organizer'].includes(user.role);
  const dashboardPath = user?.role === 'admin' ? '/admin' : '/organizer';
  const closeMenu = () => setOpen(false);
  const isDark = theme === 'dark';

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem(THEME_KEY, theme); } catch { /* ignore */ }
  }, [theme]);

  return (
    <header className="navbar">
      <div className="nav-inner">
        <Link to="/home" className="brand" onClick={closeMenu} aria-label="CampusEvents home">
          <span className="brand-icon"><CalendarDays size={21} /></span>CampusEvents
        </Link>

        <nav className={open ? 'nav-links open' : 'nav-links'} aria-label="Main navigation">
          <Link to="/home" onClick={closeMenu}>Home</Link>
          <Link to="/events" onClick={closeMenu}>Events</Link>
          {privilegedUser && <Link to={dashboardPath} onClick={closeMenu}>Dashboard</Link>}
          <Link to="/about" onClick={closeMenu}>About</Link>
          {privilegedUser ? <>
            <Link to="/profile" onClick={closeMenu}><UserCircle size={16} /> Profile</Link>
            <button className="link-button" onClick={() => { logout(); navigate('/home'); closeMenu(); }}><LogOut size={16} /> Logout</button>
          </> : <Link className="nav-login" to="/login" onClick={closeMenu}>Admin Login</Link>}
        </nav>

        <div className="nav-actions">
          <button
            type="button"
            className="theme-toggle"
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to night mode'}
            title={isDark ? 'Light mode' : 'Night mode'}
          >
            {isDark ? <Sun size={19} /> : <Moon size={19} />}
          </button>
          <button className="menu-btn" onClick={() => setOpen(!open)} aria-label="Toggle navigation menu" aria-expanded={open}>
            <Menu />
          </button>
        </div>
      </div>
    </header>
  );
}