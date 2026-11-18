import assert from 'node:assert/strict';import {createHash} from 'node:crypto';import {perfect} from './scoring.test.mjs';
export async function runApiTests({handle,db}){
 const jars=new Map(),lastCookies=new Map();
 async function call(client,path,method='GET',body,status=200,headers={}){
  const identity=client==='teacher'||client==='other-teacher'?{id:client,name:client,isTeacher:true}:client==='legacy-participant'?{id:client,name:client,isTeacher:false}:null;
  const req=new Request('https://riskman.test/api/'+path,{method,headers:{'Content-Type':'application/json',...(jars.has(client)?{cookie:[...jars.get(client).values()].join('; ')}:{}),...headers},body:body===undefined?undefined:JSON.stringify(body)});
  const r=await handle(req,identity);const text=await r.text();const data=JSON.parse(text);assert.equal(r.status,status,path+': '+text.slice(0,250));
  const cookie=r.headers.get('set-cookie');if(cookie){const pair=cookie.split(';')[0],key=pair.split('=')[0];if(!jars.has(client))jars.set(client,new Map());jars.get(client).set(key,pair);lastCookies.set(client,cookie);}
  return data;
 }
 assert.equal((await call('anonymous','me')).signedIn,false);
 await call('anonymous','classes','GET',undefined,401,{'oai-authenticated-user-id':'teacher'});
 await call('legacy-participant','classes','GET',undefined,403);
 await call('anonymous','lookup','POST',{code:'wrong'},400);
 for(const mode of ['specialist','assurer']){
  const c=await call('teacher','classes','POST',{title:'Test '+mode,mode,groups:[{name:'Kabupaten Uji'},{name:'Kota Kedua'}]},201);
  await call('other-teacher','classes/'+c.id,'GET',undefined,404);
  const lookup=await call('p1','lookup','POST',{code:c.code});assert.equal(lookup.groups.length,2);assert.equal(lookup.groups[0].assignments.length,4);
  const seats=lookup.groups[0].assignments,gid=seats[0].id,other=lookup.groups[1].assignments[0].id;
  assert.ok(!JSON.stringify(lookup).includes('token_hash'));assert.equal(lookup.groups[0].assignments[0].result,undefined);
  await call('p1','join','POST',{code:c.code,groupId:gid});
  assert.match(lastCookies.get('p1'),/HttpOnly/);assert.match(lastCookies.get('p1'),/SameSite=Lax/);assert.match(lastCookies.get('p1'),/Secure/);
  const cookiePair=jars.get('p1').get('riskman_guest_'+c.id),token=cookiePair.split('=')[1];
  const session=await db.execute({sql:'SELECT * FROM risk_guest_sessions WHERE token_hash=?',args:[createHash('sha256').update(token).digest('hex')]});assert.equal(session.rows.length,1);assert.notEqual(session.rows[0].token_hash,token);
  const before=await call('p1','groups/'+gid);assert.equal(before.bank.Kunci_Risiko[0][3],null);
  assert.equal((await call('p1','lookup','POST',{code:c.code})).groups[0].assignments[0].mine,true);
  await call('p1','join','POST',{code:c.code,groupId:gid});
  await call('p2','join','POST',{code:c.code,groupId:gid},409);
  await call('p1','join','POST',{code:c.code,groupId:seats[1].id},409);
  await call('p1','join','POST',{code:c.code,groupId:other},409);
  await call('p1','groups/'+other,'GET',undefined,403);
  await call('p2','groups/'+gid,'GET',undefined,403);
  await call('p1','classes','GET',undefined,401);
  await call('p2','groups/'+gid,'GET',undefined,403,{cookie:'riskman_guest_'+c.id+'='+'a'.repeat(64)});
  await call('p1','groups/'+gid+'/save','POST',{revision:0,state:{}},403,{origin:'https://evil.test'});
  await call('p1','groups/'+gid+'/submit','POST',{revision:0,state:{}},400);
  const state=perfect(mode,'BAPPEDA');if(mode==='specialist')state.answers['BAPPEDA-R01'].k=1;else state.reviews['BAPPEDA-R01-A1'].diagnosis=0;
  const draft=await call('p1','groups/'+gid+'/save','POST',{revision:0,state});assert.equal(draft.revision,1);
  await call('p1','groups/'+gid+'/save','POST',{revision:0,state},409);
  assert.equal((await call('p1','groups/'+gid)).revision,1);
  const wrongLock=structuredClone(state);wrongLock.selected=[];wrongLock.locked=false;
  const draft2=await call('p1','groups/'+gid+'/save','POST',{revision:1,state:wrongLock});assert.equal(draft2.state.selected.length,10);assert.equal(draft2.state.locked,true);
  // Teacher reset revokes the old browser, preserves saved work and the shared clock.
  await call('other-teacher','classes/'+c.id+'/reset-access','POST',{groupId:gid},404);
  await call('p2','classes/'+c.id+'/reset-access','POST',{groupId:gid},401);
  await call('teacher','classes/'+c.id+'/reset-access','POST',{groupId:gid});
  await call('p1','groups/'+gid,'GET',undefined,403);
  await call('p1','groups/'+gid+'/save','POST',{revision:2,state},403);
  const freed=await call('replacement','lookup','POST',{code:c.code});assert.equal(freed.groups[0].assignments[0].claimed,false);
  await call('replacement','join','POST',{code:c.code,groupId:gid});
  const restored=await call('replacement','groups/'+gid);assert.deepEqual(restored.state,draft2.state);assert.equal(restored.state.start,before.state.start);assert.equal(restored.revision,3);
  const final=await call('replacement','groups/'+gid+'/submit','POST',{revision:3,state,mri:5});assert.ok(final.result.mri<5);assert.equal(final.result.errors.length,1);
  const partial=await call('teacher','classes/'+c.id);assert.equal(partial.groups[0].completed,1);assert.equal(partial.groups[0].result,null);
  for(const a of seats.slice(1)){const client='member-'+a.opd;await call(client,'join','POST',{code:c.code,groupId:a.id});const boot=await call(client,'groups/'+a.id);assert.equal(boot.state.start,before.state.start);await call(client,'groups/'+a.id+'/submit','POST',{revision:0,state:perfect(mode,a.opd)});}
  const complete=await call('teacher','classes/'+c.id),county=complete.groups[0];assert.equal(county.completed,4);assert.equal(county.result.mri,Math.round((final.result.score+300)/4/20*100)/100);assert.equal(county.result.errors.length,1);assert.equal(county.result.errors[0].opd,'BAPPEDA');
  assert.equal((await call('replacement','groups/'+gid)).team.mri,county.result.mri);
  // Reset a submitted OPD preserves the final score and allows read-only recovery.
  await call('teacher','classes/'+c.id+'/reset-access','POST',{groupId:gid});
  await call('restored-final','join','POST',{code:c.code,groupId:gid});const recoveredFinal=await call('restored-final','groups/'+gid);assert.deepEqual(recoveredFinal.result,final.result);assert.equal(recoveredFinal.state.submitted,true);
  await call('restored-final','groups/'+gid+'/save','POST',{revision:recoveredFinal.revision,state},409);
  await call('teacher','classes/'+c.id+'/status','POST',{status:'closed'});
  await call('late','join','POST',{code:c.code,groupId:other},409);
  await call('restored-final','groups/'+gid);await call('restored-final','join','POST',{code:c.code,groupId:gid});
  // Closed class rejects new claims even after teacher releases the seat.
  await call('teacher','classes/'+c.id+'/reset-access','POST',{groupId:other});await call('late','join','POST',{code:c.code,groupId:other},409);
  console.log('PASS',mode,'anonymous code entry, cookies, four members, one OPD/browser/class, reload, reset and recovery, MRI, errors and class closure');
 }
 // Simultaneous claims for one free OPD must produce exactly one owner.
 const race=await call('teacher','classes','POST',{title:'Concurrent claims',mode:'specialist',groups:[{name:'Kota Bersamaan'}]},201);
 const raceSeat=(await call('race','lookup','POST',{code:race.code})).groups[0].assignments[0];
 const attempts=await Promise.all([1,2].map(()=>handle(new Request('https://riskman.test/api/join',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({code:race.code,groupId:raceSeat.id})}),null)));
 assert.deepEqual(attempts.map(r=>r.status).sort(),[200,409]);
 assert.equal((await db.execute({sql:'SELECT COUNT(*) AS total FROM risk_memberships WHERE group_id=?',args:[raceSeat.id]})).rows[0].total,1);
 // An expired guest cannot read or save, but teacher can free its seat.
 const c=await call('teacher','classes','POST',{title:'Expired sessions',mode:'specialist',groups:[{name:'Kabupaten Timer'}]},201);
 const seat=(await call('expiring','lookup','POST',{code:c.code})).groups[0].assignments[0];
 await call('expiring','join','POST',{code:c.code,groupId:seat.id});await db.execute({sql:'UPDATE risk_guest_sessions SET expires_at=? WHERE group_id=?',args:['2000-01-01T00:00:00.000Z',seat.id]});
 await call('expiring','groups/'+seat.id,'GET',undefined,403);
 await call('teacher','classes/'+c.id+'/reset-access','POST',{groupId:seat.id});await call('fresh','join','POST',{code:c.code,groupId:seat.id});
 // Late collection grades only previously stored answers, not a fresh perfect submission.
 await db.execute({sql:'UPDATE risk_groups SET started_at=? WHERE id=?',args:['2000-01-01T00:00:00.000Z',seat.id]});
 await call('fresh','groups/'+seat.id+'/save','POST',{revision:1,state:perfect('specialist','BAPPEDA')},409);
 const timed=await call('fresh','groups/'+seat.id+'/submit','POST',{revision:1,state:perfect('specialist','BAPPEDA')});assert.equal(timed.result.timedOut,true);assert.ok(timed.result.mri<5);
 console.log('PASS migration repeatability, teacher authorization, cookie forgery/expiry, CSRF, revoked browser, submitted result preservation and timer enforcement');
}
