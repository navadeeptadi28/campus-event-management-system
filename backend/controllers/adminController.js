import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import {query} from '../config/db.js';
import PDFDocument from 'pdfkit';
import XLSX from 'xlsx';

export async function dashboard(req,res,next){try{const out={};out.students=Number((await query(`SELECT COUNT(DISTINCT CASE WHEN COALESCE(r.email_snapshot,'')<>'' THEN LOWER(r.email_snapshot) WHEN COALESCE(r.student_id_snapshot,'')<>'' THEN LOWER(r.student_id_snapshot) ELSE CAST(r.student_id AS TEXT) END) count FROM event_registrations r JOIN events e ON e.id=r.event_id WHERE e.deleted_at IS NULL AND r.status<>'cancelled'`))[0].count||0);out.organizers=Number((await query(`SELECT COUNT(DISTINCT e.organizer_id) count FROM events e WHERE e.deleted_at IS NULL`))[0].count||0);out.events=Number((await query('SELECT COUNT(*) count FROM events WHERE deleted_at IS NULL'))[0].count||0);out.event_registrations=Number((await query(`SELECT COUNT(*) count FROM event_registrations r JOIN events e ON e.id=r.event_id WHERE e.deleted_at IS NULL AND r.status<>'cancelled'`))[0].count||0);out.upcoming=Number((await query(`SELECT COUNT(*) count FROM events WHERE deleted_at IS NULL AND date(event_date)>=date('now','localtime') AND status='approved'`))[0].count||0);out.completed=Number((await query(`SELECT COUNT(*) count FROM events WHERE deleted_at IS NULL AND date(event_date)<date('now','localtime') AND status='approved'`))[0].count||0);res.set('Cache-Control','no-store');res.json(out)}catch(e){next(e)}}
export async function users(req,res,next){try{res.json(await query(`SELECT id,full_name,email,mobile,role,is_active,is_system_admin,created_at FROM users ORDER BY created_at DESC`))}catch(e){next(e)}}
export async function toggleUser(req,res,next){try{await query("UPDATE users SET is_active=NOT is_active WHERE id=? AND role<>'admin'",[req.params.id]);res.json({message:'User status updated'})}catch(e){next(e)}}
export async function createAdmin(req,res,next){const {fullName,email,mobile,password}=req.body;try{if(!fullName||!email||!password)return res.status(400).json({message:'Name, email and password are required'});if(password.length<6)return res.status(400).json({message:'Password must contain at least 6 characters'});const hash=await bcrypt.hash(password,12);const r=await query('INSERT INTO users(email,password_hash,role,full_name,mobile,is_system_admin) VALUES(?,?,?,?,?,0)',[email.toLowerCase().trim(),hash,'admin',fullName.trim(),mobile||null]);res.status(201).json({message:'Admin created',id:r.insertId});}catch(e){if(e.code==='ER_DUP_ENTRY')return res.status(409).json({message:'An account with this email already exists'});next(e)}}
export async function updateAdmin(req,res,next){try{const id=Number(req.params.id);const existing=(await query("SELECT id,role FROM users WHERE id=?",[id]))[0];if(!existing||existing.role!=='admin')return res.status(404).json({message:'Admin not found'});const {fullName,email,mobile,password}=req.body;if(!fullName||!email)return res.status(400).json({message:'Name and email are required'});if(password && password.length<6)return res.status(400).json({message:'Password must contain at least 6 characters'});if(password){const hash=await bcrypt.hash(password,12);await query('UPDATE users SET full_name=?,email=?,mobile=?,password_hash=?,updated_at=CURRENT_TIMESTAMP WHERE id=?',[fullName.trim(),email.toLowerCase().trim(),mobile||null,hash,id]);}else await query('UPDATE users SET full_name=?,email=?,mobile=?,updated_at=CURRENT_TIMESTAMP WHERE id=?',[fullName.trim(),email.toLowerCase().trim(),mobile||null,id]);res.json({message:'Admin details updated'});}catch(e){if(e.code==='ER_DUP_ENTRY')return res.status(409).json({message:'Email already exists'});next(e)}}
export async function deleteAdmin(req,res,next){try{if(!req.user.isSystemAdmin)return res.status(403).json({message:'Only the System Administrator can delete administrator accounts'});const id=Number(req.params.id);const target=(await query('SELECT id,role,is_system_admin,full_name FROM users WHERE id=?',[id]))[0];if(!target||target.role!=='admin')return res.status(404).json({message:'Admin not found'});if(target.is_system_admin)return res.status(400).json({message:'The System Administrator account cannot be deleted'});if(id===req.user.id)return res.status(400).json({message:'You cannot delete your own administrator account'});await query('DELETE FROM users WHERE id=?',[id]);res.json({message:`Administrator ${target.full_name} deleted`});}catch(e){next(e)}}

