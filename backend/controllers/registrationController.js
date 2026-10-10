import {query,pool} from '../config/db.js';
import bcrypt from 'bcryptjs';
import PDFDocument from 'pdfkit';
function code(){return `REG${Date.now().toString().slice(-8)}${Math.floor(Math.random()*90+10)}`;}
const standardKeys=['fullName','studentId','email','mobile','department','course','year','section'];

export async function register(req,res,next){
 const conn=await pool.getConnection();
 try{
  const profile=(await query(`SELECT s.*,u.full_name,u.email,u.mobile FROM students s JOIN users u ON u.id=s.user_id WHERE s.user_id=?`,[req.user.id]))[0];
  if(!profile)return res.status(400).json({message:'Student profile not found'});
  const e=(await query(`SELECT e.*,COALESCE((SELECT COUNT(*) FROM event_registrations r WHERE r.event_id=e.id AND r.status IN ('pending','approved')),0) count FROM events e WHERE e.id=? AND e.status='approved' AND e.deleted_at IS NULL`,[req.params.id]))[0];
  if(!e)return res.status(404).json({message:'Approved event not found'});
  const now=new Date(), start=new Date(String(e.registration_start).replace(' ','T')), end=new Date(String(e.registration_end).replace(' ','T'));
  if(now<start||now>end)return res.status(400).json({message:'Registration is not open for this event'});
  if(Number(e.count)>=Number(e.max_participants))return res.status(400).json({message:'No seats available'});
  const body=req.body||{}; const config=(()=>{try{return JSON.parse(e.registration_config_json||'{}')}catch{return {}}})();
  const campusType=body.campusType==='external'?'external':'hosting';
  if(e.campus_scope!=='all_campuses'&&campusType==='external')return res.status(400).json({message:'This event is limited to the hosting campus.'});
  const collegeName=campusType==='external'?String(body.collegeName||'').trim():(process.env.COLLEGE_NAME||'Hosting College');
  if(campusType==='external'&&!collegeName)return res.status(400).json({message:'College Name is required for external participants.'});
  const snapshot={fullName:String(body.fullName||profile.full_name).trim(),studentId:String(body.studentId||profile.student_id).trim(),email:String(body.email||profile.email).trim().toLowerCase(),mobile:String(body.mobile||profile.mobile||'').trim(),department:String(body.department||profile.department).trim(),course:String(body.course||profile.course).trim(),year:String(body.year||profile.year).trim(),section:String(body.section||profile.section).trim()};
  const required=(config.standardFields||standardKeys).filter(k=>!config.optionalStandardFields?.includes(k));
  for(const k of required){if(!snapshot[k])return res.status(400).json({message:`${({fullName:'Full Name',studentId:'Student ID / Roll Number',email:'Email',mobile:'Mobile Number',department:'Department',course:'Course',year:'Year',section:'Section'})[k]||k} is required.`});}
  if(snapshot.email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(snapshot.email))return res.status(400).json({message:'Enter a valid email address.'});
  if(snapshot.mobile&&!/^[+\d][\d\s()-]{7,17}$/.test(snapshot.mobile))return res.status(400).json({message:'Enter a valid mobile number.'});
  const answers=body.answers&&typeof body.answers==='object'?body.answers:{};
  for(const q of (config.questions||[])){const v=answers[q.id];if(q.required&&(v===undefined||v===null||v===''||(Array.isArray(v)&&!v.length)))return res.status(400).json({message:`${q.label} is required.`});if(v!==undefined&&q.options?.length&&['dropdown','radio'].includes(q.type)&&v!==''&&!q.options.includes(v))return res.status(400).json({message:`Invalid option for ${q.label}.`});if(v!==undefined&&v!==''&&q.type==='email'&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v)))return res.status(400).json({message:`Enter a valid email for ${q.label}.`});if(v!==undefined&&v!==''&&q.type==='number'&&!Number.isFinite(Number(v)))return res.status(400).json({message:`Enter a valid number for ${q.label}.`});if(v!==undefined&&q.type==='checkbox'&&Array.isArray(v)&&q.options?.length&&v.some(x=>!q.options.includes(x)))return res.status(400).json({message:`Invalid option for ${q.label}.`});}
  let teamName=null, members=[];
  if(e.participation_type==='team'){
   teamName=String(body.teamName||'').trim();members=Array.isArray(body.teamMembers)?body.teamMembers:[];
   if(!teamName)return res.status(400).json({message:'Team Name is required.'});
   const min=Number(e.team_min_size)||2,max=Number(e.team_max_size)||5;
   if(members.length+1<min||members.length+1>max)return res.status(400).json({message:`Team size must be between ${min} and ${max} members, including you.`});
   if(members.some(m=>!m.fullName||!m.studentId))return res.status(400).json({message:'Every team member needs a name and student ID.'});
   const duplicate=(await query(`SELECT id FROM event_registrations WHERE event_id=? AND LOWER(team_name)=LOWER(?) AND status<>'cancelled'`,[e.id,teamName]))[0];if(duplicate)return res.status(409).json({message:'A team with this name is already registered for this event.'});
  }
  const existing=(await query('SELECT id,status FROM event_registrations WHERE student_id=? AND event_id=?',[profile.id,e.id]))[0];
  if(existing&&existing.status!=='cancelled')return res.status(409).json({message:'You are already registered for this event'});
  await conn.beginTransaction(); const registrationCode=code();
  const params=[registrationCode,profile.id,e.id,'approved',collegeName,campusType,snapshot.fullName,snapshot.studentId,snapshot.email,snapshot.mobile,snapshot.department,snapshot.course,snapshot.year,snapshot.section,JSON.stringify(answers),teamName,JSON.stringify(members)];
  if(existing){await conn.execute(`UPDATE event_registrations SET registration_code=?,registration_date=CURRENT_TIMESTAMP,status='approved',college_name=?,campus_type=?,full_name_snapshot=?,student_id_snapshot=?,email_snapshot=?,mobile_snapshot=?,department_snapshot=?,course_snapshot=?,year_snapshot=?,section_snapshot=?,custom_answers_json=?,team_name=?,team_members_json=? WHERE id=?`,[registrationCode,collegeName,campusType,snapshot.fullName,snapshot.studentId,snapshot.email,snapshot.mobile,snapshot.department,snapshot.course,snapshot.year,snapshot.section,JSON.stringify(answers),teamName,JSON.stringify(members),existing.id]);}
  else await conn.execute(`INSERT INTO event_registrations(registration_code,student_id,event_id,status,college_name,campus_type,full_name_snapshot,student_id_snapshot,email_snapshot,mobile_snapshot,department_snapshot,course_snapshot,year_snapshot,section_snapshot,custom_answers_json,team_name,team_members_json) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,params);
  await conn.execute('INSERT INTO notifications(user_id,title,message) VALUES(?,?,?)',[req.user.id,'Registration confirmed',`Your registration ${registrationCode} for ${e.name} is confirmed.`]);
  await conn.commit();res.status(201).json({message:'Registration confirmed',registrationId:registrationCode});
 }catch(e){await conn.rollback().catch(()=>{});if(e.code==='ER_DUP_ENTRY')return res.status(409).json({message:'Duplicate registration is not allowed'});next(e)}finally{conn.release()}
}

export async function myRegistrations(req,res,next){try{const rows=await query(`SELECT r.id,r.registration_code,r.registration_date,r.status,e.id event_id,e.name event_name,e.event_date,e.registration_end,e.start_time,e.venue,r.college_name,r.campus_type,r.team_name,r.custom_answers_json,a.status attendance FROM event_registrations r JOIN students s ON s.id=r.student_id JOIN events e ON e.id=r.event_id LEFT JOIN attendance a ON a.registration_id=r.id WHERE s.user_id=? ORDER BY e.event_date DESC,r.registration_date DESC`,[req.user.id]);res.json(rows)}catch(e){next(e)}}

export async function cancelRegistration(req,res,next){try{const r=(await query(`SELECT r.id,e.event_date,e.registration_end FROM event_registrations r JOIN students s ON s.id=r.student_id JOIN events e ON e.id=r.event_id WHERE r.id=? AND s.user_id=?`,[req.params.id,req.user.id]))[0];if(!r)return res.status(404).json({message:'Registration not found'});if(new Date()>new Date(String(r.registration_end).replace(' ','T')))return res.status(400).json({message:'Cancellation window has closed'});await query("UPDATE event_registrations SET status='cancelled' WHERE id=?",[req.params.id]);res.json({message:'Registration cancelled'});}catch(e){next(e)}}

// Public event registration: visitors do not need an account. A private guest student
// record satisfies the existing relational schema while submitted identity details are
// preserved in registration snapshots for admin reports and invoice generation.
export async function publicRegister(req,res,next){
 const conn=await pool.getConnection(); let inTransaction=false;
 try{
  const event=(await query(`SELECT e.*,COALESCE((SELECT COUNT(*) FROM event_registrations r WHERE r.event_id=e.id AND r.status IN ('pending','approved')),0) AS registered_count FROM events e WHERE e.id=? AND e.status='approved' AND e.deleted_at IS NULL`,[req.params.id]))[0];
  if(!event)return res.status(404).json({message:'This event is not available for registration.'});
  const body=req.body||{}; const config=(()=>{try{return JSON.parse(event.registration_config_json||'{}')}catch{return {}}})();
  const now=new Date(); const start=new Date(String(event.registration_start||'').replace(' ','T')); const end=new Date(String(event.registration_end||'').replace(' ','T'));
  if(Number.isNaN(start.getTime())||Number.isNaN(end.getTime())||now<start||now>end)return res.status(400).json({message:'Registration is not currently open for this event.'});
  if(Number(event.registered_count)>=Number(event.max_participants))return res.status(400).json({message:'This event has reached its participant limit.'});
  const campusType=body.campusType==='external'?'external':'hosting';
  if(event.campus_scope!=='all_campuses'&&campusType==='external')return res.status(400).json({message:'This event is restricted to the hosting campus.'});
  const collegeName=campusType==='external'?String(body.collegeName||'').trim():(process.env.COLLEGE_NAME||'Hosting College');
  if(campusType==='external'&&!collegeName)return res.status(400).json({message:'College Name is required for external participants.'});
  const data={fullName:String(body.fullName||'').trim(),studentId:String(body.studentId||'').trim(),email:String(body.email||'').trim().toLowerCase(),mobile:String(body.mobile||'').trim(),department:String(body.department||'').trim(),course:String(body.course||'').trim(),year:String(body.year||'').trim(),section:String(body.section||'').trim()};
  const labels={fullName:'Full Name',studentId:'Student ID / Roll Number',email:'Email',mobile:'Mobile Number',department:'Department',course:'Course',year:'Year',section:'Section'};
  const enabledFields=Array.isArray(config.standardFields)?config.standardFields:Object.keys(labels); const optionalFields=Array.isArray(config.optionalStandardFields)?config.optionalStandardFields:[]; const required=enabledFields.filter(k=>!optionalFields.includes(k));
  for(const k of required){if(!data[k])return res.status(400).json({message:`${labels[k]||k} is required.`});}
  if(data.fullName.length<2)return res.status(400).json({message:'Enter a valid full name.'});
  const allowedDepartments=[...new Set(['CSE','IT','AIML','ECE','EEE','Mechanical Engineering (MECH)','Civil Engineering (CIVIL)',...(config.departmentOptions||[])])];
  const allowedCourses=[...new Set(['CSE','AIML','IT','CAD','CSD','AIDS','CSE (AIML)','ECE','EEE','MECH','CIVIL',...(config.courseOptions||[])])];
  if(data.department&&!allowedDepartments.includes(data.department))return res.status(400).json({message:'Select a valid department from the event registration options.'});
  if(data.course&&!allowedCourses.includes(data.course))return res.status(400).json({message:'Select a valid course from the event registration options.'});
  if(data.year&&!['1st Year','2nd Year','3rd Year','4th Year'].includes(data.year))return res.status(400).json({message:'Select a valid year of study.'});
  if(data.email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))return res.status(400).json({message:'Enter a valid email address.'});
  if(data.mobile&&!/^[+\d][\d\s()-]{7,17}$/.test(data.mobile))return res.status(400).json({message:'Enter a valid mobile number.'});
  const answers=body.answers&&typeof body.answers==='object'&&!Array.isArray(body.answers)?body.answers:{};
  for(const q of (config.questions||[])){
   const v=answers[q.id];
   if(q.required&&(v===undefined||v===null||v===''||(Array.isArray(v)&&!v.length)))return res.status(400).json({message:`${q.label} is required.`});
   if(v!==undefined&&q.options?.length&&['dropdown','radio'].includes(q.type)&&v!==''&&!q.options.includes(v))return res.status(400).json({message:`Invalid option for ${q.label}.`});
   if(v!==undefined&&v!==''&&q.type==='email'&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v)))return res.status(400).json({message:`Enter a valid email for ${q.label}.`});
   if(v!==undefined&&v!==''&&q.type==='number'&&!Number.isFinite(Number(v)))return res.status(400).json({message:`Enter a valid number for ${q.label}.`});
   if(v!==undefined&&q.type==='checkbox'&&Array.isArray(v)&&q.options?.length&&v.some(x=>!q.options.includes(x)))return res.status(400).json({message:`Invalid option for ${q.label}.`});
  }
  let teamName=null, members=[];
  if(event.participation_type==='team'){
   teamName=String(body.teamName||'').trim();members=Array.isArray(body.teamMembers)?body.teamMembers:[];
   if(!teamName)return res.status(400).json({message:'Team Name is required.'});
   const min=Number(event.team_min_size)||2,max=Number(event.team_max_size)||5;
   if(members.length+1<min||members.length+1>max)return res.status(400).json({message:`Team size must be between ${min} and ${max} members, including the team leader.`});
   const memberRequired=[...new Set(['fullName','studentId','department','course','year',...enabledFields.filter(k=>['email','mobile','section'].includes(k)&&!optionalFields.includes(k))])];
   const memberLabels={fullName:'full name',studentId:'student ID / roll number',email:'email',mobile:'mobile number',department:'department',course:'course',year:'year of study',section:'section'};
   for(let i=0;i<members.length;i++){const m=members[i]||{};for(const k of memberRequired){if(!String(m[k]||'').trim())return res.status(400).json({message:`Team member ${i+2}: ${memberLabels[k]} is required.`});}if(m.email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(m.email)))return res.status(400).json({message:`Enter a valid email for team member ${i+2}.`});if(m.mobile&&!/^[+\d][\d\s()-]{7,17}$/.test(String(m.mobile)))return res.status(400).json({message:`Enter a valid mobile number for team member ${i+2}.`});if(m.department&&!allowedDepartments.includes(m.department))return res.status(400).json({message:`Select a valid department for team member ${i+2}.`});if(m.course&&!allowedCourses.includes(m.course))return res.status(400).json({message:`Select a valid course for team member ${i+2}.`});if(m.year&&!['1st Year','2nd Year','3rd Year','4th Year'].includes(m.year))return res.status(400).json({message:`Select a valid year for team member ${i+2}.`});}
   const dupeTeam=(await query(`SELECT id FROM event_registrations WHERE event_id=? AND LOWER(team_name)=LOWER(?) AND status<>'cancelled'`,[event.id,teamName]))[0];
   if(dupeTeam)return res.status(409).json({message:'A team with this name is already registered for this event.'});
  }
  const duplicate=(await query(`SELECT id FROM event_registrations WHERE event_id=? AND status<>'cancelled' AND ((?<>'' AND LOWER(email_snapshot)=LOWER(?)) OR (?<>'' AND LOWER(student_id_snapshot)=LOWER(?)))`,[event.id,data.email,data.email,data.studentId,data.studentId]))[0];
  if(duplicate)return res.status(409).json({message:'This email address or student ID is already registered for this event.'});
  await conn.beginTransaction();inTransaction=true;
  const registrationCode=code();
  const randomPassword=await bcrypt.hash(`${registrationCode}-${Math.random()}-${Date.now()}`,10);
  const guestEmail=`guest-${registrationCode.toLowerCase()}@registration.invalid`;
  const userInsert=await conn.execute(`INSERT INTO users(email,password_hash,role,full_name,mobile) VALUES(?,?,?,?,?)`,[guestEmail,randomPassword,'student',data.fullName,data.mobile||null]);
  const studentInsert=await conn.execute(`INSERT INTO students(user_id,student_id,department,course,year,section) VALUES(?,?,?,?,?,?)`,[userInsert[0].insertId,`PUBLIC-${registrationCode}`,data.department||'Not provided',data.course||'Not provided',data.year||'Not provided',data.section||'Not provided']);
  const regInsert=await conn.execute(`INSERT INTO event_registrations(registration_code,student_id,event_id,status,college_name,campus_type,full_name_snapshot,student_id_snapshot,email_snapshot,mobile_snapshot,department_snapshot,course_snapshot,year_snapshot,section_snapshot,custom_answers_json,team_name,team_members_json) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,[registrationCode,studentInsert[0].insertId,event.id,'approved',collegeName,campusType,data.fullName,data.studentId,data.email,data.mobile,data.department,data.course,data.year,data.section,JSON.stringify(answers),teamName,JSON.stringify(members)]);
  if(teamName){await conn.execute(`INSERT INTO team_members(registration_id,member_index,full_name,student_id,department,course,year,email,mobile,section,details_json) VALUES(?,?,?,?,?,?,?,?,?,?,?)`,[regInsert[0].insertId,1,data.fullName,data.studentId,data.department,data.course,data.year,data.email,data.mobile,data.section,JSON.stringify({...data,teamLeader:true})]);}
  for(let i=0;i<members.length;i++){const m=members[i]||{};await conn.execute(`INSERT INTO team_members(registration_id,member_index,full_name,student_id,department,course,year,email,mobile,section,details_json) VALUES(?,?,?,?,?,?,?,?,?,?,?)`,[regInsert[0].insertId,i+2,String(m.fullName||'').trim(),String(m.studentId||'').trim(),m.department||'',m.course||'',m.year||'',m.email||'',m.mobile||'',m.section||'',JSON.stringify(m)]);}
  await conn.commit();inTransaction=false;
  res.status(201).json({message:'Registration submitted successfully.',registrationId:registrationCode,registrationCode,registrationDbId:regInsert[0].insertId,eventName:event.name,invoiceUrl:`/api/registrations/${registrationCode}/invoice`});
 }catch(e){if(inTransaction)await conn.rollback().catch(()=>{});if(e.code==='ER_DUP_ENTRY')return res.status(409).json({message:'A registration with these details already exists.'});next(e)}finally{conn.release()}
}

