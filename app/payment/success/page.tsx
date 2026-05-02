'use client';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

function PaymentContent() {
  const searchParams = useSearchParams();
  const reference = searchParams.get('reference');
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');
  const [plan, setPlan] = useState<string | null>(null);

  useEffect(() => {
    if (!reference) { setStatus('failed'); return; }
    fetch('/api/payment/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reference }),
    })
      .then(r => r.json())
      .then(d => {
        if (d.success) { setPlan(d.plan); setStatus('success'); }
        else setStatus('failed');
      })
      .catch(() => setStatus('failed'));
  }, [reference]);

  const isPro = plan === 'pro';

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
          <p style={{fontSize:15,color:"#C8E600",fontWeight:700,marginBottom:8}}>
            {isPro ? 'Welcome to Jobsesame Pro' : '10 credits added to your account'}
          </p>
          <p style={{fontSize:14,color:"#5A9A6A",marginBottom:24,lineHeight:1.7}}>
            {isPro
              ? 'All doors are now open. Unlimited CV rewrites, auto-apply, cover letters — everything is unlocked for 30 days.'
              : 'Your 10 CV rewrite credits are ready to use. Head to your dashboard to start applying.'}
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
          <h1 style={{fontSize:22,fontWeight:800,color:"#FFFFFF",marginBottom:8}}>Payment not confirmed</h1>
          <p style={{fontSize:14,color:"#5A9A6A",marginBottom:8}}>We could not verify your payment. If you were charged, please contact support with your reference.</p>
          {reference && (
            <div style={{background:"#0D3A1A",borderRadius:10,padding:14,marginBottom:16,fontSize:12,color:"#3A7A4A"}}>
              Reference: {reference}
            </div>
          )}
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
