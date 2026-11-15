"use client";
import { useClerk } from '@clerk/nextjs';
export default function Page(){const {signOut}=useClerk();return <main style={{padding:48,fontFamily:'sans-serif'}}><h1>Keluar dari Riskman?</h1><button onClick={()=>signOut({redirectUrl:'/'})}>Ya, keluar akun</button><p><a href="/">Kembali ke akademi</a></p></main>}
