import {createClient, type Client, type InValue} from '@libsql/client';
let client:Client|undefined;
function getClient(){if(!client){if(!process.env.TURSO_DATABASE_URL)throw Error('TURSO_DATABASE_URL belum diisi.');client=createClient({url:process.env.TURSO_DATABASE_URL,authToken:process.env.TURSO_AUTH_TOKEN});}return client;}
class Statement{
 constructor(readonly sql:string,readonly args:InValue[]=[]){ }
 bind(...args:InValue[]){return new Statement(this.sql,args)}
 async first<T>(){const r=await getClient().execute({sql:this.sql,args:this.args});return (r.rows[0]??null) as T|null;}
 async all<T>(){const r=await getClient().execute({sql:this.sql,args:this.args});return {results:r.rows as T[]};}
 async run(){const r=await getClient().execute({sql:this.sql,args:this.args});return {meta:{changes:r.rowsAffected}};}
}
export const database=()=>({prepare:(sql:string)=>new Statement(sql),batch:(statements:Statement[])=>getClient().batch(statements.map(s=>({sql:s.sql,args:s.args})),'write')});