export async function organizerOptions(req,res,next){try{res.json(await query(`SELECT o.id,o.employee_id,o.department,o.designation,u.full_name,u.email FROM organizers o JOIN users u ON u.id=o.user_id WHERE u.is_active=1 ORDER BY u.full_name`))}catch(e){next(e)}}

export async function events(req,res,next){try{res.json(await query(`SELECT e.*,c.name category_name,o.id organizer_id,u.full_name organizer_name,(SELECT COUNT(*) FROM event_registrations r WHERE r.event_id=e.id AND r.status<>'cancelled') participant_count FROM events e JOIN categories c ON c.id=e.category_id JOIN organizers o ON o.id=e.organizer_id JOIN users u ON u.id=o.user_id WHERE e.deleted_at IS NULL ORDER BY e.created_at DESC`))}catch(e){next(e)}}
export async function trash(req,res,next){try{res.json(await query(`SELECT e.*,c.name category_name,u.full_name organizer_name,(SELECT COUNT(*) FROM event_registrations r WHERE r.event_id=e.id AND r.status<>'cancelled') participant_count FROM events e JOIN categories c ON c.id=e.category_id JOIN organizers o ON o.id=e.organizer_id JOIN users u ON u.id=o.user_id WHERE e.deleted_at IS NOT NULL ORDER BY e.deleted_at DESC`))}catch(e){next(e)}}

