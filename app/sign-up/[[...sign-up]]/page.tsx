import { SignUp } from '@clerk/nextjs';
export default function Page() {
  return (
    <main style={{minHeight:"100vh",background:"#052A14",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"24px"}}>
      <div style={{marginBottom:"24px",textAlign:"center"}}>
        <span style={{fontSize:"28px",fontWeight:"800",color:"#ffffff",letterSpacing:"-0.5px"}}>
          Job<span style={{color:"#DFFF00"}}>sesame</span>
        </span>
      </div>
      <SignUp forceRedirectUrl="/dashboard" fallbackRedirectUrl="/dashboard" />
    </main>
  );
}