/* ------------------------------------------------------------------ */
/*  REGISTRATION RECEIPT (PDF, A4) - explicit-cursor layout            */
/* ------------------------------------------------------------------ */
export async function downloadRegistrationInvoice(req,res,next){
 try{
  const r=(await query(`SELECT r.*,e.name event_name,e.event_date,e.start_time,e.end_time,e.venue,e.contact_information,e.registration_config_json FROM event_registrations r JOIN events e ON e.id=r.event_id WHERE r.registration_code=? AND e.deleted_at IS NULL`,[req.params.code]))[0];
  if(!r)return res.status(404).json({message:'Registration receipt not found.'});
  const answers=(()=>{try{const v=JSON.parse(r.custom_answers_json||'{}');return v&&typeof v==='object'?v:{}}catch{return {}}})();
  const members=(()=>{try{const v=JSON.parse(r.team_members_json||'[]');return Array.isArray(v)?v:[]}catch{return []}})();
  const isTeam=Boolean(r.team_name);
  const college=process.env.COLLEGE_NAME||'College Event Management System';

  const fmtDate=(v)=>{if(!v)return '—';const d=new Date(v);return Number.isNaN(d.getTime())?String(v):d.toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})};
  const fmtDateTime=(v)=>{if(!v)return '—';const raw=String(v);const d=new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(raw)?raw:raw.replace(' ','T')+'Z');return Number.isNaN(d.getTime())?raw:d.toLocaleString('en-IN',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit',hour12:true,timeZone:'Asia/Kolkata'})+' IST'};
  const fmtTime=(v)=>{const m=String(v||'').match(/^(\d{1,2}):(\d{2})/);if(!m)return '';let h=Number(m[1]);const ap=h>=12?'PM':'AM';h=h%12||12;return `${String(h).padStart(2,'0')}:${m[2]} ${ap}`};
  const timeRange=r.start_time?`${fmtTime(r.start_time)}${r.end_time?' – '+fmtTime(r.end_time):''}`:'—';
  const val=(v)=>{const s=String(v??'').trim();return s?s:'—'};

  res.setHeader('Content-Type','application/pdf');
  res.setHeader('Content-Disposition',`attachment; filename="Registration-${r.registration_code}.pdf"`);
  const doc=new PDFDocument({size:'A4',margin:40,bufferPages:true,info:{Title:`Registration Receipt - ${r.event_name}`,Author:college,Subject:`Registration ${r.registration_code}`}});
  doc.pipe(res);

  const L=40,W=doc.page.width-80,BOTTOM=doc.page.height-70;
  const C={primary:'#1e3a8a',accent:'#2563eb',soft:'#eff4ff',line:'#d5dcea',text:'#111827',muted:'#64748b'};
  let y=0;
  const newPage=()=>{doc.addPage();y=40;};
  const need=(h)=>{if(y+h>BOTTOM)newPage();};

  /* ---- header band ---- */
  doc.rect(0,0,doc.page.width,104).fill(C.primary);
  doc.rect(0,104,doc.page.width,4).fill(C.accent);
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(12).text(college.toUpperCase(),L,24,{width:W,align:'center',lineBreak:false,ellipsis:true});
  doc.font('Helvetica-Bold').fontSize(22).text('EVENT REGISTRATION RECEIPT',L,46,{width:W,align:'center',lineBreak:false});
  doc.font('Helvetica').fontSize(9.5).fillColor('#cfdcff').text(`Receipt No: ${r.registration_code}`,L,78,{width:W,align:'center',lineBreak:false});
  y=124;

  /* ---- status banner ---- */
  const statusRaw=String(r.status||'approved').toUpperCase();
  const statusLabel=statusRaw==='APPROVED'?'CONFIRMED':statusRaw;
  const statusColor=({APPROVED:'#15803d',PENDING:'#b45309',REJECTED:'#b91c1c',CANCELLED:'#6b7280'})[statusRaw]||'#15803d';
  doc.roundedRect(L,y,W,42,6).fillAndStroke('#f8fafc',C.line);
  doc.fillColor(C.muted).font('Helvetica').fontSize(8).text('EVENT',L+14,y+8,{lineBreak:false});
  doc.fillColor(C.text).font('Helvetica-Bold').fontSize(13).text(r.event_name,L+14,y+21,{width:W-150,lineBreak:false,ellipsis:true});
  doc.roundedRect(L+W-112,y+12,98,18,9).fill(statusColor);
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(9).text(statusLabel,L+W-112,y+17,{width:98,align:'center',lineBreak:false});
  y+=42+18;

  /* ---- helpers ---- */
  const section=(title)=>{
   need(70);
   doc.rect(L,y,4,16).fill(C.accent);
   doc.fillColor(C.primary).font('Helvetica-Bold').fontSize(11).text(title.toUpperCase(),L+12,y+3,{width:W-12,lineBreak:false});
   y+=24;
  };
  const grid=(pairs,cols=2)=>{
   const cw=W/cols,pad=9;
   for(let i=0;i<pairs.length;i+=cols){
    const rowItems=pairs.slice(i,i+cols);
    doc.font('Helvetica-Bold').fontSize(9.5);
    const h=Math.max(...rowItems.map(([,v])=>doc.heightOfString(val(v),{width:cw-pad*2})))+28;
    need(h);
    for(let ci=0;ci<cols;ci++){
     const x=L+ci*cw;
     doc.rect(x,y,cw,h).fillAndStroke(ci%2===0?'#ffffff':'#fafbff',C.line);
     const item=rowItems[ci];if(!item)continue;
     doc.fillColor(C.muted).font('Helvetica').fontSize(7).text(String(item[0]).toUpperCase(),x+pad,y+7,{width:cw-pad*2,lineBreak:false});
     doc.fillColor(C.text).font('Helvetica-Bold').fontSize(9.5).text(val(item[1]),x+pad,y+19,{width:cw-pad*2});
    }
    y+=h;
   }
   y+=16;
  };

  /* ---- event details ---- */
  section('Event details');
  grid([['Event name',r.event_name],['Event date',fmtDate(r.event_date)],['Time',timeRange],['Venue',r.venue],...(r.contact_information?[['Event contact',r.contact_information]]:[])]);

  /* ---- registration details ---- */
  section('Registration details');
  grid([
   ['Registration reference',r.registration_code],
   ['Submitted on',fmtDateTime(r.registration_date)],
   ...(isTeam?[['Team ID',r.registration_code],['Team name',r.team_name]]:[]),
   ['Participation',isTeam?`Team (${members.length+1} member${members.length+1>1?'s':''})`:'Individual'],
   ['Campus type',r.campus_type==='external'?'External college':'Hosting college'],
   ['College',r.college_name],
  ]);

  /* ---- participant / leader ---- */
  section(isTeam?'Team leader details':'Participant details');
  grid([
   ['Full name',r.full_name_snapshot],['Student ID / Roll number',r.student_id_snapshot],
   ['Email',r.email_snapshot],['Mobile number',r.mobile_snapshot],
   ['Department',r.department_snapshot],['Course',r.course_snapshot],
   ['Year',r.year_snapshot],['Section',r.section_snapshot],
  ]);

  /* ---- team members table ---- */
  if(isTeam){
   section('Team members');
   const cols=[['#',22],['Name',100],['Roll No',58],['Dept',46],['Course',62],['Year',48],['Email',116],['Mobile',63]];
   const xs=[];cols.reduce((x,[,w],i)=>{xs[i]=x;return x+w},L);
   const tableW=cols.reduce((a,[,w])=>a+w,0);
   const drawHead=()=>{doc.rect(L,y,tableW,22).fillAndStroke(C.primary,C.primary);cols.forEach(([label,w],i)=>{doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(8).text(label,xs[i]+4,y+7,{width:w-8,lineBreak:false})});y+=22};
   need(70);drawHead();
   const all=[
    {n:1,fullName:`${val(r.full_name_snapshot)} (Leader)`,studentId:r.student_id_snapshot,department:r.department_snapshot,course:r.course_snapshot,year:r.year_snapshot,email:r.email_snapshot,mobile:r.mobile_snapshot},
    ...members.map((m,i)=>({n:i+2,...m}))
   ];
   all.forEach((m,idx)=>{
    const vals=[String(m.n),val(m.fullName),val(m.studentId),val(m.department),val(m.course),val(m.year),val(m.email),val(m.mobile)];
    doc.font('Helvetica').fontSize(8);
    const h=Math.max(22,...vals.map((v,i)=>doc.heightOfString(v,{width:cols[i][1]-8})+12));
    if(y+h>BOTTOM){newPage();drawHead();}
    doc.rect(L,y,tableW,h).fillAndStroke(idx%2?'#f8fafc':'#ffffff',C.line);
    vals.forEach((v,i)=>{doc.fillColor(C.text).font(i===1&&idx===0?'Helvetica-Bold':'Helvetica').fontSize(8).text(v,xs[i]+4,y+6,{width:cols[i][1]-8})});
    y+=h;
   });
   y+=16;
  }

  /* ---- additional answers ---- */
  const answerEntries=Object.entries(answers).filter(([,v])=>!(v===undefined||v===null||v===''||(Array.isArray(v)&&!v.length)));
  if(answerEntries.length){
   let questions=[];try{questions=JSON.parse(r.registration_config_json||'{}').questions||[]}catch{}
   const questionLabels=Object.fromEntries(questions.map(q=>[String(q.id),q.label]));
   section('Additional registration answers');
   grid(answerEntries.map(([k,v])=>[questionLabels[k]||k,Array.isArray(v)?v.join(', '):String(v)]),1);
  }

  /* ---- closing note ---- */
  const note=`Please retain this receipt and present Registration ID ${r.registration_code}${isTeam?' (Team ID)':''} at the event as proof of registration.`;
  doc.font('Helvetica').fontSize(8.5);
  const noteH=doc.heightOfString(note,{width:W-24})+34;
  need(noteH+4);
  doc.roundedRect(L,y,W,noteH,6).fillAndStroke(C.soft,'#c7d6fb');
  doc.fillColor(C.primary).font('Helvetica-Bold').fontSize(9).text('IMPORTANT',L+12,y+9,{lineBreak:false});
  doc.fillColor(C.text).font('Helvetica').fontSize(8.5).text(note,L+12,y+22,{width:W-24});
  y+=noteH;

  /* ---- footer on every page ---- */
  const range=doc.bufferedPageRange();
  const generated=new Date().toLocaleString('en-IN',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit',hour12:true,timeZone:'Asia/Kolkata'});
  for(let i=range.start;i<range.start+range.count;i++){
   doc.switchToPage(i);
   doc.page.margins.bottom=0;
   const fy=doc.page.height-52;
   doc.moveTo(L,fy).lineTo(L+W,fy).lineWidth(0.6).strokeColor(C.line).stroke();
   doc.fillColor(C.muted).font('Helvetica').fontSize(7.5);
   doc.text(`${college}  •  Computer-generated receipt, no signature required`,L,fy+8,{width:W-100,lineBreak:false,ellipsis:true});
   doc.text(`Page ${i-range.start+1} of ${range.count}`,L+W-90,fy+8,{width:90,align:'right',lineBreak:false});
   doc.text(`Generated on ${generated} IST`,L,fy+20,{width:W,lineBreak:false});
  }
  doc.end();
 }catch(e){next(e)}
}