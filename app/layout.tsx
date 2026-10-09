import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {title:'FieldFit | Evidence-led hiring',description:'A consistent, trilingual assessment for front-line sales teams.',icons:{icon:'/favicon.svg'}};
export default function RootLayout({children}: Readonly<{children:React.ReactNode}>) {return <html lang="en"><body>{children}</body></html>}
