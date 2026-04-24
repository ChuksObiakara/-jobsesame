'use client';
import { useState } from 'react';

export default function OptimisePage() {
  const [step, setStep] = useState<'input' | 'uploading' | 'rewriting' | 'result'>('input');
  const [jobTitle, setJobTitle] = useState('');
  const [jobCompany, setJobCompany] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [userPrompt, setUserPrompt] = useState('');
  const [rewrittenCV, setRewrittenCV] = useState<any>(null);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isPdf = file.type === 'application/pdf' || file.type === 'application/octet-stream' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) { setError('Please upload a PDF file only'); return; }
    if (!jobTitle) { setError('Please enter the job title first'); return; }
    if (!jobDescription) { setError('Please paste the job description first'); return; }

    setStep('uploading');
    setError('');

    try {
      const formData = new FormData();
      formData.append('cv', file);
      const cvResponse = await fetch('/api/cv', { method: 'POST', body: formData });
      const cvData = await cvResponse.json();

      if (!cvData.success) {
        setError(cvData.error || 'Failed to read CV');
        setStep('input');
        return;
      }

      setStep('rewriting');

      const rewriteResponse = await fetch('/api/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cvData: cvData.cvData,
          jobTitle,
          jobCompany,
          jobDescription,
          userPrompt,
        }),
      });

      const rewriteData = await rewriteResponse.json();

      if (rewriteData.success) {
        setRewrittenCV(rewriteData.rewrittenCV);
        setStep('result');
      } else {
        setError(rewriteData.error || 'Failed to rewrite CV');
        setStep('input');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
      setStep('input');
    }
  };

  const downloadPDF = async () => {
    if (!rewrittenCV) return;
    setDownloading(true);
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = 210;
      const margin = 20;
      const contentWidth = pageWidth - (margin * 2);
      let y = 20;

      doc.setFillColor(5, 42, 20);
      doc.rect(0, 0, 210, 28, 'F');
      doc.setTextColor(200, 230, 0);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text(rewrittenCV.name || '', margin, 13);
      doc.setTextColor(144, 200, 152);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(rewrittenCV.title || '', margin, 21);
      y = 36;

      doc.setTextColor(80, 80, 80);
      doc.setFontSize(9);
      const contactParts = [rewrittenCV.location, rewrittenCV.email, rewrittenCV.phone].filter(Boolean);
      if (contactParts.length) doc.text(contactParts.join('  |  '), margin, y);
      y += 8;

      doc.setDrawColor(5, 42, 20);
      doc.setLineWidth(0.5);
      doc.line(margin, y, pageWidth - margin, y);
      y += 6;

      const addSection = (title: string, content: () => void) => {
        if (y > 265) { doc.addPage(); y = 20; }
        doc.setFillColor(234, 245, 234);
        doc.rect(margin, y - 4, contentWidth, 7, 'F');
        doc.setTextColor(5, 42, 20);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text(title.toUpperCase(), margin + 2, y + 1);
        y += 7;
        doc.setTextColor(51, 51, 51);
        doc.setFont('helvetica', 'normal');
        content();
        y += 4;
      };

      if (rewrittenCV.summary) {
        addSection('Professional Summary', () => {
          doc.setFontSize(10);
          doc.setFont('helvetica', 'italic');
          const lines = doc.splitTextToSize(rewrittenCV.summary, contentWidth);
          doc.text(lines, margin, y);
          y += lines.length * 5;
        });
      }

      if (rewrittenCV.skills?.length) {
        addSection('Skills', () => {
          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
          const lines = doc.splitTextToSize(rewrittenCV.skills.join('  ·  '), contentWidth);
          doc.text(lines, margin, y);
          y += lines.length * 5;
        });
      }

      if (rewrittenCV.experience?.length) {
        addSection('Experience', () => {
          rewrittenCV.experience.forEach((exp: any) => {
            if (y > 265) { doc.addPage(); y = 20; }
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(5, 42, 20);
            doc.text(exp.title || '', margin, y);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(42, 106, 58);
            doc.setFontSize(9);
            doc.text(`${exp.company || ''}  |  ${exp.duration || ''}`, margin, y + 5);
            y += 10;
            doc.setTextColor(68, 68, 68);
            exp.bullets?.forEach((bullet: string) => {
              if (y > 265) { doc.addPage(); y = 20; }
              const lines = doc.splitTextToSize(`• ${bullet}`, contentWidth - 4);
              doc.text(lines, margin + 2, y);
              y += lines.length * 4.5;
            });
            y += 3;
          });
        });
      }

      if (rewrittenCV.education) {
        addSection('Education', () => {
          doc.setFontSize(10);
          doc.text(rewrittenCV.education, margin, y);
          y += 6;
        });
      }

      if (rewrittenCV.languages?.length) {
        addSection('Languages', () => {
          doc.setFontSize(10);
          doc.text(rewrittenCV.languages.join('  |  '), margin, y);
          y += 6;
        });
      }

      const fileName = `${(rewrittenCV.name || 'CV').replace(/\s+/g, '_')}_CV_for_${(jobCompany || jobTitle).replace(/\s+/g, '_')}.pdf`;
      doc.save(fileName);
    } catch (err) {
      setError('PDF download failed. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <main style={{fontFamily:"'Plus Jakarta Sans',sans-serif",background:"#052A14",minHeight:"100vh"}}>

      {/* NAV */}
      <nav style={{background:"#052A14",padding:"0 24px",height:64,display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:"1px solid #0D4A20",position:"sticky",top:0,zIndex:100}}>
        <a href="/" style={{display:"flex",alignItems:"center",gap:11,textDecoration:"none"}}>
          <div style={{width:38,height:38,background:"#C8E600",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center"}}>
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <circle cx="9" cy="9" r="5.5" stroke="#052A14" strokeWidth="2.2"/>
              <circle cx="9" cy="9" r="2.5" fill="#052A14" opacity="0.4"/>
              <line x1="13.5" y1="13.5" x2="20" y2="20" stroke="#052A14" strokeWidth="2.8" strokeLinecap="round"/>
              <line x1="16" y1="14" x2="14.5" y2="17" stroke="#052A14" strokeWidth="2" strokeLinecap="round"/>
              <line x1="19" y1="17" x2="17.5" y2="20" stroke="#052A14" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <span style={{fontSize:20,fontWeight:800,letterSpacing:-0.5}}>
            <span style={{color:"#FFFFFF"}}>job</span>
            <span style={{color:"#C8E600"}}>sesame</span>
          </span>
        </a>
        <div style={{display:"flex",gap:16,alignItems:"center"}}>
          <a href="/" style={{fontSize:13,color:"#A8D8B0",fontWeight:500,textDecoration:"none"}}>Find jobs</a>
          <a href="/dashboard" style={{fontSize:13,color:"#A8D8B0",fontWeight:500,textDecoration:"none"}}>Dashboard</a>
          <a href="/sign-up" style={{background:"#C8E600",color:"#052A14",fontSize:13,fontWeight:800,padding:"9px 22px",borderRadius:99,textDecoration:"none"}}>Start free</a>
        </div>
      </nav>

      <div style={{maxWidth:760,margin:"0 auto",padding:"40px 24px"}}>

        {/* HEADER */}
        <div style={{textAlign:"center",marginBottom:36}}>
          <div style={{display:"inline-flex",alignItems:"center",gap:8,background:"rgba(200,230,0,0.12)",border:"1.5px solid #C8E600",borderRadius:99,padding:"6px 16px",fontSize:11,color:"#C8E600",fontWeight:700,marginBottom:16,letterSpacing:"0.8px"}}>
            ✨ AI CV OPTIMISER
          </div>
          <h1 style={{fontSize:34,fontWeight:800,color:"#FFFFFF",marginBottom:8,lineHeight:1.1}}>
            Found a job anywhere?<br/><span style={{color:"#C8E600"}}>Let AI optimise your CV for it.</span>
          </h1>
          <p style={{fontSize:14,color:"#5A9A6A",lineHeight:1.7,maxWidth:520,margin:"0 auto"}}>
            Found a job on LinkedIn, Indeed, a recruiter email, or anywhere else? Paste the job description, upload your CV, and AI rewrites it perfectly in 30 seconds.
          </p>
        </div>

        {step === 'input' && (
          <div style={{background:"#072E16",border:"1.5px solid #1A4A2A",borderRadius:16,padding:28}}>

            <div style={{display:"flex",gap:12,marginBottom:16,flexWrap:"wrap"}}>
              <div style={{flex:1,minWidth:200}}>
                <label style={{fontSize:12,color:"#5A9A6A",fontWeight:600,display:"block",marginBottom:6}}>Job title *</label>
                <input
                  value={jobTitle}
                  onChange={e=>setJobTitle(e.target.value)}
                  placeholder="e.g. Senior Project Manager"
                  style={{width:"100%",padding:"11px 14px",border:"1.5px solid #1A5A2A",borderRadius:10,fontSize:14,color:"#FFFFFF",background:"#0D3A1A",outline:"none",fontFamily:"inherit"}}
                />
              </div>
              <div style={{flex:1,minWidth:200}}>
                <label style={{fontSize:12,color:"#5A9A6A",fontWeight:600,display:"block",marginBottom:6}}>Company name</label>
                <input
                  value={jobCompany}
                  onChange={e=>setJobCompany(e.target.value)}
                  placeholder="e.g. Standard Bank"
                  style={{width:"100%",padding:"11px 14px",border:"1.5px solid #1A5A2A",borderRadius:10,fontSize:14,color:"#FFFFFF",background:"#0D3A1A",outline:"none",fontFamily:"inherit"}}
                />
              </div>
            </div>

            <div style={{marginBottom:16}}>
              <label style={{fontSize:12,color:"#5A9A6A",fontWeight:600,display:"block",marginBottom:6}}>
                Job description * <span style={{color:"#3A7A4A",fontWeight:400}}>— paste the full job description here</span>
              </label>
              <textarea
                value={jobDescription}
                onChange={e=>setJobDescription(e.target.value)}
                placeholder="Paste the full job description here. The more detail you provide the better AI can tailor your CV..."
                rows={8}
                style={{width:"100%",padding:"11px 14px",border:"1.5px solid #1A5A2A",borderRadius:10,fontSize:13,color:"#FFFFFF",background:"#0D3A1A",outline:"none",fontFamily:"inherit",resize:"vertical",lineHeight:1.6}}
              />
            </div>

            <div style={{marginBottom:20}}>
              <label style={{fontSize:12,color:"#5A9A6A",fontWeight:600,display:"block",marginBottom:6}}>
                Special instructions <span style={{color:"#3A7A4A",fontWeight:400}}>(optional)</span>
              </label>
              <textarea
                value={userPrompt}
                onChange={e=>setUserPrompt(e.target.value)}
                placeholder="e.g. Make it more senior, emphasise my leadership experience, keep it under one page, focus on my technical skills..."
                rows={2}
                style={{width:"100%",padding:"11px 14px",border:"1.5px solid #1A5A2A",borderRadius:10,fontSize:13,color:"#FFFFFF",background:"#0D3A1A",outline:"none",fontFamily:"inherit",resize:"vertical"}}
              />
            </div>

            <div style={{background:"#0D3A1A",borderRadius:12,padding:20,textAlign:"center",border:"2px dashed #1A5A2A"}}>
              <div style={{fontSize:28,marginBottom:10}}>📄</div>
              <div style={{fontSize:14,fontWeight:700,color:"#FFFFFF",marginBottom:4}}>Upload your CV</div>
              <div style={{fontSize:12,color:"#5A9A6A",marginBottom:16}}>PDF only — AI reads it and rewrites it for this job</div>
              <label
                style={{cursor:"pointer"}}
                onClick={e => {
                  if (!jobTitle || !jobDescription) {
                    e.preventDefault();
                    setError('Please fill in the job title and job description above before uploading your CV.');
                  } else {
                    setError('');
                  }
                }}
              >
                <input type="file" accept=".pdf" onChange={handleFileUpload} style={{display:"none"}}/>
                <span style={{background:"#C8E600",color:"#052A14",fontSize:14,fontWeight:800,padding:"12px 32px",borderRadius:99,cursor:"pointer",display:"inline-block"}}>
                  Choose CV and optimise now
                </span>
              </label>
            </div>

            {error && (
              <div style={{background:"rgba(163,45,45,0.2)",border:"1px solid #A32D2D",borderRadius:10,padding:"10px 16px",fontSize:13,color:"#F09595",marginTop:16}}>
                {error}
              </div>
            )}

            <div style={{display:"flex",gap:16,marginTop:20,flexWrap:"wrap"}}>
              {[["📋","Paste from anywhere","LinkedIn, Indeed, email, WhatsApp, anywhere"],["✨","AI rewrites in 30s","Tailored specifically for this role"],["📥","Downloads as PDF","Clean professional CV ready to send"]].map(([icon,title,desc])=>(
                <div key={title} style={{flex:1,minWidth:140,textAlign:"center"}}>
                  <div style={{fontSize:20,marginBottom:4}}>{icon}</div>
                  <div style={{fontSize:12,fontWeight:700,color:"#FFFFFF",marginBottom:2}}>{title}</div>
                  <div style={{fontSize:11,color:"#3A7A4A"}}>{desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {(step === 'uploading' || step === 'rewriting') && (
          <div style={{background:"#072E16",border:"1.5px solid #C8E600",borderRadius:16,padding:48,textAlign:"center"}}>
            <div style={{fontSize:48,marginBottom:20}}>✨</div>
            <h2 style={{fontSize:22,fontWeight:800,color:"#FFFFFF",marginBottom:8}}>
              {step === 'uploading' ? 'Reading your CV...' : 'AI is optimising your CV...'}
            </h2>
            <p style={{fontSize:14,color:"#5A9A6A",marginBottom:8}}>
              {step === 'uploading' ? 'Extracting your experience and skills' : `Tailoring specifically for ${jobTitle} at ${jobCompany || 'this company'}`}
            </p>
            {userPrompt && step === 'rewriting' && (
              <div style={{background:"#0D3A1A",borderRadius:10,padding:"8px 14px",marginTop:12,fontSize:12,color:"#C8E600",fontStyle:"italic",display:"inline-block"}}>
                Following: &ldquo;{userPrompt}&rdquo;
              </div>
            )}
            <div style={{fontSize:12,color:"#3A7A4A",marginTop:16,fontStyle:"italic"}}>About 15 to 30 seconds</div>
          </div>
        )}

        {step === 'result' && rewrittenCV && (
          <div>
            <div style={{background:"#C8E600",borderRadius:14,padding:16,marginBottom:20,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10}}>
              <div>
                <div style={{fontSize:15,fontWeight:800,color:"#052A14"}}>CV optimised for {jobTitle} {jobCompany ? `at ${jobCompany}` : ''}</div>
                <div style={{fontSize:12,color:"#2A5A14"}}>Match score: {rewrittenCV.match_score}%  ·  ATS score: {rewrittenCV.ats_score}%</div>
              </div>
              <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                <button
                  onClick={downloadPDF}
                  disabled={downloading}
                  style={{background:"#052A14",color:"#C8E600",fontSize:13,fontWeight:800,padding:"10px 20px",borderRadius:99,border:"none",cursor:downloading?"default":"pointer",opacity:downloading?0.7:1}}>
                  {downloading ? 'Preparing...' : '📥 Download PDF'}
                </button>
                <button
                  onClick={()=>{ setStep('input'); setRewrittenCV(null); setJobTitle(''); setJobCompany(''); setJobDescription(''); setUserPrompt(''); }}
                  style={{background:"transparent",color:"#052A14",fontSize:13,fontWeight:600,padding:"10px 16px",borderRadius:99,border:"1.5px solid #052A14",cursor:"pointer"}}>
                  Optimise another CV
                </button>
              </div>
            </div>

            <div style={{background:"#072E16",border:"1.5px solid #1A4A2A",borderRadius:16,padding:28}}>
              <h2 style={{fontSize:20,fontWeight:800,color:"#FFFFFF",marginBottom:4}}>{rewrittenCV.name}</h2>
              <div style={{fontSize:14,color:"#C8E600",fontWeight:600,marginBottom:2}}>{rewrittenCV.title}</div>
              <div style={{fontSize:12,color:"#5A9A6A",marginBottom:16}}>{rewrittenCV.location}</div>

              {rewrittenCV.summary && (
                <div style={{marginBottom:20}}>
                  <div style={{fontSize:11,color:"#3A7A4A",fontWeight:700,letterSpacing:"1px",textTransform:"uppercase",marginBottom:8,paddingBottom:4,borderBottom:"1px solid #1A4A2A"}}>Professional Summary</div>
                  <p style={{fontSize:13,color:"#A8D8B0",lineHeight:1.7,fontStyle:"italic"}}>{rewrittenCV.summary}</p>
                </div>
              )}

              {rewrittenCV.skills?.length > 0 && (
                <div style={{marginBottom:20}}>
                  <div style={{fontSize:11,color:"#3A7A4A",fontWeight:700,letterSpacing:"1px",textTransform:"uppercase",marginBottom:8,paddingBottom:4,borderBottom:"1px solid #1A4A2A"}}>Skills</div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                    {rewrittenCV.skills.map((skill: string) => (
                      <span key={skill} style={{background:"#0D4A20",color:"#90C898",fontSize:11,padding:"3px 10px",borderRadius:99,fontWeight:600}}>{skill}</span>
                    ))}
                  </div>
                </div>
              )}

              {rewrittenCV.keywords_added?.length > 0 && (
                <div style={{marginBottom:20}}>
                  <div style={{fontSize:11,color:"#3A7A4A",fontWeight:700,letterSpacing:"1px",textTransform:"uppercase",marginBottom:8,paddingBottom:4,borderBottom:"1px solid #1A4A2A"}}>Keywords added for ATS</div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                    {rewrittenCV.keywords_added.map((kw: string) => (
                      <span key={kw} style={{background:"rgba(200,230,0,0.1)",color:"#C8E600",fontSize:11,padding:"3px 10px",borderRadius:99,fontWeight:600,border:"1px solid rgba(200,230,0,0.3)"}}>{kw}</span>
                    ))}
                  </div>
                </div>
              )}

              {rewrittenCV.experience?.map((exp: any, i: number) => (
                <div key={i} style={{marginBottom:14,padding:14,background:"#0D3A1A",borderRadius:10}}>
                  <div style={{fontSize:13,fontWeight:700,color:"#FFFFFF",marginBottom:2}}>{exp.title}</div>
                  <div style={{fontSize:12,color:"#C8E600",marginBottom:8}}>{exp.company} · {exp.duration}</div>
                  {exp.bullets?.map((bullet: string, j: number) => (
                    <div key={j} style={{fontSize:12,color:"#90C898",lineHeight:1.7,paddingLeft:14,position:"relative"}}>
                      <span style={{position:"absolute",left:3,color:"#C8E600"}}>·</span>{bullet}
                    </div>
                  ))}
                </div>
              ))}

              {rewrittenCV.education && (
                <div style={{marginBottom:14}}>
                  <div style={{fontSize:11,color:"#3A7A4A",fontWeight:700,letterSpacing:"1px",textTransform:"uppercase",marginBottom:6,paddingBottom:4,borderBottom:"1px solid #1A4A2A"}}>Education</div>
                  <div style={{fontSize:13,color:"#90C898"}}>{rewrittenCV.education}</div>
                </div>
              )}

              {rewrittenCV.languages?.length > 0 && (
                <div>
                  <div style={{fontSize:11,color:"#3A7A4A",fontWeight:700,letterSpacing:"1px",textTransform:"uppercase",marginBottom:6,paddingBottom:4,borderBottom:"1px solid #1A4A2A"}}>Languages</div>
                  <div style={{fontSize:13,color:"#90C898"}}>{rewrittenCV.languages.join('  |  ')}</div>
                </div>
              )}
            </div>

            <div style={{background:"#072E16",border:"1.5px solid #1A4A2A",borderRadius:14,padding:20,marginTop:16,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
              <div>
                <div style={{fontSize:14,fontWeight:800,color:"#FFFFFF",marginBottom:4}}>Want unlimited CV optimisations?</div>
                <div style={{fontSize:12,color:"#5A9A6A"}}>Go Pro for R370/month — unlimited optimisations, Quick Apply, auto-apply and more.</div>
              </div>
              <a href="/sign-up" style={{background:"#C8E600",color:"#052A14",fontSize:13,fontWeight:800,padding:"10px 24px",borderRadius:99,textDecoration:"none",whiteSpace:"nowrap"}}>
                Unlock Pro
              </a>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
