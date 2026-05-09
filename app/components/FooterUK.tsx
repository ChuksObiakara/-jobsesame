'use client';
import { useState } from 'react';

export default function FooterUK() {
  const [isMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 768 : false);

  return (
    <footer style={{ background: '#040F07', borderTop: '1px solid rgba(255,255,255,0.04)', padding: isMobile ? '44px 22px 80px' : '56px 40px 32px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : '2fr 1fr 1fr 1fr', gap: isMobile ? '28px 20px' : 40, marginBottom: 44 }}>
          <div style={{ gridColumn: isMobile ? '1 / -1' : 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: 15, fontWeight: 800 }}><span style={{ color: '#fff' }}>job</span><span style={{ color: '#C8E600' }}>sesame</span></span>
              <span style={{ fontSize: 10, background: 'rgba(200,230,0,0.1)', color: '#C8E600', border: '1px solid rgba(200,230,0,0.2)', borderRadius: 4, padding: '2px 7px', fontWeight: 700 }}>🇬🇧 UK</span>
            </div>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.15)', lineHeight: 1.75, maxWidth: 200, marginBottom: 8 }}>AI-powered job applications. Built for the UK market.</p>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.1)', marginBottom: 4 }}>GDPR compliant · United Kingdom</p>
            <a href="mailto:uk@jobsesame.co.za" style={{ fontSize: 11, color: 'rgba(255,255,255,0.15)', textDecoration: 'none' }}>uk@jobsesame.co.za</a>
          </div>
          {[
            { h: 'Product', links: [['UK Jobs', '/uk/jobs'], ['Pricing', '/uk#pricing'], ['Dashboard', '/uk/dashboard'], ['CV Optimiser', '/optimise']] },
            { h: 'Company', links: [['About', '/about'], ['Blog', '/blog'], ['Recruiters', '/recruiters'], ['Contact', 'mailto:uk@jobsesame.co.za']] },
            { h: 'Legal',   links: [['Privacy Policy', '/privacy'], ['Terms', '/terms'], ['Refund Policy', '/refund'], ['Delete Data', '/delete-data']] },
          ].map(col => (
            <div key={col.h}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 14 }}>{col.h}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {col.links.map(([l, h]) => <a key={l} href={h} style={{ fontSize: 13, color: 'rgba(255,255,255,0.2)', textDecoration: 'none', transition: 'color 0.15s' }}>{l}</a>)}
              </div>
            </div>
          ))}
        </div>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: 18, display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.1)' }}>© 2025 Jobsesame. All rights reserved. GDPR compliant.</span>
          <div style={{ display: 'flex', gap: 18 }}>
            {['Twitter', 'LinkedIn'].map(s => <span key={s} style={{ fontSize: 11, color: 'rgba(255,255,255,0.12)', cursor: 'pointer' }}>{s}</span>)}
          </div>
        </div>
      </div>
    </footer>
  );
}