function normalizeEventBody(body){const {name,description,categoryId,organizerId,venue,eventDate,startTime,endTime,registrationStart,registrationEnd,maxParticipants,eligibility,rules,contactInformation,organizerDisplayName,organizationType,organizationName,organizationDetails,organizationWebsite,organizationLinkedin,sponsorName,sponsorDetails,sponsorWebsite,sponsorLinkedin,campusScope,participationType,teamMinSize,teamMaxSize,registrationConfig}=body;if(!name||!description||!categoryId||!organizerId||!venue||!eventDate||!startTime||!endTime||!registrationStart||!registrationEnd||!maxParticipants)return {error:'Required event fields are missing'};if(Number(maxParticipants)<1)return {error:'Maximum participants must be at least 1'};if(new Date(`${eventDate}T${endTime}`)<=new Date(`${eventDate}T${startTime}`))return {error:'End time must be after start time'};if(new Date(registrationEnd)<new Date(registrationStart))return {error:'Registration end must be after registration start'};return {value:{name,description,categoryId:Number(categoryId),organizerInput:String(organizerId).trim(),venue,eventDate,startTime,endTime,registrationStart:String(registrationStart).replace('T',' '),registrationEnd:String(registrationEnd).replace('T',' '),maxParticipants:Number(maxParticipants),eligibility:eligibility||null,rules:rules||null,contactInformation:contactInformation||null,organizerDisplayName:organizerDisplayName||null,organizationType:organizationType||null,organizationName:organizationName||null,organizationDetails:organizationDetails||null,organizationWebsite:organizationWebsite||null,organizationLinkedin:organizationLinkedin||null,sponsorName:sponsorName||null,sponsorDetails:sponsorDetails||null,sponsorWebsite:sponsorWebsite||null,sponsorLinkedin:sponsorLinkedin||null,campusScope:campusScope==='all_campuses'?'all_campuses':'hosting_only',participationType:participationType==='team'?'team':'individual',teamMinSize:Math.max(1,Number(teamMinSize)||2),teamMaxSize:Math.max(1,Number(teamMaxSize)||5),registrationConfig:(()=>{try{return typeof registrationConfig==='string'?JSON.parse(registrationConfig):(registrationConfig||{})}catch{return {}}})()}}}
async function resolveOrganizerId(input){
  const value=String(input||'').trim();
  if(!value)return null;
  if(/^\d+$/.test(value)){
    const byId=(await query('SELECT id FROM organizers WHERE id=?',[Number(value)]))[0];
    if(byId)return byId.id;
  }
  const byIdentity=(await query(`SELECT o.id FROM organizers o JOIN users u ON u.id=o.user_id WHERE LOWER(u.email)=LOWER(?) OR LOWER(u.full_name)=LOWER(?) OR LOWER(COALESCE(o.employee_id,''))=LOWER(?) LIMIT 1`,[value,value,value]))[0];
  if(byIdentity?.id)return byIdentity.id;

  // Organizer details are entered directly in the Event Creation form.
  // If the typed organizer does not already have an organizer account,
  // create a lightweight organizer profile automatically so the event can
  // keep a proper foreign-key relationship without requiring a separate
  // "Create Organizer" screen.
  const looksLikeEmail=value.includes('@');
  const fullName=looksLikeEmail ? value.split('@')[0].replace(/[._-]+/g,' ').trim() || value : value;
  let email=looksLikeEmail ? value.toLowerCase() : `event-organizer-${Date.now()}-${crypto.randomBytes(3).toString('hex')}@local.invalid`;
  const existingUser=(await query('SELECT id,role FROM users WHERE LOWER(email)=LOWER(?)',[email]))[0];
  if(existingUser){
    if(existingUser.role!=='organizer')return null;
    const existingOrg=(await query('SELECT id FROM organizers WHERE user_id=?',[existingUser.id]))[0];
    if(existingOrg)return existingOrg.id;
    const org=await query('INSERT INTO organizers(user_id) VALUES(?)',[existingUser.id]);
    return org.insertId;
  }
  const passwordHash=await bcrypt.hash(crypto.randomBytes(24).toString('hex'),12);
  const user=await query('INSERT INTO users(email,password_hash,role,full_name,mobile,is_active,is_system_admin) VALUES(?,?,?,?,?,1,0)',[email,passwordHash,'organizer',fullName,null]);
  const org=await query('INSERT INTO organizers(user_id) VALUES(?)',[user.insertId]);
  return org.insertId;
}
export async function createEvent(req,res,next){try{const parsed=normalizeEventBody(req.body);if(parsed.error)return res.status(400).json({message:parsed.error});const b=parsed.value;const organizerId=await resolveOrganizerId(b.organizerInput);if(!organizerId)return res.status(400).json({message:'Organizer details could not be created. Use a valid organizer name or email.'});const category=(await query('SELECT id FROM categories WHERE id=?',[b.categoryId]))[0];if(!category)return res.status(400).json({message:'Selected category was not found'});const poster=req.files?.poster?.[0]?`/uploads/${req.files.poster[0].filename}`:null;const r=await query(`INSERT INTO events(organizer_id,category_id,name,description,poster,venue,event_date,start_time,end_time,registration_start,registration_end,max_participants,eligibility,rules,contact_information,organizer_display_name,organization_type,organization_name,organization_details,organization_website,organization_linkedin,sponsor_name,sponsor_details,sponsor_website,sponsor_linkedin,campus_scope,participation_type,team_min_size,team_max_size,registration_config_json,status,deleted_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,NULL)`,[organizerId,b.categoryId,b.name,b.description,poster,b.venue,b.eventDate,b.startTime,b.endTime,b.registrationStart,b.registrationEnd,b.maxParticipants,b.eligibility,b.rules,b.contactInformation,b.organizerDisplayName,b.organizationType,b.organizationName,b.organizationDetails,b.organizationWebsite,b.organizationLinkedin,b.sponsorName,b.sponsorDetails,b.sponsorWebsite,b.sponsorLinkedin,b.campusScope,b.participationType,b.teamMinSize,b.teamMaxSize,JSON.stringify(b.registrationConfig),'approved']);res.status(201).json({message:'Event created and approved',id:r.insertId});}catch(e){next(e)}}

