import { database } from '../database';
import { guestForClass, newGuest } from './guest';
import bank from './bank.json';
import { emptyState, cleanState, completeness, assess, playerBank } from './scoring.mjs';
export type Identity={id:string;name:string;isTeacher:boolean};
const json=(v:any,status=200)=>Response.json(v,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
const fail=(message:string,status=400)=>{throw Object.assign(new Error(message),{status})};
const id=()=>crypto.randomUUID();const now=()=>new Date().toISOString();
const db=database;
async function one(sql:string,...args:any[]){return db().prepare(sql).bind(...args).first<any>()}
async function many(sql:string,...args:any[]){return (await db().prepare(sql).bind(...args).all<any>()).results}
const exec=(sql:string,...args:any[])=>db().prepare(sql).bind(...args).run();
function safeText(v:any,min=1,max=100){if(typeof v!=='string'||v.trim().length<min||v.trim().length>max)fail('Isian nama tidak valid.');return v.trim()}
async function own(classId:string,user:string){const c=await one('SELECT * FROM risk_classes WHERE id=? AND owner=?',classId,user);if(!c)fail('Kelas tidak ditemukan atau bukan milik akun ini.',404);return c}
async function member(groupId:string,user:string){const g=await one('SELECT g.*,c.mode,c.status AS class_status,c.duration,c.title AS class_title,c.code,c.owner,c.demo FROM risk_groups g JOIN risk_classes c ON c.id=g.class_id JOIN risk_memberships m ON m.group_id=g.id WHERE g.id=? AND m.user_id=?',groupId,user);if(!g)fail('Kelompok tidak ditemukan atau Anda belum bergabung.',403);return g}
const groupState=(g:any)=>({...emptyState(),...JSON.parse(g.payload||'{}'),start:g.started_at?Date.parse(g.started_at):null,submitted:!!g.submitted_at,demo:!!g.demo});
const boot=async(g:any)=>({...await team(g),group:{id:g.id,name:g.name,opd:g.opd,mode:g.mode,classId:g.class_id,classTitle:g.class_title,code:g.code,status:g.class_status,duration:g.duration},state:groupState(g),revision:g.revision,result:g.result?JSON.parse(g.result):null,bank:playerBank(bank,g.opd,g.mode==='assurer'||!!JSON.parse(g.payload||'{}').locked,!!g.submitted_at)});

function rollup(gs:any[]){const map=new Map<string,any>();for(const g of gs){const key=g.county_id||g.id;if(!map.has(key))map.set(key,{id:key,name:g.name,legacy:!g.county_id,assignments:[]});map.get(key).assignments.push(g)}return [...map.values()].map(t=>{const a=t.assignments,done=a.filter((g:any)=>g.submitted_at),complete=done.length===(t.legacy?1:4);const score=complete?done.reduce((v:number,g:any)=>v+g.result.score,0)/done.length:null;const mri=score===null?null:Math.round(score/20*100)/100;return {...t,opd:t.legacy?a[0].opd:'4 OPD',progress:Math.round(a.reduce((v:number,g:any)=>v+g.progress,0)/a.length),started_at:a.find((g:any)=>g.started_at)?.started_at,submitted_at:complete?done.map((g:any)=>g.submitted_at).sort().at(-1):null,completed:done.length,result:complete?{score,mri,label:mri!>4?'Risk Champion':mri!>3?'Risk Agent':mri!>2?'Risk Practitioner':mri!>1?'Risk Student':'Risk Explorer',errors:a.flatMap((g:any)=>g.result.errors.map((e:any)=>({...e,opd:g.opd})))}:null}})}
async function team(g:any){if(!g.county_id)return {team:null};const rows=await many('SELECT id,county_id,name,opd,progress,started_at,submitted_at,result FROM risk_groups WHERE county_id=? ORDER BY position',g.county_id);const t=rollup(rows.map(x=>({...x,result:x.result?JSON.parse(x.result):null})))[0];return {team:{name:t.name,completed:t.completed,mri:t.result?.mri??null,label:t.result?.label,assignments:rows.map(x=>({opd:x.opd,progress:x.progress,submitted:!!x.submitted_at}))}}}

export async function handle(req:Request,identity:Identity|null){try{
 const url=new URL(req.url),path=url.pathname.replace(/^\/api\//,'').split('/'),method=req.method;
 if(!['GET','POST','PATCH'].includes(method))return json({error:'Metode tidak didukung'},405);
 if(method!=='GET'){const origin=req.headers.get('origin');if(req.headers.get('sec-fetch-site')==='cross-site'||(origin&&origin!==url.origin))fail('Asal permintaan tidak valid.',403);if(!req.headers.get('content-type')?.includes('application/json'))fail('Gunakan JSON.',415);if(Number(req.headers.get('content-length')||0)>150000)fail('Jawaban terlalu besar.',413)}
 if(path[0]==='me')return json({signedIn:!!identity,name:identity?.name||'Peserta',canTeach:!!identity?.isTeacher,signIn:'/sign-in',signOut:'/sign-out'});
 if(path[0]==='classes'){if(!identity)fail('Silakan login sebagai pengajar.',401);if(!identity!.isTeacher)fail('Akun ini belum terdaftar sebagai pengajar.',403);}
 const user=identity?.id||'';let body:any={};if(method!=='GET'){const raw=await req.text();if(raw.length>150000)fail('Jawaban terlalu besar.',413);try{body=JSON.parse(raw)}catch{fail('Format permintaan tidak valid.')}if(!body||typeof body!=='object'||Array.isArray(body))fail('Format permintaan tidak valid.');}
 if(path[0]==='classes'&&path.length===1){
  if(method==='GET'){const cs=await many('SELECT * FROM risk_classes WHERE owner=? ORDER BY created_at DESC',user);for(const c of cs){const gs=rollup((await many('SELECT * FROM risk_groups WHERE class_id=?',c.id)).map(g=>({...g,result:g.result?JSON.parse(g.result):null})));c.group_count=gs.length;c.completed=gs.filter(g=>g.submitted_at).length}return json({classes:cs})}
  if(method==='POST'){const title=safeText(body.title,3,100),mode=body.mode;if(!['specialist','assurer'].includes(mode))fail('Pilih versi kelas.');const gs=body.groups;if(!Array.isArray(gs)||gs.length<1||gs.length>30)fail('Kelas berisi 1–30 kelompok.');let names=new Set();for(const g of gs){g.name=safeText(g.name,3,80);if(names.has(g.name.toLocaleLowerCase('id')))fail('Nama kabupaten/kota tidak boleh sama dalam satu kelas.');names.add(g.name.toLocaleLowerCase('id'));}const cid=id();let code=Array.from(crypto.getRandomValues(new Uint8Array(8)),v=>'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[v%'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'.length]).join('');const stmts=[db().prepare('INSERT INTO risk_classes (id,owner,title,code,mode,status,duration,created_at,bank_version) VALUES (?,?,?,?,?,?,?,?,?)').bind(cid,user,title,code,mode,'open',120,now(),'riskman-v2-20261110'),...gs.flatMap((g:any,i:number)=>{const county=id();return [db().prepare('INSERT INTO risk_counties (id,class_id,name,position) VALUES (?,?,?,?)').bind(county,cid,g.name,i),...['BAPPEDA','BPKAD','PU','PDAM'].map((opd,j)=>db().prepare('INSERT INTO risk_groups (id,class_id,county_id,name,opd,position,payload) VALUES (?,?,?,?,?,?,?)').bind(id(),cid,county,g.name,opd,i*4+j,JSON.stringify(emptyState())))]})];await db().batch(stmts);return json({id:cid,code},201)}
 }
 if(path[0]==='classes'&&path[1]){const c=await own(path[1],user);if(path[2]==='status'&&method==='POST'){if(!['open','closed'].includes(body.status))fail('Status tidak valid.');await exec('UPDATE risk_classes SET status=? WHERE id=?',body.status,c.id);return json({status:body.status})}
 if(path[2]==='reset-access'&&method==='POST'){const target=await one('SELECT id FROM risk_groups WHERE id=? AND class_id=?',body.groupId,c.id);if(!target)fail('OPD tidak ditemukan dalam kelas ini.',404);await db().batch([db().prepare('UPDATE risk_guest_sessions SET revoked_at=? WHERE group_id=? AND revoked_at IS NULL').bind(now(),target.id),db().prepare('DELETE FROM risk_memberships WHERE group_id=?').bind(target.id),db().prepare('UPDATE risk_groups SET revision=revision+1 WHERE id=?').bind(target.id)]);return json({reset:true,message:'Akses OPD dilepas. Jawaban, hasil, dan waktu tetap tersimpan.'})}
 if(method==='GET'){const groups=await many('SELECT g.*, (SELECT COUNT(*) FROM risk_memberships m WHERE m.group_id=g.id) AS members FROM risk_groups g WHERE g.class_id=? ORDER BY g.position',c.id);return json({class:c,groups:rollup(groups.map(g=>({...g,payload:undefined,result:g.result?JSON.parse(g.result):null})))})}
 }
 if(path[0]==='lookup'&&method==='POST'){
  const code=String(body.code||'').trim().toUpperCase();if(!/^[A-Z2-9]{8}$/.test(code))fail('Kode kelas terdiri dari 8 karakter.');
  const c=await one('SELECT id,title,mode,status,duration FROM risk_classes WHERE code=?',code);if(!c)fail('Kode kelas tidak ditemukan.',404);
  const guest=await guestForClass(req,c.id);
  const gs=await many('SELECT g.id,g.county_id,g.name,g.opd,g.progress,g.started_at,g.submitted_at,(SELECT user_id FROM risk_memberships m WHERE m.group_id=g.id LIMIT 1) AS claimed_by FROM risk_groups g WHERE class_id=? ORDER BY position',c.id);
  const groups=new Map<string,any>();for(const g of gs){const key=g.county_id||g.id;if(!groups.has(key))groups.set(key,{id:key,name:g.name,assignments:[]});groups.get(key).assignments.push({id:g.id,name:g.name,opd:g.opd,progress:g.progress,claimed:!!g.claimed_by,mine:!!guest&&g.claimed_by===guest.id,submitted:!!g.submitted_at});}
  return json({class:c,groups:[...groups.values()]});
 }
 if(path[0]==='join'&&method==='POST'){
  const g=await one('SELECT g.*,c.status,c.mode FROM risk_groups g JOIN risk_classes c ON c.id=g.class_id WHERE g.id=? AND c.code=?',body.groupId,String(body.code||'').trim().toUpperCase());if(!g)fail('Kelompok atau kode kelas tidak valid.',404);
  const prior=await guestForClass(req,g.class_id);if(prior&&prior.group_id!==g.id)fail('Browser ini sudah memegang satu OPD pada kelas ini. Lanjutkan OPD yang telah dipilih.',409);
  if(prior)return json({id:g.id});
  if(g.status!=='open')fail('Kelas sudah ditutup pengajar.',409);
  if(await one('SELECT id FROM risk_memberships WHERE group_id=?',g.id))fail('OPD ini sedang dikerjakan anggota lain. Pilih OPD yang tersedia atau hubungi pengajar untuk reset akses.',409);
  const guest=newGuest(g.class_id,g.id,req);
  await db().batch([
   db().prepare('INSERT INTO risk_guest_sessions (id,class_id,group_id,token_hash,created_at,expires_at) VALUES (?,?,?,?,?,?)').bind(guest.id,g.class_id,g.id,guest.hash,now(),guest.expires),
   db().prepare("INSERT OR IGNORE INTO risk_memberships (id,class_id,group_id,user_id,created_at) SELECT ?,?,?,?,? WHERE NOT EXISTS (SELECT 1 FROM risk_memberships WHERE group_id=?) AND EXISTS (SELECT 1 FROM risk_classes WHERE id=? AND status='open')").bind(id(),g.class_id,g.id,guest.id,now(),g.id,g.class_id)
  ]);
  const claim=await one('SELECT id FROM risk_memberships WHERE group_id=? AND user_id=?',g.id,guest.id);
  if(!claim){await exec('DELETE FROM risk_guest_sessions WHERE id=?',guest.id);fail('OPD sudah dipilih anggota lain atau kelas telah ditutup. Perbarui daftar OPD.',409);}
  if(g.county_id){await exec('UPDATE risk_counties SET started_at=COALESCE(started_at,?) WHERE id=?',now(),g.county_id);await exec('UPDATE risk_groups SET started_at=(SELECT started_at FROM risk_counties WHERE id=?),updated_at=? WHERE county_id=?',g.county_id,now(),g.county_id)}else await exec('UPDATE risk_groups SET started_at=COALESCE(started_at,?),updated_at=? WHERE id=?',now(),now(),g.id);
  const response=json({id:g.id});response.headers.append('Set-Cookie',guest.cookie);return response;
 }
 if(path[0]==='groups'&&path[1]){const assignment=await one('SELECT class_id FROM risk_groups WHERE id=?',path[1]);const guest=assignment?await guestForClass(req,assignment.class_id):null;if(!guest)fail('Sesi peserta tidak tersedia atau aksesnya sudah direset. Masukkan kode kelas kembali; jika OPD masih terkunci, hubungi pengajar.',403);const player=guest!.id;let g=await member(path[1],player);if(method==='GET')return json(await boot(g));
 if((path[2]==='save'||path[2]==='submit')&&method==='POST'){if(g.submitted_at){if(path[2]==='submit')return json(await boot(g));fail('Jawaban sudah dikumpulkan.',409)}if(g.class_status!=='open')fail('Kelas ditutup oleh pengajar.',409);if(body.revision!==g.revision)fail('Jawaban berubah di perangkat lain. Muat ulang sebelum melanjutkan.',409);const old=groupState(g),expired=g.started_at&&Date.now()>Date.parse(g.started_at)+g.duration*60000;
 if(expired&&path[2]==='save')fail('Waktu habis. Kumpulkan jawaban yang sudah tersimpan.',409);
 const s=cleanState(bank,g.mode,g.opd,expired?old:body.state);if(old.locked){s.locked=true;s.selected=old.selected;}const complete=completeness(bank,g.mode,g.opd,s);if(path[2]==='submit'&&!expired&&complete.issues.length)fail(complete.issues.join(' '));const result=path[2]==='submit'?{...assess(bank,g.mode,g.opd,s),timedOut:!!expired}:null;
 const updated=await exec('UPDATE risk_groups SET payload=?,progress=?,revision=revision+1,updated_at=?,submitted_at=?,result=? WHERE id=? AND revision=? AND submitted_at IS NULL AND EXISTS (SELECT 1 FROM risk_memberships WHERE group_id=? AND user_id=?)',JSON.stringify(s),complete.progress,now(),result?now():null,result?JSON.stringify(result):null,g.id,g.revision,g.id,player);if(!updated.meta.changes)fail('Jawaban berubah. Muat ulang sebelum melanjutkan.',409);g=await member(g.id,player);return json(await boot(g));}
 }
 return json({error:'Halaman tidak ditemukan.'},404);
 }catch(e:any){if(!e.status)console.error('Riskman API',e.message);return json({error:e.status?e.message:'Terjadi gangguan penyimpanan. Coba lagi.'},e.status||500)}}

