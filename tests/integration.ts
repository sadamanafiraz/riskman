import {mkdtempSync,rmSync} from 'node:fs';import {tmpdir} from 'node:os';import {join} from 'node:path';
import {createClient} from '@libsql/client';
import {migrate} from '../scripts/migrate.mjs';
const dir=mkdtempSync(join(tmpdir(),'riskman-test-'));process.env.TURSO_DATABASE_URL='file:'+join(dir,'test.db');
const db=createClient({url:process.env.TURSO_DATABASE_URL});
try{
 await migrate(db);await migrate(db);
 const {handle}=await import('../lib/riskman/handler');
 const {runApiTests}=await import('./api.test.mjs');
 await runApiTests({handle,db});
}finally{db.close();rmSync(dir,{recursive:true,force:true});}
