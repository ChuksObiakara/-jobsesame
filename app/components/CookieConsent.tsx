'use client';
import { useEffect, useState } from 'react';
import { INK, INK_SOFT, LINE, PAPER, CARD, ACCENT } from '../lib/theme';

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem('jobsesame_cookie_consent')) setVisible(true);
    const mq = window.matchMedia('(max-width: 640px)');
    setMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  function accept(value: 'accepted' | 'necessary') {
    localStorage.setItem('jobsesame_cookie_consent', value);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9999,
      background: CARD, borderTop: `1.5px solid ${LINE}`,
      boxShadow: '0 -4px 24px rgba(28,26,22,0.06)',
      padding: mobile ? '20px 20px 28px' : '20px 32px',
      display: 'flex', flexDirection: mobile ? 'column' : 'row',
      alignItems: mobile ? 'stretch' : 'center',
      gap: mobile ? 14 : 24,
    }}>
      <p style={{
        margin: 0, flex: 1, fontSize: 13, color: INK_SOFT, lineHeight: 1.65,
      }}>
        We use cookies to improve your experience, analyse site traffic and personalise content.
        By continuing to use Jobsesame you accept our use of cookies.{' '}
        <a href="/privacy" style={{ color: ACCENT, textDecoration: 'underline' }}>Learn more</a>
      </p>
      <div style={{
        display: 'flex', flexDirection: mobile ? 'column' : 'row',
        gap: 10, flexShrink: 0,
      }}>
        <button onClick={() => accept('accepted')} style={{
          background: ACCENT, color: PAPER, fontWeight: 700,
          fontSize: 13, border: 'none', borderRadius: 3, padding: '11px 22px',
          cursor: 'pointer', whiteSpace: 'nowrap',
        }}>
          Accept all cookies
        </button>
        <button onClick={() => accept('necessary')} style={{
          background: 'transparent', color: INK, fontWeight: 600,
          fontSize: 13, border: `1.5px solid ${LINE}`, borderRadius: 3,
          padding: '11px 22px', cursor: 'pointer', whiteSpace: 'nowrap',
        }}>
          Necessary only
        </button>
      </div>
    </div>
  );
}
