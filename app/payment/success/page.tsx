'use client';
import { Suspense } from 'react';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

function PaymentContent() {
  const searchParams = useSearchParams();
  const reference = searchParams.get('reference');
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    if (reference) {
      setStatus('success');
    } else {
      setStatus('failed');
    }
  }, [reference]);

  return (
    <div style={{background:"#072E16",border:"1.5px solid #C8E600",borderRadius:16,padding:40,maxWidth:480,width:"100%",textAlign:"center"}}>
      {status === 'loading' && (
        <div>
          <div style={{fontSize:40,marginBottom:16}}>⏳</div>
          <h1 style={{fontSize:22,fontWeight:800,color:"#FFFFFF",marginBottom:8}}>Verifying payment...</h1>
          <p style={{fontSize:14,color:"#5A9A6A"}}>Please wait a moment.</p>
        </div>
      )}
      {status === 'success' && (
        <div>
          <div style={{fontSize:48,marginBottom:16}}>🎉</div>
          <h1 style={{fontSize:24,fontWeight:800,color:"#FFFFFF",marginBottom:8}}>Payment successful!</h1>
          <p style={{fontSize:15,color:"#C8E600",fontWeight:700,marginBottom:8}}>Welcome to Jobsesame Pro</p>
          <p style={{fontSize:14,color:"#5A9A6A",marginBottom:24,lineHeight:1.7}}>
            All doors are now open. Unlimited CV rewrites, auto-apply, cover letters — everything is unlocked.
          </p>
          <div style={{background:"#0D3A1A",borderRadius:10,padding:14,marginBottom:24,fontSize:12,color:"#3A7A4A"}}>
            Reference: {reference}
          </div>
          <a href="/dashboard" style={{background:"#C8E600",color:"#052A14",fontSize:14,fontWeight:800,padding:"13px 32px",borderRadius:99,textDecoration:"none",display:"inline-block"}}>
            Go to my dashboard
          </a>
        </div>
      )}
      {status === 'failed' && (
        <div>
          <div style={{fontSize:48,marginBottom:16}}>❌</div>
          <h1 style={{fontSize:22,fontWeight:800,color:"#FFFFFF",marginBottom:8}}>Payment not found</h1>
          <p style={{fontSize:14,color:"#5A9A6A",marginBottom:24}}>Something went wrong. Please try again.</p>
          <a href="/dashboard" style={{background:"#C8E600",color:"#052A14",fontSize:14,fontWeight:800,padding:"13px 32px",borderRadius:99,textDecoration:"none",display:"inline-block"}}>
            Back to dashboard
          </a>
        </div>
      )}
    </div>
  );
}

export default function PaymentSuccess() {
  return (
    <main style={{fontFamily:"'Plus Jakarta Sans',sans-serif",background:"#052A14",minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:"24px"}}>
      <Suspense fallback={<div style={{color:"#C8E600",fontSize:16,fontWeight:700}}>Loading...</div>}>
        <PaymentContent />
      </Suspense>
    </main>
  );
}
