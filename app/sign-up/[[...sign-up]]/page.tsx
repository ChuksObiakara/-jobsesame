'use client';
import { useEffect } from 'react';
import { SignUp } from '@clerk/nextjs';
import { captureClient } from '../../lib/posthog-client';
import { ANALYTICS_EVENTS } from '../../lib/analytics-events';
import { PAPER, INK, SERIF } from '../../lib/theme';

export default function Page() {
  // Single chokepoint: every "Get started" / "Start free" CTA lands here, so
  // one event covers all entry points regardless of which button was clicked.
  useEffect(() => {
    captureClient(ANALYTICS_EVENTS.SIGNUP_STARTED);
  }, []);

  return (
    <main style={{minHeight:"100vh",background:PAPER,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"24px"}}>
      <div style={{marginBottom:"24px",textAlign:"center"}}>
        <span style={{fontFamily:SERIF,fontSize:"22px",fontWeight:500,color:INK}}>
          jobsesame
        </span>
      </div>
      <SignUp forceRedirectUrl="/onboarding" fallbackRedirectUrl="/onboarding" />
    </main>
  );
}
