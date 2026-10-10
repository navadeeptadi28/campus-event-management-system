import { useCallback, useEffect, useState } from 'react';
import { Search, SlidersHorizontal, CalendarDays, RefreshCw } from 'lucide-react';
import api from '../services/api';
import EventCard from '../components/EventCard';

export default function Events() {
  const [events, setEvents] = useState([]);
  const [cats, setCats] = useState([]);
  const [f, setF] = useState({ search: '', category: '', date: '', sort: 'date_asc' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/events', { params: f });
      setEvents(Array.isArray(data) ? data : []);
    } catch (err) {
      setEvents([]);
      setError(err.response?.data?.message || 'Could not load events. Check that the backend is running at http://localhost:5000.');
    } finally {
      setLoading(false);
    }
  }, [f]);

  useEffect(() => {
    api.get('/events/categories').then(({ data }) => setCats(Array.isArray(data) ? data : [])).catch(() => setCats([]));
  }, []);
  useEffect(() => { load(); }, [load]);

  const update = (key, value) => setF(old => ({ ...old, [key]: value }));

  return <div className="container page events-page">
    <section className="events-hero">
      <span className="eyebrow"><CalendarDays size={15} /> CAMPUS CALENDAR</span>
      <div className="page-header">
        <div><h1>Discover events</h1><p className="muted">Find workshops, competitions, sports, cultural programs and more.</p></div>
      </div>
    </section>

    <section className="filters event-filters" aria-label="Filter events">
      <label className="search-box"><Search size={18}/><input aria-label="Search events" placeholder="Search events, venue..." value={f.search} onChange={e => update('search', e.target.value)} onKeyDown={e => e.key === 'Enter' && load()} /></label>
      <select aria-label="Filter by category" value={f.category} onChange={e => update('category', e.target.value)}><option value="">All categories</option>{cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
      <input aria-label="Filter by date" type="date" value={f.date} onChange={e => update('date', e.target.value)} />
      <select aria-label="Sort events" value={f.sort} onChange={e => update('sort', e.target.value)}><option value="date_asc">Date: Soonest</option><option value="date_desc">Date: Latest</option><option value="name">Name: A–Z</option></select>
      <button className="btn btn-secondary apply-filters" onClick={load}><SlidersHorizontal size={16}/> Apply</button>
    </section>

    {error && <div className="alert error" role="alert"><div><strong>Events could not be loaded</strong><p>{error}</p></div><button className="btn btn-secondary btn-sm" onClick={load}><RefreshCw size={15}/> Retry</button></div>}
    {!error && !loading && events.length === 0 && <div className="empty empty-events"><div className="empty-icon"><CalendarDays size={26}/></div><h3>No approved events found</h3><p>Events appear here after an administrator approves them. Try changing your filters or check the Admin Dashboard → Events tab for pending events.</p><button className="btn btn-secondary" onClick={() => { setF({ search: '', category: '', date: '', sort: 'date_asc' }); }}><RefreshCw size={15}/> Clear filters</button></div>}
    {loading ? <div className="event-grid loading-grid" aria-label="Loading events"><div className="event-skeleton"/><div className="event-skeleton"/><div className="event-skeleton"/></div> : events.length > 0 && <div className="event-grid">{events.map(event => <EventCard key={event.id} event={event}/>)}</div>}
  </div>;
}
