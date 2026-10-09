import { z } from 'zod';
import { actor,db,owned,now,uid,token,hash,requireThat,HttpError,auditStmt,candidateView,candidateAccess,safeQuestions,finish,log } from '@/lib/server';
import { CAPS,LANGS,RUBRIC,chooseQuestions,csvCell } from '@/lib/assessment';
export const dynamic='force-dynamic';
const language=z.enum(['en','ms','zh']);
const rulesSchema=z.object({proficient:z.number().int().min(1).max(99),strong:z.number().int().min(2).max(100),core:z.array(z.number().int().min(0).max(5)).max(6),minutes:z.number().int().min(5).max(90),version:z.number().int()}).refine(v=>v.strong>v.proficient,'Strong threshold must exceed proficient.');
const questionSchema=z.object({id:z.string().min(1).max(40),cap:z.number().int().min(0).max(5),enabled:z.boolean(),prompt:z.object({en:z.string().min(5).max(2000),ms:z.string().min(5).max(2000),zh:z.string().min(5).max(2000)}),options:z.object({en:z.array(z.string().min(1).max(500)).length(4),ms:z.array(z.string().min(1).max(500)).length(4),zh:z.array(z.string().min(1).max(500)).length(4)}),points:z.array(z.number().int().min(0).max(100)).length(4),explanation:z.string().min(1).max(2000)});
async function body(req:Request){requireThat((req.headers.get('content-type')??'').includes('application/json'),415,'JSON body required.');const raw=await req.text();requireThat(raw.length<150000,413,'Request is too large.');try{return JSON.parse(raw)}catch{throw new HttpError(400,'Invalid JSON')}}
function response(data:any,status=200,headers:Record<string,string>={}){return Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...headers}})}
async function handle(req:Request,{params}: {params:Promise<{path:string[]}>}){try{
 const {path}=await params;const method=req.method;
 if(method!=='GET'){requireThat(req.headers.get('origin')===new URL(req.url).origin,403,'Request origin is not allowed.');}
 if(path[0]==='assessment'){
  const raw=path[1];let c:any=await candidateAccess(raw,req,true);
  if(method==='GET'){
   if(c.status==='In progress'&&Date.now()>Date.parse(c.started)+JSON.parse(c.snapshot).rules.minutes*60000)c=await finish(c);
   const snap=JSON.parse(c.snapshot);return response({name:c.name,status:c.status,language:c.language,questions:safeQuestions(snap.questions),minutes:snap.rules.minutes,started:c.started,answers:JSON.parse(c.answers),conversation:c.conversation,revision:c.revision,retentionDays:180});
  }
  const data=await body(req);
  if(path[2]==='start'){
   const input=z.object({language,consent:z.literal(true)}).parse(data);requireThat(c.status==='Invited'&&!c.session_hash,409,'This assessment has already started.');const session=token();const result=await db().prepare("UPDATE candidates SET session_hash=?,status='In progress',language=?,started=?,consent=? WHERE id=? AND session_hash IS NULL AND status='Invited'").bind(await hash(session),input.language,now(),now(),c.id).run();requireThat(result.meta.changes===1,409,'This assessment was started elsewhere.');await log(c.workspace,'candidate','assessment.started',c.id,{consentVersion:1,language:input.language});return response({ok:true},200,{'Set-Cookie':`ff_${c.id}=${session}; HttpOnly; SameSite=Strict; Path=/api/assessment/${raw}; Max-Age=604800${new URL(req.url).protocol==='https:'?'; Secure':''}`});
  }
  c=await candidateAccess(raw,req);
  requireThat(c.status==='In progress',409,'Assessment is already submitted.');
  if(path[2]==='event'){await db().prepare('UPDATE candidates SET switches=switches+1 WHERE id=?').bind(c.id).run();return response({ok:true})}
  const snap=JSON.parse(c.snapshot);
  if(path[2]==='save'||path[2]==='submit'){
   if(Date.now()>Date.parse(c.started)+snap.rules.minutes*60000){await finish(c);return response({ok:true,status:'Completed',timedOut:true})}
   const input=z.object({answers:z.record(z.number().int().min(0).max(3)),conversation:z.string().max(6000),revision:z.number().int().min(0)}).parse(data);
   requireThat(Object.keys(input.answers).every(id=>snap.questions.some((q:any)=>q.id===id)),400,'Unknown assessment item.');
   if(path[2]==='submit')requireThat(snap.questions.every((q:any)=>input.answers[q.id]!==undefined)&&input.conversation.trim().length>=20,400,'Complete every question and write at least 20 characters for the conversation.');
   const saved=await db().prepare("UPDATE candidates SET answers=?,conversation=?,revision=revision+1 WHERE id=? AND revision=? AND status='In progress'").bind(JSON.stringify(input.answers),input.conversation,c.id,input.revision).run();requireThat(saved.meta.changes===1,409,'A newer answer was saved in another tab. Reload before continuing.');
   if(path[2]==='submit'){c=await db().prepare('SELECT * FROM candidates WHERE id=?').bind(c.id).first();await finish(c)}return response({ok:true,revision:input.revision+1,status:path[2]==='submit'?'Completed':'In progress'});
  }
  throw new HttpError(404,'Unknown assessment action.');
 }
 const a=await actor();const workspace=a.workspace.id;const user=a.user.email;
 if(path[0]==='workspace'&&method==='GET'){
  const records=await db().prepare("SELECT * FROM candidates WHERE workspace=? AND created>? ORDER BY created DESC").bind(workspace,new Date(Date.now()-180*86400000).toISOString()).all();
  const audit=await db().prepare('SELECT * FROM audit WHERE workspace=? ORDER BY created DESC LIMIT 80').bind(workspace).all();
  const members=await db().prepare('SELECT id,email,role FROM members WHERE workspace=?').bind(workspace).all();
  return response({candidates:records.results.map(candidateView),settings:a.settings,audit:audit.results,members:members.results,user:{name:a.user.displayName,email:user,role:a.role}});
 }
 if(path[0]==='candidates'&&method==='POST'&&path.length===1){
  const input=z.object({name:z.string().trim().min(2).max(120),email:z.string().email().max(200),language,kind:z.enum(['candidate','employee']),performance:z.enum(['high','typical']).nullable().optional()}).parse(await body(req));
  const id=uid(),raw=token();const snapshot={rules:a.settings.rules,questions:chooseQuestions(a.settings.questions)};requireThat(snapshot.questions.length===12,400,'Enable at least two questions per capability first.');
  await db().batch([db().prepare('INSERT INTO candidates(id,workspace,name,email,kind,performance,token_hash,status,language,created,expires,snapshot,answers,conversation,outcomes) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').bind(id,workspace,input.name,input.email,input.kind,input.kind==='employee'?input.performance??'typical':null,await hash(raw),'Invited',input.language,now(),new Date(Date.now()+7*86400000).toISOString(),JSON.stringify(snapshot),'{}','','[]'),auditStmt(workspace,user,'candidate.invited',id,{kind:input.kind})]);return response({id,path:'/assess/'+raw});
 }
 if(path[0]==='candidates'&&path[1]){
  const c=await owned(path[1],a);
  if(path[2]==='decision'&&method==='POST'){
   requireThat(c.status==='Completed',400,'Complete the assessment before recording a decision.');const input=z.object({decision:z.enum(['Interview','Hold','Hire','Do not proceed']),reason:z.string().trim().min(10).max(4000)}).parse(await body(req));const decision={...input,by:user,at:now()};await db().batch([db().prepare('UPDATE candidates SET decision=? WHERE id=?').bind(JSON.stringify(decision),c.id),auditStmt(workspace,user,'decision.recorded',c.id,decision)]);return response({ok:true});
  }
  if(path[2]==='review'&&method==='POST'){
   requireThat(c.status==='Completed',400,'Assessment is not complete.');const input=z.object({ratings:z.array(z.number().int().min(0).max(4)).length(4),notes:z.string().trim().min(10).max(4000)}).parse(await body(req));const review={...input,score:Math.round(input.ratings.reduce((x,y)=>x+y,0)/16*100),by:user,at:now(),method:'human-rubric',rubric:RUBRIC};await db().batch([db().prepare('UPDATE candidates SET review=? WHERE id=?').bind(JSON.stringify(review),c.id),auditStmt(workspace,user,'conversation.reviewed',c.id,review)]);return response({ok:true});
  }
  if(path[2]==='outcome'&&method==='POST'){
   requireThat(c.decision&&JSON.parse(c.decision).decision==='Hire',400,'Record a Hire decision before a follow-up.');const input=z.object({month:z.union([z.literal(3),z.literal(6)]),retained:z.boolean(),salesKpi:z.number().min(0).max(1000),notes:z.string().max(2000)}).parse(await body(req));const outcomes=JSON.parse(c.outcomes).filter((o:any)=>o.month!==input.month);outcomes.push({...input,at:now(),by:user});await db().batch([db().prepare('UPDATE candidates SET outcomes=? WHERE id=?').bind(JSON.stringify(outcomes),c.id),auditStmt(workspace,user,'outcome.recorded',c.id,input)]);return response({ok:true});
  }
  if(path[2]==='reissue'&&method==='POST'){
   requireThat(c.status!=='Completed',400,'Completed assessments cannot be reopened.');const raw=token();await db().batch([db().prepare("UPDATE candidates SET token_hash=?,session_hash=NULL,status='Invited',started=NULL,consent=NULL,answers='{}',conversation='',revision=0,switches=0,expires=? WHERE id=?").bind(await hash(raw),new Date(Date.now()+7*86400000).toISOString(),c.id),auditStmt(workspace,user,'invitation.reissued',c.id,{clearedAttempt:true})]);return response({path:'/assess/'+raw});
  }
 }
 if(path[0]==='export'&&method==='POST'){
  const records=await db().prepare('SELECT * FROM candidates WHERE workspace=? AND created>? ORDER BY created DESC').bind(workspace,new Date(Date.now()-180*86400000).toISOString()).all();const lines=[['Name','Email','Type','Language','Status',...CAPS,'Conversation review','Decision','Reason'].map(csvCell).join(',')];for(const row of records.results){const c=candidateView(row);lines.push([c.name,c.email,c.kind,LANGS[c.language as keyof typeof LANGS],c.status,...(c.scores.length?c.scores:Array(6).fill('')),c.review?.score??'Pending',c.decision?.decision??'',c.decision?.reason??''].map(csvCell).join(','))}await log(workspace,user,'candidates.exported',null,{count:records.results.length});return new Response('\uFEFF'+lines.join('\r\n'),{headers:{'Content-Type':'text/csv; charset=utf-8','Content-Disposition':'attachment; filename="fieldfit-candidates.csv"','Cache-Control':'no-store'}});
 }
 requireThat(a.role==='admin',403,'Only HR administrators can change this setting.');
 if(path[0]==='settings'&&method==='POST'){
  const input=z.object({rules:rulesSchema,questions:z.array(questionSchema).min(12).max(120)}).parse(await body(req));requireThat(new Set(input.questions.map(q=>q.id)).size===input.questions.length,400,'Question IDs must be unique.');requireThat(CAPS.every((_,cap)=>input.questions.filter(q=>q.enabled&&q.cap===cap).length>=2),400,'Keep at least two active questions in every capability.');input.rules.version=a.settings.rules.version+1;await db().batch([db().prepare('UPDATE workspaces SET settings=? WHERE id=?').bind(JSON.stringify(input),workspace),auditStmt(workspace,user,'assessment.settings.updated',null,{version:input.rules.version,settings:input})]);return response({ok:true});
 }
 if(path[0]==='members'&&method==='POST'){
  const input=z.object({email:z.string().email().max(200),role:z.enum(['manager','admin'])}).parse(await body(req));const email=input.email.toLowerCase();const existing:any=await db().prepare('SELECT * FROM members WHERE email=?').bind(email).first();requireThat(!existing||existing.workspace===workspace,409,'This person already belongs to a workspace.');await db().batch([db().prepare('INSERT OR REPLACE INTO members(id,workspace,email,role) VALUES(?,?,?,?)').bind(existing?.id??uid(),workspace,email,input.role),auditStmt(workspace,user,'member.role.updated',null,{email,role:input.role})]);return response({ok:true});
 }
 if(path[0]==='purge'&&method==='POST'){const cutoff=new Date(Date.now()-180*86400000).toISOString();const result=await db().batch([db().prepare('DELETE FROM candidates WHERE workspace=? AND created<?').bind(workspace,cutoff),db().prepare('DELETE FROM audit WHERE workspace=? AND created<?').bind(workspace,cutoff),auditStmt(workspace,user,'retention.purged',null,{cutoff})]);return response({ok:true,count:result[0].meta.changes});}
 throw new HttpError(404,'Action not found.');
}catch(e){if(e instanceof z.ZodError)return response({error:e.issues.map(i=>i.message).join(' ')},400);if(e instanceof HttpError)return response({error:e.message},e.status);console.error('FieldFit request failed',e);return response({error:'Your data could not be loaded or saved. Please retry.'},503)}}
export const GET=handle;export const POST=handle;
