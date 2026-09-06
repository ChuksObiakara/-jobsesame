'use client';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { INK, INK_SOFT, INK_FAINT, PAPER, CARD, ACCENT, LINE, SANS } from '../../lib/theme';

function PaymentContent() {
  const searchParams = useSearchParams();
  const reference = searchParams.get('order_id') || searchParams.get('checkout_id');
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');

  useEffect(() => {
    let cancelled = false;
    let attempts = 0;

    // Lemon Squeezy confirms the subscription via webhook, which can land a
    // few seconds after this redirect — poll briefly instead of a single check.
    const check = () => {
      attempts += 1;
      fetch('/api/payment/verify', { method: 'POST' })
        .then(r => r.json())
        .then(d => {
          if (cancelled) return;
          if (d.success) {
            setStatus('success');
          } else if (attempts >= 10) {
            setStatus('failed');
          } else {
            setTimeout(check, 1500);
          }
        })
        .catch(() => {
          if (!cancelled && attempts < 10) setTimeout(check, 1500);
          else if (!cancelled) setStatus('failed');
        });
    };

    check();
    return () => { cancelled = true; };
  }, []);

  return (
    <div style={{background:CARD,border:`1.5px solid ${ACCENT}`,borderRadius:8,padding:40,maxWidth:480,width:"100%",textAlign:"center"}}>
      {status === 'loading' && (
        <div>
          <div style={{fontSize:40,marginBottom:16}}>⏳</div>
          <h1 style={{fontSize:22,fontWeight:700,color:INK,marginBottom:8}}>Verifying payment...</h1>
          <p style={{fontSize:14,color:INK_SOFT}}>Please wait a moment.</p>
        </div>
      )}
      {status === 'success' && (
        <div>
          <div style={{fontSize:48,marginBottom:16}}>🎉</div>
          <h1 style={{fontSize:24,fontWeight:700,color:INK,marginBottom:8}}>Payment successful!</h1>
          <p style={{fontSize:15,color:ACCENT,fontWeight:700,marginBottom:8}}>
            Welcome to Jobsesame Pro
          </p>
          <p style={{fontSize:14,color:INK_SOFT,marginBottom:24,lineHeight:1.7}}>
            Unlimited AI CV rewrites, matching cover letters, and priority processing — everything is unlocked. Cancel anytime from your account page.
          </p>
          <div style={{background:PAPER,border:`1px solid ${LINE}`,borderRadius:6,padding:14,marginBottom:24,fontSize:12,color:INK_FAINT}}>
            Reference: {reference}
          </div>
          <a href="/dashboard" style={{background:ACCENT,color:PAPER,fontSize:14,fontWeight:700,padding:"13px 32px",borderRadius:3,textDecoration:"none",display:"inline-block"}}>
            Go to my dashboard
          </a>
        </div>
      )}
      {status === 'failed' && (
        <div>
          <div style={{fontSize:48,marginBottom:16}}>❌</div>
          <h1 style={{fontSize:22,fontWeight:700,color:INK,marginBottom:8}}>Payment not confirmed</h1>
          <p style={{fontSize:14,color:INK_SOFT,marginBottom:8}}>We could not verify your payment. If you were charged, please contact support with your reference.</p>
          {reference && (
            <div style={{background:PAPER,border:`1px solid ${LINE}`,borderRadius:6,padding:14,marginBottom:16,fontSize:12,color:INK_FAINT}}>
              Reference: {reference}
            </div>
          )}
          <a href="/dashboard" style={{background:ACCENT,color:PAPER,fontSize:14,fontWeight:700,padding:"13px 32px",borderRadius:3,textDecoration:"none",display:"inline-block"}}>
            Back to dashboard
          </a>
        </div>
      )}
    </div>
  );
}

export default function PaymentSuccess() {
  return (
    <main style={{fontFamily:SANS,background:PAPER,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:"24px"}}>
      <Suspense fallback={<div style={{color:ACCENT,fontSize:16,fontWeight:700}}>Loading...</div>}>
        <PaymentContent />
      </Suspense>
    </main>
  );
}
