'use client';
import { useEffect, useRef, useState } from 'react';
import NavSA from '../components/NavSA';
import QuickApply, { isAutoApply } from '../components/QuickApply';

// ── AI Search Assistant ───────────────────────────────────────────────────────
const SA_SUGGESTIONS = [
  'React developer Cape Town',
  'Remote data scientist',
  'Nurse jobs London relocation',
  'Teach English South Korea',
];

function AISearchAssistant({
  onResult,
  onClear,
  hasActiveAI,
  isMobile,
}: {
  onResult: (params: any) => void;
  onClear: () => void;
  hasActiveAI: boolean;
  isMobile: boolean;
}) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [reply, setReply] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const submit = async (query: string) => {
    if (!query.trim() || loading) return;
    setInput(query);
    setLoading(true);
    setReply('');
    try {
      const res = await fetch('/api/ai-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      const data = await res.json();
      setReply(data.reply || '');
      onResult(data);
    } catch {
      setReply("Something went wrong — try again.");
    }
    setLoading(false);
  };

  const clear = () => {
    setInput('');
    setReply('');
    onClear();
    inputRef.current?.focus();
  };

  return (
    <div style={{
      background: '#FDFFF5',
      border: '2px solid #C8E600',
      borderRadius: 14,
      padding: isMobile ? '14px' : '18px 22px',
      marginBottom: 16,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 15 }}>✦</span>
          <span style={{ fontSize: 13, fontWeight: 800, color: '#052A14' }}>AI Job Search</span>
          <span style={{ fontSize: 10, color: '#4A8A5A', fontWeight: 500 }}>powered by Claude</span>
        </div>
        {hasActiveAI && (
          <button
            onClick={clear}
            style={{ fontSize: 11, color: '#4A8A5A', background: '#EAF5EA', border: '1px solid #C8E6C8', borderRadius: 99, padding: '4px 10px', cursor: 'pointer', fontWeight: 600 }}
          >
            Clear AI filters
          </button>
        )}
      </div>

      {/* Input row */}
      <form onSubmit={e => { e.preventDefault(); submit(input); }} style={{ display: 'flex', gap: 8 }}>
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder='e.g. "React developer in Cape Town" or "remote data scientist"'
          disabled={loading}
          style={{
            flex: 1,
            background: '#fff',
            border: '2px solid #C8E600',
            borderRadius: 10,
            padding: '11px 15px',
            fontSize: 14,
            color: '#052A14',
            outline: 'none',
            fontFamily: 'inherit',
            fontWeight: 600,
            opacity: loading ? 0.7 : 1,
          }}
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          style={{
            background: input.trim() && !loading ? '#C8E600' : '#E8F4C8',
            color: '#052A14',
            border: 'none',
            borderRadius: 10,
            padding: '11px 20px',
            fontSize: 14,
            fontWeight: 800,
            cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
            whiteSpace: 'nowrap',
            minWidth: 80,
            transition: 'all 0.15s',
          }}
        >
          {loading ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 12, height: 12, border: '2px solid rgba(5,42,20,0.2)', borderTopColor: '#052A14', borderRadius: '50%', display: 'inline-block', animation: 'aispin 0.7s linear infinite' }} />
              {!isMobile && 'Searching'}
            </span>
          ) : 'Search →'}
        </button>
      </form>

      {/* Suggestion chips */}
      {!reply && !loading && (
        <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
          {SA_SUGGESTIONS.map(s => (
            <button
              key={s}
              onClick={() => submit(s)}
              style={{
                fontSize: 11,
                color: '#1A5A2A',
                background: '#EAF5EA',
                border: '1px solid #C8E6C8',
                borderRadius: 99,
                padding: '5px 12px',
                cursor: 'pointer',
                fontWeight: 600,
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#C8E600'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#EAF5EA'; }}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* AI reply bubble */}
      {reply && !loading && (
        <div style={{
          marginTop: 10,
          background: '#EAF5EA',
          border: '1px solid #C8E6C8',
          borderRadius: 10,
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 8,
        }}>
          <span style={{ fontSize: 13, flexShrink: 0, marginTop: 1 }}>✦</span>
          <p style={{ fontSize: 13, color: '#1A4A2A', margin: 0, lineHeight: 1.55, fontWeight: 500 }}>{reply}</p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 13, height: 13, border: '2px solid #C8E6C8', borderTopColor: '#052A14', borderRadius: '50%', display: 'inline-block', animation: 'aispin 0.7s linear infinite' }} />
          <span style={{ fontSize: 12, color: '#4A8A5A' }}>Analysing your request...</span>
        </div>
      )}

      <style>{`@keyframes aispin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  url: string;
  category: string;
  level: string;
  salary?: string;
  type?: string;
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [total, setTotal] = useState(0);
  const [currency, setCurrency] = useState<'ZAR' | 'USD'>('USD');
  const [activeTab, setActiveTab] = useState<'all' | 'remote' | 'relocation' | 'teaching'>('all');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const jobsSectionRef = useRef<HTMLDivElement>(null);
  const jobsFetchedRef = useRef(false);
  const [loadedTabs, setLoadedTabs] = useState<Set<string>>(new Set());
  const [savedJobs, setSavedJobs] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('jobsesame_saved_jobs');
      if (saved) return JSON.parse(saved).map((j: Job) => String(j.id));
    }
    return [];
  });
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [cvData, setCvData] = useState<any>(null);
  const [strongMatchOnly, setStrongMatchOnly] = useState(false);
  const [sortMode, setSortMode] = useState<'match' | 'date'>('match');
  const [lastSearchQuery, setLastSearchQuery] = useState('');
  const [aiActive, setAiActive] = useState(false);

  const toggleSaveJob = (job: Job) => {
    const saved = localStorage.getItem('jobsesame_saved_jobs');
    const savedList: Job[] = saved ? JSON.parse(saved) : [];
    const isAlreadySaved = savedList.some(j => String(j.id) === String(job.id));
    let updated: Job[];
    if (isAlreadySaved) {
      updated = savedList.filter(j => String(j.id) !== String(job.id));
      fetch('/api/user/saved-jobs', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobUrl: job.url }),
      }).catch((err) => console.error('[jobs] unsave failed:', err));
    } else {
      updated = [...savedList, job];
      fetch('/api/user/saved-jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobTitle: job.title, company: job.company, location: job.location, jobUrl: job.url, jobData: job }),
      }).catch((err) => console.error('[jobs] save failed:', err));
    }
    localStorage.setItem('jobsesame_saved_jobs', JSON.stringify(updated));
    setSavedJobs(updated.map(j => String(j.id)));
  };

  useEffect(() => {
    fetch('https://ipapi.co/json/')
      .then(r => r.json())
      .then(data => { if (data.country_code === 'ZA') setCurrency('ZAR'); })
      .catch(() => setCurrency('USD'));
  }, []);

  useEffect(() => {
    const check = () => {
      setIsMobile(window.innerWidth < 768);
      setIsDesktop(window.innerWidth >= 1024);
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('jobsesame_cv_data');
      if (stored) setCvData(JSON.parse(stored));
    } catch (err) { console.error('[jobs] cv parse failed:', err); }
  }, []);

  const fetchJobs = async (tab = 'all', searchQuery = '', loc = '', pageNum = 1, append = false) => {
    if (append) setLoadingMore(true); else setLoading(true);
    try {
      let url = '';
      if (tab === 'remote') {
        url = `/api/remote?query=${encodeURIComponent(searchQuery || 'developer')}&page=${pageNum}`;
      } else if (tab === 'relocation') {
        url = `/api/relocation?query=${encodeURIComponent(searchQuery || 'engineer')}&page=${pageNum}`;
      } else if (tab === 'teaching') {
        url = `/api/teaching?page=${pageNum}`;
      } else if (tab === 'all' && loc === 'South Africa') {
        url = `/api/south-africa?query=${encodeURIComponent(searchQuery || 'software engineer')}`;
      } else {
        url = `/api/jobs?query=${encodeURIComponent(searchQuery || cvData?.title || 'software engineer')}&location=${encodeURIComponent(loc)}&page=${pageNum}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      const newJobs: Job[] = data.jobs || [];
      if (append) {
        setJobs(prev => {
          const existingIds = new Set(prev.map(j => j.id));
          return [...prev, ...newJobs.filter(j => !existingIds.has(j.id))];
        });
      } else {
        setJobs(newJobs);
      }
      setTotal(data.total || 0);
      setHasMore(newJobs.length >= 20 && loc !== 'South Africa');
      if (!append) {
        setLastSearchQuery(searchQuery || cvData?.title || '');
        setLoadedTabs(prev => new Set(prev).add(tab));
      }
    } catch {
    }
    if (append) setLoadingMore(false); else setLoading(false);
  };

  useEffect(() => {
    const el = jobsSectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !jobsFetchedRef.current) {
          jobsFetchedRef.current = true;
          fetchJobs('all', '', '', 1, false);
        }
      },
      { rootMargin: '300px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  // fetchJobs changes identity on every render; this observer must be registered once on mount only
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTabChange = (tab: 'all' | 'remote' | 'relocation' | 'teaching') => {
    setActiveTab(tab);
    setPage(1);
    if (!loadedTabs.has(tab)) {
      fetchJobs(tab, query, location, 1, false);
    }
  };

  const handleLocationChange = (newLoc: string) => {
    setLocation(newLoc);
    setPage(1);
    setLoadedTabs(new Set());
    fetchJobs(activeTab, query, newLoc, 1, false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setLoadedTabs(new Set());
    fetchJobs(activeTab, query, location, 1, false);
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchJobs(activeTab, query, location, nextPage, true);
  };

  const handleAIResult = (params: any) => {
    const newTab = (params.tab || 'all') as 'all' | 'remote' | 'relocation' | 'teaching';
    const newQuery = params.keywords || '';
    const newLocation = params.location || '';
    setActiveTab(newTab);
    setQuery(newQuery);
    setLocation(newLocation);
    setPage(1);
    setAiActive(true);
    setLoadedTabs(new Set());
    fetchJobs(newTab, newQuery, newLocation, 1, false);
  };

  const handleAIClear = () => {
    setQuery('');
    setLocation('');
    setActiveTab('all');
    setPage(1);
    setAiActive(false);
    setLoadedTabs(new Set());
    fetchJobs('all', '', '', 1, false);
  };

  const locationKeywords: Record<string, string[]> = {
    'South Africa': ['South Africa', 'Johannesburg', 'Cape Town', 'Durban', 'Pretoria'],
    'United Kingdom': ['London', 'UK', 'United Kingdom', 'England'],
    'Australia': ['Australia', 'Sydney', 'Melbourne', 'Brisbane'],
    'Canada': ['Canada', 'Toronto', 'Vancouver', 'Montreal'],
  };

  const calculateMatchScore = (job: Job): number | null => {
    if (!cvData) return null;
    const skills: string[] = cvData.skills || [];
    const cvTitle: string = cvData.title || '';
    if (!skills.length && !cvTitle) return null;
    const text = (job.title + ' ' + (job.description || '')).toLowerCase();
    let skillMatches = 0;
    skills.forEach(s => { if (s && text.includes(s.toLowerCase())) skillMatches++; });
    const skillScore = Math.min(40, skillMatches * 8);
    const firstWord = cvTitle.split(' ')[0].toLowerCase();
    const titleMatch = firstWord.length > 2 && job.title.toLowerCase().includes(firstWord);
    return Math.min(97, 35 + skillScore + (titleMatch ? 20 : 0));
  };

  const filteredJobs = (() => {
    let list = jobs;
    if (location && activeTab === 'all') {
      const keywords = locationKeywords[location];
      if (keywords) list = list.filter(j => keywords.some(kw => j.location.toLowerCase().includes(kw.toLowerCase())));
      else list = list.filter(j => j.location.toLowerCase().includes(location.toLowerCase()));
    }
    if (cvData && sortMode === 'match') list = [...list].sort((a, b) => (calculateMatchScore(b) ?? 0) - (calculateMatchScore(a) ?? 0));
    if (strongMatchOnly) list = list.filter(j => (calculateMatchScore(j) ?? 0) >= 55);
    return list;
  })();

  const matchBadge = (pct: number) => {
    if (pct >= 75) return { bg: '#D4F5D4', color: '#1A5A2A', label: 'Strong match' };
    if (pct >= 55) return { bg: '#FDFFF5', color: '#5A7A00', label: 'Good match' };
    if (pct >= 35) return { bg: '#FFF5E0', color: '#8A5A00', label: 'Partial match' };
    return { bg: '#F0F0F0', color: '#777', label: 'Low match' };
  };

  const tabStyle = (tab: string) => ({
    padding: '10px 22px',
    borderRadius: 99,
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
    border: 'none',
    background: activeTab === tab ? '#C8E600' : 'transparent',
    color: activeTab === tab ? '#052A14' : '#A8D8B0',
    transition: 'all 0.15s',
    whiteSpace: 'nowrap',
  } as React.CSSProperties);

  return (
    <main style={{fontFamily:"'Plus Jakarta Sans',sans-serif",background:"#F4FCF4",margin:0,padding:0,overflowX:"hidden",maxWidth:"100vw"}}>

      {/* QUICK APPLY MODAL */}
      {selectedJob && (
        <QuickApply
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
          currency={currency}
        />
      )}

      <NavSA />

      {/* PAGE HEADER */}
      <div style={{background:"#052A14",padding:isMobile?"12px 12px 0":"28px 28px 0",overflowX:"hidden"}}>
        <div style={{maxWidth:900,margin:"0 auto"}}>
          <h1 style={{fontSize:isMobile?20:26,fontWeight:800,color:"#FFFFFF",marginBottom:4}}>
            Find your next job
          </h1>
          <p style={{fontSize:13,color:"#5A9A6A",marginBottom:20}}>
            {total > 0 ? `${total.toLocaleString()} live openings` : '495,000+ live openings'} · AI-powered matching · Quick Apply in 10 seconds
          </p>
        </div>
      </div>

      {/* SEARCH + TABS */}
      <div style={{background:"#052A14",padding:isMobile?"0 12px 16px":"0 24px 24px",borderBottom:"4px solid #C8E600",overflowX:"hidden"}}>
        <div style={{maxWidth:900,margin:"0 auto"}}>
          <div style={{display:"flex",gap:8,flexWrap:"wrap",padding:"4px 0",marginBottom:18}}>
            {(['all','remote','relocation','teaching'] as const).map(tab=>(
              <button key={tab} style={tabStyle(tab)} onClick={()=>handleTabChange(tab)}>
                {tab === 'all' ? '🌍 All Jobs' : tab === 'remote' ? '💻 Remote Jobs' : tab === 'teaching' ? '🎓 Teaching Jobs' : '✈️ Relocation Jobs'}
              </button>
            ))}
          </div>
          <p style={{fontSize:12,color:"#5A9A6A",marginBottom:14,fontStyle:"italic"}}>
            {activeTab === 'all' ? 'Browse millions of jobs worldwide' : activeTab === 'remote' ? 'Work from anywhere — worldwide remote positions' : activeTab === 'teaching' ? 'Teach English in China, South Korea, Japan and UAE — $2,000–$3,500/month tax-free' : 'Jobs in London, Dubai, Toronto, Singapore and more'}
          </p>
          <AISearchAssistant
            onResult={handleAIResult}
            onClear={handleAIClear}
            hasActiveAI={aiActive}
            isMobile={isMobile}
          />

          <p style={{fontSize:11,color:"#5A9A6A",fontWeight:600,letterSpacing:"0.5px",textTransform:"uppercase",marginBottom:8}}>
            Or search manually
          </p>

          <form onSubmit={handleSearch} style={{display:"flex",gap:8,flexDirection:isMobile?"column":"row",flexWrap:isMobile?"nowrap":"wrap"}}>
            <input
              value={query}
              onChange={e=>setQuery(e.target.value)}
              placeholder={activeTab === 'remote' ? "Remote job title or skill..." : activeTab === 'relocation' ? "Job title for abroad..." : activeTab === 'teaching' ? "Teaching subject or country..." : "Job title, skill or keyword..."}
              style={{flex:1,minWidth:140,width:isMobile?"100%":"auto",padding:"13px 18px",border:"2px solid #C8E600",borderRadius:11,fontSize:14,color:"#052A14",fontWeight:600,outline:"none",background:"#fff"}}
            />
            {activeTab === 'all' && (
              <select value={location} onChange={e=>handleLocationChange(e.target.value)}
                style={{padding:"13px 14px",border:"2px solid #C8E600",borderRadius:11,fontSize:13,color:"#052A14",fontWeight:600,outline:"none",background:"#fff",width:isMobile?"100%":"auto"}}>
                <option value="">Worldwide</option>
                <option value="South Africa">South Africa</option>
                <option value="Nigeria">Nigeria</option>
                <option value="Kenya">Kenya</option>
                <option value="United Kingdom">United Kingdom</option>
                <option value="United States">United States</option>
                <option value="Canada">Canada</option>
                <option value="Australia">Australia</option>
                <option value="India">India</option>
                <option value="Singapore">Singapore</option>
                <option value="Dubai">Dubai</option>
              </select>
            )}
            {activeTab === 'relocation' && (
              <select value={location} onChange={e=>setLocation(e.target.value)}
                style={{padding:"13px 14px",border:"2px solid #C8E600",borderRadius:11,fontSize:13,color:"#052A14",fontWeight:600,outline:"none",background:"#fff",width:isMobile?"100%":"auto"}}>
                <option value="">All countries</option>
                <option value="London">London, UK</option>
                <option value="Toronto">Toronto, Canada</option>
                <option value="Dubai">Dubai, UAE</option>
                <option value="Singapore">Singapore</option>
                <option value="Berlin">Berlin, Germany</option>
                <option value="Amsterdam">Amsterdam, Netherlands</option>
                <option value="Sydney">Sydney, Australia</option>
                <option value="India">India</option>
              </select>
            )}
            <button type="submit" style={{background:"#C8E600",color:"#052A14",fontSize:14,fontWeight:800,padding:"13px 28px",borderRadius:11,border:"none",cursor:"pointer",whiteSpace:"nowrap",width:isMobile?"100%":"auto"}}>
              {loading ? 'Searching...' : 'Search jobs'}
            </button>
          </form>
        </div>
      </div>

      {/* TEACHING BANNER */}
      {activeTab === 'teaching' && !loading && (
        <div style={{background:"#052A14",padding:"20px 24px",borderBottom:"1px solid #1A5A2A"}}>
          <div style={{maxWidth:900,margin:"0 auto"}}>
            <div style={{background:"#072E16",border:"1.5px solid #C8E600",borderRadius:14,padding:20}}>
              <div style={{fontSize:11,color:"#C8E600",fontWeight:700,letterSpacing:"1.5px",textTransform:"uppercase",marginBottom:8}}>🎓 TEACHING ABROAD OPPORTUNITY</div>
              <h3 style={{fontSize:16,fontWeight:800,color:"#FFFFFF",marginBottom:8}}>Teach English in Asia & the UAE — earn $2,000–$3,500/month tax-free</h3>
              <p style={{fontSize:13,color:"#A8D8B0",lineHeight:1.7,marginBottom:12}}>
                China, South Korea, Japan and the UAE are hiring English teachers right now. Most packages include <strong style={{color:"#C8E600"}}>free housing, return flights and a tax-free salary</strong> — no prior teaching experience required in many schools.
              </p>
              <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                {[["🇨🇳 China","$1,800–$3,000/mo"],["🇰🇷 South Korea","$1,800–$2,800/mo"],["🇯🇵 Japan","$2,000–$3,000/mo"],["🇦🇪 UAE","$2,500–$3,500/mo"]].map(([country,salary])=>(
                  <div key={country} style={{background:"rgba(200,230,0,0.1)",border:"1px solid rgba(200,230,0,0.3)",borderRadius:10,padding:"8px 14px"}}>
                    <span style={{fontSize:12,color:"#C8E600",fontWeight:700}}>{country}</span>
                    <span style={{fontSize:11,color:"#90C898",marginLeft:6}}>{salary} + free housing & flights</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* JOBS LIST */}
      <section ref={jobsSectionRef} style={{background:"#F4FCF4",padding:isMobile?"12px":"20px 24px",minHeight:"60vh",overflowX:"hidden"}}>
        <div style={{maxWidth:900,margin:"0 auto"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
            <div>
              <span style={{fontSize:15,fontWeight:800,color:"#052A14"}}>
                {activeTab === 'remote' ? 'Remote roles worldwide' : activeTab === 'relocation' ? 'International opportunities' : activeTab === 'teaching' ? 'Teaching jobs worldwide' : 'All jobs'}
              </span>
              {activeTab === 'relocation' && <div style={{fontSize:11,color:"#4A8A5A",marginTop:2,fontStyle:"italic"}}>Jobs in London, Dubai, Toronto, Singapore and beyond</div>}
              {activeTab === 'remote' && <div style={{fontSize:11,color:"#4A8A5A",marginTop:2,fontStyle:"italic"}}>Work from anywhere — earn in USD, GBP or EUR</div>}
              {activeTab === 'teaching' && <div style={{fontSize:11,color:"#4A8A5A",marginTop:2,fontStyle:"italic"}}>Teach abroad — free housing, flights and $2,000–$3,500/month</div>}
            </div>
            <span style={{fontSize:12,color:"#052A14",background:"#C8E600",padding:"3px 12px",borderRadius:99,fontWeight:800,whiteSpace:"nowrap"}}>
              {total > 0 ? total.toLocaleString() : '...'} matches
            </span>
          </div>

          {location && activeTab === 'all' && !loading && (
            <div style={{fontSize:13,color:"#1A5A2A",fontWeight:600,marginBottom:12,padding:"8px 14px",background:"#EAF5EA",borderRadius:99,display:"inline-block"}}>
              Showing jobs in {location}
            </div>
          )}
          {!loading && lastSearchQuery && (
            <div style={{fontSize:13,color:"#1A5A2A",fontWeight:600,marginBottom:10,padding:"6px 14px",background:"#EAF5EA",borderRadius:99,display:"inline-block"}}>
              Showing results for &ldquo;{lastSearchQuery}&rdquo;{cvData && sortMode === 'match' ? ' — sorted by CV match' : ''}
            </div>
          )}
          {cvData && !loading && (
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14,flexWrap:"wrap"}}>
              <span style={{fontSize:12,color:"#4A8A5A",fontStyle:"italic"}}>
                {cvData.title ? `CV: ${cvData.title}` : 'CV uploaded'}
              </span>
              <button onClick={() => setSortMode(m => m === 'match' ? 'date' : 'match')} style={{
                padding:"4px 12px",borderRadius:99,fontSize:12,fontWeight:700,cursor:"pointer",border:"1.5px solid #C8E600",
                background: sortMode === 'match' ? "#C8E600" : "transparent",
                color: sortMode === 'match' ? "#052A14" : "#5A9A6A",
              }}>
                {sortMode === 'match' ? '✓ Sort: CV match' : 'Sort: CV match'}
              </button>
              <button onClick={() => setStrongMatchOnly(v => !v)} style={{
                padding:"4px 12px",borderRadius:99,fontSize:12,fontWeight:700,cursor:"pointer",border:"1.5px solid #C8E600",
                background: strongMatchOnly ? "#C8E600" : "transparent",
                color: strongMatchOnly ? "#052A14" : "#5A9A6A",
              }}>
                {strongMatchOnly ? '✓ Hide low matches' : 'Hide low matches'}
              </button>
            </div>
          )}

          {loading ? (
            <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":isDesktop?"repeat(3,1fr)":"repeat(2,1fr)",gap:10}}>
              {[...Array(6)].map((_,i)=>(
                <div key={i} style={{background:"#fff",border:"1.5px solid #C8E6C8",borderRadius:14,padding:16}}>
                  <div style={{display:"flex",gap:12,marginBottom:12}}>
                    <div style={{width:44,height:44,borderRadius:11,background:"#D8EED8",flexShrink:0}}></div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{height:14,background:"#D8EED8",borderRadius:6,marginBottom:10,width:"60%"}}></div>
                      <div style={{height:11,background:"#E8F4E8",borderRadius:6,width:"45%"}}></div>
                    </div>
                  </div>
                  <div style={{display:"flex",gap:5,marginBottom:10,flexWrap:"wrap"}}>
                    <div style={{height:20,width:64,background:"#E8F4E8",borderRadius:99}}></div>
                    <div style={{height:20,width:52,background:"#E8F4E8",borderRadius:99}}></div>
                  </div>
                  <div style={{height:11,background:"#E8F4E8",borderRadius:6,width:"80%",marginBottom:14}}></div>
                  <div style={{height:30,background:"#D8EED8",borderRadius:99}}></div>
                </div>
              ))}
            </div>
          ) : filteredJobs.length === 0 ? (
            <div style={{textAlign:"center",padding:"60px 0"}}>
              <div style={{fontSize:16,color:"#2A6A3A",fontWeight:700,marginBottom:8}}>
                {location && jobs.length > 0 ? `No jobs found in ${location}. Try a different search.` : 'No jobs found — try a different search'}
              </div>
              <div style={{fontSize:13,color:"#4A8A5A"}}>Change keywords, location or tab</div>
            </div>
          ) : (
            <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":isDesktop?"repeat(3,1fr)":"repeat(2,1fr)",gap:10}}>
              {filteredJobs.map((job,i)=>(
                <div key={job.id} style={{
                  background:i===0?"#FDFFF5":"#fff",
                  border:`1.5px solid ${i===0?"#C8E600":"#D8EED8"}`,
                  borderRadius:14,
                  padding:16,
                  display:"flex",
                  flexDirection:"column",
                  gap:12,
                  overflow:"hidden",
                  width:"100%",
                }}>
                  <div style={{display:"flex",gap:12,flex:1,minWidth:0}}>
                    <div style={{width:44,height:44,borderRadius:11,background:"#EAF5EA",color:"#1A5A2A",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:800,flexShrink:0}}>
                      {job.company.charAt(0).toUpperCase()}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:3,minWidth:0}}>
                        <div style={{fontSize:14,fontWeight:700,color:"#052A14",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",flex:1,minWidth:0}}>{job.title}</div>
                        {(() => { const matchScore = calculateMatchScore(job); if (matchScore === null) return null; const b = matchBadge(matchScore); return (
                          <span style={{fontSize:10,fontWeight:800,color:b.color,background:b.bg,padding:"2px 7px",borderRadius:99,whiteSpace:"nowrap",flexShrink:0}}>{matchScore}%</span>
                        ); })()}
                      </div>
                      <div style={{fontSize:12,color:"#666",marginBottom:8,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{job.company} · {job.location}</div>
                      <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:8}}>
                        <span style={{fontSize:11,padding:"3px 9px",borderRadius:99,fontWeight:600,background:"#EAF5EA",color:"#1A5A2A",whiteSpace:"nowrap"}}>{job.location}</span>
                        <span style={{fontSize:11,padding:"3px 9px",borderRadius:99,fontWeight:600,background:"#FDFFF5",color:"#5A7A00",border:"1px solid #C8E600",whiteSpace:"nowrap"}}>{job.level}</span>
                        <span style={{fontSize:11,padding:"3px 9px",borderRadius:99,fontWeight:600,background:"#FFF8EC",color:"#7A5000",whiteSpace:"nowrap"}}>{job.category}</span>
                        {activeTab === 'remote' && <span style={{fontSize:11,padding:"3px 9px",borderRadius:99,fontWeight:600,background:"#052A14",color:"#C8E600",whiteSpace:"nowrap"}}>Remote</span>}
                        {activeTab === 'relocation' && <span style={{fontSize:11,padding:"3px 9px",borderRadius:99,fontWeight:600,background:"#052A14",color:"#C8E600",whiteSpace:"nowrap"}}>Relocation</span>}
                        {activeTab === 'teaching' && <span style={{fontSize:11,padding:"3px 9px",borderRadius:99,fontWeight:600,background:"#052A14",color:"#C8E600",whiteSpace:"nowrap"}}>🎓 Teaching</span>}
                        {isAutoApply(job.url) && <span style={{fontSize:10,padding:"3px 9px",borderRadius:99,fontWeight:800,background:"rgba(200,230,0,0.12)",color:"#C8E600",border:"1px solid rgba(200,230,0,0.4)",whiteSpace:"nowrap"}}>⚡ Auto-apply</span>}

                      </div>
                      <p style={{fontSize:12,color:"#666",lineHeight:1.55,margin:0,display:"-webkit-box" as string,WebkitLineClamp:2,WebkitBoxOrient:"vertical" as any,overflow:"hidden"}}>{job.description}</p>
                    </div>
                  </div>

                  <div style={{display:"flex",flexDirection:"column",gap:7,width:"100%"}}>
                    <button onClick={()=>setSelectedJob(job)} style={{width:"100%",background:"#C8E600",color:"#052A14",fontSize:13,fontWeight:800,padding:"11px 0",borderRadius:99,border:"none",cursor:"pointer"}}>
                      {isAutoApply(job.url, job.type) ? '⚡ Quick Apply' : 'Apply'}
                    </button>
                    <div style={{display:"flex",gap:7}}>
                      <button onClick={()=>window.open(job.url,'_blank')} style={{flex:1,background:"transparent",color:"#052A14",fontSize:12,fontWeight:700,padding:"9px 0",borderRadius:99,border:"1.5px solid #1A5A2A",cursor:"pointer"}}>
                        View Job
                      </button>
                      <button onClick={()=>toggleSaveJob(job)} style={{flex:1,background:savedJobs.includes(job.id)?"#1A4A2A":"transparent",color:savedJobs.includes(job.id)?"#C8E600":"#5A9A6A",fontSize:12,fontWeight:600,padding:"9px 0",borderRadius:99,border:`1px solid ${savedJobs.includes(job.id)?"#C8E600":"#1A5A2A"}`,cursor:"pointer"}}>
                        {savedJobs.includes(job.id) ? '🔖 Saved' : '🔖 Save'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {hasMore && !loading && filteredJobs.length > 0 && (
                <div style={{textAlign:"center",paddingTop:16,gridColumn:"1/-1"}}>
                  <button
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    style={{background:"#052A14",color:"#C8E600",fontSize:13,fontWeight:800,padding:"12px 36px",borderRadius:99,border:"2px solid #C8E600",cursor:loadingMore?"not-allowed":"pointer",opacity:loadingMore?0.7:1}}
                  >
                    {loadingMore ? 'Loading...' : 'Load More Jobs'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{background:"#052A14",borderTop:"1px solid #0D4A20",padding:"32px 24px 20px"}}>
        <div style={{maxWidth:900,margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:16}}>
          <span style={{fontSize:13,fontWeight:800}}>
            <span style={{color:"#FFFFFF"}}>job</span>
            <span style={{color:"#C8E600"}}>sesame</span>
          </span>
          <div style={{display:"flex",gap:20,flexWrap:"wrap"}}>
            <a href="/about" style={{fontSize:12,color:"#5A9A6A",textDecoration:"none"}}>About</a>
            <a href="/optimise" style={{fontSize:12,color:"#5A9A6A",textDecoration:"none"}}>CV Optimiser</a>
            <a href="/privacy" style={{fontSize:12,color:"#5A9A6A",textDecoration:"none"}}>Privacy</a>
            <a href="/terms" style={{fontSize:12,color:"#5A9A6A",textDecoration:"none"}}>Terms</a>
            <a href="mailto:hello@jobsesame.co.za" style={{fontSize:12,color:"#5A9A6A",textDecoration:"none"}}>Contact</a>
          </div>
          <span style={{fontSize:11,color:"#1A4A2A"}}>© 2025 Jobsesame</span>
        </div>
      </footer>

    </main>
  );
}
