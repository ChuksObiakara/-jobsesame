import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <main style={{
      minHeight: '100vh',
      background: '#052A14',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{marginBottom: 32, textAlign: 'center'}}>
        <div style={{fontSize: 28, fontWeight: 800, marginBottom: 8}}>
          <span style={{color: '#FFFFFF'}}>job</span>
          <span style={{color: '#C8E600'}}>sesame</span>
        </div>
        <p style={{color: '#90C898', fontSize: 14, fontStyle: 'italic'}}>
          &ldquo;Welcome back — your future is waiting.&rdquo;
        </p>
      </div>
      <SignIn
        appearance={{
          elements: {
            rootBox: {width: '100%', maxWidth: 480},
            card: {background: '#fff', borderRadius: 16, padding: 32},
            headerTitle: {color: '#052A14', fontWeight: 800},
            headerSubtitle: {color: '#555'},
            formButtonPrimary: {
              background: '#C8E600',
              color: '#052A14',
              fontWeight: 800,
              borderRadius: 99,
            },
          },
        }}
      />
    </main>
  );
}