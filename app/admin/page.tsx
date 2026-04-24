'use client';
import { useState, useEffect } from 'react';
import { POSTS as HARDCODED_POSTS, Post } from '../blog/posts';

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'Jobsesame2024Admin';

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', border: '1.5px solid #1A5A2A', borderRadius: 8,
  fontSize: 13, color: '#FFFFFF', background: '#0D3A1A', outline: 'none',
  fontFamily: 'inherit', boxSizing: 'border-box',
};
const cardStyle: React.CSSProperties = {
  background: '#072E16', border: '1.5px solid #1A4A2A', borderRadius: 14, padding: 24, marginBottom: 20,
};
const btnPrimary: React.CSSProperties = {
  background: '#C8E600', color: '#052A14', fontSize: 12, fontWeight: 800,
  padding: '7px 16px', borderRadius: 99, border: 'none', cursor: 'pointer',
};
const btnGhost: React.CSSProperties = {
  background: 'transparent', color: '#5A9A6A', fontSize: 12, fontWeight: 600,
  padding: '7px 14px', borderRadius: 99, border: '1px solid #1A5A2A', cursor: 'pointer',
};
const btnDanger: React.CSSProperties = {
  background: 'transparent', color: '#F09595', fontSize: 12, fontWeight: 600,
  padding: '7px 14px', borderRadius: 99, border: '1px solid #5A2020', cursor: 'pointer',
};

type Tab = 'overview' | 'blog' | 'recruiters' | 'activity' | 'new-post';