export async function getEvent(req,res,next){try{const rows=await query(`SELECT e.*,c.name category_name,o.id organizer_id,u.full_name organizer_name FROM events e JOIN categories c ON c.id=e.category_id JOIN organizers o ON o.id=e.organizer_id JOIN users u ON u.id=o.user_id WHERE e.id=? AND e.deleted_at IS NULL`,[req.params.id]);if(!rows.length)return res.status(404).json({message:'Event not found'});res.json(rows[0]);}catch(e){next(e)}}
export async function updateEvent(req,res,next){try{const existing=(await query('SELECT * FROM events WHERE id=? AND deleted_at IS NULL',[req.params.id]))[0];if(!existing)return res.status(404).json({message:'Event not found'});const parsed=normalizeEventBody(req.body);if(parsed.error)return res.status(400).json({message:parsed.error});const b=parsed.value;const organizerId=await resolveOrganizerId(b.organizerInput);if(!organizerId)return res.status(400).json({message:'Organizer details could not be created. Use a valid organizer name or email.'});const poster=req.files?.poster?.[0]?`/uploads/${req.files.poster[0].filename}`:existing.poster;await query(`UPDATE events SET organizer_id=?,category_id=?,name=?,description=?,poster=?,venue=?,event_date=?,start_time=?,end_time=?,registration_start=?,registration_end=?,max_participants=?,eligibility=?,rules=?,contact_information=?,organizer_display_name=?,organization_type=?,organization_name=?,organization_details=?,organization_website=?,organization_linkedin=?,sponsor_name=?,sponsor_details=?,sponsor_website=?,sponsor_linkedin=?,campus_scope=?,participation_type=?,team_min_size=?,team_max_size=?,registration_config_json=?,status='approved',rejection_reason=NULL,updated_at=CURRENT_TIMESTAMP WHERE id=?`,[organizerId,b.categoryId,b.name,b.description,poster,b.venue,b.eventDate,b.startTime,b.endTime,b.registrationStart,b.registrationEnd,b.maxParticipants,b.eligibility,b.rules,b.contactInformation,b.organizerDisplayName,b.organizationType,b.organizationName,b.organizationDetails,b.organizationWebsite,b.organizationLinkedin,b.sponsorName,b.sponsorDetails,b.sponsorWebsite,b.sponsorLinkedin,b.campusScope,b.participationType,b.teamMinSize,b.teamMaxSize,JSON.stringify(b.registrationConfig),req.params.id]);res.json({message:'Event updated'});}catch(e){next(e)}}

