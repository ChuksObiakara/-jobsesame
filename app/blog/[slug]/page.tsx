import { notFound } from 'next/navigation';
import { POSTS } from '../posts';

export async function generateStaticParams() {
  return POSTS.map(p => ({ slug: p.slug }));
}

const TAG_COLORS: Record<string, { bg: string; color: string }> = {
  'CV Tips':       { bg: '#0D3A1A', color: '#C8E600' },
  'Career Advice': { bg: '#1A2A0A', color: '#A8D8B0' },
  'Relocation':    { bg: '#1A2A3A', color: '#7EC8F0' },
  'Remote Work':   { bg: '#2A1A0A', color: '#FFA500' },
  'Salary':        { bg: '#1A0A2A', color: '#D4A8FF' },
};

function renderMarkdown(text: string): React.ReactNode[] {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith('## ')) {
      elements.push(
        <h2 key={i} style={{ fontSize: 22, fontWeight: 800, color: '#052A14', marginTop: 36, marginBottom: 12, lineHeight: 1.3 }}>
          {line.replace('## ', '')}
        </h2>
      );
    } else if (line.startsWith('# ')) {
      elements.push(
        <h1 key={i} style={{ fontSize: 28, fontWeight: 800, color: '#052A14', marginBottom: 20, lineHeight: 1.2 }}>
          {line.replace('# ', '')}
        </h1>
      );
    } else if (line.startsWith('### ')) {
      elements.push(
        <h3 key={i} style={{ fontSize: 17, fontWeight: 800, color: '#052A14', marginTop: 24, marginBottom: 8 }}>
          {line.replace('### ', '')}
        </h3>
      );
    } else if (line.startsWith('- ')) {
      // collect consecutive list items
      const items: string[] = [];
      while (i < lines.length && lines[i].startsWith('- ')) {
        items.push(lines[i].replace('- ', ''));
        i++;
      }
      elements.push(
        <ul key={`ul-${i}`} style={{ paddingLeft: 20, margin: '10px 0 16px' }}>
          {items.map((item, j) => (
            <li key={j} style={{ fontSize: 15, color: '#2A4A2A', lineHeight: 1.8, marginBottom: 4 }}
              dangerouslySetInnerHTML={{ __html: inlineFormat(item) }} />
          ))}
        </ul>
      );
      continue;
    } else if (line.trim() === '') {
      // skip blank lines (handled by paragraph spacing)
    } else {
      elements.push(
        <p key={i} style={{ fontSize: 15, color: '#2A4A2A', lineHeight: 1.85, marginBottom: 16 }}
          dangerouslySetInnerHTML={{ __html: inlineFormat(line) }} />
      );
    }
    i++;
  }
  return elements;
}

function inlineFormat(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code style="background:#EAF5EA;padding:2px 6px;border-radius:4px;font-size:13px">$1</code>');
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = POSTS.find(p => p.slug === slug);
  if (!post) notFound();

  const tc = TAG_COLORS[post.category] || { bg: '#0D3A1A', color: '#C8E600' };
  const otherPosts = POSTS.filter(p => p.slug !== slug).slice(0, 3);

  return (
    <main style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", background: '#F4FCF4', minHeight: '100vh', margin: 0 }}>

      {/* NAV */}
      <nav style={{ background: '#052A14', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{ width: 36, height: 36, background: '#C8E600', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="20" height="20" viewBox="0 0 22 22" fill="none">
              <circle cx="9" cy="9" r="5.5" stroke="#052A14" strokeWidth="2.2"/>
              <circle cx="9" cy="9" r="2.5" fill="#052A14" opacity="0.4"/>
              <line x1="13.5" y1="13.5" x2="20" y2="20" stroke="#052A14" strokeWidth="2.8" strokeLinecap="round"/>
            </svg>
          </div>
          <span style={{ fontSize: 18, fontWeight: 800 }}>
            <span style={{ color: '#FFFFFF' }}>job</span>
            <span style={{ color: '#C8E600' }}>sesame</span>
          </span>
        </a>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <a href="/blog" style={{ fontSize: 13, color: '#A8D8B0', fontWeight: 500, textDecoration: 'none' }}>← Blog</a>
          <a href="/sign-up" style={{ background: '#C8E600', color: '#052A14', fontSize: 13, fontWeight: 800, padding: '9px 22px', borderRadius: 99, textDecoration: 'none' }}>Get Started</a>
        </div>
      </nav>

      {/* HERO */}
      <div style={{ background: '#052A14', padding: '48px 24px 40px' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20 }}>
            <span style={{ background: tc.bg, color: tc.color, fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 99 }}>{post.category}</span>
            <span style={{ fontSize: 12, color: '#5A9A6A' }}>{post.date}</span>
            <span style={{ fontSize: 12, color: '#5A9A6A' }}>·</span>
            <span style={{ fontSize: 12, color: '#5A9A6A' }}>{post.readTime}</span>
          </div>
          <h1 style={{ fontSize: 'clamp(22px, 4vw, 34px)', fontWeight: 800, color: '#FFFFFF', lineHeight: 1.25, marginBottom: 16 }}>{post.title}</h1>
          <p style={{ fontSize: 15, color: '#90C898', lineHeight: 1.75 }}>{post.excerpt}</p>
        </div>
      </div>

      {/* ARTICLE */}
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '48px 24px 64px' }}>
        <article style={{ background: '#fff', borderRadius: 16, padding: '36px 40px', border: '1.5px solid #D8EED8', marginBottom: 40 }}>
          {renderMarkdown(post.content)}
        </article>

        {/* CTA */}
        <div style={{ background: '#052A14', borderRadius: 16, padding: '32px 28px', textAlign: 'center', marginBottom: 48 }}>
          <div style={{ fontSize: 28, marginBottom: 12 }}>🚀</div>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: '#FFFFFF', marginBottom: 8 }}>Ready to put this into action?</h3>
          <p style={{ fontSize: 14, color: '#5A9A6A', marginBottom: 20 }}>Upload your CV and let AI tailor it for every job you apply to — free.</p>
          <a href="/sign-up" style={{ background: '#C8E600', color: '#052A14', fontSize: 14, fontWeight: 800, padding: '13px 32px', borderRadius: 99, textDecoration: 'none', display: 'inline-block' }}>
            Get started free →
          </a>
        </div>

        {/* MORE ARTICLES */}
        {otherPosts.length > 0 && (
          <div>
            <h3 style={{ fontSize: 17, fontWeight: 800, color: '#052A14', marginBottom: 16 }}>More articles</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {otherPosts.map(p => (
                <a key={p.slug} href={`/blog/${p.slug}`} style={{ background: '#fff', border: '1.5px solid #D8EED8', borderRadius: 12, padding: '16px 20px', textDecoration: 'none', display: 'block' }}>
                  <div style={{ fontSize: 11, color: '#90A890', marginBottom: 4 }}>{p.category} · {p.readTime}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#052A14' }}>{p.title}</div>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      <footer style={{ background: '#052A14', borderTop: '1px solid #0D4A20', padding: '24px', textAlign: 'center' }}>
        <span style={{ fontSize: 13, fontWeight: 800 }}>
          <span style={{ color: '#FFFFFF' }}>job</span>
          <span style={{ color: '#C8E600' }}>sesame</span>
        </span>
        <div style={{ fontSize: 11, color: '#1A4A2A', marginTop: 8 }}>© 2025 Jobsesame</div>
      </footer>
    </main>
  );
}
