'use client';

export default function JobsError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <main style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", background: '#F4FCF4', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <nav style={{ background: '#052A14', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 20px rgba(0,0,0,0.3)' }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 11, textDecoration: 'none' }}>
          <div style={{ width: 38, height: 38, background: '#C8E600', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <circle cx="9" cy="9" r="5.5" stroke="#052A14" strokeWidth="2.2" />
              <line x1="13.5" y1="13.5" x2="20" y2="20" stroke="#052A14" strokeWidth="2.8" strokeLinecap="round" />
            </svg>
          </div>
          <span style={{ fontSize: 20, fontWeight: 800 }}>
            <span style={{ color: '#FFFFFF' }}>job</span>
            <span style={{ color: '#C8E600' }}>sesame</span>
          </span>
        </a>
      </nav>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#052A14', marginBottom: 10 }}>Something went wrong loading jobs</h1>
        <p style={{ fontSize: 14, color: '#4A8A5A', marginBottom: 24, maxWidth: 420, lineHeight: 1.7 }}>
          We hit an unexpected error. Your CV data and saved jobs are safe. Try refreshing the page.
        </p>
        {process.env.NODE_ENV === 'development' && (
          <pre style={{ fontSize: 11, background: '#fff', border: '1px solid #D8EED8', borderRadius: 10, padding: '12px 16px', maxWidth: 560, overflow: 'auto', color: '#A32D2D', marginBottom: 20, textAlign: 'left' }}>
            {error?.message}
          </pre>
        )}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            onClick={reset}
            style={{ background: '#C8E600', color: '#052A14', fontSize: 14, fontWeight: 800, padding: '12px 28px', borderRadius: 99, border: 'none', cursor: 'pointer' }}
          >
            Try again
          </button>
          <a href="/" style={{ background: 'transparent', color: '#4A8A5A', fontSize: 14, fontWeight: 600, padding: '12px 28px', borderRadius: 99, border: '1.5px solid #1A5A2A', textDecoration: 'none' }}>
            Back to home
          </a>
        </div>
      </div>
    </main>
  );
}