export async function deleteEvent(req,res,next){try{const result=await query("UPDATE events SET deleted_at=datetime('now','localtime'),updated_at=CURRENT_TIMESTAMP WHERE id=? AND deleted_at IS NULL",[req.params.id]);if(!result.affectedRows)return res.status(404).json({message:'Event not found'});res.json({message:'Event moved to Bin. Participant records are retained until permanent deletion.'});}catch(e){next(e)}}
export async function restoreEvent(req,res,next){try{const r=await query("UPDATE events SET deleted_at=NULL,updated_at=CURRENT_TIMESTAMP WHERE id=? AND deleted_at IS NOT NULL",[req.params.id]);if(!r.affectedRows)return res.status(404).json({message:'Event not found in Bin'});res.json({message:'Event restored successfully'});}catch(e){next(e)}}
export async function permanentDeleteEvent(req,res,next){try{const r=await query('DELETE FROM events WHERE id=? AND deleted_at IS NOT NULL',[req.params.id]);if(!r.affectedRows)return res.status(404).json({message:'Event not found in Bin'});res.json({message:'Event permanently deleted. Its registrations, attendance and related records were removed.'});}catch(e){next(e)}}
export async function eventDecision(req,res,next){try{const {status,rejectionReason}=req.body;if(!['approved','rejected','cancelled'].includes(status))return res.status(400).json({message:'Invalid event status'});await query('UPDATE events SET status=?,rejection_reason=?,updated_at=CURRENT_TIMESTAMP WHERE id=? AND deleted_at IS NULL',[status,rejectionReason||null,req.params.id]);res.json({message:`Event ${status}`});}catch(e){next(e)}}
export async function registrations(req,res,next){try{res.json(await query(`SELECT r.id,r.registration_code,r.registration_date,r.status,e.name event_name,e.id event_id,e.campus_scope,e.participation_type,COALESCE(r.full_name_snapshot,u.full_name) student_name,COALESCE(r.email_snapshot,u.email) email,COALESCE(r.student_id_snapshot,s.student_id) student_id,COALESCE(r.mobile_snapshot,u.mobile) mobile,COALESCE(r.department_snapshot,s.department) department,COALESCE(r.course_snapshot,s.course) course,COALESCE(r.year_snapshot,s.year) year,COALESCE(r.section_snapshot,s.section) section,r.college_name,r.campus_type,r.team_name,r.team_members_json,r.custom_answers_json,a.status attendance FROM event_registrations r JOIN events e ON e.id=r.event_id JOIN students s ON s.id=r.student_id JOIN users u ON u.id=s.user_id LEFT JOIN attendance a ON a.registration_id=r.id WHERE e.deleted_at IS NULL ORDER BY r.registration_date DESC`))}catch(e){next(e)}}
export async function registrationDecision(req,res,next){try{const {status}=req.body;if(!['approved','rejected'].includes(status))return res.status(400).json({message:'Invalid registration status'});const r=(await query(`SELECT r.*,s.user_id,e.name event_name FROM event_registrations r JOIN students s ON s.id=r.student_id JOIN events e ON e.id=r.event_id WHERE r.id=? AND e.deleted_at IS NULL`,[req.params.id]))[0];if(!r)return res.status(404).json({message:'Registration not found'});await query('UPDATE event_registrations SET status=? WHERE id=?',[status,r.id]);await query('INSERT INTO notifications(user_id,title,message) VALUES(?,?,?)',[r.user_id,'Registration update',`Your registration for ${r.event_name} was ${status}.`]);res.json({message:`Registration ${status}`});}catch(e){next(e)}}
export async function participants(req,res,next){try{const event=(await query('SELECT id,name,event_date,status FROM events WHERE id=? AND deleted_at IS NULL',[req.params.id]))[0];if(!event)return res.status(404).json({message:'Event not found'});const rows=await query(`SELECT r.id,r.registration_code,r.registration_date,r.status,s.student_id,COALESCE(r.full_name_snapshot,u.full_name) full_name,COALESCE(r.email_snapshot,u.email) email,COALESCE(r.student_id_snapshot,s.student_id) student_id,COALESCE(r.mobile_snapshot,u.mobile) mobile,COALESCE(r.department_snapshot,s.department) department,COALESCE(r.course_snapshot,s.course) course,COALESCE(r.year_snapshot,s.year) year,COALESCE(r.section_snapshot,s.section) section,r.college_name,r.campus_type,r.team_name,r.team_members_json,r.custom_answers_json,a.status attendance FROM event_registrations r JOIN students s ON s.id=r.student_id JOIN users u ON u.id=s.user_id LEFT JOIN attendance a ON a.registration_id=r.id WHERE r.event_id=? ORDER BY r.registration_date`,[req.params.id]);res.json({event,participants:rows});}catch(e){next(e)}}
export async function eventAnalysis(req,res,next){try{const event=(await query(`SELECT e.id,e.name,e.event_date,e.max_participants,e.status,c.name category_name,u.full_name organizer_name FROM events e JOIN categories c ON c.id=e.category_id JOIN organizers o ON o.id=e.organizer_id JOIN users u ON u.id=o.user_id WHERE e.id=? AND e.deleted_at IS NULL`,[req.params.id]))[0];if(!event)return res.status(404).json({message:'Event not found'});const summary=(await query(`SELECT COUNT(r.id) total,COALESCE(SUM(r.status='approved'),0) approved,COALESCE(SUM(r.status='pending'),0) pending,COALESCE(SUM(r.status='rejected'),0) rejected,COALESCE(SUM(r.status='cancelled'),0) cancelled,COALESCE(SUM(a.status='Present'),0) present,COALESCE(SUM(a.status='Absent'),0) absent,COALESCE(SUM(r.status='approved' AND a.id IS NULL),0) not_marked FROM event_registrations r LEFT JOIN attendance a ON a.registration_id=r.id WHERE r.event_id=?`,[req.params.id]))[0];const byBranch=await query(`SELECT COALESCE(s.department,'Unknown') branch,COUNT(*) registrations,COALESCE(SUM(r.status='approved'),0) approved,COALESCE(SUM(a.status='Present'),0) present FROM event_registrations r JOIN students s ON s.id=r.student_id LEFT JOIN attendance a ON a.registration_id=r.id WHERE r.event_id=? GROUP BY s.department ORDER BY registrations DESC`,[req.params.id]);const trend=await query(`SELECT DATE(r.registration_date) registration_date,COUNT(*) registrations FROM event_registrations r WHERE r.event_id=? GROUP BY DATE(r.registration_date) ORDER BY registration_date`,[req.params.id]);res.json({event,summary,byBranch,trend});}catch(e){next(e)}}

