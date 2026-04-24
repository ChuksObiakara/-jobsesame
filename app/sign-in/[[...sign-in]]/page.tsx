import { SignIn } from '@clerk/nextjs';
export default function Page() {
  return (
    <main style={{minHeight:"100vh",background:"#052A14",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"24px"}}>
      <SignIn forceRedirectUrl="/dashboard" fallbackRedirectUrl="/dashboard" />
    </main>
  );
}
