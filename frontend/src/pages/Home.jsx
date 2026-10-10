import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CalendarCheck,
  ShieldCheck,
  Users,
  BarChart3,
  UserRoundCheck,
  UsersRound,
  ClipboardList,
  Sparkles,
} from 'lucide-react';

const features = [
  {
    icon: CalendarCheck,
    title: 'Easy Registration',
    text: 'Register for campus events online without needing a student account or login.',
  },
  {
    icon: ShieldCheck,
    title: 'Verified Events',
    text: 'Discover events that have been reviewed and approved by the administrator.',
  },
  {
    icon: UsersRound,
    title: 'Individual and Team Participation',
    text: 'Choose individual or team participation and complete the event-specific registration form.',
  },
  {
    icon: BarChart3,
    title: 'Smart Administration',
    text: 'Manage events, registrations, attendance, participant information and reports in one place.',
  },
];

const audiences = [
  {
    icon: Users,
    title: 'For Students',
    text: 'Browse events, view posters and full event details, complete registration forms, and download registration invoices.',
  },
  {
    icon: UserRoundCheck,
    title: 'For Organizers',
    text: 'Manage events and participants using the existing authorized organizer functionality.',
  },
  {
    icon: ClipboardList,
    title: 'For Admins',
    text: 'Create and manage events, configure registration requirements, review student and team registrations, and export registration data.',
  },
];

export default function Home() {
  return (
    <div className="home-page">
      <section className="home-hero">
        <div className="container home-hero-grid">
          <div className="home-hero-copy">
            <span className="eyebrow"><Sparkles size={14} /> COLLEGE EVENT MANAGEMENT</span>
            <h1>One place for every <span>campus event.</span></h1>
            <p className="home-lead">
              Discover college events, explore event details, register in seconds, and participate in individual or team events. Organizers can manage events, while administrators control registrations and monitor participation from one dashboard.
            </p>
            <div className="home-actions">
              <Link to="/events" className="btn btn-primary btn-large">Explore Events <ArrowRight size={18} /></Link>
              <Link to="/about" className="btn btn-secondary btn-large">About Us</Link>
              <Link to="/login" className="btn btn-outline-primary btn-large">Admin Login</Link>
            </div>
            <div className="home-trust-note"><ShieldCheck size={17} /> Public event browsing and registration — no student login required.</div>
          </div>
          <div className="home-visual" aria-label="CampusEvents platform overview">
            <div className="home-visual-top"><span className="home-calendar-icon"><CalendarCheck size={25} /></span><div><strong>Campus calendar</strong><small>Everything happening on campus</small></div><span className="home-live-dot" /></div>
            <div className="home-visual-feature"><div className="home-visual-art"><CalendarCheck size={34} /></div><div><span className="badge">Discover what's next</span><h3>Find your next campus experience</h3><p>Workshops, competitions, sports, cultural programs and more.</p></div></div>
            <div className="home-visual-stats"><div><strong>01</strong><span>Browse events</span></div><div><strong>02</strong><span>Register online</span></div><div><strong>03</strong><span>Get confirmation</span></div></div>
          </div>
        </div>
      </section>

      <section className="section home-features" id="features">
        <div className="container">
          <div className="section-heading home-section-heading"><div><span className="eyebrow">SIMPLE. CONNECTED. CAMPUS-READY.</span><h2>Everything you need for campus events</h2><p>From discovering an event to managing registrations, keep the process clear and straightforward.</p></div><Link to="/events" className="text-link">Browse events <ArrowRight size={16} /></Link></div>
          <div className="home-feature-grid">
            {features.map(({ icon: Icon, title, text }) => <article className="home-feature-card" key={title}><span className="home-feature-icon"><Icon size={23} /></span><h3>{title}</h3><p>{text}</p></article>)}
          </div>
        </div>
      </section>

      <section className="section home-audiences-section">
        <div className="container">
          <div className="home-audience-heading"><span className="eyebrow">BUILT FOR CAMPUS</span><h2>One platform, three ways to get things done</h2><p>CampusEvents connects students, organizers and administrators through one event management workflow.</p></div>
          <div className="home-audience-grid">
            {audiences.map(({ icon: Icon, title, text }, index) => <article className="home-audience-card" key={title}><div className="home-audience-top"><span className="home-feature-icon"><Icon size={23} /></span><span className="home-audience-number">0{index + 1}</span></div><h3>{title}</h3><p>{text}</p>{index === 0 && <Link to="/events" className="text-link">Explore events <ArrowRight size={16} /></Link>}</article>)}
          </div>
          <div className="home-bottom-cta"><div><span className="eyebrow">YOUR NEXT EVENT STARTS HERE</span><h2>Ready to discover what's happening?</h2><p>Explore approved campus events and find the right opportunity for you.</p></div><Link to="/events" className="btn btn-primary btn-large">Explore Events <ArrowRight size={18} /></Link></div>
        </div>
      </section>
    </div>
  );
}
