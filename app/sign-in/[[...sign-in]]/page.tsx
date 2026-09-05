import { SignIn } from '@clerk/nextjs';
import { PAPER, INK, SERIF } from '../../lib/theme';

export default function Page() {
  return (
    <main style={{minHeight:"100vh",background:PAPER,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"24px"}}>
      <div style={{marginBottom:"24px",textAlign:"center"}}>
        <span style={{fontFamily:SERIF,fontSize:"22px",fontWeight:500,color:INK}}>
          jobsesame
        </span>
      </div>
      <SignIn forceRedirectUrl="/dashboard" fallbackRedirectUrl="/dashboard" />
    </main>
  );
}
