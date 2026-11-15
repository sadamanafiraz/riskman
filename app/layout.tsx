import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
export const metadata:Metadata={title:'Riskman — Akademi & Dashboard Pengajar',description:'Simulasi manajemen risiko program air bersih.'};
export default function Layout({children}:{children:React.ReactNode}){return <ClerkProvider><html lang="id"><body style={{margin:0}}>{children}</body></html></ClerkProvider>}
