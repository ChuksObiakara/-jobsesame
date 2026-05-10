'use client';
import { useEffect, useState } from 'react';
import { useAuth, UserButton } from '@clerk/nextjs';
import MarketSwitcher from './MarketSwitcher';

interface Props {
  home?: boolean;
  planBadge?: string | null;
}

export default function NavUK({ home, planBadge }: Props) {
  const { isSignedIn } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    if (!home) return;
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, [home]);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMenuOpen(false);
  };

  const navBg = home
    ? scrolled ? 'rgba(6,18,8,0.94)' : 'transparent'
    : 'rgba(6,26,12,0.94)';

  return (
    <>
      <nav style={{
        position: 'sticky', top: 0, zIndex: 200, height: 64,
        padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: navBg,
        backdropFilter: (home && !scrolled) ? 'none' : 'blur(20px)',
        WebkitBackdropFilter: (home && !scrolled) ? 'none' : 'blur(20px)',
        borderBottom: home ? (scrolled ? '1px solid rgba(255,255,255,0.05)' : 'none') : '1px solid rgba(255,255,255,0.06)',
        transition: 'all 0.3s', gap: 12,
      }}>
        <a href="/uk" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', flexShrink: 0 }}>
          <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: -0.5 }}>
            <span style={{ color: '#fff' }}>job</span><span style={{ color: '#C8E600' }}>sesame</span>
          </span>
          <span style={{ fontSize: 10, background: 'rgba(200,230,0,0.12)', color: '#C8E600', border: '1px solid rgba(200,230,0,0.24)', borderRadius: 4, padding: '2px 7px', fontWeight: 700, letterSpacing: 0.3 }}>🇬🇧 UK</span>
        </a>

        {/* Desktop nav links */}
        <div style={{ display: isMobile ? 'none' : 'flex', gap: 2, alignItems: 'center' }}>
          {home ? (
            [['Features', 'features'], ['Jobs', 'jobs'], ['Pricing', 'pricing'], ['FAQ', 'faq']].map(([l, id]) => (
              <button key={id} onClick={() => scrollTo(id)} style={{ background: 'transparent', border: 'none', fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: 500, padding: '8px 12px', borderRadius: 6, cursor: 'pointer', transition: 'color 0.15s' }}>{l}</button>
            ))
          ) : (
            <>
              <a href="/uk/jobs" style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: 500, padding: '8px 12px', textDecoration: 'none', transition: 'color 0.15s' }}>UK Jobs</a>
              <a href="/uk/dashboard" style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: 500, padding: '8px 12px', textDecoration: 'none', transition: 'color 0.15s' }}>Dashboard</a>
              <a href="/uk/subscribe" style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: 500, padding: '8px 12px', textDecoration: 'none', transition: 'color 0.15s' }}>Subscribe</a>
            </>
          )}
        </div>

        {/* Right controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 12, flexShrink: 0 }}>
          {planBadge && (
            <div style={{ background: 'rgba(200,230,0,0.1)', border: '1px solid rgba(200,230,0,0.25)', borderRadius: 99, padding: '5px 12px', fontSize: 12, fontWeight: 700, color: '#C8E600', flexShrink: 0 }}>
              {planBadge}
            </div>
          )}
          <MarketSwitcher compact={isMobile} />
          {!isMobile && !isSignedIn && (
            <a href="/sign-in" style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', fontWeight: 500, textDecoration: 'none', padding: '8px 10px', transition: 'color 0.15s' }}>Sign in</a>
          )}
          {!isMobile && isSignedIn && home && (
            <a href="/uk/dashboard" style={{ fontSize: 13, color: '#C8E600', fontWeight: 700, textDecoration: 'none', padding: '8px 14px', background: 'rgba(200,230,0,0.08)', borderRadius: 8, border: '1px solid rgba(200,230,0,0.22)' }}>Dashboard</a>
          )}
          {isSignedIn
            ? <UserButton />
            : <a href="/sign-up" style={{ background: '#C8E600', color: '#061A0C', fontSize: 13, fontWeight: 800, padding: '9px 20px', borderRadius: 8, textDecoration: 'none', whiteSpace: 'nowrap' }}>Get started free</a>
          }
          {isMobile && (
            <button onClick={() => setMenuOpen(!menuOpen)} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.7)', fontSize: 20, cursor: 'pointer', padding: 4, lineHeight: 1 }}>
              {menuOpen ? '✕' : '☰'}
            </button>
          )}
        </div>
      </nav>

      {/* Mobile menu */}
      {isMobile && menuOpen && (
        <div style={{ position: 'fixed', top: 64, left: 0, right: 0, background: 'rgba(6,18,8,0.99)', backdropFilter: 'blur(20px)', zIndex: 199, borderTop: '1px solid rgba(255,255,255,0.05)', padding: '24px 24px 32px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {home ? (
            [['Features', 'features'], ['Jobs', 'jobs'], ['Pricing', 'pricing'], ['FAQ', 'faq']].map(([l, id]) => (
              <button key={id} onClick={() => scrollTo(id)} style={{ background: 'transparent', border: 'none', fontSize: 16, color: 'rgba(255,255,255,0.7)', fontWeight: 600, textAlign: 'left', cursor: 'pointer', padding: '4px 0' }}>{l}</button>
            ))
          ) : (
            <>
              <a href="/uk/jobs" onClick={() => setMenuOpen(false)} style={{ fontSize: 16, color: 'rgba(255,255,255,0.7)', fontWeight: 600, textDecoration: 'none' }}>UK Jobs</a>
              <a href="/uk/dashboard" onClick={() => setMenuOpen(false)} style={{ fontSize: 16, color: 'rgba(255,255,255,0.7)', fontWeight: 600, textDecoration: 'none' }}>Dashboard</a>
              <a href="/uk/subscribe" onClick={() => setMenuOpen(false)} style={{ fontSize: 16, color: 'rgba(255,255,255,0.7)', fontWeight: 600, textDecoration: 'none' }}>Subscribe</a>
            </>
          )}
          <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />
          {isSignedIn
            ? <a href="/uk/dashboard" onClick={() => setMenuOpen(false)} style={{ fontSize: 16, color: '#C8E600', fontWeight: 700, textDecoration: 'none' }}>Dashboard →</a>
            : <a href="/sign-up" onClick={() => setMenuOpen(false)} style={{ background: '#C8E600', color: '#061A0C', fontSize: 15, fontWeight: 800, padding: '14px 24px', borderRadius: 8, textDecoration: 'none', textAlign: 'center' }}>Get started free</a>
          }
        </div>
      )}
    </>
  );
}
