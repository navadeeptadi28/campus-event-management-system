import {useEffect,useState} from 'react';
import {Link} from 'react-router-dom';
import api from '../services/api';

export default function MyRegistrations(){
 const [rows,setRows]=useState([]),[msg,setMsg]=useState(''),[error,setError]=useState(''),[loading,setLoading]=useState(true);
 const load=async()=>{setLoading(true);setError('');try{const r=await api.get('/registrations/my');setRows(r.data)}catch(e){setError(e.response?.data?.message||'Unable to load your registrations. Please login again if your session expired.')}finally{setLoading(false)}};
 useEffect(()=>{load()},[]);
 const cancel=async id=>{if(!confirm('Cancel this registration?'))return;try{await api.delete(`/registrations/${id}`);setMsg('Registration cancelled');load()}catch(e){setError(e.response?.data?.message||'Unable to cancel')}};
 if(loading)return <div className="center-page"><div className="spinner"/></div>;
 return <div className="container page"><div className="page-header"><div><span className="eyebrow">STUDENT</span><h1>My Registrations</h1><p className="muted">Track your confirmed registrations, attendance results.</p></div><Link className="btn btn-primary" to="/events">Find Events</Link></div>{msg&&<div className="alert success">{msg}</div>}{error&&<div className="alert error">{error}</div>}<div className="table-wrap"><table><thead><tr><th>Event</th><th>Registration ID</th><th>Date</th><th>Status</th><th>Attendance</th><th>Actions</th></tr></thead><tbody>{rows.map(r=><tr key={r.id}><td><b>{r.event_name}</b><small><Link to={`/events/${r.event_id}`}>{new Date(r.event_date).toLocaleDateString('en-IN')} · {r.venue}</Link></small></td><td>{r.registration_code}</td><td>{new Date(r.registration_date).toLocaleDateString('en-IN')}</td><td><span className={`status ${r.status}`}>{r.status}</span></td><td>{r.attendance||'—'}</td><td>{r.status!=='cancelled'&&r.status!=='rejected'&&new Date()<new Date(r.registration_end)&&<button className="btn btn-danger btn-sm" onClick={()=>cancel(r.id)}>Cancel</button>}</td></tr>)}</tbody></table>{!rows.length&&!error&&<div className="empty">You have no registrations yet. <Link to="/events">Browse upcoming events</Link>.</div>}</div></div>
}
