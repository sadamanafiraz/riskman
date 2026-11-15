import assert from 'node:assert/strict';import {perfect} from './scoring.test.mjs';
const base=process.env.RISKMAN_TEST_URL||'http://127.0.0.1:4173';
async function call(user,path,method='GET',body,status=200){const r=await fetch(base+'/api/'+path,{method,headers:{'Content-Type':'application/json',...(user?{'oai-authenticated-user-id':user,'oai-authenticated-user-email':user+'@example.test'}:{})},body:body?JSON.stringify(body):undefined});const text=await r.text();let d;try{d=JSON.parse(text)}catch{throw Error(path+': '+text.slice(0,300))}assert.equal(r.status,status,path+': '+text.slice(0,300));return d}
await call(null,'classes','GET',undefined,401);
const token=Date.now(),teacher='qa-teacher-'+token,student='qa-student-'+token,intruder='qa-other-'+token;
for(const mode of ['specialist','assurer']){
 const c=await call(teacher,'classes','POST',{title:'QA '+mode+' '+token,mode,groups:[{name:'Kabupaten Uji Satu'},{name:'Kota Uji Dua'}]},201);
 assert.equal(c.code.length,8);await call(intruder,'classes/'+c.id,'GET',undefined,403);await call(teacher+'-other','classes/'+c.id,'GET',undefined,404);
 const lookup=await call(student,'lookup','POST',{code:c.code});assert.equal(lookup.groups.length,2);assert.equal(lookup.groups[0].assignments.length,4);const gid=lookup.groups[0].assignments[0].id;
 await call(student,'join','POST',{code:c.code,groupId:gid});await call(intruder,'join','POST',{code:c.code,groupId:gid},409);
 await call(student,'join','POST',{code:c.code,groupId:lookup.groups[1].assignments[0].id},409);
 await call(intruder,'groups/'+gid,'GET',undefined,403);
 const boot=await call(student,'groups/'+gid);assert.equal(boot.bank.Kunci_Risiko[0][3],null);
 await call(student,'groups/'+gid+'/submit','POST',{revision:0,state:{}},400);
 const state=perfect(mode,'BAPPEDA');if(mode==='specialist')state.answers['BAPPEDA-R01'].k=1;else state.reviews['BAPPEDA-R01-A1'].diagnosis=0;
 const draft=await call(student,'groups/'+gid+'/save','POST',{revision:0,state});assert.equal(draft.revision,1);assert.equal(draft.state.locked,true);
 await call(student,'groups/'+gid+'/save','POST',{revision:0,state},409);
 const locked=structuredClone(state);locked.selected=[];locked.locked=false;
 const draft2=await call(student,'groups/'+gid+'/save','POST',{revision:1,state:locked});assert.equal(draft2.state.selected.length,10);assert.equal(draft2.state.locked,true);
 const final=await call(student,'groups/'+gid+'/submit','POST',{revision:2,state,mri:5});assert.ok(final.result.mri<5);assert.equal(final.result.errors.length,1);
 const dashboard=await call(teacher,'classes/'+c.id);assert.equal(dashboard.groups[0].result,null);assert.equal(dashboard.groups[0].completed,1);assert.equal(dashboard.groups[0].assignments[0].result.mri,final.result.mri);
 for(const a of lookup.groups[0].assignments.slice(1)){const u=student+a.opd;await call(u,'join','POST',{code:c.code,groupId:a.id});const b=await call(u,'groups/'+a.id);assert.equal(b.state.start,boot.state.start);await call(u,'groups/'+a.id+'/submit','POST',{revision:0,state:perfect(mode,a.opd)});}
 const complete=await call(teacher,'classes/'+c.id);const county=complete.groups[0];assert.equal(county.completed,4);assert.equal(county.result.mri,Math.round((final.result.score+300)/4/20*100)/100);assert.equal(county.result.errors.length,1);assert.equal(county.result.errors[0].opd,'BAPPEDA');assert.equal((await call(student,'groups/'+gid)).team.mri,county.result.mri);assert.equal((await call(teacher,'classes')).classes.find(x=>x.id===c.id).completed,1);
 await call(student,'groups/'+gid+'/save','POST',{revision:3,state},409);
 await call(teacher,'classes/'+c.id+'/status','POST',{status:'closed'});await call(intruder,'join','POST',{code:c.code,groupId:lookup.groups[1].assignments[0].id},409);
 console.log('PASS',mode,'create, join, claim lock, private owner access, save/reload, immutable identification, concurrent revision, submit MRI and errors, close class');
}
