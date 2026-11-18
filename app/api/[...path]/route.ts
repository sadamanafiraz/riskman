import { auth, currentUser } from '@clerk/nextjs/server';
import { handle, type Identity } from '../../../lib/riskman/handler';
export const runtime='nodejs';
export const dynamic='force-dynamic';
async function route(req:Request){
 const path=new URL(req.url).pathname;
 if(path!=='/api/me'&&!path.startsWith('/api/classes'))return handle(req,null);
 try {
  const session=await auth();let identity:Identity|null=null;
  if(session.userId){const user=await currentUser();const email=user?.emailAddresses.find(e=>e.id===user.primaryEmailAddressId&&e.verification?.status==='verified')?.emailAddress.toLowerCase();
   const teachers=(process.env.TEACHER_EMAILS||'').split(',').map(s=>s.trim().toLowerCase()).filter(Boolean);
   identity={id:session.userId,name:user?.fullName||email||'Peserta',isTeacher:!!email&&teachers.includes(email)};
  }
  return handle(req,identity);
 }catch{if(path==='/api/me')return Response.json({signedIn:false,canTeach:false,loginUnavailable:true},{headers:{'Cache-Control':'no-store'}}); return Response.json({error:'Layanan login belum siap. Periksa konfigurasi Clerk.'},{status:503}); }
}
export const GET=route;export const POST=route;export const PATCH=route;
