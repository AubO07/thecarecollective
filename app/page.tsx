// app/page.tsx  — minimal Tilda test page
'use client';

import TildeIcon from '@/assets/tilde-bold.svg';   // path may need '../' if @ alias isn't set

const BoldTilde = ({ className = '' }) => (
  <TildeIcon className={`inline h-6 w-6 fill-current ${className}`} />
);

export default function Home() {
  return (
    <main style={{minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',background:'#000',color:'#fff'}}>
      <h1 style={{fontSize:'3rem',fontWeight:600}}>
        Ride the <BoldTilde style={{height:'2rem',width:'2rem'}} />
      </h1>
      <p style={{opacity:.8,maxWidth:480,textAlign:'center',marginTop:16}}>
        If you can see a bold tilde above, the SVG import works.
      </p>
    </main>
  );
}
