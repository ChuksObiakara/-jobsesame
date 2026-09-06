'use client';
import { useState } from 'react';
import { JOB_BOARD_ENABLED } from '../lib/flags';
import { INK, INK_SOFT, INK_FAINT, LINE, PAPER, SERIF, SCRIPT } from '../lib/theme';

const DIVIDE = '1px solid rgba(255,255,255,0.05)';

const LIGHT = {
  ink: INK,
  inkSoft: INK_SOFT,
  inkFaint: INK_FAINT,
  line: LINE,
  paper: PAPER,
  serif: SERIF,
};

interface Props {
  theme?: 'light' | 'dark';
}

export default function Footer({ theme = 'dark' }: Props) {
  const [isMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 768 : false);
  const year = new Date().getFullYear();

  const columns = [
    { heading: 'Product', links: [['Find Jobs', '/jobs'], ['CV Optimiser', '/optimise'], ['Dashboard', '/dashboard'], ['Saved Jobs', '/saved-jobs']].filter(([, h]) => JOB_BOARD_ENABLED || (h !== '/jobs' && h !== '/saved-jobs')) },
    { heading: 'Company', links: [['About', '/about'], ['Recruiters', '/recruiters'], ['Blog', '/blog'], ['Contact', '/contact']].filter(([, h]) => JOB_BOARD_ENABLED || h !== '/recruiters') },
    { heading: 'Legal',   links: [['Privacy Policy', '/privacy'], ['Terms of Service', '/terms'], ['Refund Policy', '/refund'], ['Delete My Data', '/delete-data']] },
  ];

  if (theme === 'light') {
    return (
      <footer style={{ background: LIGHT.paper, borderTop: `1px solid ${LIGHT.line}`, padding: isMobile ? '48px 22px 40px' : '64px 40px 36px' }}>
        <style>{`.footer-link-l:hover { color: #1C1A16 !important; }`}</style>
        <div style={{ maxWidth: 1120, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : '2fr 1fr 1fr 1fr', gap: isMobile ? '32px 24px' : 40, marginBottom: 48 }}>
            <div style={{ gridColumn: isMobile ? '1 / -1' : 'auto' }}>
              <div style={{ fontFamily: SCRIPT, fontSize: 28, fontWeight: 400, color: LIGHT.ink, marginBottom: 14 }}>jobsesame</div>
              <p style={{ fontSize: 13, color: LIGHT.inkFaint, lineHeight: 1.8, maxWidth: 240, marginBottom: 14 }}>AI CV rewriting and ATS optimisation for job seekers who refuse to be filtered out.</p>
              <a href="mailto:hello@jobsesame.co" className="footer-link-l" style={{ fontSize: 11, color: LIGHT.inkFaint, textDecoration: 'none' }}>hello@jobsesame.co</a>
            </div>
            {columns.map(col => (
              <div key={col.heading}>
                <div style={{ fontSize: 10, color: LIGHT.inkFaint, fontWeight: 700, letterSpacing: '1.2px', textTransform: 'uppercase', marginBottom: 16 }}>{col.heading}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {col.links.map(([l, h]) => (
                    <a key={l} href={h} className="footer-link-l" style={{ fontSize: 13, color: LIGHT.inkSoft, textDecoration: 'none' }}>{l}</a>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div style={{ borderTop: `1px solid ${LIGHT.line}`, paddingTop: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: LIGHT.inkFaint }}>&copy; {year} Jobsesame Ltd. All rights reserved.</span>
              <div style={{ display: 'flex', gap: 16 }}>
                <a href="https://twitter.com/jobsesame" target="_blank" rel="noopener noreferrer" className="footer-link-l" style={{ fontSize: 11, color: LIGHT.inkFaint, textDecoration: 'none' }}>Twitter / X</a>
                <a href="https://linkedin.com/company/jobsesame" target="_blank" rel="noopener noreferrer" className="footer-link-l" style={{ fontSize: 11, color: LIGHT.inkFaint, textDecoration: 'none' }}>LinkedIn</a>
                <a href="https://instagram.com/jobsesame" target="_blank" rel="noopener noreferrer" className="footer-link-l" style={{ fontSize: 11, color: LIGHT.inkFaint, textDecoration: 'none' }}>Instagram</a>
              </div>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
              <span style={{ fontSize: 11, color: LIGHT.inkFaint }}>Registered with the South African Information Regulator under POPIA</span>
              <a href="/unsubscribe" className="footer-link-l" style={{ fontSize: 11, color: LIGHT.inkFaint, textDecoration: 'none' }}>Unsubscribe from emails</a>
            </div>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer style={{ background: '#040F07', borderTop: DIVIDE, padding: isMobile ? '48px 22px 96px' : '64px 40px 36px' }}>
      <style>{`
        .footer-link:hover { color: rgba(255,255,255,0.55) !important; }
        .footer-social:hover { color: rgba(200,230,0,0.7) !important; }
      `}</style>
      <div style={{ maxWidth: 1240, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : '2fr 1fr 1fr 1fr', gap: isMobile ? '32px 24px' : 40, marginBottom: 48 }}>
          <div style={{ gridColumn: isMobile ? '1 / -1' : 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{ width: 28, height: 28, background: '#C8E600', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="15" height="15" viewBox="0 0 22 22" fill="none"><circle cx="9" cy="9" r="5.5" stroke="#061A0C" strokeWidth="2.2" /><circle cx="9" cy="9" r="2.5" fill="#061A0C" opacity="0.4" /><line x1="13.5" y1="13.5" x2="20" y2="20" stroke="#061A0C" strokeWidth="2.8" strokeLinecap="round" /></svg>
              </div>
              <span style={{ fontFamily: SCRIPT, fontSize: 26, fontWeight: 400 }}><span style={{ color: '#fff' }}>job</span><span style={{ color: '#C8E600' }}>sesame</span></span>
            </div>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.16)', lineHeight: 1.8, maxWidth: 220, marginBottom: 10 }}>AI-powered job applications for professionals who refuse to be ignored.</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.18)', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 4, padding: '2px 7px', fontWeight: 600 }}>POPIA</span>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.18)', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 4, padding: '2px 7px', fontWeight: 600 }}>SSL Secured</span>
            </div>
            <a href="mailto:hello@jobsesame.co" className="footer-link" style={{ fontSize: 11, color: 'rgba(255,255,255,0.15)', textDecoration: 'none', transition: 'color 0.15s' }}>hello@jobsesame.co</a>
          </div>
          {columns.map(col => (
            <div key={col.heading}>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.22)', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 16 }}>{col.heading}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {col.links.map(([l, h]) => (
                  <a key={l} href={h} className="footer-link" style={{ fontSize: 13, color: 'rgba(255,255,255,0.24)', textDecoration: 'none', transition: 'color 0.15s' }}>{l}</a>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div style={{ borderTop: DIVIDE, paddingTop: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.12)' }}>© {year} Jobsesame Ltd. All rights reserved.</span>
            <div style={{ display: 'flex', gap: 16 }}>
              <a href="https://twitter.com/jobsesame" target="_blank" rel="noopener noreferrer" className="footer-social" style={{ fontSize: 11, color: 'rgba(255,255,255,0.15)', textDecoration: 'none', transition: 'color 0.15s' }}>Twitter / X</a>
              <a href="https://linkedin.com/company/jobsesame" target="_blank" rel="noopener noreferrer" className="footer-social" style={{ fontSize: 11, color: 'rgba(255,255,255,0.15)', textDecoration: 'none', transition: 'color 0.15s' }}>LinkedIn</a>
              <a href="https://instagram.com/jobsesame" target="_blank" rel="noopener noreferrer" className="footer-social" style={{ fontSize: 11, color: 'rgba(255,255,255,0.15)', textDecoration: 'none', transition: 'color 0.15s' }}>Instagram</a>
            </div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.1)' }}>Registered with the South African Information Regulator under POPIA</span>
            <a href="/unsubscribe" className="footer-link" style={{ fontSize: 11, color: 'rgba(255,255,255,0.15)', textDecoration: 'none', transition: 'color 0.15s' }}>Unsubscribe from emails</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
