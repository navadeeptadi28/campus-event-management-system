import {useEffect,useState} from 'react';
import {Link,useParams} from 'react-router-dom';
import api from '../services/api';

const defaults={fullName:'',studentId:'',email:'',mobile:'',department:'',course:'',year:'',section:''};
const labels={fullName:'Full Name',studentId:'Student ID / Roll Number',email:'Email',mobile:'Mobile Number',department:'Department',course:'Course',year:'Year',section:'Section'};
const defaultDepartments=['CSE','IT','AIML','ECE','EEE','Mechanical Engineering (MECH)','Civil Engineering (CIVIL)'];
const defaultCourses=['CSE','AIML','IT','CAD','CSD','AIDS','CSE (AIML)','ECE','EEE','MECH','CIVIL'];
const defaultYears=['1st Year','2nd Year','3rd Year','4th Year'];

/* One rule for every screen: a field is shown only if enabled, and required only if
   it is not in optionalStandardFields. Full Name and Student ID are always on/required. */
const ALWAYS_ON=['fullName','studentId'];
const enabledFieldsOf=(config)=>{
 const list=Array.isArray(config?.standardFields)?config.standardFields:Object.keys(labels);
 return Object.keys(labels).filter(k=>ALWAYS_ON.includes(k)||list.includes(k));
};
const isRequired=(k,config)=>ALWAYS_ON.includes(k)||!(config?.optionalStandardFields||[]).includes(k);

function StudentValueField({field,value,onChange,required,config}){
 const label=labels[field];let control;
 if(field==='department'||field==='course'||field==='year'){
  const options=field==='department'?[...new Set([...defaultDepartments,...(config.departmentOptions||[])])]:field==='course'?[...new Set([...defaultCourses,...(config.courseOptions||[])])]:defaultYears;
  control=<select required={required} value={value||''} onChange={e=>onChange(e.target.value)}><option value="">Select {field==='year'?'year':field}</option>{options.map(x=><option key={x} value={x}>{x}</option>)}</select>;
 }else{
  control=<input required={required} type={field==='email'?'email':field==='mobile'?'tel':'text'} value={value||''} onChange={e=>onChange(e.target.value)} pattern={field==='mobile'?'[+0-9() -]{8,18}':undefined} autoComplete={field==='email'?'email':field==='mobile'?'tel':'off'}/>;
 }
 return <label>{label}{required?' *':' (optional)'}{control}</label>;
}

