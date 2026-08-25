'use client';
import { useState } from 'react';
import { POSTS, TAG_COLORS, TAG_COLOR_FALLBACK } from './posts';
import { INK, INK_SOFT, INK_FAINT, LINE, PAPER, CARD, SERIF } from '../lib/theme';

const CATEGORIES = ['All', 'CV Tips', 'Career Advice', 'Relocation', 'Remote Work', 'Salary'];

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
      <div style={{ borderBottom: `1px solid ${LINE}`, padding: '56px 24px 36px' }}>
        <div style={{ maxWidth: 760, margin: '0 auto', textAlign: 'center' }}>
          <h1 style={{ fontFamily: SERIF, fontWeight: 500, fontSize: 'clamp(26px, 4vw, 38px)', marginBottom: 10 }}>
            Jobsesame career insights
          </h1>
          <p style={{ fontSize: 15, color: INK_SOFT, marginBottom: 28 }}>Expert advice to help you get hired faster</p>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search articles..."
            style={{ width: '100%', maxWidth: 440, padding: '11px 18px', border: `1px solid ${LINE}`, borderRadius: 3, fontSize: 14, color: INK, outline: 'none', background: CARD, boxSizing: 'border-box' }}
          />
        </div>
      </div>

      {/* CATEGORY FILTERS */}
      <div style={{ borderBottom: `1px solid ${LINE}`, padding: '18px 24px' }}>
        <div style={{ maxWidth: 760, margin: '0 auto', display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setCategory(cat)} style={{ padding: '8px 16px', borderRadius: 99, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', border: `1px solid ${category === cat ? INK : LINE}`, background: category === cat ? INK : 'transparent', color: category === cat ? PAPER : INK_SOFT, transition: 'all 0.15s' }}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* POSTS GRID */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '48px 24px 80px' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: INK_FAINT }}>
            <div style={{ fontSize: 15, fontWeight: 600 }}>No articles match your search</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: 20 }}>
            {filtered.map(post => {
              const tc = TAG_COLORS[post.category] || TAG_COLOR_FALLBACK;
              return (
                <div key={post.slug} style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 4, padding: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <span style={{ background: tc.bg, color: tc.color, fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 99 }}>{post.category}</span>
                    <span style={{ fontSize: 11, color: INK_FAINT }}>{post.readTime}</span>
                  </div>
                  <h2 style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.4, margin: 0 }}>{post.title}</h2>
                  <p style={{ fontSize: 13, color: INK_SOFT, lineHeight: 1.7, margin: 0, flex: 1 }}>{post.excerpt}</p>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4, paddingTop: 12, borderTop: `1px solid ${LINE}` }}>
                    <span style={{ fontSize: 11, color: INK_FAINT }}>{post.date}</span>
                    <a href={`/blog/${post.slug}`} style={{ fontSize: 12, fontWeight: 600, color: INK, textDecoration: 'none', borderBottom: `1px solid ${LINE}` }}>
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
