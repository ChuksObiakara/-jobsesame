export default function PrivacyPage() {
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
          <h1 style={{fontSize:32,fontWeight:800,color:"#FFFFFF",marginBottom:8}}>Privacy Policy</h1>
          <p style={{fontSize:13,color:"#5A9A6A"}}>Last updated: January 2025</p>
        </div>

        {[
          {
            title: "1. Information We Collect",
            body: "We collect information you provide directly to us when you create an account, upload your CV, or use our services. This includes your name, email address, CV content, job application history, and usage data. We also collect technical information such as your IP address, browser type, and pages visited.",
          },
          {
            title: "2. How We Use Your Information",
            body: "We use the information we collect to provide, maintain, and improve our services — including AI-powered CV rewriting, job matching, and Quick Apply. We use your CV data solely to tailor job applications on your behalf. We do not sell your personal information to third parties.",
          },
          {
            title: "3. CV Data and AI Processing",
            body: "When you upload your CV, we extract structured data (name, skills, experience, education) and pass it to our AI system to rewrite it for specific job applications. Your CV data is processed securely and is not shared with employers without your explicit action of applying. We retain CV data to improve your experience across sessions.",
          },
          {
            title: "4. Data Storage and Security",
            body: "Your data is stored on secure servers. We use industry-standard encryption for data in transit and at rest. Some preferences and application history are stored in your browser's local storage for performance. We implement reasonable technical and organisational measures to protect your information.",
          },
          {
            title: "5. Cookies and Tracking",
            body: "We use cookies and similar technologies to maintain your session, remember your preferences, and analyse how our platform is used. You can control cookie settings in your browser, though disabling them may affect platform functionality.",
          },
          {
            title: "6. Payment Processing",
            body: "Payments are processed by Paystack, a PCI-DSS compliant payment provider. Jobsesame does not store your card details. When you purchase a Pro subscription or credits pack, your payment information is handled entirely by Paystack and subject to their privacy policy. We receive only a transaction confirmation and your email address to activate your subscription. Subscription billing is processed monthly and you may cancel at any time from your account settings.",
          },
          {
            title: "7. Third-Party Services",
            body: "We use Clerk for authentication, Paystack for payment processing, and AI APIs for CV processing. These third-party providers have their own privacy policies. Job listings are sourced from public job boards and partner APIs. We are not responsible for the privacy practices of external employer websites or payment providers.",
          },
          {
            title: "8. Your Rights",
            body: "You have the right to: access the personal data we hold about you; correct inaccurate data; request deletion of your account and associated data; withdraw consent for data processing at any time; request a portable copy of your data; lodge a complaint with a data protection authority. To exercise any of these rights, contact us at privacy@jobsesame.co.za. We will respond within 30 days.",
          },
          {
            title: "9. Data Retention",
            body: "We retain your data for as long as your account is active or as needed to provide our services. If you delete your account, we will delete your personal data within 30 days, except where we are required by law to retain it.",
          },
          {
            title: "10. Children's Privacy",
            body: "Jobsesame is not intended for users under the age of 16. We do not knowingly collect personal information from children under 16. If you believe a child has provided us with personal information, please contact us and we will delete it.",
          },
          {
            title: "11. Changes to This Policy",
            body: "We may update this Privacy Policy from time to time. We will notify you of significant changes by email or by posting a notice on our platform. Your continued use of Jobsesame after changes constitutes acceptance of the updated policy.",
          },
          {
            title: "12. Contact Us",
            body: "If you have questions about this Privacy Policy or how we handle your data, please contact us at privacy@jobsesame.co.za or write to us at Jobsesame, South Africa.",
          },
        ].map(section => (
          <div key={section.title} style={{marginBottom:28,background:"#072E16",border:"1.5px solid #1A4A2A",borderRadius:14,padding:24}}>
            <h2 style={{fontSize:15,fontWeight:800,color:"#C8E600",marginBottom:10}}>{section.title}</h2>
            <p style={{fontSize:13,color:"#A8D8B0",lineHeight:1.8,margin:0}}>{section.body}</p>
          </div>
        ))}

        <div style={{background:"#0D3A1A",border:"1px solid #1A5A2A",borderRadius:12,padding:20,marginTop:8,textAlign:"center"}}>
          <p style={{fontSize:13,color:"#5A9A6A",marginBottom:12}}>Questions about your privacy?</p>
          <a href="mailto:privacy@jobsesame.co.za" style={{background:"#C8E600",color:"#052A14",fontSize:13,fontWeight:800,padding:"10px 24px",borderRadius:99,textDecoration:"none",display:"inline-block"}}>
            Contact us
          </a>
        </div>
      </div>
    </main>
  );
}