interface EditState {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  readTime: string;
  content: string;
  status: 'published' | 'draft';
}

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [pw, setPw] = useState('');
  const [pwError, setPwError] = useState(false);
  const [tab, setTab] = useState<Tab>('overview');

  // Data
  const [recruiterSubs, setRecruiterSubs] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [savedJobsCount, setSavedJobsCount] = useState(0);
  const [localPosts, setLocalPosts] = useState<Post[]>([]);

  // New post form
  const [newTitle, setNewTitle] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [newExcerpt, setNewExcerpt] = useState('');
  const [newCategory, setNewCategory] = useState('Career Advice');
  const [newReadTime, setNewReadTime] = useState('5 min read');
  const [newContent, setNewContent] = useState('');
  const [newStatus, setNewStatus] = useState<'published' | 'draft'>('published');
  const [postSaved, setPostSaved] = useState(false);

  // Edit post
  const [editing, setEditing] = useState<EditState | null>(null);

  useEffect(() => {
    if (!authed) return;
    try {
      const subs = localStorage.getItem('jobsesame_recruiter_submissions');
      setRecruiterSubs(subs ? JSON.parse(subs) : []);
      const apps = localStorage.getItem('jobsesame_applications');
      setApplications(apps ? JSON.parse(apps) : []);
      const saved = localStorage.getItem('jobsesame_saved_jobs');
      setSavedJobsCount(saved ? JSON.parse(saved).length : 0);
      const stored = localStorage.getItem('jobsesame_blog_posts');
      setLocalPosts(stored ? JSON.parse(stored) : []);
    } catch {}
  }, [authed]);

  const allPosts = [...localPosts, ...HARDCODED_POSTS];
  const publishedCount = allPosts.filter(p => !p.status || p.status === 'published').length;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pw === ADMIN_PASSWORD) {
      setAuthed(true);
      setPwError(false);
    } else {
      setPwError(true);
    }
  };

  // Blog actions
  const saveLocalPosts = (updated: Post[]) => {
    setLocalPosts(updated);
    localStorage.setItem('jobsesame_blog_posts', JSON.stringify(updated));
  };

  const saveNewPost = () => {
    if (!newTitle.trim() || !newContent.trim()) return;
    const slug = newSlug.trim() || newTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const post: Post = {
      slug, title: newTitle, excerpt: newExcerpt, category: newCategory,
      date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
      readTime: newReadTime, content: newContent, status: newStatus,
    };
    saveLocalPosts([post, ...localPosts]);
    setNewTitle(''); setNewSlug(''); setNewExcerpt(''); setNewContent('');
    setPostSaved(true);
    setTimeout(() => { setPostSaved(false); setTab('blog'); }, 1200);
  };

  const deletePost = (slug: string) => {
    if (!confirm('Delete this post permanently?')) return;
    saveLocalPosts(localPosts.filter(p => p.slug !== slug));
  };

  const startEdit = (post: Post) => {
    setEditing({ slug: post.slug, title: post.title, excerpt: post.excerpt || '', category: post.category, readTime: post.readTime, content: post.content, status: post.status || 'published' });
  };

  const saveEdit = () => {
    if (!editing) return;
    const updated = localPosts.map(p => p.slug === editing.slug ? { ...p, ...editing } : p);
    saveLocalPosts(updated);
    setEditing(null);
  };

  const togglePostStatus = (slug: string) => {
    const updated = localPosts.map(p => p.slug === slug ? { ...p, status: p.status === 'draft' ? 'published' : 'draft' } as Post : p);
    saveLocalPosts(updated);
  };

  // Recruiter actions
  const markContacted = (i: number) => {
    const updated = recruiterSubs.map((s, idx) => idx === i ? { ...s, contacted: true } : s);
    setRecruiterSubs(updated);
    localStorage.setItem('jobsesame_recruiter_submissions', JSON.stringify(updated));
  };

  const exportCSV = () => {
    const headers = ['Company,Contact,Email,Phone,Size,Date,Contacted'];
    const rows = recruiterSubs.map(s =>
      [s.companyName, s.contactName, s.workEmail, s.phone, s.companySize, s.submittedAt?.slice(0, 10), s.contacted ? 'Yes' : 'No']
        .map(v => `"${(v || '').toString().replace(/"/g, '""')}"`)
        .join(',')
    );
    const csv = [...headers, ...rows].join('\n');
    const a = document.createElement('a');
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    a.download = 'recruiter-signups.csv';
    a.click();
  };

  const todayStr = new Date().toISOString().slice(0, 10);

  if (!authed) {
    return (
      <main style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", background: '#052A14', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <form onSubmit={handleLogin} style={{ background: '#072E16', border: '1.5px solid #1A4A2A', borderRadius: 18, padding: '48px 40px', width: '100%', maxWidth: 400, textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, background: '#C8E600', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, margin: '0 auto 20px' }}>🔐</div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#FFFFFF', marginBottom: 8 }}>Admin Dashboard</h1>
          <p style={{ fontSize: 13, color: '#5A9A6A', marginBottom: 28 }}>Jobsesame internal access only</p>
          <input
            type="password"
            value={pw}
            onChange={e => { setPw(e.target.value); setPwError(false); }}
            placeholder="Enter admin password"
            autoFocus
            style={{ ...inputStyle, textAlign: 'center', fontSize: 15, marginBottom: 14 }}
          />
          {pwError && <div style={{ fontSize: 13, color: '#F09595', marginBottom: 12, fontWeight: 600 }}>Incorrect password</div>}
          <button type="submit" style={{ width: '100%', background: '#C8E600', color: '#052A14', fontSize: 15, fontWeight: 800, padding: '13px', borderRadius: 10, border: 'none', cursor: 'pointer' }}>
            Enter Dashboard
          </button>
        </form>
      </main>
    );
  }

  return (
    <main style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", background: '#041F10', minHeight: '100vh', padding: '0 0 80px' }}>

      {/* TOP BAR */}
      <div style={{ background: '#052A14', borderBottom: '2px solid #C8E600', padding: '0 28px', height: 58, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 34, height: 34, background: '#C8E600', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>⚙️</div>
          <div>
            <span style={{ fontSize: 16, fontWeight: 800, color: '#FFFFFF' }}>Jobsesame</span>
            <span style={{ fontSize: 13, color: '#5A9A6A', marginLeft: 8 }}>Admin</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <a href="https://jobsesame.co.za" target="_blank" rel="noreferrer" style={{ fontSize: 12, color: '#A8D8B0', textDecoration: 'none', fontWeight: 600 }}>🌐 Live site</a>
          <a href="https://github.com/ChuksObiakara/-jobsesame" target="_blank" rel="noreferrer" style={{ fontSize: 12, color: '#A8D8B0', textDecoration: 'none', fontWeight: 600 }}>GitHub</a>
          <a href="/" style={{ fontSize: 12, color: '#5A9A6A', textDecoration: 'none' }}>← Back</a>
        </div>
      </div>

      <div style={{ maxWidth: 1040, margin: '0 auto', padding: '28px 24px 0' }}>

        {/* TABS */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 28, overflowX: 'auto', paddingBottom: 4 }}>
          {([
            ['overview', '📊 Overview'],
            ['blog', '📝 Blog'],
            ['recruiters', '🏢 Recruiters'],
            ['activity', '📋 Activity'],
            ['new-post', '✏️ New Post'],
          ] as [Tab, string][]).map(([t, label]) => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '9px 20px', borderRadius: 99, fontSize: 13, fontWeight: 700,
              cursor: 'pointer', border: 'none', whiteSpace: 'nowrap',
              background: tab === t ? '#C8E600' : '#0D3A1A',
              color: tab === t ? '#052A14' : '#A8D8B0',
            }}>
              {label}
            </button>
          ))}
        </div>

        {/* ── SECTION 1: OVERVIEW ── */}
        {tab === 'overview' && (
          <>
            {/* Stats grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 24 }}>
              {[
                { label: 'Published posts', value: publishedCount, icon: '📝', color: '#C8E600' },
                { label: 'Recruiter signups', value: recruiterSubs.length, icon: '🏢', color: '#FFA500' },
                { label: 'Applications tracked', value: applications.length, icon: '📤', color: '#90C898' },
                { label: 'Saved jobs', value: savedJobsCount, icon: '🔖', color: '#A8D8B0' },
              ].map(s => (
                <div key={s.label} style={{ background: '#072E16', border: '1.5px solid #1A4A2A', borderRadius: 14, padding: '20px 22px' }}>
                  <div style={{ fontSize: 11, color: '#3A7A4A', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 8 }}>{s.icon} {s.label}</div>
                  <div style={{ fontSize: 32, fontWeight: 800, color: s.color }}>{s.value}</div>
                </div>
              ))}
            </div>

            {/* Quick actions */}
            <div style={{ ...cardStyle, marginBottom: 24 }}>
              <h2 style={{ fontSize: 14, fontWeight: 800, color: '#FFFFFF', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '1px' }}>Quick Actions</h2>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button onClick={() => setTab('new-post')} style={{ ...btnPrimary, fontSize: 13, padding: '10px 22px' }}>
                  ✏️ Publish new post
                </button>
                <a href="https://jobsesame.co.za" target="_blank" rel="noreferrer" style={{ ...btnGhost, fontSize: 13, padding: '10px 22px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
                  🌐 View live site
                </a>
                <a href="https://github.com/ChuksObiakara/-jobsesame" target="_blank" rel="noreferrer" style={{ ...btnGhost, fontSize: 13, padding: '10px 22px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
                  🐙 View GitHub
                </a>
                <button onClick={() => setTab('recruiters')} style={{ ...btnGhost, fontSize: 13, padding: '10px 22px' }}>
                  🏢 Recruiter signups ({recruiterSubs.length})
                </button>
              </div>
            </div>

            {/* Today summary */}
            <div style={cardStyle}>
              <h2 style={{ fontSize: 14, fontWeight: 800, color: '#FFFFFF', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '1px' }}>Today</h2>
              <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: 11, color: '#3A7A4A', fontWeight: 700 }}>APPLICATIONS TODAY</div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: '#C8E600' }}>
                    {applications.filter(a => a.dateApplied?.startsWith(todayStr)).length}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#3A7A4A', fontWeight: 700 }}>DRAFT POSTS</div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: '#FFA500' }}>
                    {localPosts.filter(p => p.status === 'draft').length}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#3A7A4A', fontWeight: 700 }}>UNCONTACTED RECRUITERS</div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: '#A8D8B0' }}>
                    {recruiterSubs.filter(s => !s.contacted).length}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── SECTION 2: BLOG MANAGEMENT ── */}
        {tab === 'blog' && (
          <div style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
              <h2 style={{ fontSize: 15, fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                Blog Posts <span style={{ fontSize: 13, color: '#5A9A6A', fontWeight: 500 }}>({allPosts.length} total · {publishedCount} published · {localPosts.filter(p => p.status === 'draft').length} drafts)</span>
              </h2>
              <button onClick={() => setTab('new-post')} style={btnPrimary}>+ New post</button>
            </div>

            {allPosts.length === 0 ? (
              <div style={{ fontSize: 13, color: '#3A7A4A', padding: '24px 0', textAlign: 'center' }}>No blog posts yet.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {allPosts.map(post => {
                  const isLocal = localPosts.some(p => p.slug === post.slug);
                  const isDraft = post.status === 'draft';

                  if (editing && editing.slug === post.slug) {
                    return (
                      <div key={post.slug} style={{ background: '#0D3A1A', borderRadius: 12, padding: '18px 20px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <div>
                              <label style={{ fontSize: 11, color: '#5A9A6A', display: 'block', marginBottom: 5 }}>Title</label>
                              <input value={editing.title} onChange={e => setEditing({ ...editing, title: e.target.value })} style={inputStyle} />
                            </div>
                            <div>
                              <label style={{ fontSize: 11, color: '#5A9A6A', display: 'block', marginBottom: 5 }}>Category</label>
                              <select value={editing.category} onChange={e => setEditing({ ...editing, category: e.target.value })} style={{ ...inputStyle, cursor: 'pointer' }}>
                                {['CV Tips','Career Advice','Relocation','Remote Work','Salary'].map(c => <option key={c}>{c}</option>)}
                              </select>
                            </div>
                          </div>
                          <div>
                            <label style={{ fontSize: 11, color: '#5A9A6A', display: 'block', marginBottom: 5 }}>Excerpt</label>
                            <input value={editing.excerpt} onChange={e => setEditing({ ...editing, excerpt: e.target.value })} style={inputStyle} />
                          </div>
                          <div>
                            <label style={{ fontSize: 11, color: '#5A9A6A', display: 'block', marginBottom: 5 }}>Content</label>
                            <textarea value={editing.content} onChange={e => setEditing({ ...editing, content: e.target.value })} rows={12} style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.7 }} />
                          </div>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <label style={{ fontSize: 12, color: '#5A9A6A' }}>Status:</label>
                            <select value={editing.status} onChange={e => setEditing({ ...editing, status: e.target.value as 'published' | 'draft' })} style={{ ...inputStyle, width: 'auto', padding: '6px 12px' }}>
                              <option value="published">Published</option>
                              <option value="draft">Draft</option>
                            </select>
                          </div>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button onClick={saveEdit} style={btnPrimary}>Save changes</button>
                            <button onClick={() => setEditing(null)} style={btnGhost}>Cancel</button>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={post.slug} style={{ background: '#0D3A1A', borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: 200 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#FFFFFF' }}>{post.title}</span>
                          <span style={{
                            fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 99,
                            background: isDraft ? '#2A1A0A' : 'rgba(200,230,0,0.15)',
                            color: isDraft ? '#FFA500' : '#C8E600',
                          }}>
                            {isDraft ? 'DRAFT' : 'PUBLISHED'}
                          </span>
                          {!isLocal && <span style={{ fontSize: 10, color: '#3A7A4A', fontStyle: 'italic' }}>hardcoded</span>}
                        </div>
                        <div style={{ fontSize: 11, color: '#5A9A6A' }}>{post.category} · {post.date} · {post.readTime}</div>
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexShrink: 0, flexWrap: 'wrap' }}>
                        {isLocal && (
                          <button onClick={() => togglePostStatus(post.slug)} style={{ ...btnGhost, color: isDraft ? '#C8E600' : '#FFA500', borderColor: isDraft ? '#2A4A00' : '#4A3010' }}>
                            {isDraft ? 'Publish' : 'Unpublish'}
                          </button>
                        )}
                        {isLocal && <button onClick={() => startEdit(post)} style={btnGhost}>Edit</button>}
                        <a href={`/blog/${post.slug}`} target="_blank" rel="noreferrer" style={{ ...btnGhost, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>View</a>
                        {isLocal && <button onClick={() => deletePost(post.slug)} style={btnDanger}>Delete</button>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── SECTION 3: RECRUITER SIGNUPS ── */}
        {tab === 'recruiters' && (
          <div style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
              <h2 style={{ fontSize: 15, fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                Recruiter Signups <span style={{ fontSize: 13, color: '#5A9A6A', fontWeight: 500 }}>({recruiterSubs.length})</span>
              </h2>
              {recruiterSubs.length > 0 && (
                <button onClick={exportCSV} style={{ ...btnGhost, borderColor: '#C8E600', color: '#C8E600' }}>
                  ↓ Export CSV
                </button>
              )}
            </div>

            {recruiterSubs.length === 0 ? (
              <div style={{ fontSize: 13, color: '#3A7A4A', padding: '24px 0', textAlign: 'center' }}>No recruiter submissions yet.</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #1A4A2A' }}>
                      {['Company', 'Contact', 'Email', 'Phone', 'Size', 'Date', 'Status', ''].map(h => (
                        <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: '#5A9A6A', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {recruiterSubs.map((sub, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #0D3A1A', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                        <td style={{ padding: '12px 12px', color: '#FFFFFF', fontWeight: 700 }}>{sub.companyName}</td>
                        <td style={{ padding: '12px 12px', color: '#A8D8B0' }}>{sub.contactName}</td>
                        <td style={{ padding: '12px 12px', color: '#A8D8B0' }}>{sub.workEmail}</td>
                        <td style={{ padding: '12px 12px', color: '#A8D8B0' }}>{sub.phone || '—'}</td>
                        <td style={{ padding: '12px 12px', color: '#A8D8B0' }}>{sub.companySize || '—'}</td>
                        <td style={{ padding: '12px 12px', color: '#5A9A6A', whiteSpace: 'nowrap' }}>{sub.submittedAt?.slice(0, 10) || '—'}</td>
                        <td style={{ padding: '12px 12px' }}>
                          <span style={{
                            fontSize: 10, fontWeight: 800, padding: '3px 10px', borderRadius: 99,
                            background: sub.contacted ? 'rgba(200,230,0,0.15)' : '#1A4A2A',
                            color: sub.contacted ? '#C8E600' : '#5A9A6A',
                          }}>
                            {sub.contacted ? 'Contacted' : 'New'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 12px' }}>
                          {!sub.contacted && (
                            <button onClick={() => markContacted(i)} style={btnPrimary}>
                              Mark contacted
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── SECTION 4: RECENT ACTIVITY ── */}
        {tab === 'activity' && (
          <>
            <div style={{ ...cardStyle, marginBottom: 20 }}>
              <h2 style={{ fontSize: 14, fontWeight: 800, color: '#FFFFFF', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '1px' }}>
                Recent Job Applications ({applications.length})
              </h2>
              {applications.length === 0 ? (
                <div style={{ fontSize: 13, color: '#3A7A4A', textAlign: 'center', padding: '20px 0' }}>No applications tracked yet.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[...applications].reverse().slice(0, 20).map((app: any, i: number) => (
                    <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '10px 14px', background: '#0D3A1A', borderRadius: 10, flexWrap: 'wrap' }}>
                      <div style={{ width: 36, height: 36, borderRadius: 9, background: '#1A4A2A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: '#C8E600', flexShrink: 0 }}>
                        {(app.company || '?').charAt(0).toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 140 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#FFFFFF' }}>{app.jobTitle}</div>
                        <div style={{ fontSize: 11, color: '#5A9A6A' }}>{app.company} · {app.location}</div>
                      </div>
                      <div style={{ fontSize: 11, color: '#3A7A4A', whiteSpace: 'nowrap' }}>{app.dateApplied?.slice(0, 10)}</div>
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 99,
                        background: app.status === 'Offer' ? 'rgba(200,230,0,0.2)' : '#1A4A2A',
                        color: app.status === 'Offer' ? '#C8E600' : '#90C898',
                      }}>{app.status || 'Applied'}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={cardStyle}>
              <h2 style={{ fontSize: 14, fontWeight: 800, color: '#FFFFFF', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '1px' }}>
                Published Blog Posts ({publishedCount})
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {allPosts.filter(p => !p.status || p.status === 'published').slice(0, 10).map(post => (
                  <div key={post.slug} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#0D3A1A', borderRadius: 10, gap: 12, flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#FFFFFF' }}>{post.title}</div>
                      <div style={{ fontSize: 11, color: '#5A9A6A' }}>{post.category} · {post.date}</div>
                    </div>
                    <a href={`/blog/${post.slug}`} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: '#C8E600', textDecoration: 'none', fontWeight: 700, whiteSpace: 'nowrap' }}>
                      View →
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── SECTION 5: NEW POST ── */}
        {tab === 'new-post' && (
          <div style={cardStyle}>
            <h2 style={{ fontSize: 15, fontWeight: 800, color: '#FFFFFF', marginBottom: 22 }}>Write a New Blog Post</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 12, color: '#5A9A6A', fontWeight: 600, display: 'block', marginBottom: 6 }}>Title *</label>
                <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="How to write a great CV in 2025" style={inputStyle} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 12, color: '#5A9A6A', fontWeight: 600, display: 'block', marginBottom: 6 }}>Category</label>
                  <select value={newCategory} onChange={e => setNewCategory(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                    {['CV Tips','Career Advice','Relocation','Remote Work','Salary'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, color: '#5A9A6A', fontWeight: 600, display: 'block', marginBottom: 6 }}>Status</label>
                  <select value={newStatus} onChange={e => setNewStatus(e.target.value as 'published' | 'draft')} style={{ ...inputStyle, cursor: 'pointer' }}>
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
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
                <label style={{ fontSize: 12, color: '#5A9A6A', fontWeight: 600, display: 'block', marginBottom: 6 }}>Content (Markdown: # ## **bold** *italic* - lists)</label>
                <textarea
                  value={newContent}
                  onChange={e => setNewContent(e.target.value)}
                  rows={20}
                  placeholder={'# Post title\n\nIntro paragraph...\n\n## Section heading\n\nMore content here.\n\n- Bullet point\n- Another point'}
                  style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.7 }}
                />
              </div>

              {postSaved && (
                <div style={{ fontSize: 14, color: '#C8E600', fontWeight: 800, padding: '12px 18px', background: 'rgba(200,230,0,0.1)', borderRadius: 10, textAlign: 'center' }}>
                  ✓ Post {newStatus === 'published' ? 'published' : 'saved as draft'}!
                </div>
              )}

              <button
                onClick={saveNewPost}
                disabled={!newTitle.trim() || !newContent.trim()}
                style={{ ...btnPrimary, fontSize: 14, padding: '14px', borderRadius: 10, opacity: (!newTitle.trim() || !newContent.trim()) ? 0.5 : 1 }}
              >
                {newStatus === 'published' ? '🚀 Publish post' : '💾 Save as draft'}
              </button>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
