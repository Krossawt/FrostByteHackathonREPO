export default function About() {
  return (
    <section className="section">
      <div className="container">

        {/* ── Page Intro ── */}
        <div className="page-intro">
          <span className="page-kicker">About the Platform</span>
          <h1 className="page-title">A Public Accountability System for Santa Rosa City, Laguna</h1>
          <p className="page-subtitle">
            eSKala is the City of Santa Rosa's official Sangguniang Kabataan financial transparency portal — bringing barangay project reporting, citizen voices, and SK financial data into a single, structured public experience.
          </p>
        </div>

        {/* ── Mission Statement ── */}
        <div className="card card-accent" style={{ marginBottom: '2rem', padding: '1.8rem 2rem' }}>
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            <span className="page-kicker">Our Mission</span>
            <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '1.15rem', lineHeight: 1.55, color: 'var(--ink)', maxWidth: '80ch' }}>
              To make youth governance visible, accountable, and participatory — empowering every Santa Rosa City resident to understand how their SK funds are used and to meaningfully engage with their barangay's youth programs.
            </p>
          </div>
        </div>

        {/* ── Core Features Grid ── */}
        <div style={{ marginBottom: '2rem' }}>
          <div className="page-kicker" style={{ marginBottom: '1rem' }}>What This System Is Built To Do</div>
          <div className="card-grid card-grid-3">
            {[
              {
                icon: '🏛', title: 'Public Trust & Transparency',
                desc: 'Citizens can review active SK initiatives, track budgets in real-time, and follow exactly where public funds go — from proposal to receipt.'
              },
              {
                icon: '⚡', title: 'Operational Clarity for SK Officers',
                desc: 'SK Chairpersons, Secretaries, and Treasurers each have role-specific dashboards for project management, financial reporting, and receipt tracking.'
              },
              {
                icon: '🏙', title: 'City-Wide Oversight for Administrators',
                desc: 'Super Admins manage all 18 barangay SK accounts, publish city-wide news, review activity logs, and maintain platform integrity.'
              },
              {
                icon: '💬', title: 'Citizen Participation',
                desc: 'Registered citizens can comment on projects, submit suggestions, and vote on community ideas — creating a direct feedback channel to their barangay SK.'
              },
              {
                icon: '📄', title: 'Receipt & Document Intelligence',
                desc: 'SK Treasurers can upload payment receipts for automatic OCR extraction of amounts, vendors, and dates — with manual override to ensure accuracy.'
              },
              {
                icon: '🔒', title: 'Role-Based Access Control',
                desc: 'Every feature is gated by role and position — ensuring each user sees exactly what they are authorized to view and manage, nothing more.'
              },
            ].map(f => (
              <div key={f.title} className="card">
                <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>{f.icon}</div>
                <div className="card-title" style={{ marginBottom: '0.4rem', fontSize: '1rem' }}>{f.title}</div>
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
                  <span style={{ color: 'var(--maroon)', fontWeight: 700, fontSize: '1rem', lineHeight: 1.4, flexShrink: 0 }}>◆</span>
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
                  <div className="card-title" style={{ marginTop: '0.3rem' }}>Governing Laws & Frameworks</div>
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
            <div className="card" style={{ background: 'rgba(118,0,49,0.06)', border: '1.5px solid rgba(118,0,49,0.15)' }}>
              <span className="page-kicker" style={{ marginBottom: '0.6rem', display: 'block' }}>Contact</span>
              <div className="card-title" style={{ marginBottom: '0.6rem' }}>City Youth Development Office (CYDO)</div>
              <div style={{ display: 'grid', gap: '0.4rem', fontSize: '0.86rem', color: 'var(--muted)', fontFamily: 'var(--font-display)' }}>
                <div>📍 City Government Center, J.P. Rizal, Santa Rosa City, Laguna</div>
                <div>📞 (049) 530-0015 local 5011</div>
                <div>📧 cydo@santarosacity.gov.ph</div>
                <div>🌐 santarosacity.gov.ph</div>
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
                      <span style={{ color: r.color, fontWeight: 700, fontSize: '0.85rem', lineHeight: 1.5, flexShrink: 0 }}>✓</span>
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
