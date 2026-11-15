import { SignIn } from '@clerk/nextjs';
export const dynamic='force-dynamic';
export default function Page(){return <main style={{minHeight:'100vh',display:'grid',placeItems:'center',background:'#eff0de'}}><SignIn /></main>}
