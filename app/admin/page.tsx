'use client';
import { useState, useEffect } from 'react';
import { POSTS as HARDCODED_POSTS, Post } from '../blog/posts';

const PASSWORD = 'Jobsesame2024Admin';

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [pw, setPw] = useState('');
  const [pwError, setPwError] = useState(false);

  const [tab, setTab] = useState<'overview' | 'recruiters' | 'blog' | 'new-post'>('overview');
  const [recruiterSubs, setRecruiterSubs] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [blogPosts, setBlogPosts] = useState<Post[]>([]);
  const [allPosts, setAllPosts] = useState<Post[]>([]);

  // New post form
  const [newSlug, setNewSlug] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newExcerpt, setNewExcerpt] = useState('');
  const [newCategory, setNewCategory] = useState('Career Advice');
  const [newContent, setNewContent] = useState('');
  const [newReadTime, setNewReadTime] = useState('5 min read');
  const [postSaved, setPostSaved] = useState(false);

  // Edit post
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');

  useEffect(() => {
    if (!authed) return;
    try {
      const subs = localStorage.getItem('jobsesame_recruiter_submissions');
      if (subs) setRecruiterSubs(JSON.parse(subs));
      const apps = localStorage.getItem('jobsesame_applications');
      if (apps) setApplications(JSON.parse(apps));
      const extra = localStorage.getItem('jobsesame_blog_posts');
      const extraPosts = extra ? JSON.parse(extra) : [];
      setBlogPosts(extraPosts);
      setAllPosts([...extraPosts, ...HARDCODED_POSTS]);
    } catch {}
  }, [authed]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pw === PASSWORD) {
      setAuthed(true);
      setPwError(false);
    } else {
      setPwError(true);
      setTimeout(() => { window.location.href = '/'; }, 1500);
    }
  };

  const saveNewPost = () => {
    if (!newTitle.trim() || !newContent.trim()) return;
    const slug = newSlug.trim() || newTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const post: Post = {
      slug,
      title: newTitle,
      excerpt: newExcerpt,
      category: newCategory,
      date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
      readTime: newReadTime,
      content: newContent,
    };
    const updated = [post, ...blogPosts];
    setBlogPosts(updated);
    setAllPosts([...updated, ...HARDCODED_POSTS]);
    localStorage.setItem('jobsesame_blog_posts', JSON.stringify(updated));
    setNewTitle(''); setNewSlug(''); setNewExcerpt(''); setNewContent('');
    setPostSaved(true);
    setTimeout(() => { setPostSaved(false); setTab('blog'); }, 1200);
  };

  const startEdit = (post: Post) => {
    setEditingSlug(post.slug);
    setEditTitle(post.title);
    setEditContent(post.content);
  };

  const saveEdit = (slug: string) => {
    const isExtra = blogPosts.some(p => p.slug === slug);
    if (isExtra) {
      const updated = blogPosts.map(p => p.slug === slug ? { ...p, title: editTitle, content: editContent } : p);
      setBlogPosts(updated);
      setAllPosts([...updated, ...HARDCODED_POSTS]);
      localStorage.setItem('jobsesame_blog_posts', JSON.stringify(updated));
    }
    setEditingSlug(null);
  };

  const todayStr = new Date().toISOString().slice(0, 10);
  const appsToday = applications.filter(a => a.dateApplied?.startsWith(todayStr)).length;

  const sectionStyle: React.CSSProperties = {
    background: '#072E16', border: '1.5px solid #1A4A2A', borderRadius: 14, padding: 24, marginBottom: 20,
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', border: '1.5px solid #1A5A2A', borderRadius: 8,
    fontSize: 13, color: '#FFFFFF', background: '#0D3A1A', outline: 'none',
    fontFamily: 'inherit', boxSizing: 'border-box',
  };

  if (!authed) {
    return (
      <main style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", background: '#052A14', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <form onSubmit={handleLogin} style={{ background: '#072E16', border: '1.5px solid #1A4A2A', borderRadius: 16, padding: '40px 36px', width: '100%', maxWidth: 380, textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 16 }}>🔐</div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: '#FFFFFF', marginBottom: 24 }}>Admin access</h1>
          <input
            type="password"
            value={pw}
            onChange={e => setPw(e.target.value)}
            placeholder="Password"
            autoFocus
            style={{ ...inputStyle, textAlign: 'center', fontSize: 15, marginBottom: 16 }}
          />
          {pwError && <div style={{ fontSize: 13, color: '#F09595', marginBottom: 12 }}>Wrong password. Redirecting...</div>}
          <button type="submit" style={{ width: '100%', background: '#C8E600', color: '#052A14', fontSize: 14, fontWeight: 800, padding: '12px', borderRadius: 10, border: 'none', cursor: 'pointer' }}>
            Enter
          </button>
        </form>
      </main>
    );
  }

  return (
    <main style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", background: '#052A14', minHeight: '100vh', padding: '24px 20px 60px' }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>

        {/* HEADER */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#FFFFFF', marginBottom: 4 }}>Jobsesame Admin</h1>
            <div style={{ fontSize: 12, color: '#5A9A6A' }}>Internal dashboard — keep this URL private</div>
          </div>
          <a href="/" style={{ fontSize: 13, color: '#A8D8B0', textDecoration: 'none' }}>← Back to site</a>
        </div>

        {/* TABS */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
          {([['overview','📊 Overview'],['recruiters','🏢 Recruiters'],['blog','📝 Blog posts'],['new-post','✏️ New post']] as const).map(([t, label]) => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: '9px 18px', borderRadius: 99, fontSize: 13, fontWeight: 700, cursor: 'pointer', border: 'none', background: tab === t ? '#C8E600' : '#0D3A1A', color: tab === t ? '#052A14' : '#A8D8B0' }}>
              {label}
            </button>
          ))}
        </div>

        {/* OVERVIEW */}
        {tab === 'overview' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 24 }}>
              {[
                { label: 'Applications (total)', value: applications.length, color: '#90C898', icon: '📤' },
                { label: 'Applications today', value: appsToday, color: '#C8E600', icon: '📅' },
                { label: 'Recruiter signups', value: recruiterSubs.length, color: '#FFA500', icon: '🏢' },
                { label: 'Blog posts', value: allPosts.length, color: '#A8D8B0', icon: '📝' },
              ].map(s => (
                <div key={s.label} style={{ background: '#072E16', border: '1.5px solid #1A4A2A', borderRadius: 12, padding: '18px 20px' }}>
                  <div style={{ fontSize: 11, color: '#3A7A4A', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 6 }}>{s.icon} {s.label}</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}</div>
                </div>
              ))}
            </div>

            <div style={sectionStyle}>
              <h2 style={{ fontSize: 15, fontWeight: 800, color: '#FFFFFF', marginBottom: 14 }}>Recent applications</h2>
              {applications.length === 0 ? (
                <div style={{ fontSize: 13, color: '#3A7A4A' }}>No applications yet.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {applications.slice(-10).reverse().map((app: any, i: number) => (
                    <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '10px 14px', background: '#0D3A1A', borderRadius: 8, flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: 140 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#FFFFFF' }}>{app.jobTitle}</div>
                        <div style={{ fontSize: 11, color: '#5A9A6A' }}>{app.company} · {app.location}</div>
                      </div>
                      <div style={{ fontSize: 11, color: '#3A7A4A' }}>{app.dateApplied?.slice(0, 10)}</div>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 99, background: app.status === 'Offer' ? 'rgba(200,230,0,0.2)' : '#1A4A2A', color: app.status === 'Offer' ? '#C8E600' : '#90C898' }}>{app.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* RECRUITERS */}
        {tab === 'recruiters' && (
          <div style={sectionStyle}>
            <h2 style={{ fontSize: 15, fontWeight: 800, color: '#FFFFFF', marginBottom: 14 }}>Recruiter signup submissions ({recruiterSubs.length})</h2>
            {recruiterSubs.length === 0 ? (
              <div style={{ fontSize: 13, color: '#3A7A4A' }}>No recruiter submissions yet.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {recruiterSubs.map((sub: any, i: number) => (
                  <div key={i} style={{ background: '#0D3A1A', borderRadius: 10, padding: '16px 18px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: '#FFFFFF' }}>{sub.companyName}</div>
                      <div style={{ fontSize: 11, color: '#3A7A4A' }}>{sub.submittedAt?.slice(0, 10)}</div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 6, fontSize: 12, color: '#90C898' }}>
                      <div><span style={{ color: '#5A9A6A' }}>Contact:</span> {sub.contactName}</div>
                      <div><span style={{ color: '#5A9A6A' }}>Email:</span> {sub.workEmail}</div>
                      <div><span style={{ color: '#5A9A6A' }}>Phone:</span> {sub.phone}</div>
                      <div><span style={{ color: '#5A9A6A' }}>Size:</span> {sub.companySize}</div>
                      <div><span style={{ color: '#5A9A6A' }}>Industry:</span> {sub.industry}</div>
                      <div><span style={{ color: '#5A9A6A' }}>Open positions:</span> {sub.openPositions || '—'}</div>
                      <div><span style={{ color: '#5A9A6A' }}>Heard via:</span> {sub.howHeard || '—'}</div>
                    </div>
                    {sub.message && (
                      <div style={{ marginTop: 10, fontSize: 12, color: '#A8D8B0', fontStyle: 'italic', lineHeight: 1.6 }}>
                        &ldquo;{sub.message}&rdquo;
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* BLOG POSTS */}
        {tab === 'blog' && (
          <div style={sectionStyle}>
            <h2 style={{ fontSize: 15, fontWeight: 800, color: '#FFFFFF', marginBottom: 14 }}>All blog posts ({allPosts.length})</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {allPosts.map(post => (
                <div key={post.slug} style={{ background: '#0D3A1A', borderRadius: 10, padding: '14px 16px' }}>
                  {editingSlug === post.slug ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <input value={editTitle} onChange={e => setEditTitle(e.target.value)} style={inputStyle} />
                      <textarea value={editContent} onChange={e => setEditContent(e.target.value)} rows={10} style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }} />
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => saveEdit(post.slug)} style={{ background: '#C8E600', color: '#052A14', fontSize: 12, fontWeight: 800, padding: '8px 20px', borderRadius: 99, border: 'none', cursor: 'pointer' }}>Save</button>
                        <button onClick={() => setEditingSlug(null)} style={{ background: 'transparent', color: '#5A9A6A', fontSize: 12, fontWeight: 600, padding: '8px 16px', borderRadius: 99, border: '1px solid #1A5A2A', cursor: 'pointer' }}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#FFFFFF', marginBottom: 3 }}>{post.title}</div>
                        <div style={{ fontSize: 11, color: '#5A9A6A' }}>{post.category} · {post.date} · {post.readTime}</div>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => startEdit(post)} style={{ background: '#0D4A20', color: '#C8E600', fontSize: 11, fontWeight: 700, padding: '6px 14px', borderRadius: 99, border: '1px solid #1A5A2A', cursor: blogPosts.some(p => p.slug === post.slug) ? 'pointer' : 'not-allowed', opacity: blogPosts.some(p => p.slug === post.slug) ? 1 : 0.4 }}>
                          Edit
                        </button>
                        <a href={`/blog/${post.slug}`} target="_blank" rel="noreferrer" style={{ background: 'transparent', color: '#5A9A6A', fontSize: 11, fontWeight: 600, padding: '6px 14px', borderRadius: 99, border: '1px solid #1A5A2A', textDecoration: 'none' }}>
                          View →
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div style={{ marginTop: 16, fontSize: 11, color: '#3A7A4A', fontStyle: 'italic' }}>
              Note: hardcoded posts can only be viewed here, not edited. Only posts created from New post can be edited.
            </div>
          </div>
        )}

        {/* NEW POST */}
        {tab === 'new-post' && (
          <div style={sectionStyle}>
            <h2 style={{ fontSize: 15, fontWeight: 800, color: '#FFFFFF', marginBottom: 20 }}>Write a new blog post</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, color: '#5A9A6A', fontWeight: 600, display: 'block', marginBottom: 6 }}>Title *</label>
                <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="How to write a great CV in 2025" style={inputStyle} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, color: '#5A9A6A', fontWeight: 600, display: 'block', marginBottom: 6 }}>Category</label>
                  <select value={newCategory} onChange={e => setNewCategory(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                    {['CV Tips','Career Advice','Relocation','Remote Work','Salary'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, color: '#5A9A6A', fontWeight: 600, display: 'block', marginBottom: 6 }}>Read time</label>
                  <input value={newReadTime} onChange={e => setNewReadTime(e.target.value)} placeholder="5 min read" style={inputStyle} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: '#5A9A6A', fontWeight: 600, display: 'block', marginBottom: 6 }}>Slug (optional)</label>
                  <input value={newSlug} onChange={e => setNewSlug(e.target.value)} placeholder="auto-generated-from-title" style={inputStyle} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, color: '#5A9A6A', fontWeight: 600, display: 'block', marginBottom: 6 }}>Excerpt</label>
                <input value={newExcerpt} onChange={e => setNewExcerpt(e.target.value)} placeholder="One sentence summary shown on the blog index..." style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: '#5A9A6A', fontWeight: 600, display: 'block', marginBottom: 6 }}>Content (Markdown supported: # ## **bold** *italic*)</label>
                <textarea value={newContent} onChange={e => setNewContent(e.target.value)} rows={18} placeholder={'# Post title\n\nIntro paragraph...\n\n## Section heading\n\nMore content here.'} style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.7 }} />
              </div>
              {postSaved && <div style={{ fontSize: 13, color: '#C8E600', fontWeight: 700 }}>✓ Post saved and published!</div>}
              <button onClick={saveNewPost} style={{ background: '#C8E600', color: '#052A14', fontSize: 14, fontWeight: 800, padding: '13px', borderRadius: 10, border: 'none', cursor: 'pointer' }}>
                Publish post
              </button>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
