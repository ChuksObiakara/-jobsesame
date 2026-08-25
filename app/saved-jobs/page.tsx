'use client';
import { useEffect, useState } from 'react';
import QuickApply, { isAutoApply } from '../components/QuickApply';
import Nav from '../components/Nav';
import Footer from '../components/Footer';
import { INK, INK_SOFT, INK_FAINT, LINE, PAPER, CARD, ACCENT, CLAY, SANS } from '../lib/theme';

interface Job {
  id: string | number;
  dbId?: string;
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

export default function SavedJobsPage() {
  const [savedJobs, setSavedJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  useEffect(() => {
    fetch('/api/user/saved-jobs')
      .then(r => r.json())
      .then(d => {
        const dbJobs: Job[] = (d.savedJobs || []).map((s: any) => ({
          id: s.id,
          dbId: s.id,
          title: s.jobTitle,
          company: s.company,
          location: s.location || '',
          description: (s.jobData as Record<string, unknown>)?.description as string || '',
          url: s.jobUrl,
          category: (s.jobData as Record<string, unknown>)?.category as string || '',
          level: (s.jobData as Record<string, unknown>)?.level as string || '',
          salary: (s.jobData as Record<string, unknown>)?.salary as string,
        }));
        if (dbJobs.length > 0) {
          setSavedJobs(dbJobs);
          localStorage.setItem('jobsesame_saved_jobs', JSON.stringify(dbJobs));
        } else {
          const local = localStorage.getItem('jobsesame_saved_jobs');
          if (local) setSavedJobs(JSON.parse(local));
        }
      })
      .catch(() => {
        const local = localStorage.getItem('jobsesame_saved_jobs');
        if (local) setSavedJobs(JSON.parse(local));
      });
  }, []);

  const removeJob = (job: Job) => {
    const updated = savedJobs.filter(j => String(j.id) !== String(job.id));
    setSavedJobs(updated);
    localStorage.setItem('jobsesame_saved_jobs', JSON.stringify(updated));
    fetch('/api/user/saved-jobs', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(job.dbId ? { jobId: job.dbId } : { jobUrl: job.url }),
    }).catch((err) => console.error('[saved-jobs] unsave failed:', err));
  };

  return (
    <main style={{fontFamily:SANS,background:PAPER,minHeight:"100vh"}}>
      {selectedJob && <QuickApply job={selectedJob} onClose={() => setSelectedJob(null)} />}

      <Nav theme="light" />

      <div style={{maxWidth:900,margin:"0 auto",padding:"40px 24px"}}>
        <div style={{marginBottom:28}}>
          <h1 style={{fontSize:28,fontWeight:600,color:INK,marginBottom:6}}>
            Saved jobs <span style={{color:ACCENT}}>({savedJobs.length})</span>
          </h1>
          <p style={{fontSize:14,color:INK_SOFT}}>Jobs you bookmarked — apply when you are ready.</p>
        </div>

        {savedJobs.length === 0 ? (
          <div style={{background:CARD,border:`1px solid ${LINE}`,borderRadius:8,padding:48,textAlign:"center"}}>
            <div style={{fontSize:40,marginBottom:16}}>🔖</div>
            <h2 style={{fontSize:18,fontWeight:700,color:INK,marginBottom:8}}>No saved jobs yet</h2>
            <p style={{fontSize:14,color:INK_SOFT,marginBottom:24}}>Click the bookmark icon on any job card to save it here.</p>
            <a href="/" style={{background:ACCENT,color:PAPER,fontSize:14,fontWeight:600,padding:"12px 28px",borderRadius:3,textDecoration:"none",display:"inline-block"}}>
              Browse jobs
            </a>
          </div>
        ) : (
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {savedJobs.map((job) => (
              <div key={job.id} style={{background:CARD,border:`1px solid ${LINE}`,borderRadius:6,padding:16,display:"flex",gap:12}}>
                <div style={{width:44,height:44,borderRadius:6,background:PAPER,border:`1px solid ${LINE}`,color:ACCENT,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:700,flexShrink:0}}>
                  {job.company.charAt(0).toUpperCase()}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:14,fontWeight:600,color:INK,marginBottom:2}}>{job.title}</div>
                  <div style={{fontSize:12,color:INK_SOFT,marginBottom:8}}>{job.company} · {job.location}</div>
                  <p style={{fontSize:12,color:INK_FAINT,lineHeight:1.6,margin:0}}>{job.description?.slice(0,120)}...</p>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:8,flexShrink:0}}>
                  <button onClick={() => setSelectedJob(job)}
                    style={{background:ACCENT,color:PAPER,fontSize:11,fontWeight:700,padding:"8px 14px",borderRadius:3,border:"none",cursor:"pointer",whiteSpace:"nowrap"}}>
                    {isAutoApply(job.url, job.type) ? '⚡ Quick Apply' : 'Apply'}
                  </button>
                  <button onClick={() => window.open(job.url, '_blank')}
                    style={{background:"transparent",color:INK_SOFT,fontSize:11,fontWeight:600,padding:"6px 14px",borderRadius:3,border:`1px solid ${LINE}`,cursor:"pointer",whiteSpace:"nowrap"}}>
                    View job
                  </button>
                  <button onClick={() => removeJob(job)}
                    style={{background:"transparent",color:CLAY,fontSize:11,fontWeight:600,padding:"6px 14px",borderRadius:3,border:`1px solid ${CLAY}`,cursor:"pointer",whiteSpace:"nowrap"}}>
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer theme="light" />
    </main>
  );
}
