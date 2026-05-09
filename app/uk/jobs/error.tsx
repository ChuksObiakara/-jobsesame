'use client';

export default function UKJobsError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <main style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", background: '#052A14', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <nav style={{ background: '#041E0F', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center' }}>
        <a href="/uk" style={{ textDecoration: 'none' }}>
          <span style={{ fontSize: 18, fontWeight: 800 }}>
            <span style={{ color: '#fff' }}>job</span><span style={{ color: '#C8E600' }}>sesame</span>
          </span>
        </a>
      </nav>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 10 }}>Something went wrong loading UK jobs</h1>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', marginBottom: 24, maxWidth: 420, lineHeight: 1.7 }}>
          We hit an unexpected error. Your CV data and saved jobs are safe — try refreshing the page.
        </p>
        {process.env.NODE_ENV === 'development' && (
          <pre style={{ fontSize: 11, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,80,80,0.3)', borderRadius: 10, padding: '12px 16px', maxWidth: 560, overflow: 'auto', color: '#FF8080', marginBottom: 20, textAlign: 'left' }}>
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
          <a href="/uk" style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.5)', padding: '12px 28px', borderRadius: 99, border: '1px solid rgba(255,255,255,0.1)', textDecoration: 'none' }}>
            Back to UK home
          </a>
        </div>
      </div>
    </main>
  );
}
