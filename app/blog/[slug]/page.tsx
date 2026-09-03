import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { POSTS, TAG_COLORS, TAG_COLOR_FALLBACK } from '../posts';
import Nav from '../../components/Nav';
import Footer from '../../components/Footer';
import { INK, INK_SOFT, INK_FAINT, LINE, PAPER, CARD, ACCENT, SERIF, SANS } from '../../lib/theme';

const BASE = 'https://www.jobsesame.co.za';

export async function generateStaticParams() {
  return POSTS.map(p => ({ slug: p.slug }));
}

function toIsoDate(date: string): string | undefined {
  const d = new Date(date);
  return isNaN(d.getTime()) ? undefined : d.toISOString();
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = POSTS.find(p => p.slug === slug);
  if (!post) return {};

  const url = `${BASE}/blog/${post.slug}`;
  const title = `${post.title} | Jobsesame Blog`;

  return {
    title,
    description: post.excerpt,
    alternates: { canonical: url },
    openGraph: {
      title,
      description: post.excerpt,
      url,
      siteName: 'Jobsesame',
      locale: 'en_US',
      type: 'article',
      publishedTime: toIsoDate(post.date),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: post.excerpt,
    },
  };
}

// Every post's `content` starts with its own leading "# Title" line, which
// duplicates the <h1> already rendered in the hero above — strip it so each
// article page has exactly one H1.
function stripLeadingH1(content: string): string {
  return content.replace(/^#\s+.+(\r?\n)+/, '');
}

function renderMarkdown(text: string): React.ReactNode[] {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith('## ')) {
      elements.push(
        <h2 key={i} style={{ fontFamily: SERIF, fontWeight: 500, fontSize: 22, color: INK, marginTop: 36, marginBottom: 12, lineHeight: 1.3 }}>
          {line.replace('## ', '')}
        </h2>
      );
    } else if (line.startsWith('# ')) {
      elements.push(
        <h1 key={i} style={{ fontFamily: SERIF, fontWeight: 500, fontSize: 28, color: INK, marginBottom: 20, lineHeight: 1.2 }}>
          {line.replace('# ', '')}
        </h1>
      );
    } else if (line.startsWith('### ')) {
      elements.push(
        <h3 key={i} style={{ fontSize: 16.5, fontWeight: 600, color: INK, marginTop: 24, marginBottom: 8 }}>
          {line.replace('### ', '')}
        </h3>
      );
    } else if (line.startsWith('- ')) {
      const items: string[] = [];
      while (i < lines.length && lines[i].startsWith('- ')) {
        items.push(lines[i].replace('- ', ''));
        i++;
      }
      elements.push(
        <ul key={`ul-${i}`} style={{ paddingLeft: 20, margin: '10px 0 16px' }}>
          {items.map((item, j) => (
            <li key={j} style={{ fontSize: 15, color: INK_SOFT, lineHeight: 1.8, marginBottom: 4 }}
              dangerouslySetInnerHTML={{ __html: inlineFormat(item) }} />
          ))}
        </ul>
      );
      continue;
    } else if (line.trim() === '') {
      // skip blank lines (handled by paragraph spacing)
    } else {
      elements.push(
        <p key={i} style={{ fontSize: 15, color: INK_SOFT, lineHeight: 1.85, marginBottom: 16 }}
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
    .replace(/`(.+?)`/g, `<code style="background:${PAPER};padding:2px 6px;border-radius:3px;font-size:13px">$1</code>`);
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = POSTS.find(p => p.slug === slug);
  if (!post) notFound();

  const tc = TAG_COLORS[post.category] || TAG_COLOR_FALLBACK;
  const otherPosts = POSTS.filter(p => p.slug !== slug).slice(0, 3);
  const url = `${BASE}/blog/${post.slug}`;
  const isoDate = toIsoDate(post.date);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    ...(isoDate ? { datePublished: isoDate, dateModified: isoDate } : {}),
    author: { '@type': 'Organization', name: 'Jobsesame' },
    publisher: {
      '@type': 'Organization',
      name: 'Jobsesame',
      logo: { '@type': 'ImageObject', url: `${BASE}/og-image.png` },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
  };

  return (
    <main style={{ fontFamily: SANS, background: PAPER, color: INK, minHeight: '100vh', margin: 0 }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Nav theme="light" />

      {/* HERO */}
      <div style={{ borderBottom: `1px solid ${LINE}`, padding: '48px 24px 40px' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20 }}>
            <span style={{ background: tc.bg, color: tc.color, fontSize: 11, fontWeight: 600, padding: '4px 12px', borderRadius: 99 }}>{post.category}</span>
            <span style={{ fontSize: 12, color: INK_FAINT }}>{post.date}</span>
            <span style={{ fontSize: 12, color: INK_FAINT }}>&middot;</span>
            <span style={{ fontSize: 12, color: INK_FAINT }}>{post.readTime}</span>
          </div>
          <h1 style={{ fontFamily: SERIF, fontWeight: 500, fontSize: 'clamp(24px, 4vw, 36px)', lineHeight: 1.25, marginBottom: 16 }}>{post.title}</h1>
          <p style={{ fontSize: 15, color: INK_SOFT, lineHeight: 1.75 }}>{post.excerpt}</p>
        </div>
      </div>

      {/* ARTICLE */}
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '48px 24px 64px' }}>
        <article style={{ background: CARD, borderRadius: 4, padding: '36px 40px', border: `1px solid ${LINE}`, marginBottom: 40 }}>
          {renderMarkdown(stripLeadingH1(post.content))}
        </article>

        {/* CTA */}
        <div style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 4, padding: '32px 28px', textAlign: 'center', marginBottom: 48 }}>
          <h3 style={{ fontFamily: SERIF, fontWeight: 500, fontSize: 19, marginBottom: 8 }}>Ready to put this into action?</h3>
          <p style={{ fontSize: 14, color: INK_SOFT, marginBottom: 22 }}>Upload your CV and let AI tailor it for every job you apply to — free.</p>
          <a href="/sign-up" style={{ background: ACCENT, color: PAPER, fontSize: 14, fontWeight: 600, padding: '13px 30px', borderRadius: 3, textDecoration: 'none', display: 'inline-block' }}>
            Get started free
          </a>
        </div>

        {/* MORE ARTICLES */}
        {otherPosts.length > 0 && (
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>More articles</h3>
            <div style={{ borderTop: `1px solid ${LINE}` }}>
              {otherPosts.map(p => (
                <a key={p.slug} href={`/blog/${p.slug}`} style={{ display: 'block', padding: '18px 0', borderBottom: `1px solid ${LINE}`, textDecoration: 'none' }}>
                  <div style={{ fontSize: 11, color: INK_FAINT, marginBottom: 4 }}>{p.category} &middot; {p.readTime}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: INK }}>{p.title}</div>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      <Footer theme="light" />
    </main>
  );
}
