export default function TermsPage() {
  return (
    <main style={{fontFamily:"'Plus Jakarta Sans',sans-serif",background:"#052A14",minHeight:"100vh"}}>
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
        </div>
      </nav>

      <div style={{maxWidth:760,margin:"0 auto",padding:"48px 24px"}}>
        <div style={{marginBottom:36}}>
          <div style={{display:"inline-flex",alignItems:"center",gap:8,background:"rgba(200,230,0,0.12)",border:"1.5px solid #C8E600",borderRadius:99,padding:"5px 14px",fontSize:11,color:"#C8E600",fontWeight:700,marginBottom:16,letterSpacing:"0.8px"}}>
            LEGAL
          </div>
          <h1 style={{fontSize:32,fontWeight:800,color:"#FFFFFF",marginBottom:8}}>Terms of Service</h1>
          <p style={{fontSize:13,color:"#5A9A6A"}}>Last updated: January 2025</p>
        </div>

        {[
          {
            title: "1. Acceptance of Terms",
            body: "By accessing or using Jobsesame (jobsesame.co.za), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our platform. These terms apply to all visitors, users, and others who access or use the service.",
          },
          {
            title: "2. Description of Service",
            body: "Jobsesame is an AI-powered job search platform that helps users find jobs, rewrite their CVs for specific roles, and apply to positions quickly. We provide CV optimisation, job matching, and Quick Apply features. Job listings are sourced from third-party job boards and our partner APIs.",
          },
          {
            title: "3. User Accounts",
            body: "You must create an account to access certain features. You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account. You must provide accurate and complete information when registering. You may not use another person's account.",
          },
          {
            title: "4. Acceptable Use",
            body: "You agree not to use Jobsesame for any unlawful purpose or in any way that could damage, disable, or impair our services. You may not attempt to gain unauthorised access to any part of the platform, scrape data automatically, submit false information, or use the platform to spam employers.",
          },
          {
            title: "5. CV and Personal Data",
            body: "By uploading your CV, you grant Jobsesame a licence to process, store, and use its contents to provide our services — including AI rewriting and job matching. You retain ownership of your CV. You confirm that your CV content is accurate and does not infringe on any third-party rights.",
          },
          {
            title: "6. AI-Generated Content",
            body: "Our AI rewrites your CV to better match job descriptions. While we strive for accuracy and quality, AI-generated content may not always be perfect. You are responsible for reviewing AI-rewritten CVs before submission. Jobsesame makes no guarantees about interview or employment outcomes.",
          },
          {
            title: "7. Subscription and Payments",
            body: "Some features require a paid subscription. Subscription fees are billed in advance on a monthly basis. You may cancel at any time and your access will continue until the end of the current billing period. We do not offer refunds for partial billing periods. Prices may change with 30 days notice.",
          },
          {
            title: "8. Free Credits",
            body: "Free users receive a limited number of Quick Apply credits. These credits are non-transferable and may not be redeemed for cash. Jobsesame reserves the right to modify the number of free credits available at any time.",
          },
          {
            title: "9. Intellectual Property",
            body: "The Jobsesame platform, including its design, branding, and technology, is owned by Jobsesame and protected by intellectual property laws. You may not copy, reproduce, or distribute any part of our platform without written permission.",
          },
          {
            title: "10. Disclaimer of Warranties",
            body: "Jobsesame is provided on an 'as is' basis without warranties of any kind. We do not guarantee that job listings are accurate, current, or complete. We do not guarantee employment outcomes. Your use of the platform is at your own risk.",
          },
          {
            title: "11. Limitation of Liability",
            body: "To the maximum extent permitted by law, Jobsesame shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the platform. Our total liability to you shall not exceed the amount you paid us in the 12 months preceding the claim.",
          },
          {
            title: "12. Termination",
            body: "We reserve the right to suspend or terminate your account at any time if you breach these Terms of Service. You may also delete your account at any time. Upon termination, your right to use the platform ceases immediately.",
          },
          {
            title: "13. Governing Law",
            body: "These Terms are governed by the laws of South Africa. Any disputes arising from these Terms or your use of Jobsesame shall be subject to the exclusive jurisdiction of the courts of South Africa.",
          },
          {
            title: "14. Changes to Terms",
            body: "We may update these Terms of Service from time to time. We will notify you of significant changes by email or by posting a notice on the platform. Continued use of Jobsesame after changes constitutes acceptance of the updated Terms.",
          },
          {
            title: "15. Contact",
            body: "For questions about these Terms of Service, please contact us at legal@jobsesame.co.za.",
          },
        ].map(section => (
          <div key={section.title} style={{marginBottom:28,background:"#072E16",border:"1.5px solid #1A4A2A",borderRadius:14,padding:24}}>
            <h2 style={{fontSize:15,fontWeight:800,color:"#C8E600",marginBottom:10}}>{section.title}</h2>
            <p style={{fontSize:13,color:"#A8D8B0",lineHeight:1.8,margin:0}}>{section.body}</p>
          </div>
        ))}

        <div style={{background:"#0D3A1A",border:"1px solid #1A5A2A",borderRadius:12,padding:20,marginTop:8,textAlign:"center"}}>
          <p style={{fontSize:13,color:"#5A9A6A",marginBottom:12}}>Questions about our terms?</p>
          <a href="mailto:legal@jobsesame.co.za" style={{background:"#C8E600",color:"#052A14",fontSize:13,fontWeight:800,padding:"10px 24px",borderRadius:99,textDecoration:"none",display:"inline-block"}}>
            Contact us
          </a>
        </div>
      </div>
    </main>
  );
}
