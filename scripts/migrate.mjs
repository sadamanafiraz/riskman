import {createClient} from '@libsql/client';
import {readFileSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
export async function migrate(db){
 await db.execute('CREATE TABLE IF NOT EXISTS riskman_migrations (name TEXT PRIMARY KEY, sha TEXT NOT NULL)');
 for(const name of readdirSync(new URL('../db/migrations/',import.meta.url)).filter(n=>n.endsWith('.sql')).sort()){
  const sql=readFileSync(new URL('../db/migrations/'+name,import.meta.url),'utf8');const sha=createHash('sha256').update(sql).digest('hex');
  const old=await db.execute({sql:'SELECT sha FROM riskman_migrations WHERE name=?',args:[name]});
  if(old.rows.length){if(old.rows[0].sha!==sha)throw Error('Migrasi yang sudah diterapkan telah berubah: '+name);continue;}
  await db.batch([...sql.split('--> statement-breakpoint').map(s=>s.trim()).filter(Boolean),{sql:'INSERT INTO riskman_migrations(name,sha) VALUES(?,?)',args:[name,sha]}],'write');
  console.log('Applied',name);
 }
}
if(process.argv[1]&&import.meta.url===new URL('file://'+process.argv[1]).href){
 if(!process.env.TURSO_DATABASE_URL)throw Error('Isi TURSO_DATABASE_URL pada .env.local terlebih dahulu.');
 const db=createClient({url:process.env.TURSO_DATABASE_URL,authToken:process.env.TURSO_AUTH_TOKEN});
 try{await migrate(db);console.log('Database siap.');}finally{db.close();}
}