/* ------------------------------------------------------------------ */
/*  EXPORT (Excel + PDF)                                               */
/*  - Honors the admin's selected columns in both formats.             */
/*  - "Team ID" = the team's registration code (unique per team).      */
/*  - Team events: leader row + one row per member, Team ID / Name     */
/*    repeated on every row of that team. Excel gets exactly ONE       */
/*    truly empty worksheet row between consecutive teams.             */
/*  - Individual events: Team ID is never generated or exported.       */
/* ------------------------------------------------------------------ */
export async function exportEvent(req,res,next){
 try{
  const event=(await query(`SELECT e.id,e.name,e.event_date,e.registration_config_json,e.participation_type FROM events e WHERE e.id=? AND e.deleted_at IS NULL`,[req.params.id]))[0];
  if(!event)return res.status(404).json({message:'Event not found'});
  const config=(()=>{try{return JSON.parse(event.registration_config_json||'{}')}catch{return {}}})();
  const standard=[
   ['student_name','Student Name'],['student_id','Student ID / Roll Number'],['email','Email'],['mobile','Mobile Number'],['department','Department'],['course','Course'],['year','Year'],['section','Section'],['college_name','College Name'],['campus_type','Campus Type'],['team_id','Team ID'],['team_name','Team Name'],['team_members','Team Member Details'],['registration_date','Registration Date and Time'],['registration_code','Registration ID'],['status','Registration Status']
  ];
  let columns=String(req.query.columns||'student_name,student_id,email,mobile,department,course,year,section,college_name,registration_date').split(',').filter(Boolean);
  const known=new Set([...standard.map(x=>x[0]),...(config.questions||[]).map(q=>`q:${q.id}`)]);
  columns=[...new Set(columns.filter(c=>known.has(c)))];

  const filters=[];const params=[req.params.id];
  if(req.query.college){filters.push('COALESCE(r.college_name,?)=?');params.push(process.env.COLLEGE_NAME||'Hosting College',req.query.college)}
  if(req.query.department){filters.push('COALESCE(r.department_snapshot,s.department)=?');params.push(req.query.department)}
  if(req.query.year){filters.push('COALESCE(r.year_snapshot,s.year)=?');params.push(req.query.year)}
  if(req.query.campusType){filters.push('r.campus_type=?');params.push(req.query.campusType)}
  const rows=await query(`SELECT r.*,COALESCE(r.full_name_snapshot,u.full_name) student_name,COALESCE(r.student_id_snapshot,s.student_id) student_id,COALESCE(r.email_snapshot,u.email) email,COALESCE(r.mobile_snapshot,u.mobile) mobile,COALESCE(r.department_snapshot,s.department) department,COALESCE(r.course_snapshot,s.course) course,COALESCE(r.year_snapshot,s.year) year,COALESCE(r.section_snapshot,s.section) section FROM event_registrations r JOIN students s ON s.id=r.student_id JOIN users u ON u.id=s.user_id WHERE r.event_id=? AND r.status<>'cancelled' ${filters.length?'AND '+filters.join(' AND '):''} ORDER BY r.registration_date,r.id`,params);

  const isTeam=event.participation_type==='team'||rows.some(r=>Boolean(r.team_name));
  // Team members are expanded into their own rows for team events; Team ID never applies to individual events.
  columns=columns.filter(c=>c!=='team_members'&&(isTeam||c!=='team_id'));
  if(!columns.length)return res.status(400).json({message:'Select at least one export column.'});

  const labels=Object.fromEntries(standard.map(x=>[x[0],x[1]]));for(const q of config.questions||[])labels[`q:${q.id}`]=q.label||`Question ${q.id}`;
  const parseJson=(v)=>{try{return JSON.parse(v||'{}')}catch{return {}}};
  const memberMap={student_name:'fullName',student_id:'studentId',email:'email',mobile:'mobile',department:'department',course:'course',year:'year',section:'section'};
  const getValue=(row,key,member=null)=>{
   // Team ID is always the registration code of the team's registration (same for leader and all members).
   if(key==='team_id')return isTeam&&row?.team_name?String(row.registration_code||row.id||''):'';
   if(key==='team_name')return String(row?.team_name??'');
   if(key.startsWith('q:')){const id=key.slice(2);const answers=member?(member.answers||member.customAnswers||{}):parseJson(row?.custom_answers_json);const val=member?(answers[id]??member[id]??''):(answers[id]??'');return Array.isArray(val)?val.join(', '):String(val??'')}
   if(key==='team_members')return '';
   if(member){const mk=memberMap[key];if(mk)return String(member[mk]??'');}
   return String(row?.[key]??'');
  };

  const exportHeaders=isTeam?['Team No','Member Role',...columns.map(c=>labels[c]||c)]:columns.map(c=>labels[c]||c);
  const exportRows=[]; // an empty array [] represents a real blank separator row between teams
  if(isTeam){
   rows.forEach((row,index)=>{
    if(index>0)exportRows.push([]);
    const teamLabel=`Team ${index+1}`;
    const members=(()=>{try{const v=JSON.parse(row.team_members_json||'[]');return Array.isArray(v)?v:[]}catch{return []}})();
    const push=(role,member=null)=>exportRows.push([teamLabel,role,...columns.map(c=>getValue(row,c,member))]);
    push('Team Leader');
    members.forEach((member,memberIndex)=>push(`Member ${memberIndex+2}`,member));
   });
  }else{
   rows.forEach(row=>exportRows.push(columns.map(c=>getValue(row,c))));
  }
  const dataRowCount=exportRows.filter(r=>r.length>0).length;
  const format=(req.query.format||'xlsx').toLowerCase();const safe=event.name.replace(/[^a-z0-9]+/gi,'-').replace(/^-|-$/g,'').toLowerCase()||'event';

  if(format==='pdf'){
   const doc=new PDFDocument({size:'A3',layout:'landscape',margin:28,bufferPages:true,info:{Title:`${event.name} registration report`}});
   res.setHeader('Content-Type','application/pdf');res.setHeader('Content-Disposition',`attachment; filename="${safe}-registrations.pdf"`);doc.pipe(res);
   const pageLeft=doc.page.margins.left,pageRight=doc.page.width-doc.page.margins.right,pageW=pageRight-pageLeft;
   doc.font('Helvetica-Bold').fontSize(17).fillColor('#17243b').text(event.name,{align:'center'});
   doc.font('Helvetica').fontSize(9).fillColor('#52627a').text(`Event date: ${new Date(event.event_date).toLocaleDateString('en-IN')}  |  Registration records: ${rows.length}  |  Exported rows: ${dataRowCount}`,{align:'center'});
   doc.moveDown(1);
   // Weighted widths keep every selected column visible while giving names, emails and IDs more room.
   const weights=exportHeaders.map((h,i)=>{const t=String(h).toLowerCase();if(isTeam&&i===0)return 0.7;if(isTeam&&i===1)return 1;if(t.includes('team id')||t.includes('registration id'))return 1.35;if(t.includes('name')||t.includes('question'))return 1.55;if(t.includes('email'))return 1.65;return 1;});
   const totalWeight=weights.reduce((a,b)=>a+b,0);const widths=weights.map(w=>pageW*w/totalWeight);let y=doc.y;const headerFont=7.5,bodyFont=7.2;
   const rowHeight=(values,fontSize)=>Math.max(24,...values.map((v,i)=>doc.heightOfString(String(v??''),{width:Math.max(22,widths[i]-8),font:'Helvetica',fontSize,lineGap:1})+8));
   const drawHeader=()=>{const h=36;let x=pageLeft;exportHeaders.forEach((label,i)=>{doc.save().rect(x,y,widths[i],h).fillAndStroke('#eaf0ff','#cbd5e1').restore();doc.font('Helvetica-Bold').fontSize(headerFont).fillColor('#172554').text(String(label),x+4,y+4,widths[i]-8,{height:h-8,ellipsis:true});x+=widths[i]});y+=h;doc.fillColor('#111827')};
   drawHeader();
   for(let ri=0;ri<exportRows.length;ri++){
    const vals=exportRows[ri];
    if(!vals.length){ // team separator: small visual gap in the PDF
     if(y+12>doc.page.height-doc.page.margins.bottom){doc.addPage();y=doc.page.margins.top;drawHeader();}else y+=12;
     continue;
    }
    const h=rowHeight(vals,bodyFont);
    if(y+h>doc.page.height-doc.page.margins.bottom){doc.addPage();y=doc.page.margins.top;drawHeader();}
    let x=pageLeft;vals.forEach((v,i)=>{doc.rect(x,y,widths[i],h).stroke('#d7deea');doc.font('Helvetica').fontSize(bodyFont).fillColor('#111827').text(String(v??''),x+4,y+4,widths[i]-8,{height:h-8,lineGap:1});x+=widths[i]});y+=h;
   }
   if(!dataRowCount)doc.fontSize(10).fillColor('#52627a').text('No registrations match the selected filters.',pageLeft,y+10,{align:'center',width:pageW});
   doc.end();return;
  }

  const wb=XLSX.utils.book_new();
  const topRows=[[event.name],[`Event date: ${event.event_date}`,`Registration records: ${rows.length}`,`Export rows: ${dataRowCount}`],exportHeaders,...exportRows];
  const ws=XLSX.utils.aoa_to_sheet(topRows);ws['!merges']=[{s:{r:0,c:0},e:{r:0,c:Math.max(exportHeaders.length-1,0)}}];ws['!autofilter']={ref:`A3:${XLSX.utils.encode_col(Math.max(exportHeaders.length-1,0))}${Math.max(3,topRows.length)}`};ws['!freeze']={xSplit:0,ySplit:3};
  ws['!cols']=exportHeaders.map((h,i)=>({wch:Math.min(42,Math.max(14,String(h).length+4,...exportRows.slice(0,300).map(r=>String(r[i]??'').length+2)))}));
  XLSX.utils.book_append_sheet(wb,ws,isTeam?'Team-by-Team':'Registrations');
  const buf=XLSX.write(wb,{type:'buffer',bookType:'xlsx'});res.setHeader('Content-Type','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');res.setHeader('Content-Disposition',`attachment; filename="${safe}-registrations.xlsx"`);res.send(buf);
 }catch(e){next(e)}
}
export async function categoriesAdmin(req,res,next){
  try { res.json(await query('SELECT id,name,description,created_at FROM categories ORDER BY name COLLATE NOCASE')); }
  catch(e){ next(e); }
}

