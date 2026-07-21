import { skOfficials } from '../data/mockData'

function SKs() {
  return (
    <section className="section">
      <div className="container">
        <div className="page-intro">
          <p className="hero-kicker">SK directory</p>
          <h1 className="section-title">Barangay leadership roster for Santa Rosa City.</h1>
          <p className="subtitle">A structured, public-facing repository of current SK officials and their roles across the city.</p>
        </div>

        <div className="section-surface">
          <div className="panel-header">
            <div>
              <h3>Current officials</h3>
              <p>Prepared for future expansion into a live directory with verified public contacts.</p>
            </div>
            <span className="status-pill">Verified roster</span>
          </div>

          <div className="table-panel">
            <table>
              <thead>
                <tr>
                  <th>Barangay</th>
                  <th>Name</th>
                  <th>Position</th>
                  <th>Contact</th>
                </tr>
              </thead>
              <tbody>
                {skOfficials.map((official) => (
                  <tr key={official.id}>
                    <td>{official.barangay}</td>
                    <td>{official.name}</td>
                    <td>{official.position}</td>
                    <td>{official.phone}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  )
}

export default SKs
