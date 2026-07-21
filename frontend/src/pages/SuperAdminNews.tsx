import { useState } from 'react'
import { news } from '../data/mockData'

function SuperAdminNews() {
  const [entries] = useState(news)

  return (
    <section className="section">
      <div className="container">
        <div className="section-title">News management</div>
        <p className="subtitle">Create, edit, or delete public news items from the super admin portal.</p>

        <div className="section-surface" style={{ marginTop: '2rem' }}>
          <div className="input-group" style={{ maxWidth: '700px' }}>
            <label>Upload news image</label>
            <input type="file" accept="image/*" disabled />
          </div>
          <div className="input-group">
            <label>Title</label>
            <input type="text" placeholder="Transparent SK budget updates" disabled />
          </div>
          <div className="input-group">
            <label>Description</label>
            <textarea rows={4} placeholder="Write a short public summary about the news item." disabled />
          </div>
          <button type="button" className="primary" style={{ marginBottom: '1.5rem' }} disabled>
            Publish news (mock interface)
          </button>

          <div className="news-list">
            {entries.map((item) => (
              <div key={item.id} className="news-item">
                <small>{item.date} • {item.category}</small>
                <h4>{item.title}</h4>
                <p>{item.summary}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default SuperAdminNews
