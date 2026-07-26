export default function About() {
  return (
    <section className="section">
      <div className="container">

        {/* ── Page Intro ── */}
        <div className="page-intro reveal">
          <span className="page-kicker">About the Platform</span>
          <h1 className="page-title">A Public Accountability System for Santa Rosa City, Laguna</h1>
          <p className="page-subtitle">
            eSKala is the City of Santa Rosa's official Sangguniang Kabataan financial transparency portal — bringing barangay project reporting, citizen voices, and SK financial data into a single, structured public experience.
          </p>
        </div>

        {/* ── Mission Statement ── */}
        <div className="card card-accent reveal" style={{ marginBottom: '2rem', padding: '1.8rem 2rem' }}>
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            <span className="page-kicker">Our Mission</span>
            <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '1.15rem', lineHeight: 1.55, color: 'var(--ink)', maxWidth: '80ch' }}>
              To make youth governance visible, accountable, and participatory — empowering every Santa Rosa City resident to understand how their SK funds are used and to meaningfully engage with their barangay's youth programs.
            </p>
          </div>
        </div>

        {/* ── Core Features Grid ── */}
        <div style={{ marginBottom: '2rem' }} className="reveal">
          <div className="page-kicker" style={{ marginBottom: '1rem' }}>What This System Is Built To Do</div>
          <div className="card-grid card-grid-3">
            {[
              {
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                ),
                title: 'Public Trust & Transparency',
                desc: 'Citizens can review active SK initiatives, track budgets in real-time, and follow exactly where public funds go — from proposal to receipt.'
              },
              {
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                  </svg>
                ),
                title: 'Operational Clarity for SK Officers',
                desc: 'SK Chairpersons, Secretaries, and Treasurers each have role-specific dashboards for project management, financial reporting, and receipt tracking.'
              },
              {
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                  </svg>
                ),
                title: 'City-Wide Oversight for Administrators',
                desc: 'Super Admins manage all 18 barangay SK accounts, publish city-wide news, review activity logs, and maintain platform integrity.'
              },
              {
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                ),
                title: 'Citizen Participation',
                desc: 'Registered citizens can comment on projects, submit suggestions, and vote on community ideas — creating a direct feedback channel to their barangay SK.'
              },
              {
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
                  </svg>
                ),
                title: 'Receipt & Document Intelligence',
                desc: 'SK Treasurers can upload payment receipts for automatic OCR extraction of amounts, vendors, and dates — with manual override to ensure accuracy.'
              },
            ].map(f => (
              <div key={f.title} className="card">
                <div className="city-stat-icon" style={{ width: '40px', height: '40px', marginBottom: '0.85rem' }}>
                  {f.icon}
                </div>
                <div className="card-title" style={{ marginBottom: '0.4rem', fontSize: '0.96rem' }}>{f.title}</div>
                <p style={{ fontSize: '0.85rem', color: 'var(--muted)', lineHeight: 1.7, margin: 0 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Two columns: Why it matters + Legal Basis ── */}
        <div className="page-cols page-cols-2" style={{ marginBottom: '2rem' }}>

          {/* Why it matters */}
          <div className="card">
            <div className="card-header">
              <div>
                <span className="page-kicker">Why This Matters</span>
                <div className="card-title" style={{ marginTop: '0.3rem' }}>Youth Governance, Made Visible</div>
              </div>
            </div>
            <ul style={{ display: 'grid', gap: '0.65rem', paddingLeft: '0', listStyle: 'none' }}>
              {[
                'Barangay-level accountability for all SK projects and disbursements',
                'Accessible financial summaries that citizens can understand without a finance background',
                'Citizen feedback loops that keep public participation active and visible to SK officers',
                'Digital receipt and document workflows that reduce manual paperwork',
                'Full audit trail via activity logs for every action taken by SK officials',
                'Foundation for future OCR-based receipt intelligence and AI-assisted reporting',
              ].map(item => (
                <li key={item} style={{ display: 'flex', gap: '0.65rem', alignItems: 'flex-start' }}>
                  <span style={{ color: 'var(--maroon)', fontWeight: 700, fontSize: '0.8rem', lineHeight: 1.6, flexShrink: 0 }}>◆</span>
                  <span style={{ fontSize: '0.87rem', color: 'var(--muted)', lineHeight: 1.65 }}>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal basis */}
          <div style={{ display: 'grid', gap: '0.85rem' }}>
            <div className="card">
              <div className="card-header">
                <div>
                  <span className="page-kicker">Legal Basis</span>
                  <div className="card-title" style={{ marginTop: '0.3rem' }}>Governing Laws &amp; Frameworks</div>
                </div>
              </div>
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                {[
                  { law: 'RA 10742', title: 'SK Reform Act of 2015', desc: 'Establishes the legal framework for SK operations, elections, and fund management.' },
                  { law: 'RA 11768', title: 'SK Reform Act Amendment', desc: 'Enhances financial reporting requirements and digitization mandates for all SK units.' },
                  { law: 'RA 10173', title: 'Data Privacy Act of 2012', desc: 'Governs the collection and protection of citizen data within eSKala.' },
                  { law: 'DILG MC', title: 'Full Disclosure Policy', desc: 'Requires all SK units to publicly disclose financial reports within 30 days of quarter close.' },
                ].map(l => (
                  <div key={l.law} style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}>
                    <div style={{ padding: '0.28rem 0.6rem', background: 'rgba(118,0,49,0.1)', color: 'var(--maroon)', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '0.72rem', letterSpacing: '0.08em', flexShrink: 0 }}>{l.law}</div>
                    <div>
                      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.88rem', color: 'var(--ink)', marginBottom: '0.1rem' }}>{l.title}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{l.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CYDO Contact */}
            <div className="card" style={{ background: 'rgba(118,0,49,0.04)', border: '1.5px solid rgba(118,0,49,0.14)' }}>
              <span className="page-kicker" style={{ marginBottom: '0.6rem' }}>Contact Office</span>
              <div className="card-title" style={{ marginBottom: '0.6rem' }}>City Youth Development Office (CYDO)</div>
              <div style={{ display: 'grid', gap: '0.55rem', fontSize: '0.84rem', color: 'var(--muted)', fontFamily: 'var(--font-display)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: '3px' }}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                  <span style={{ lineHeight: 1.5 }}>City Government Center, J.P. Rizal, Santa Rosa City, Laguna</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13 19.79 19.79 0 0 1 1.62 4.45 2 2 0 0 1 3.6 2.27h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6 6l.92-.92a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 17l.19-.08z" /></svg>
                  (049) 530-0015 local 5011
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
                  cydo@santarosacity.gov.ph
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Roles Breakdown ── */}
        <div>
          <div className="page-kicker" style={{ marginBottom: '1rem' }}>Role-Based Access</div>
          <div className="card-grid card-grid-3">
            {[
              {
                role: 'Super Admin', color: 'var(--maroon)', bg: 'rgba(118,0,49,0.06)',
                abilities: ['Manage all 18 barangay SK accounts', 'Publish and edit city-wide news', 'Review full activity logs', 'Export audit reports to PDF', 'Barangay-level filtering & oversight']
              },
              {
                role: 'SK Officer', color: '#b45309', bg: 'rgba(180,83,9,0.06)',
                abilities: ['Chairperson + Secretary: Add & edit projects', 'Chairperson + Treasurer: Add receipts', 'Upload project documents (OCR-assisted)', 'Update project progress & status', 'View citizen comments & suggestions']
              },
              {
                role: 'Citizen', color: '#166534', bg: 'rgba(22,101,52,0.06)',
                abilities: ['View barangay SK financial reports', 'Track all active & completed projects', 'Submit comments and suggestions', 'View SK official profiles & contacts', 'Read city-wide news & announcements']
              },
            ].map(r => (
              <div key={r.role} className="card" style={{ background: r.bg, borderColor: `${r.color}22` }}>
                <div style={{ padding: '0.25rem 0.65rem', background: r.color, color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.85rem', display: 'inline-flex' }}>{r.role}</div>
                <ul style={{ display: 'grid', gap: '0.5rem', paddingLeft: '0', listStyle: 'none' }}>
                  {r.abilities.map(a => (
                    <li key={a} style={{ display: 'flex', gap: '0.55rem', alignItems: 'flex-start' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={r.color} strokeWidth="3" style={{ flexShrink: 0, marginTop: '3px' }}><polyline points="20 6 9 17 4 12" /></svg>
                      <span style={{ fontSize: '0.84rem', color: 'var(--muted)', lineHeight: 1.55 }}>{a}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  )
}
