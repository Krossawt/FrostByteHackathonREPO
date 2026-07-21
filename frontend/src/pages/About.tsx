function About() {
  return (
    <section className="section">
      <div className="container">
        <div className="section-title">About eSKala</div>
        <p className="subtitle">
          eSKala is a transparency-first portal for the Sanggunian ng Kabataan in Santa Rosa City, Laguna. It unifies barangay SK project reporting,
          citizen suggestions, and public budget tracking in a clean, modern design inspired by official legislative portals.
        </p>

        <div className="grid grid-3 section-surface" style={{ marginTop: '2rem' }}>
          <div className="card">
            <strong>System Vision</strong>
            <h3>Build trust through clear reporting.</h3>
            <p>Public officials and citizens see project progress, budgets, and activity logs in one polished interface.</p>
          </div>
          <div className="card">
            <strong>Design direction</strong>
            <h3>Professional, authoritative, approachable.</h3>
            <p>Using a maroon and gold palette, the interface avoids unnecessary curves and keeps readability sharp.</p>
          </div>
          <div className="card">
            <strong>Future-ready</strong>
            <h3>React front end with FastAPI backend scope.</h3>
            <p>All content is mocked for now and ready to switch to Supabase-authenticated data once the API is available.</p>
          </div>
        </div>

        <div className="section-surface" style={{ marginTop: '2.5rem' }}>
          <h3>What makes this portal work?</h3>
          <div className="grid grid-2" style={{ gap: '2rem' }}>
            <div>
              <p className="overline">Feature set</p>
              <ul style={{ margin: 0, paddingLeft: '1.25rem', color: '#4e3f46' }}>
                <li>Role-based dashboards for super admin, SK officers, and citizens</li>
                <li>Barangay project management and progress tracking</li>
                <li>Citizen news feed, comment board, and suggestion pipeline</li>
                <li>Financial transparency tools, receipt upload workflows, and budget status</li>
              </ul>
            </div>
            <div>
              <p className="overline">Why Santa Rosa City?</p>
              <p>
                The portal is intentionally scoped for Santa Rosa City, Laguna. It supports barangay-level management and local SK accountability,
                making it easy to expand beyond the pilot barangays once the backend is connected.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default About
