'use client';
import { useState } from 'react';

const DIVIDE = '1px solid rgba(255,255,255,0.05)';

export default function FooterSA() {
  const [isMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 768 : false);
  const year = new Date().getFullYear();

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
              <span style={{ fontSize: 16, fontWeight: 800 }}><span style={{ color: '#fff' }}>job</span><span style={{ color: '#C8E600' }}>sesame</span></span>
            </div>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.16)', lineHeight: 1.8, maxWidth: 220, marginBottom: 10 }}>AI-powered job applications for professionals who refuse to be ignored.</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.18)', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 4, padding: '2px 7px', fontWeight: 600 }}>POPIA</span>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.18)', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 4, padding: '2px 7px', fontWeight: 600 }}>SSL Secured</span>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.18)', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 4, padding: '2px 7px', fontWeight: 600 }}>ZA Registered</span>
            </div>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.1)', marginBottom: 5 }}>Jobsesame (Pty) Ltd · South Africa</p>
            <a href="mailto:support@jobsesame.co.za" className="footer-link" style={{ fontSize: 11, color: 'rgba(255,255,255,0.15)', textDecoration: 'none', transition: 'color 0.15s' }}>support@jobsesame.co.za</a>
          </div>
          {[
            { heading: 'Product', links: [['Find Jobs', '/jobs'], ['CV Optimiser', '/optimise'], ['UK Market', '/uk'], ['Dashboard', '/dashboard'], ['Saved Jobs', '/saved-jobs']] },
            { heading: 'Company', links: [['About', '/about'], ['Recruiters', '/recruiters'], ['Blog', '/blog'], ['Contact', 'mailto:hello@jobsesame.co.za']] },
            { heading: 'Legal',   links: [['Privacy Policy', '/privacy'], ['Terms of Service', '/terms'], ['Refund Policy', '/refund'], ['Delete My Data', '/delete-data']] },
          ].map(col => (
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
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.12)' }}>© {year} Jobsesame (Pty) Ltd. All rights reserved.</span>
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
