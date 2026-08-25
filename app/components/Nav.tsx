'use client';
import { useEffect, useState } from 'react';
import { useAuth, UserButton } from '@clerk/nextjs';
import { usePathname } from 'next/navigation';
import { JOB_BOARD_ENABLED } from '../lib/flags';
import { INK, INK_SOFT, INK_FAINT, LINE, PAPER, ACCENT, SERIF } from '../lib/theme';

interface Props {
  home?: boolean;
  theme?: 'light' | 'dark';
}

const DIVIDE_DARK = '1px solid rgba(255,255,255,0.05)';
const BG_DARK = '#061A0C';

const LIGHT = {
  ink: INK,
  inkSoft: INK_SOFT,
  inkFaint: INK_FAINT,
  line: LINE,
  paper: PAPER,
  paperTint: 'rgba(250,248,243,0.92)',
  accent: ACCENT,
  serif: SERIF,
};

export default function Nav({ home, theme = 'dark' }: Props) {
  const { isSignedIn } = useAuth();
  const pathname = usePathname();
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
    // Dark theme only reacts to scroll on the home page (navBg/border below are
    // both static off-home); light theme reacts everywhere (paper -> paperTint).
    if (theme === 'dark' && !home) return;
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, [theme, home]);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMenuOpen(false);
  };

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/');

  if (theme === 'light') {
    const navItems = home
      ? [
          { label: 'How it works', id: 'how' },
          { label: 'Features', id: 'features' },
          { label: 'Pricing', id: 'pricing' },
          { label: 'FAQ', id: 'faq' },
        ]
      : null;

    const pageLinks = [
      ...(JOB_BOARD_ENABLED ? [['Find Jobs', '/jobs']] : []),
      ['CV Optimiser', '/optimise'],
      ['Blog', '/blog'],
      ...(JOB_BOARD_ENABLED ? [['Recruiters', '/recruiters']] : []),
    ];

    return (
      <>
        <nav style={{
          position: 'sticky', top: 0, zIndex: 200,
          background: scrolled ? LIGHT.paperTint : LIGHT.paper,
          backdropFilter: scrolled ? 'blur(10px)' : 'none',
          borderBottom: `1px solid ${LIGHT.line}`,
          transition: 'background 0.2s',
        }}>
          <div style={{ maxWidth: 1120, margin: '0 auto', padding: '0 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 72 }}>
            <a href="/" style={{ textDecoration: 'none', fontFamily: LIGHT.serif, fontSize: 19, fontWeight: 500, color: LIGHT.ink, letterSpacing: '-0.01em' }}>jobsesame</a>

            {!isMobile && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 36 }}>
                {navItems
                  ? navItems.map(item => (
                    <button key={item.id} onClick={() => scrollTo(item.id)} style={{ background: 'transparent', border: 'none', fontSize: 14, color: LIGHT.inkSoft, cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}>
                      {item.label}
                    </button>
                  ))
                  : pageLinks.map(([label, href]) => (
                    <a key={href} href={href} style={{ fontSize: 14, color: isActive(href) ? LIGHT.ink : LIGHT.inkSoft, fontWeight: isActive(href) ? 600 : 400, textDecoration: 'none' }}>{label}</a>
                  ))
                }
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              {!isMobile && !isSignedIn && <a href="/sign-in" style={{ fontSize: 14, color: LIGHT.inkSoft, textDecoration: 'none' }}>Sign in</a>}
              {!isMobile && isSignedIn && <a href="/dashboard" style={{ fontSize: 14, color: LIGHT.ink, fontWeight: 600, textDecoration: 'none' }}>Dashboard</a>}
              {isSignedIn
                ? <UserButton />
                : <a href="/sign-up" style={{ background: LIGHT.accent, color: LIGHT.paper, fontSize: 13.5, fontWeight: 600, padding: '11px 22px', borderRadius: 3, textDecoration: 'none', whiteSpace: 'nowrap' }}>Get started</a>
              }
              {isMobile && (
                <button onClick={() => setMenuOpen(!menuOpen)} style={{ background: 'transparent', border: 'none', color: LIGHT.ink, fontSize: 20, cursor: 'pointer', padding: 4, lineHeight: 1 }}>
                  {menuOpen ? '✕' : '☰'}
                </button>
              )}
            </div>
          </div>
        </nav>

        {isMobile && menuOpen && (
          <div style={{ position: 'fixed', inset: '72px 0 0 0', zIndex: 199, background: LIGHT.paper, padding: '24px 22px 32px', display: 'flex', flexDirection: 'column', gap: 18, overflowY: 'auto' }}>
            {(navItems
              ? navItems.map(item => ({ label: item.label, onClick: () => scrollTo(item.id) }))
              : pageLinks.map(([label, href]) => ({ label, href }))
            ).map((item, i) => 'href' in item ? (
              <a key={i} href={item.href as string} onClick={() => setMenuOpen(false)} style={{ fontSize: 16, color: LIGHT.ink, fontWeight: 500, textDecoration: 'none' }}>{item.label}</a>
            ) : (
              <button key={i} onClick={item.onClick} style={{ background: 'transparent', border: 'none', textAlign: 'left', padding: 0, fontSize: 16, color: LIGHT.ink, fontWeight: 500, cursor: 'pointer' }}>{item.label}</button>
            ))}
            <div style={{ height: 1, background: LIGHT.line, margin: '4px 0' }} />
            {isSignedIn
              ? <a href="/dashboard" onClick={() => setMenuOpen(false)} style={{ fontSize: 16, color: LIGHT.accent, fontWeight: 600, textDecoration: 'none' }}>Dashboard →</a>
              : <>
                <a href="/sign-in" onClick={() => setMenuOpen(false)} style={{ fontSize: 15, color: LIGHT.inkSoft, textDecoration: 'none' }}>Sign in</a>
                <a href="/sign-up" onClick={() => setMenuOpen(false)} style={{ background: LIGHT.accent, color: LIGHT.paper, fontSize: 15, fontWeight: 600, padding: '14px 24px', borderRadius: 3, textDecoration: 'none', textAlign: 'center' }}>Get started — free</a>
              </>
            }
          </div>
        )}
      </>
    );
  }

  const linkStyle = (href: string): React.CSSProperties => ({
    fontSize: 13,
    color: isActive(href) ? '#C8E600' : home ? 'rgba(255,255,255,0.52)' : '#A8D8B0',
    fontWeight: isActive(href) ? 700 : 500,
    padding: '8px 14px',
    textDecoration: 'none',
    borderRadius: 6,
    transition: 'color 0.15s',
  });

  const navBg = home
    ? scrolled ? 'rgba(4,12,6,0.92)' : 'transparent'
    : '#052A14';

  return (
    <>
      <style>{`
        .nav-sa-link { transition: color 0.15s, background 0.15s !important; }
        .nav-sa-link:hover { color: #FFFFFF !important; background: rgba(255,255,255,0.04) !important; }
        .nav-sa-btn:hover { color: #FFFFFF !important; }
      `}</style>
      <nav style={{
        position: 'sticky', top: 0, zIndex: 200, height: 64,
        padding: '0 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: navBg,
        backdropFilter: (home && scrolled) ? 'blur(20px)' : 'none',
        WebkitBackdropFilter: (home && scrolled) ? 'blur(20px)' : 'none',
        borderBottom: home ? (scrolled ? DIVIDE_DARK : 'none') : '1px solid #0D4A20',
        transition: 'all 0.3s', gap: 12,
      }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', flexShrink: 0 }}>
          <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: -0.5 }}>
            <span style={{ color: '#fff' }}>job</span><span style={{ color: '#C8E600' }}>sesame</span>
          </span>
        </a>

        {/* Desktop nav links */}
        <div style={{ display: isMobile ? 'none' : 'flex', gap: 2, alignItems: 'center' }}>
          {home ? (
            <>
              {[
                { label: 'How it works', id: 'how-it-works' },
                { label: 'Features', id: 'features' },
                { label: 'Pricing', id: 'pricing' },
                { label: 'FAQ', id: 'faq' },
              ].map(item => (
                <button key={item.id} onClick={() => scrollTo(item.id)} className="nav-sa-btn" style={{ background: 'transparent', border: 'none', fontSize: 13, color: 'rgba(255,255,255,0.52)', fontWeight: 500, padding: '8px 14px', borderRadius: 6, cursor: 'pointer' }}>
                  {item.label}
                </button>
              ))}
              {JOB_BOARD_ENABLED && <a href="/recruiters" className="nav-sa-link" style={linkStyle('/recruiters')}>Recruiters</a>}
              <a href="/blog" className="nav-sa-link" style={linkStyle('/blog')}>Blog</a>
            </>
          ) : (
            <>
              {JOB_BOARD_ENABLED && <a href="/jobs" className="nav-sa-link" style={linkStyle('/jobs')}>Find Jobs</a>}
              <a href="/optimise" className="nav-sa-link" style={linkStyle('/optimise')}>CV Optimiser</a>
              <a href="/blog" className="nav-sa-link" style={linkStyle('/blog')}>Blog</a>
              {JOB_BOARD_ENABLED && <a href="/recruiters" className="nav-sa-link" style={linkStyle('/recruiters')}>Recruiters</a>}
            </>
          )}
        </div>

        {/* Right controls */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {!isMobile && !isSignedIn && (
            <a href="/sign-in" style={{ fontSize: 13, color: 'rgba(255,255,255,0.48)', fontWeight: 500, textDecoration: 'none', padding: '8px 12px' }}>Sign in</a>
          )}
          {!isMobile && isSignedIn && (
            <a href="/dashboard" style={{ fontSize: 13, color: '#C8E600', fontWeight: 700, textDecoration: 'none', padding: '8px 16px', background: 'rgba(200,230,0,0.08)', borderRadius: 8, border: '1px solid rgba(200,230,0,0.22)' }}>Dashboard</a>
          )}
          {isSignedIn
            ? <UserButton />
            : <a href="/sign-up" style={{ background: '#C8E600', color: BG_DARK, fontSize: 13, fontWeight: 800, padding: '9px 22px', borderRadius: 8, textDecoration: 'none', whiteSpace: 'nowrap' }}>Get started free</a>
          }
          {isMobile && (
            <button onClick={() => setMenuOpen(!menuOpen)} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.7)', fontSize: 22, cursor: 'pointer', padding: 4, lineHeight: 1 }}>
              {menuOpen ? '✕' : '☰'}
            </button>
          )}
        </div>
      </nav>

      {/* Mobile menu */}
      {isMobile && menuOpen && (
        <div style={{ position: 'fixed', top: 64, left: 0, right: 0, background: 'rgba(4,12,6,0.98)', backdropFilter: 'blur(20px)', zIndex: 199, borderTop: DIVIDE_DARK, padding: '24px 24px 32px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {home ? (
            <>
              {[
                { label: 'How it works', id: 'how-it-works' },
                { label: 'Features', id: 'features' },
                { label: 'Pricing', id: 'pricing' },
                { label: 'FAQ', id: 'faq' },
              ].map(item => (
                <button key={item.id} onClick={() => scrollTo(item.id)} style={{ background: 'transparent', border: 'none', fontSize: 16, color: 'rgba(255,255,255,0.72)', fontWeight: 600, textAlign: 'left', cursor: 'pointer', padding: '4px 0' }}>
                  {item.label}
                </button>
              ))}
              {JOB_BOARD_ENABLED && <a href="/recruiters" onClick={() => setMenuOpen(false)} style={{ fontSize: 16, color: 'rgba(255,255,255,0.72)', fontWeight: 600, textDecoration: 'none' }}>Recruiters</a>}
              <a href="/blog" onClick={() => setMenuOpen(false)} style={{ fontSize: 16, color: 'rgba(255,255,255,0.72)', fontWeight: 600, textDecoration: 'none' }}>Blog</a>
            </>
          ) : (
            <>
              {JOB_BOARD_ENABLED && <a href="/jobs" onClick={() => setMenuOpen(false)} style={{ fontSize: 16, color: 'rgba(255,255,255,0.72)', fontWeight: 600, textDecoration: 'none' }}>Find Jobs</a>}
              <a href="/optimise" onClick={() => setMenuOpen(false)} style={{ fontSize: 16, color: 'rgba(255,255,255,0.72)', fontWeight: 600, textDecoration: 'none' }}>CV Optimiser</a>
              <a href="/blog" onClick={() => setMenuOpen(false)} style={{ fontSize: 16, color: 'rgba(255,255,255,0.72)', fontWeight: 600, textDecoration: 'none' }}>Blog</a>
              {JOB_BOARD_ENABLED && <a href="/recruiters" onClick={() => setMenuOpen(false)} style={{ fontSize: 16, color: 'rgba(255,255,255,0.72)', fontWeight: 600, textDecoration: 'none' }}>Recruiters</a>}
            </>
          )}
          <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />
          {isSignedIn
            ? <a href="/dashboard" onClick={() => setMenuOpen(false)} style={{ fontSize: 16, color: '#C8E600', fontWeight: 700, textDecoration: 'none' }}>Dashboard →</a>
            : <>
              <a href="/sign-in" onClick={() => setMenuOpen(false)} style={{ fontSize: 15, color: 'rgba(255,255,255,0.45)', fontWeight: 500, textDecoration: 'none' }}>Sign in</a>
              <a href="/sign-up" onClick={() => setMenuOpen(false)} style={{ background: '#C8E600', color: BG_DARK, fontSize: 15, fontWeight: 800, padding: '14px 24px', borderRadius: 8, textDecoration: 'none', textAlign: 'center' }}>Get started — free</a>
            </>
          }
        </div>
      )}
    </>
  );
}
