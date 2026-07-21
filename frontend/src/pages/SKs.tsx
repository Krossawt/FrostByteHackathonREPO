import { skOfficials } from '../data/mockData'

function SKs() {
  return (
    <section className="section">
      <div className="container">
        <div className="section-title">SK Directory</div>
        <p className="subtitle">A repository of barangay SK officials for Santa Rosa City, Laguna.</p>

        <div className="section-surface" style={{ marginTop: '2rem' }}>
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