export async function addCategory(req,res,next){
  try {
    const name=String(req.body?.name||'').trim();
    const description=String(req.body?.description||'').trim()||null;
    if(!name) return res.status(400).json({message:'Category name is required'});
    if(name.length>80) return res.status(400).json({message:'Category name must be 80 characters or fewer'});
    const result=await query('INSERT INTO categories(name,description) VALUES(?,?)',[name,description]);
    const created=(await query('SELECT id,name,description,created_at FROM categories WHERE id=?',[result.insertId]))[0];
    return res.status(201).json({message:'Category created',category:created});
  } catch(e){
    if(e.code==='ER_DUP_ENTRY' || /UNIQUE constraint failed/i.test(e.message||'')) return res.status(409).json({message:'A category with this name already exists'});
    next(e);
  }
}

export async function deleteCategory(req,res,next){
  try {
    const id=Number(req.params.id);
    if(!Number.isInteger(id)||id<1) return res.status(400).json({message:'Invalid category ID'});
    const category=(await query('SELECT id,name FROM categories WHERE id=?',[id]))[0];
    if(!category) return res.status(404).json({message:'Category not found'});
    const used=(await query('SELECT COUNT(*) AS count FROM events WHERE category_id=?',[id]))[0]?.count||0;
    if(used>0) return res.status(409).json({message:`Cannot delete “${category.name}” because ${used} event(s) use this category. Reassign those events first.`});
    await query('DELETE FROM categories WHERE id=?',[id]);
    return res.json({message:'Category deleted'});
  } catch(e){ next(e); }
}

