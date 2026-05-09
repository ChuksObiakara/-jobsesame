'use client';
import { useEffect, useRef, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import NavUK from '../../components/NavUK';
import { useRouter } from 'next/navigation';
import OptimiseModal from '../components/OptimiseModal';
interface UKJob {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  url: string;
  source: string;
  description: string;
  tags: string[];
  postedAt: string;
  applyType: 'greenhouse' | 'direct';
  applyUrl: string;
}

interface Sub {
  active: boolean;
  plan: string | null;
  credits: number;
  hasSubscription?: boolean;
  trialDaysLeft?: number | null;
}

// ── Salary parser ─────────────────────────────────────────────────────────────
function parseSalaryMin(salary: string): number | null {
  if (!salary) return null;
  const clean = salary.replace(/[£,\s]/g, '');
  const match = clean.match(/(\d+)/);
  if (!match) return null;
  const n = parseInt(match[1]);
  // Adzuna gives full numbers, others may give "45k"
  return n < 1000 ? n * 1000 : n;
}

// ── Match score ───────────────────────────────────────────────────────────────
function calcMatch(job: UKJob, cvData: any): number | null {
  if (!cvData) return null;
  const skills: string[] = cvData.skills || [];
  const cvTitle: string = cvData.title || '';
  if (!skills.length && !cvTitle) return null;
  const text = (job.title + ' ' + job.description + ' ' + job.tags.join(' ')).toLowerCase();
  let hits = 0;
  skills.forEach(s => { if (s && text.includes(s.toLowerCase())) hits++; });
  const skillScore = Math.min(40, hits * 8);
  const firstWord = cvTitle.split(' ')[0].toLowerCase();
  const titleMatch = firstWord.length > 2 && job.title.toLowerCase().includes(firstWord);
  return Math.min(97, 35 + skillScore + (titleMatch ? 20 : 0));
}

function matchBadge(pct: number) {
  if (pct >= 75) return { bg: 'rgba(200,230,0,0.15)', color: '#C8E600', label: `${pct}% match` };
  if (pct >= 55) return { bg: 'rgba(200,230,0,0.08)', color: '#A0BA00', label: `${pct}% match` };
  if (pct >= 35) return { bg: 'rgba(255,200,0,0.1)', color: '#D4A000', label: `${pct}% match` };
  return { bg: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.35)', label: `${pct}% match` };
}

// ── Filter tabs config ────────────────────────────────────────────────────────
const TABS = [
  { id: 'all', label: '🇬🇧 All UK Jobs' },
  { id: 'london', label: '🏙 London' },
  { id: 'manchester', label: 'Manchester' },
  { id: 'birmingham', label: 'Birmingham' },
  { id: 'remote', label: '💻 Remote' },
  { id: 'tech', label: '⚡ Tech' },
  { id: 'finance', label: '💷 Finance' },
  { id: 'healthcare', label: '🏥 Healthcare' },
] as const;

type TabId = typeof TABS[number]['id'];

function filterJobs(
  jobs: UKJob[],
  tab: TabId,
  search: string,
  location: string,
  minSalary: number | null,
): UKJob[] {
  let list = jobs;
  if (search) {
    const q = search.toLowerCase();
    list = list.filter(j =>
      j.title.toLowerCase().includes(q) ||
      j.company.toLowerCase().includes(q) ||
      j.description.toLowerCase().includes(q)
    );
  }
  if (location) {
    const loc = location.toLowerCase();
    list = list.filter(j => j.location.toLowerCase().includes(loc));
  }
  if (minSalary) {
    list = list.filter(j => {
      const sal = parseSalaryMin(j.salary);
      return sal === null || sal >= minSalary;
    });
  }
  if (tab === 'london') list = list.filter(j => j.location.toLowerCase().includes('london'));
  else if (tab === 'manchester') list = list.filter(j => j.location.toLowerCase().includes('manchester'));
  else if (tab === 'birmingham') list = list.filter(j => j.location.toLowerCase().includes('birmingham'));
  else if (tab === 'remote') list = list.filter(j => j.location.toLowerCase().includes('remote') || j.tags.some(t => t.toLowerCase().includes('remote')));
  else if (tab === 'tech') list = list.filter(j => /software|engineer|developer|data|tech|devops|cloud|product|analyst|python|java|react|node|aws/i.test(j.title + ' ' + j.tags.join(' ')));
  else if (tab === 'finance') list = list.filter(j => /finance|account|banking|invest|audit|tax|treasury|fintech|actuar/i.test(j.title + ' ' + j.tags.join(' ')));
  else if (tab === 'healthcare') list = list.filter(j => /health|nurse|doctor|medical|pharma|clinic|nhs|care|dental|physio/i.test(j.title + ' ' + j.tags.join(' ')));
  return list;
}

// ── AI Search Assistant ───────────────────────────────────────────────────────
const SUGGESTIONS = [
  'Remote React developer £60k+',
  'NHS nurse jobs London',
  'Senior finance Manchester',
  'Part-time marketing remote',
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
      const res = await fetch('/api/uk/ai-search', {
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
      background: 'linear-gradient(135deg, rgba(200,230,0,0.06) 0%, rgba(5,42,20,0) 100%)',
      border: '1px solid rgba(200,230,0,0.18)',
      borderRadius: 16,
      padding: isMobile ? '16px' : '20px 24px',
      marginBottom: 16,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16 }}>✦</span>
          <span style={{ fontSize: 13, fontWeight: 800, color: '#C8E600', letterSpacing: '0.5px' }}>AI Job Search</span>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontWeight: 500 }}>powered by Claude</span>
        </div>
        {hasActiveAI && (
          <button
            onClick={clear}
            style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 99, padding: '4px 10px', cursor: 'pointer', fontWeight: 600 }}
          >
            Clear AI filters
          </button>
        )}
      </div>

      {/* Input row */}
      <form
        onSubmit={e => { e.preventDefault(); submit(input); }}
        style={{ display: 'flex', gap: 8 }}
      >
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder='e.g. "Remote React developer paying £70k" or "NHS nurse in London"'
          disabled={loading}
          style={{
            flex: 1,
            background: 'rgba(255,255,255,0.07)',
            border: '1px solid rgba(200,230,0,0.25)',
            borderRadius: 10,
            padding: '12px 16px',
            fontSize: 14,
            color: '#FFFFFF',
            outline: 'none',
            fontFamily: 'inherit',
            opacity: loading ? 0.7 : 1,
          }}
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          style={{
            background: input.trim() && !loading ? '#C8E600' : 'rgba(200,230,0,0.2)',
            color: input.trim() && !loading ? '#052A14' : 'rgba(200,230,0,0.5)',
            border: 'none',
            borderRadius: 10,
            padding: '12px 20px',
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
              <span style={{ width: 12, height: 12, border: '2px solid rgba(200,230,0,0.3)', borderTopColor: '#C8E600', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
              {!isMobile && 'Searching'}
            </span>
          ) : 'Search →'}
        </button>
      </form>

      {/* Suggestion chips */}
      {!reply && !loading && (
        <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
          {SUGGESTIONS.map(s => (
            <button
              key={s}
              onClick={() => submit(s)}
              style={{
                fontSize: 11,
                color: 'rgba(255,255,255,0.5)',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 99,
                padding: '5px 12px',
                cursor: 'pointer',
                fontWeight: 600,
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(200,230,0,0.3)'; (e.currentTarget as HTMLButtonElement).style.color = '#C8E600'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.08)'; (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.5)'; }}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* AI reply bubble */}
      {reply && !loading && (
        <div style={{
          marginTop: 12,
          background: 'rgba(200,230,0,0.07)',
          border: '1px solid rgba(200,230,0,0.15)',
          borderRadius: 10,
          padding: '11px 14px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 10,
          animation: 'fadeIn 0.25s ease-out',
        }}>
          <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>✦</span>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', margin: 0, lineHeight: 1.55 }}>{reply}</p>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 14, height: 14, border: '2px solid rgba(200,230,0,0.2)', borderTopColor: '#C8E600', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>Analysing your request...</span>
        </div>
      )}
    </div>
  );
}

// ── Quick Apply Modal ─────────────────────────────────────────────────────────
function ApplyModal({ job, user, cvData, onClose, onSuccess }: {
  job: UKJob;
  user: any;
  cvData: any;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [name, setName] = useState(user?.fullName || '');
  const [email, setEmail] = useState(user?.primaryEmailAddress?.emailAddress || '');
  const [phone, setPhone] = useState(user?.phoneNumbers?.[0]?.phoneNumber || '');
  const [coverLetter, setCoverLetter] = useState('');
  const [generating, setGenerating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const generateCover = async () => {
    setGenerating(true);
    try {
      const res = await fetch('/api/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cvData,
          jobTitle: job.title,
          jobCompany: job.company,
          jobDescription: job.description,
          coverLetter: true,
        }),
      });
      const data = await res.json();
      if (data.coverLetterText) setCoverLetter(data.coverLetterText);
      else setCoverLetter(`Dear Hiring Manager,\n\nI am writing to express my strong interest in the ${job.title} position at ${job.company}.\n\n${cvData?.summary || ''}\n\nI look forward to discussing this opportunity.\n\nKind regards,\n${name}`);
    } catch {
      setCoverLetter(`Dear Hiring Manager,\n\nI am writing to express my interest in the ${job.title} role at ${job.company}. I believe my background makes me a strong candidate.\n\nKind regards,\n${name}`);
    }
    setGenerating(false);
  };

  const submit = async () => {
    if (!name || !email) { setErrorMsg('Name and email are required'); return; }
    setSubmitting(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/auto-apply/uk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobUrl: job.applyUrl,
          jobTitle: job.title,
          company: job.company,
          applyType: job.applyType,
          userCV: cvData,
          userEmail: email,
          userName: name,
          userPhone: phone,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStatus('success');
        setTimeout(onSuccess, 1800);
      } else {
        setErrorMsg(data.error || data.message || 'Application failed. Please try again.');
        setStatus('error');
      }
    } catch {
      setErrorMsg('Network error. Please try again.');
      setStatus('error');
    }
    setSubmitting(false);
  };

  const [isApplyMobile, setIsApplyMobile] = useState(false);
  useEffect(() => {
    const c = () => setIsApplyMobile(window.innerWidth < 768);
    c();
    window.addEventListener('resize', c);
    return () => window.removeEventListener('resize', c);
  }, []);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 500, display: 'flex', alignItems: isApplyMobile ? 'flex-start' : 'center', justifyContent: 'center', padding: isApplyMobile ? 0 : 20 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: '#0A2E18', border: isApplyMobile ? 'none' : '1.5px solid rgba(200,230,0,0.25)', borderRadius: isApplyMobile ? 0 : 20, padding: isApplyMobile ? '24px 18px' : '32px 28px', maxWidth: isApplyMobile ? '100%' : 520, width: '100%', maxHeight: '90vh', height: isApplyMobile ? '100dvh' : 'auto', overflowY: 'auto', position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 14, right: 16, background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.35)', fontSize: 20, cursor: 'pointer' }}>✕</button>

        {status === 'success' ? (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
            <h3 style={{ fontSize: 22, fontWeight: 800, color: '#FFFFFF', marginBottom: 8 }}>Application sent!</h3>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>Your application to <strong style={{ color: '#C8E600' }}>{job.company}</strong> has been submitted.</p>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, color: '#C8E600', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 6 }}>Quick Apply</div>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#FFFFFF', marginBottom: 2 }}>{job.title}</h3>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>{job.company} · {job.location}</p>
              {job.salary && <p style={{ fontSize: 13, color: '#C8E600', fontWeight: 700, marginTop: 4 }}>{job.salary}</p>}
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 8, background: job.applyType === 'greenhouse' ? 'rgba(200,230,0,0.1)' : 'rgba(255,255,255,0.05)', border: `1px solid ${job.applyType === 'greenhouse' ? 'rgba(200,230,0,0.25)' : 'rgba(255,255,255,0.08)'}`, borderRadius: 99, padding: '3px 10px' }}>
                <span style={{ fontSize: 10, color: job.applyType === 'greenhouse' ? '#C8E600' : 'rgba(255,255,255,0.4)', fontWeight: 700 }}>
                  {job.applyType === 'greenhouse' ? '⚡ Direct submit via Greenhouse' : '📋 Pre-fill & review before sending'}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
              {[
                { label: 'Full Name *', value: name, setter: setName, placeholder: 'Your full name' },
                { label: 'Email *', value: email, setter: setEmail, placeholder: 'your@email.com' },
                { label: 'Phone', value: phone, setter: setPhone, placeholder: '+44 7xxx xxxxxx' },
              ].map(({ label, value, setter, placeholder }) => (
                <div key={label}>
                  <label style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.45)', fontWeight: 600, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.8px' }}>{label}</label>
                  <input
                    value={value}
                    onChange={e => setter(e.target.value)}
                    placeholder={placeholder}
                    style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 14px', fontSize: 14, color: '#FFFFFF', outline: 'none', fontFamily: 'inherit' }}
                  />
                </div>
              ))}

              <div style={{ background: cvData ? 'rgba(200,230,0,0.06)' : 'rgba(255,100,100,0.06)', border: `1px solid ${cvData ? 'rgba(200,230,0,0.2)' : 'rgba(255,100,100,0.2)'}`, borderRadius: 10, padding: '10px 14px', fontSize: 13 }}>
                {cvData
                  ? <span style={{ color: '#C8E600' }}>✓ CV loaded — {cvData.name || 'Your CV'} {cvData.skills?.length ? `· ${cvData.skills.length} skills` : ''}</span>
                  : <span style={{ color: 'rgba(255,150,150,0.8)' }}>⚠ No CV found — <a href="/uk/dashboard" style={{ color: '#C8E600', textDecoration: 'none' }}>upload your CV first</a></span>
                }
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                  <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px' }}>Cover Letter</label>
                  <button
                    onClick={generateCover}
                    disabled={generating}
                    style={{ fontSize: 11, color: '#C8E600', background: 'rgba(200,230,0,0.1)', border: '1px solid rgba(200,230,0,0.25)', borderRadius: 99, padding: '3px 10px', cursor: 'pointer', fontWeight: 700, opacity: generating ? 0.6 : 1 }}
                  >
                    {generating ? '✨ Generating...' : '✨ AI Generate'}
                  </button>
                </div>
                <textarea
                  value={coverLetter}
                  onChange={e => setCoverLetter(e.target.value)}
                  placeholder="Write a cover letter or click AI Generate..."
                  rows={5}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#FFFFFF', outline: 'none', resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6 }}
                />
              </div>
            </div>

            {errorMsg && (
              <div style={{ background: 'rgba(255,80,80,0.1)', border: '1px solid rgba(255,80,80,0.25)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#FF8080', marginBottom: 14 }}>
                {errorMsg}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={onClose} style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', fontSize: 14, fontWeight: 600, padding: '13px 20px', borderRadius: 99, cursor: 'pointer' }}>
                Cancel
              </button>
              <button
                onClick={submit}
                disabled={submitting}
                style={{ flex: 2, background: submitting ? 'rgba(200,230,0,0.5)' : '#C8E600', color: '#052A14', fontSize: 14, fontWeight: 800, padding: '13px 20px', borderRadius: 99, border: 'none', cursor: submitting ? 'not-allowed' : 'pointer' }}
              >
                {submitting ? 'Submitting...' : job.applyType === 'greenhouse' ? '⚡ Submit Application' : '📋 Prepare Application'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export const dynamic = 'force-dynamic';

const PAGE_SIZE = 20;

export default function UKJobsPage() {
  const { user, isSignedIn, isLoaded } = useUser();
  const router = useRouter();

  const [isMobile, setIsMobile] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [sub, setSub] = useState<Sub | null>(null);
  const [subLoading, setSubLoading] = useState(true);
  const [jobs, setJobs] = useState<UKJob[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [cvData, setCvData] = useState<any>(null);

  // Filter state — AI and manual share these
  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [minSalary, setMinSalary] = useState<number | null>(null);
  const [aiActive, setAiActive] = useState(false);

  const [page, setPage] = useState(1);
  const [selectedJob, setSelectedJob] = useState<UKJob | null>(null);
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [optimiseJob, setOptimiseJob] = useState<UKJob | null>(null);
  const [pendingJobId, setPendingJobId] = useState<string | null>(null);

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
    if (!isLoaded) return;
    if (!isSignedIn) { router.replace('/sign-in'); return; }
    fetch('/api/uk/subscription')
      .then(r => r.json())
      .then(data => {
        setSub(data);
        setSubLoading(false);
      })
      .catch(() => { setSub({ active: false, plan: null, credits: 0 }); setSubLoading(false); });
  }, [isLoaded, isSignedIn, router]);

  useEffect(() => {
    fetch('/api/jobs/uk')
      .then(r => r.json())
      .then(data => { setJobs(data.jobs || []); setJobsLoading(false); })
      .catch(() => setJobsLoading(false));
    try {
      const stored = localStorage.getItem('jobsesame_cv_data');
      if (stored) setCvData(JSON.parse(stored));
    } catch {}
    // Check for pending job saved before subscribe redirect
    try {
      const raw = localStorage.getItem('jobsesame_uk_pending_job');
      if (raw) {
        const pending = JSON.parse(raw);
        if (pending?.id) setPendingJobId(pending.id);
        localStorage.removeItem('jobsesame_uk_pending_job');
      }
    } catch {}
  }, []);

  // Scroll to the pending job once jobs have rendered
  useEffect(() => {
    if (!pendingJobId || jobsLoading) return;
    const timer = setTimeout(() => {
      const el = document.getElementById(`job-${pendingJobId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.style.borderColor = 'rgba(200,230,0,0.55)';
        setTimeout(() => { el.style.borderColor = ''; }, 2200);
      }
      setPendingJobId(null);
    }, 350);
    return () => clearTimeout(timer);
  }, [pendingJobId, jobsLoading]);

  const handleAIResult = (params: any) => {
    setSearch(params.keywords || '');
    setLocationFilter(params.location || '');
    setMinSalary(params.minSalary || null);
    if (params.tab && params.tab !== 'all') setActiveTab(params.tab as TabId);
    else if (params.jobType === 'remote') setActiveTab('remote');
    setPage(1);
    setAiActive(true);
  };

  const handleAIClear = () => {
    setSearch('');
    setLocationFilter('');
    setMinSalary(null);
    setActiveTab('all');
    setPage(1);
    setAiActive(false);
  };

  if (!isLoaded || subLoading) {
    return (
      <main style={{ background: '#052A14', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 36, height: 36, border: '3px solid rgba(200,230,0,0.2)', borderTopColor: '#C8E600', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>Loading UK Jobs...</p>
        </div>
      </main>
    );
  }

  const planBadge = sub?.active
    ? sub.plan === 'trial' ? `🎁 ${sub.trialDaysLeft ?? 7}d free trial`
    : sub.plan === 'credits' ? `${sub.credits} credits`
    : sub.plan === 'pro' ? '∞ Pro' : null
    : null;

  const filtered = filterJobs(jobs, activeTab, search, locationFilter, minSalary);
  const sorted = cvData ? [...filtered].sort((a, b) => (calcMatch(b, cvData) ?? 0) - (calcMatch(a, cvData) ?? 0)) : filtered;
  const visible = sorted.slice(0, page * PAGE_SIZE);
  const hasMore = visible.length < sorted.length;

  const tabStyle = (id: TabId): React.CSSProperties => ({
    padding: '8px 16px', borderRadius: 99, fontSize: 12, fontWeight: 700,
    cursor: 'pointer', border: 'none', whiteSpace: 'nowrap',
    background: activeTab === id ? '#C8E600' : 'rgba(255,255,255,0.05)',
    color: activeTab === id ? '#052A14' : 'rgba(255,255,255,0.55)',
    transition: 'all 0.15s',
  });

  return (
    <main style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", background: '#052A14', minHeight: '100vh', margin: 0, padding: 0 }}>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .job-card { transition: border-color 0.18s, transform 0.18s; }
        .job-card:hover { border-color: rgba(200,230,0,0.3) !important; transform: translateY(-2px); }
        input::placeholder, textarea::placeholder { color: rgba(255,255,255,0.2); }
        input:focus, textarea:focus { border-color: rgba(200,230,0,0.35) !important; }
        ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: rgba(200,230,0,0.2); border-radius: 3px; }
      `}</style>

      {/* OPTIMISE MODAL */}
      {optimiseJob && (
        <OptimiseModal
          job={optimiseJob}
          cvData={cvData}
          sub={sub}
          onClose={() => setOptimiseJob(null)}
        />
      )}

      {/* APPLY MODAL */}
      {selectedJob && (
        <ApplyModal
          job={selectedJob}
          user={user}
          cvData={cvData}
          onClose={() => setSelectedJob(null)}
          onSuccess={() => {
            setAppliedIds(prev => new Set(prev).add(selectedJob.id));
            fetch('/api/user/applications', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ jobTitle: selectedJob.title, company: selectedJob.company, location: selectedJob.location, jobUrl: selectedJob.applyUrl, jobSource: selectedJob.source, market: 'GB' }),
            }).catch(() => {});
            setSelectedJob(null);
            if (sub?.plan === 'credits') setSub(s => s ? { ...s, credits: s.credits - 1 } : s);
          }}
        />
      )}

      <NavUK planBadge={planBadge} />

      {/* STICKY SUBSCRIBE BANNER — unsubscribed users only */}
      {!sub?.active && (
        <div style={{
          position: 'sticky',
          top: 64,
          zIndex: 190,
          background: 'rgba(4,30,15,0.97)',
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)',
          borderBottom: '1px solid rgba(200,230,0,0.14)',
          padding: isMobile ? '10px 16px' : '10px 24px',
        }}>
          <div style={{ maxWidth: 1000, margin: '0 auto', display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', justifyContent: 'space-between', gap: 10, flexDirection: isMobile ? 'column' : 'row' }}>
            <div style={{ fontSize: isMobile ? 12 : 13, color: 'rgba(255,255,255,0.65)', fontWeight: 600 }}>
              Browsing <span style={{ color: '#C8E600', fontWeight: 800 }}>{jobs.length > 0 ? jobs.length.toLocaleString() : '...'}</span> UK jobs — subscribe to apply
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', width: isMobile ? '100%' : 'auto' }}>
              <a href="/uk/subscribe?plan=credits" style={{ background: '#C8E600', color: '#052A14', fontSize: 12, fontWeight: 800, padding: '7px 16px', borderRadius: 99, textDecoration: 'none', whiteSpace: 'nowrap', flex: isMobile ? 1 : 'none', textAlign: 'center' }}>
                Get 20 Credits — £10
              </a>
              <a href="/uk/subscribe?plan=pro" style={{ background: 'rgba(200,230,0,0.1)', border: '1px solid rgba(200,230,0,0.28)', color: '#C8E600', fontSize: 12, fontWeight: 700, padding: '7px 16px', borderRadius: 99, textDecoration: 'none', whiteSpace: 'nowrap', flex: isMobile ? 1 : 'none', textAlign: 'center' }}>
                Go Pro — £21/month
              </a>
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
          <div style={{ background: '#041E0F', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: isMobile ? '16px 16px 0' : '24px 24px 0' }}>
            <div style={{ maxWidth: 1000, margin: '0 auto' }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 16, gap: 12, flexWrap: 'wrap' }}>
                <div>
                  <h1 style={{ fontSize: isMobile ? 20 : 26, fontWeight: 800, color: '#FFFFFF', marginBottom: 4 }}>UK Jobs</h1>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>
                    {jobs.length > 0 ? `${filtered.length.toLocaleString()} of ${jobs.length.toLocaleString()} jobs` : 'Loading jobs...'} · Updated every 30 min
                    {minSalary ? ` · £${(minSalary / 1000).toFixed(0)}k+ salary` : ''}
                  </p>
                </div>
                {cvData && (
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '6px 12px' }}>
                    🎯 Sorted by CV match — {cvData.title || 'your profile'}
                  </div>
                )}
              </div>

              {/* AI SEARCH ASSISTANT */}
              <AISearchAssistant
                onResult={handleAIResult}
                onClear={handleAIClear}
                hasActiveAI={aiActive}
                isMobile={isMobile}
              />

              {/* Manual search */}
              <div style={{ marginBottom: 12 }}>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', fontWeight: 600, letterSpacing: '0.6px', textTransform: 'uppercase', marginBottom: 8 }}>
                  Or search manually
                </p>
                <form onSubmit={e => { e.preventDefault(); setPage(1); }} style={{ display: 'flex', gap: 8, flexDirection: isMobile ? 'column' : 'row' }}>
                  <input
                    value={search}
                    onChange={e => { setSearch(e.target.value); setPage(1); setAiActive(false); }}
                    placeholder="Job title, company, or skill..."
                    style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '11px 16px', fontSize: 14, color: '#FFFFFF', outline: 'none', fontFamily: 'inherit' }}
                  />
                  <input
                    value={locationFilter}
                    onChange={e => { setLocationFilter(e.target.value); setPage(1); setAiActive(false); }}
                    placeholder="City or region..."
                    style={{ width: isMobile ? '100%' : 180, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '11px 16px', fontSize: 14, color: '#FFFFFF', outline: 'none', fontFamily: 'inherit' }}
                  />
                </form>
              </div>

              {/* Tabs */}
              <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 12, scrollbarWidth: 'none' }}>
                {TABS.map(t => (
                  <button key={t.id} style={tabStyle(t.id)} onClick={() => { setActiveTab(t.id); setPage(1); }}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* JOB LIST */}
          <div style={{ maxWidth: 1000, margin: '0 auto', padding: isMobile ? '16px' : '24px' }}>
            {jobsLoading ? (
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : isDesktop ? 'repeat(3,1fr)' : '1fr 1fr', gap: 14 }}>
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '20px 22px', minHeight: 130 }}>
                    <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 6, height: 16, width: '55%', marginBottom: 10 }} />
                    <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 6, height: 12, width: '35%', marginBottom: 8 }} />
                    <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 6, height: 12, width: '45%' }} />
                  </div>
                ))}
              </div>
            ) : visible.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '64px 24px' }}>
                <div style={{ fontSize: 40, marginBottom: 16 }}>🔍</div>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 15 }}>No jobs match your search. Try different keywords or clear filters.</p>
                <button onClick={handleAIClear} style={{ marginTop: 16, background: 'rgba(200,230,0,0.1)', border: '1px solid rgba(200,230,0,0.25)', color: '#C8E600', fontSize: 13, fontWeight: 700, padding: '10px 20px', borderRadius: 99, cursor: 'pointer' }}>
                  Clear all filters
                </button>
              </div>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : isDesktop ? 'repeat(3,1fr)' : '1fr 1fr', gap: 14, animation: 'fadeIn 0.3s ease-out' }}>
                  {visible.map(job => {
                    const matchPct = calcMatch(job, cvData);
                    const badge = matchPct !== null ? matchBadge(matchPct) : null;
                    const applied = appliedIds.has(job.id);
                    const locked = !sub?.active;
                    return (
                      <div key={job.id} id={`job-${job.id}`} className="job-card" style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${applied ? 'rgba(200,230,0,0.3)' : locked ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.07)'}`, borderRadius: 14, padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 10, position: 'relative' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 15, fontWeight: 700, color: '#FFFFFF', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{job.title}</div>
                            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>{job.company}</div>
                          </div>
                          {badge && (
                            <div style={{ background: badge.bg, color: badge.color, fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 99, whiteSpace: 'nowrap', flexShrink: 0 }}>
                              {badge.label}
                            </div>
                          )}
                        </div>

                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>📍 {job.location}</span>
                          {job.salary && <span style={{ fontSize: 12, color: '#C8E600', fontWeight: 700 }}>{job.salary}</span>}
                          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.04)', borderRadius: 99, padding: '2px 7px' }}>{job.source}</span>
                        </div>

                        {job.tags.length > 0 && (
                          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', filter: locked ? 'blur(4px)' : 'none', userSelect: locked ? 'none' : 'auto', pointerEvents: locked ? 'none' : 'auto' }}>
                            {job.tags.slice(0, 3).map(tag => (
                              <span key={tag} style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.04)', borderRadius: 6, padding: '2px 7px', fontWeight: 600 }}>{tag}</span>
                            ))}
                          </div>
                        )}

                        <button
                          onClick={() => setOptimiseJob(job)}
                          style={{ width: '100%', background: 'rgba(200,230,0,0.07)', border: '1px solid rgba(200,230,0,0.2)', color: '#C8E600', fontSize: 12, fontWeight: 700, padding: '8px', borderRadius: 8, cursor: 'pointer', textAlign: 'center' }}
                        >
                          ✦ Optimise CV for this job
                        </button>

                        <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
                          {locked ? (
                            <button
                              onClick={() => {
                                try {
                                  localStorage.setItem('jobsesame_uk_pending_job', JSON.stringify(job));
                                } catch {}
                                router.push('/uk/subscribe');
                              }}
                              style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: 700, padding: '10px 16px', borderRadius: 99, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                            >
                              🔒 Subscribe to Apply
                            </button>
                          ) : applied ? (
                            <div style={{ flex: 1, textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#C8E600', padding: '10px', background: 'rgba(200,230,0,0.08)', borderRadius: 99, border: '1px solid rgba(200,230,0,0.2)' }}>
                              ✓ Applied
                            </div>
                          ) : (
                            <button
                              onClick={() => setSelectedJob(job)}
                              style={{ flex: 1, background: '#C8E600', color: '#052A14', fontSize: 13, fontWeight: 800, padding: '10px 16px', borderRadius: 99, border: 'none', cursor: 'pointer' }}
                            >
                              ⚡ Quick Apply
                            </button>
                          )}
                          <a
                            href={job.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: 600, padding: '10px 14px', borderRadius: 99, textDecoration: 'none', border: '1px solid rgba(255,255,255,0.08)', whiteSpace: 'nowrap' }}
                          >
                            View →
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {hasMore && (
                  <div style={{ textAlign: 'center', marginTop: 28 }}>
                    <button
                      onClick={() => setPage(p => p + 1)}
                      style={{ background: 'rgba(200,230,0,0.1)', border: '1px solid rgba(200,230,0,0.25)', color: '#C8E600', fontSize: 14, fontWeight: 700, padding: '12px 32px', borderRadius: 99, cursor: 'pointer' }}
                    >
                      Load more ({sorted.length - visible.length} remaining)
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

      {/* FAQ */}
      <section style={{ maxWidth: 700, margin: '0 auto', padding: '48px 24px 80px' }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#FFFFFF', letterSpacing: -0.4, marginBottom: 28 }}>Common questions from UK job seekers</h2>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          {[
            {
              q: 'Can I apply for UK jobs from outside the UK?',
              a: 'Yes. Many UK employers actively hire internationally, especially in tech, healthcare, and finance. You can apply from anywhere — our AI tailors your CV to each role and submits directly through employer portals. Just make sure your CV mentions your visa status or right-to-work eligibility clearly.',
            },
            {
              q: 'Which roles offer visa sponsorship in the UK?',
              a: 'Tech (software engineers, data scientists), healthcare (doctors, nurses, allied health), engineering, and certain finance roles regularly offer Skilled Worker visa sponsorship. Filter by "Sponsorship available" when browsing, or look for companies on the official UK Home Office sponsor list. We tag jobs where sponsorship is mentioned in the description.',
            },
            {
              q: 'What salary should I expect as an international applicant?',
              a: 'UK salaries vary significantly by role and region. London typically pays 15–25% more than other cities. Entry-level tech roles start around £30k–£40k; senior engineers can earn £80k–£120k+. For Skilled Worker visas, you must meet the minimum salary threshold (currently £26,200 or the going rate for the role, whichever is higher). Our salary intelligence tool shows realistic ranges for your field.',
            },
            {
              q: 'How does the AI CV rewriter work?',
              a: 'Upload your existing CV once. When you click Quick Apply on a job, our AI reads the job description and rewrites your CV in under 30 seconds — adding relevant keywords, restructuring bullet points to match what that employer wants, and rewriting your profile statement. Your facts (job titles, companies, dates) are never changed. The result is a tailored CV that passes ATS screening.',
            },
            {
              q: 'How fresh are the job listings?',
              a: 'Jobs are pulled from Adzuna UK, JSearch, and Remotive every 30 minutes. We remove expired listings automatically. Most jobs you see were posted within the last 7 days — many within 24 hours. Roles from high-demand employers refresh fastest.',
            },
            {
              q: 'What is the Skilled Worker visa and do I qualify?',
              a: 'The Skilled Worker visa lets you work in the UK for an approved employer for up to 5 years (renewable). You need a job offer from a licensed sponsor, meet the salary threshold, and have the required English language level. Points-based eligibility is assessed automatically. Many of our listed roles are at employers already approved as sponsors — look for the "Sponsorship" tag on job cards.',
            },
          ].map((faq, i) => (
            <div key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                style={{ width: '100%', background: 'transparent', border: 'none', padding: '17px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, cursor: 'pointer', textAlign: 'left' }}
              >
                <span style={{ fontSize: 14, fontWeight: 700, color: '#FFFFFF', lineHeight: 1.4 }}>{faq.q}</span>
                <span style={{ fontSize: 18, color: '#C8E600', flexShrink: 0, transform: openFaq === i ? 'rotate(45deg)' : 'none', transition: 'transform 0.18s', lineHeight: 1 }}>+</span>
              </button>
              {openFaq === i && (
                <div style={{ paddingBottom: 17, fontSize: 14, color: 'rgba(255,255,255,0.45)', lineHeight: 1.75 }}>
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
