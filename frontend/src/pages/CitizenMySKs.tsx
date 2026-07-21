import { skOfficials } from '../data/mockData'

function CitizenMySKs() {
  return (
    <section className="section">
      <div className="container">
        <div className="section-title">My SKs</div>
        <p className="subtitle">View SK officials assigned to barangays in Santa Rosa City.</p>

        <div className="section-surface" style={{ marginTop: '2rem' }}>
          <div className="grid grid-2" style={{ gap: '1.5rem' }}>
            {skOfficials.map((official) => (
              <div key={official.id} className="card">
                <p className="overline">{official.barangay}</p>
                <h3>{official.name}</h3>
                <p>{official.position}</p>
                <p>{official.phone}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default CitizenMySKs
