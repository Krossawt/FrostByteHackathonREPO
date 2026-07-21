import { barangaySummary } from '../data/mockData'

function SuperAdminAccounts() {
  return (
    <section className="section">
      <div className="container">
        <div className="section-title">Accounts management</div>
        <p className="subtitle">Review and filter barangay accounts, and prepare to add, edit, or soft-delete access.</p>

        <div className="section-surface" style={{ marginTop: '2rem' }}>
          <div className="table-panel">
            <table className="account-table">
              <thead>
                <tr>
                  <th>Barangay</th>
                  <th>Annual budget</th>
                  <th>Spent</th>
                  <th>Projects</th>
                </tr>
              </thead>
              <tbody>
                {barangaySummary.map((item) => (
                  <tr key={item.barangay}>
                    <td>{item.barangay}</td>
                    <td>₱{item.annualBudget.toLocaleString()}</td>
                    <td>₱{item.spent.toLocaleString()}</td>
                    <td>{item.projects}</td>
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

export default SuperAdminAccounts