export async function report(req,res,next){
  try {
    const totals=(await query(`SELECT
      (SELECT COUNT(*) FROM users WHERE role='student') AS students,
      (SELECT COUNT(*) FROM users WHERE role='organizer') AS organizers,
      (SELECT COUNT(*) FROM users WHERE role='admin') AS admins,
      (SELECT COUNT(*) FROM events WHERE deleted_at IS NULL) AS events,
      (SELECT COUNT(*) FROM event_registrations r JOIN events e ON e.id=r.event_id WHERE e.deleted_at IS NULL) AS registrations,
      (SELECT COUNT(*) FROM events WHERE deleted_at IS NULL AND status='approved' AND date(event_date)>=date('now','localtime')) AS upcoming_events,
      (SELECT COUNT(*) FROM events WHERE deleted_at IS NULL AND date(event_date)<date('now','localtime')) AS completed_events`))[0];
    const byEvent=await query(`SELECT e.id event_id,e.name event_name,e.event_date,e.status,
      COUNT(r.id) registrations,
      COALESCE(SUM(CASE WHEN r.status='approved' THEN 1 ELSE 0 END),0) approved,
      COALESCE(SUM(CASE WHEN r.status='pending' THEN 1 ELSE 0 END),0) pending,
      COALESCE(SUM(CASE WHEN a.status='Present' THEN 1 ELSE 0 END),0) present,
      COALESCE(SUM(CASE WHEN a.status='Absent' THEN 1 ELSE 0 END),0) absent
      FROM events e LEFT JOIN event_registrations r ON r.event_id=e.id
      LEFT JOIN attendance a ON a.registration_id=r.id
      WHERE e.deleted_at IS NULL GROUP BY e.id ORDER BY e.event_date DESC,e.name`);
    res.json({summary:totals,events:byEvent});
  } catch(e){ next(e); }
}

export async function markAttendance(req,res,next){try{const {status}=req.body;if(!['Present','Absent'].includes(status))return res.status(400).json({message:'Attendance must be Present or Absent'});const r=(await query('SELECT id FROM event_registrations WHERE id=?',[req.params.id]))[0];if(!r)return res.status(404).json({message:'Registration not found'});await query(`INSERT INTO attendance(registration_id,status,marked_by) VALUES(?,?,?) ON CONFLICT(registration_id) DO UPDATE SET status=excluded.status,marked_by=excluded.marked_by,marked_at=CURRENT_TIMESTAMP`,[r.id,status,req.user.id]);res.json({message:'Attendance updated'});}catch(e){next(e)}}