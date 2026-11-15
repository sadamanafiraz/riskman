// Identity injection exists only in this test harness. Production uses verified Clerk sessions.
import {mkdtempSync,rmSync} from 'node:fs';import {tmpdir} from 'node:os';import {join} from 'node:path';
import {createClient} from '@libsql/client';import assert from 'node:assert/strict';
import {migrate} from '../scripts/migrate.mjs';
const dir=mkdtempSync(join(tmpdir(),'riskman-test-'));process.env.TURSO_DATABASE_URL='file:'+join(dir,'test.db');
const db=createClient({url:process.env.TURSO_DATABASE_URL});
try{
 await migrate(db);await migrate(db);
 const {handle}=await import('../lib/riskman/handler');const original=globalThis.fetch;
 const unauth=await handle(new Request('http://localhost/api/classes',{headers:{'oai-authenticated-user-id':'fake-teacher'}}),null);assert.equal(unauth.status,401);
 const forbidden=await handle(new Request('http://localhost/api/classes'),{id:'participant',name:'Participant',isTeacher:false});assert.equal(forbidden.status,403);
 globalThis.fetch=async(input,init)=>{
  const req=new Request(input,init);const id=req.headers.get('oai-authenticated-user-id');
  return handle(req,id?{id,name:id,isTeacher:id.startsWith('qa-teacher-')}:null);
 };
 try{await import('./api.test.mjs');}finally{globalThis.fetch=original;}
 console.log('PASS migrations are repeatable; forged header rejected; teacher role enforced');
}finally{db.close();rmSync(dir,{recursive:true,force:true});}
