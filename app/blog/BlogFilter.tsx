'use client';
import { useState } from 'react';
import { POSTS } from './posts';

const CATEGORIES = ['All', 'CV Tips', 'Career Advice', 'Relocation', 'Remote Work', 'Salary'];

const TAG_COLORS: Record<string, { bg: string; color: string }> = {
  'CV Tips':       { bg: '#0D3A1A', color: '#C8E600' },
  'Career Advice': { bg: '#1A2A0A', color: '#A8D8B0' },
  'Relocation':    { bg: '#1A2A3A', color: '#7EC8F0' },
  'Remote Work':   { bg: '#2A1A0A', color: '#FFA500' },
  'Salary':        { bg: '#1A0A2A', color: '#D4A8FF' },
};

export default function BlogFilter() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');

  const filtered = POSTS.filter(p => {
    const matchCat = category === 'All' || p.category === category;
    const matchSearch = !search ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.excerpt.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <>
      {/* HEADER */}
      <div style={{ background: '#052A14', padding: '52px 24px 40px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
          <h1 style={{ fontSize: 'clamp(24px, 4vw, 40px)', fontWeight: 800, color: '#FFFFFF', marginBottom: 10 }}>
            Jobsesame Career Insights
          </h1>
          <p style={{ fontSize: 15, color: '#90C898', marginBottom: 28 }}>Expert advice to help you get hired faster</p>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search articles..."
            style={{ width: '100%', maxWidth: 480, padding: '12px 20px', border: '2px solid #C8E600', borderRadius: 99, fontSize: 14, color: '#052A14', fontWeight: 600, outline: 'none', background: '#fff', boxSizing: 'border-box' }}
          />
        </div>
      </div>

      {/* CATEGORY FILTERS */}
      <div style={{ background: '#052A14', borderBottom: '3px solid #C8E600', padding: '0 24px 20px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setCategory(cat)} style={{ padding: '8px 18px', borderRadius: 99, fontSize: 13, fontWeight: 700, cursor: 'pointer', border: 'none', background: category === cat ? '#C8E600' : 'rgba(200,230,0,0.1)', color: category === cat ? '#052A14' : '#A8D8B0', transition: 'all 0.15s' }}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* POSTS GRID */}
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '40px 24px 80px' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#4A8A5A' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>No articles match your search</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
            {filtered.map(post => {
              const tc = TAG_COLORS[post.category] || { bg: '#0D3A1A', color: '#C8E600' };
              return (
                <div key={post.slug} style={{ background: '#fff', border: '1.5px solid #D8EED8', borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <span style={{ background: tc.bg, color: tc.color, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 99 }}>{post.category}</span>
                    <span style={{ fontSize: 11, color: '#90A890' }}>{post.readTime}</span>
                  </div>
                  <h2 style={{ fontSize: 15, fontWeight: 800, color: '#052A14', lineHeight: 1.4, margin: 0 }}>{post.title}</h2>
                  <p style={{ fontSize: 13, color: '#4A8A5A', lineHeight: 1.7, margin: 0, flex: 1 }}>{post.excerpt}</p>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4, paddingTop: 12, borderTop: '1px solid #EAF5EA' }}>
                    <span style={{ fontSize: 11, color: '#90A890' }}>{post.date}</span>
                    <a href={`/blog/${post.slug}`} style={{ background: '#052A14', color: '#C8E600', fontSize: 12, fontWeight: 800, padding: '7px 16px', borderRadius: 99, textDecoration: 'none' }}>
                      Read more →
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