export default function EventRegistration(){
 const {id}=useParams();
 const [event,setEvent]=useState(null),[config,setConfig]=useState({}),[form,setForm]=useState(defaults),[campusType,setCampusType]=useState('hosting'),[collegeName,setCollegeName]=useState(''),[answers,setAnswers]=useState({}),[teamName,setTeamName]=useState(''),[teamMembers,setTeamMembers]=useState([]),[error,setError]=useState(''),[saving,setSaving]=useState(false),[receipt,setReceipt]=useState(null);
 useEffect(()=>{api.get(`/events/${id}`).then(({data:e})=>{setEvent(e);let c={};try{c=JSON.parse(e.registration_config_json||'{}')}catch{}setConfig(c);}).catch(e=>setError(e.response?.data?.message||'Unable to load registration form'));},[id]);
 const change=(k,v)=>setForm(p=>({...p,[k]:v}));
 const downloadInvoice=async()=>{if(!receipt?.registrationCode)return;try{const r=await api.get(`/registrations/${receipt.registrationCode}/invoice`,{responseType:'blob'});const url=URL.createObjectURL(new Blob([r.data],{type:'application/pdf'}));const a=document.createElement('a');a.href=url;a.download=`Registration-${receipt.registrationCode}.pdf`;document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);}catch(e){setError('Registration was saved, but the receipt could not be downloaded. Please try again.');}};
 const submit=async ev=>{
  ev.preventDefault();setError('');setSaving(true);
  try{
   // Send only the fields enabled for this event.
   const enabled=enabledFieldsOf(config);
   const cleanForm=Object.fromEntries(enabled.map(k=>[k,form[k]||'']));
   const cleanMembers=teamMembers.map(m=>Object.fromEntries(enabled.map(k=>[k,m[k]||''])));
   const r=await api.post(`/registrations/events/${id}/register`,{...cleanForm,campusType,collegeName,answers,teamName,teamMembers:cleanMembers});
   setReceipt({registrationCode:r.data.registrationCode||r.data.registrationId,eventName:r.data.eventName||event.name});
   window.scrollTo({top:0,behavior:'smooth'});
  }catch(e){setError(e.response?.data?.message||'Registration failed. Please check the form and try again.');}
  finally{setSaving(false)}
 };
 if(!event)return <div className="container page">{error?<div className="alert error">{error}</div>:<div className="spinner"/>}</div>;
 if(receipt)return <div className="container page"><div className="panel" style={{maxWidth:760,margin:'0 auto'}}><span className="eyebrow">REGISTRATION COMPLETE</span><h1>You're registered!</h1><div className="alert success">Your registration for <strong>{receipt.eventName}</strong> was saved successfully.</div><p><strong>Registration reference:</strong> {receipt.registrationCode}</p><p className="muted">Download your receipt for your records. It includes the event, participant/team details, submitted answers and registration reference.</p><div className="form-actions"><button className="btn btn-primary" onClick={downloadInvoice}>Download Invoice (PDF)</button><Link className="btn btn-secondary" to={`/events/${id}`}>Back to Event</Link><Link className="btn btn-secondary" to="/events">Browse Events</Link></div></div></div>;

 const fields=enabledFieldsOf(config);
 const questions=config.questions||[];
 const externalAllowed=event.campus_scope==='all_campuses';
 return <div className="container page">
  <div className="page-header"><div><span className="eyebrow">EVENT REGISTRATION</span><h1>Register for {event.name}</h1><p className="muted">No student account is required. Your submitted details are saved with this event.</p></div><Link className="btn btn-secondary" to={`/events/${id}`}>Back to event</Link></div>
  {error&&<div className="alert error">{error}</div>}
  <form className="panel registration-form" onSubmit={submit}>
   <h2>{event.participation_type==='team'?'Team Leader Details':'Student Details'}</h2>
   <div className="form-grid two">{fields.map(k=><StudentValueField key={k} field={k} value={form[k]} config={config} required={isRequired(k,config)} onChange={v=>change(k,v)}/>)}</div>

   {externalAllowed&&<div className="panel-subsection"><h3>College Eligibility</h3><label>Which college do you belong to?<select value={campusType} onChange={e=>setCampusType(e.target.value)}><option value="hosting">Hosting college</option><option value="external">Another college</option></select></label>{campusType==='external'&&<label>College Name *<input required value={collegeName} onChange={e=>setCollegeName(e.target.value)} placeholder="Enter your college name"/></label>}</div>}

   {event.participation_type==='team'&&<div className="panel-subsection">
    <h3>Team Details</h3>
    <p className="muted">Team size: {event.team_min_size}–{event.team_max_size}, including the team leader.</p>
    <label>Team Name *<input required value={teamName} onChange={e=>setTeamName(e.target.value)}/></label>
    <h4>Additional team members (excluding the team leader)</h4>
    {teamMembers.map((m,i)=><div className="team-member-card" key={i}>
     <div className="form-grid two">{fields.map(k=><StudentValueField key={k} field={k} value={m[k]} config={config} required={isRequired(k,config)} onChange={v=>setTeamMembers(p=>p.map((x,j)=>i===j?{...x,[k]:v}:x))}/>)}</div>
     <button type="button" className="btn btn-danger btn-sm" style={{marginTop:'16px'}} onClick={()=>setTeamMembers(p=>p.filter((_,j)=>j!==i))}>Remove member</button>
    </div>)}
    {teamMembers.length+1<Number(event.team_max_size||5)&&<button type="button" className="btn btn-secondary" onClick={()=>setTeamMembers(p=>[...p,{...defaults}])}>+ Add Team Member</button>}
   </div>}

   {questions.length>0&&<div className="panel-subsection"><h3>Event-specific Questions</h3><div className="form-grid two">{questions.map(q=><label key={q.id}>{q.label}{q.required?' *':' (optional)'}{q.type==='dropdown'?<select required={q.required} value={answers[q.id]||''} onChange={e=>setAnswers(p=>({...p,[q.id]:e.target.value}))}><option value="">Select an option</option>{(q.options||[]).map(o=><option key={o} value={o}>{o}</option>)}</select>:q.type==='radio'?<div className="checkbox-options">{(q.options||[]).map(o=><label className="check-line" key={o}><input type="radio" name={q.id} required={q.required&&!answers[q.id]} checked={answers[q.id]===o} onChange={()=>setAnswers(p=>({...p,[q.id]:o}))}/>{o}</label>)}</div>:q.type==='checkbox'?<div className="checkbox-options">{(q.options||[]).map(o=><label className="check-line" key={o}><input type="checkbox" checked={(answers[q.id]||[]).includes(o)} onChange={e=>setAnswers(p=>({...p,[q.id]:e.target.checked?[...(p[q.id]||[]),o]:(p[q.id]||[]).filter(x=>x!==o)}))}/>{o}</label>)}</div>:<input required={q.required} type={q.type==='phone'?'tel':q.type==='number'?'number':q.type==='date'?'date':q.type==='email'?'email':'text'} value={answers[q.id]||''} onChange={e=>setAnswers(p=>({...p,[q.id]:e.target.value}))}/>}</label>)}</div></div>}

   <div className="form-actions"><Link to={`/events/${id}`} className="btn btn-secondary">Cancel</Link><button className="btn btn-primary" disabled={saving}>{saving?'Submitting...':'Submit Registration'}</button></div>
  </form>
 </div>;
}