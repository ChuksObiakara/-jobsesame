'use client';
import { useState } from 'react';
import { JOB_BOARD_ENABLED } from '../lib/flags';

export default function FooterUK() {
  const [isMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 768 : false);
  const year = new Date().getFullYear();

  return (
    <footer style={{ background: '#040F07', borderTop: '1px solid rgba(255,255,255,0.04)', padding: isMobile ? '44px 22px 80px' : '56px 40px 32px' }}>
      <style>{`
        .footer-uk-link:hover { color: rgba(255,255,255,0.55) !important; }
        .footer-uk-social:hover { color: rgba(200,230,0,0.7) !important; }
      `}</style>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : '2fr 1fr 1fr 1fr', gap: isMobile ? '28px 20px' : 40, marginBottom: 44 }}>
          <div style={{ gridColumn: isMobile ? '1 / -1' : 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: 15, fontWeight: 800 }}><span style={{ color: '#fff' }}>job</span><span style={{ color: '#C8E600' }}>sesame</span></span>
              <span style={{ fontSize: 10, background: 'rgba(200,230,0,0.1)', color: '#C8E600', border: '1px solid rgba(200,230,0,0.2)', borderRadius: 4, padding: '2px 7px', fontWeight: 700 }}>🇬🇧 UK</span>
            </div>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.15)', lineHeight: 1.75, maxWidth: 200, marginBottom: 10 }}>AI-powered job applications. Built for the UK market.</p>
            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 10 }}>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.18)', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 4, padding: '2px 7px', fontWeight: 600 }}>GDPR</span>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.18)', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 4, padding: '2px 7px', fontWeight: 600 }}>SSL Secured</span>
            </div>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.1)', marginBottom: 4 }}>GDPR compliant · United Kingdom</p>
            <a href="mailto:uk@jobsesame.co.za" className="footer-uk-link" style={{ fontSize: 11, color: 'rgba(255,255,255,0.15)', textDecoration: 'none', transition: 'color 0.15s' }}>uk@jobsesame.co.za</a>
          </div>
          {[
            { h: 'Product', links: [['UK Jobs', '/uk/jobs'], ['Pricing', '/uk#pricing'], ['Dashboard', '/uk/dashboard'], ['CV Optimiser', '/optimise']].filter(([, h]) => JOB_BOARD_ENABLED || h !== '/uk/jobs') },
            { h: 'Company', links: [['About', '/about'], ['Blog', '/blog'], ['Recruiters', '/recruiters'], ['Contact', 'mailto:uk@jobsesame.co.za']].filter(([, h]) => JOB_BOARD_ENABLED || h !== '/recruiters') },
            { h: 'Legal',   links: [['Privacy Policy', '/privacy'], ['Terms', '/terms'], ['Refund Policy', '/refund'], ['Delete Data', '/delete-data']] },
          ].map(col => (
            <div key={col.h}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 14 }}>{col.h}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {col.links.map(([l, h]) => (
                  <a key={l} href={h} className="footer-uk-link" style={{ fontSize: 13, color: 'rgba(255,255,255,0.2)', textDecoration: 'none', transition: 'color 0.15s' }}>{l}</a>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: 18, display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.1)' }}>© {year} Jobsesame. All rights reserved. GDPR compliant.</span>
          <div style={{ display: 'flex', gap: 18 }}>
            <a href="https://twitter.com/jobsesame" target="_blank" rel="noopener noreferrer" className="footer-uk-social" style={{ fontSize: 11, color: 'rgba(255,255,255,0.12)', textDecoration: 'none', transition: 'color 0.15s' }}>Twitter / X</a>
            <a href="https://linkedin.com/company/jobsesame" target="_blank" rel="noopener noreferrer" className="footer-uk-social" style={{ fontSize: 11, color: 'rgba(255,255,255,0.12)', textDecoration: 'none', transition: 'color 0.15s' }}>LinkedIn</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
