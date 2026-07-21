function About() {
  return (
    <section className="section">
      <div className="container">
        <div className="page-intro">
          <p className="hero-kicker">About the platform</p>
          <h1 className="section-title">A public accountability system for the people and their local youth leaders.</h1>
          <p className="subtitle">
            eSKala is designed as a government-grade transparency portal for the Sanggunian ng Kabataan in Santa Rosa City, Laguna. It brings barangay project reporting, citizen voices, and financial visibility into a single, structured public experience.
          </p>
        </div>

        <div className="section-surface" style={{ marginTop: '1rem' }}>
          <div className="panel-header">
            <div>
              <h3>What this system is built to do</h3>
              <p>Institutional clarity, public access, and role-based oversight.</p>
            </div>
            <span className="status-pill">Civic service model</span>
          </div>

          <div className="service-grid">
            <div className="card">
              <strong>Public trust</strong>
              <h3>Clear project tracking and open reporting.</h3>
              <p>Citizens can review active initiatives, understand budgets, and follow where public funds go.</p>
            </div>
            <div className="card">
              <strong>Operational clarity</strong>
              <h3>Role-aware dashboards for officers and administrators.</h3>
              <p>Super admin, SK officers, and citizens each receive a view tailored to their responsibilities.</p>
            </div>
            <div className="card">
              <strong>Future-ready foundation</strong>
              <h3>Prepared for FastAPI, Supabase, and real document workflows.</h3>
              <p>The experience is intentionally structured for a clean handoff to a live backend later.</p>
            </div>
          </div>
        </div>

        <div className="section-grid" style={{ marginTop: '1.5rem' }}>
          <div className="section-surface">
            <p className="overline">Why this matters</p>
            <ul style={{ margin: 0, paddingLeft: '1.25rem', color: 'var(--muted)', lineHeight: 1.8 }}>
              <li>Barangay-level accountability for local youth governance</li>
              <li>Accessible summaries of projects, funds, and progress</li>
              <li>Citizen feedback loops that keep public participation visible</li>
              <li>Support for future receipt scanning, document uploads, and intelligent reporting</li>
            </ul>
          </div>

          <div className="section-surface">
            <p className="overline">For Santa Rosa City</p>
            <p style={{ margin: 0, color: 'var(--muted)', lineHeight: 1.8 }}>
              The design and structure are shaped for a municipality-level deployment where public trust, local transparency, and professional communication matter just as much as the data itself.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

export default About
