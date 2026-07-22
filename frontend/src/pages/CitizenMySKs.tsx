import { useState } from 'react'
import { skOfficials, citizenComments } from '../data/mockData'
import type { UserAccount } from '../types'

interface CitizenMySKsProps { user?: UserAccount | null }

function initials(name: string) {
  return name.split(' ').filter(w => w.length > 1 && !/^(Jr|Sr|II|III|IV)$/i.test(w)).slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

const posColors: Record<string, string> = {
  Chairperson: '#760031',
  Treasurer:   '#b45309',
  Secretary:   '#1d4ed8',
  Kagawad:     '#374151',
}

const posBadge: Record<string, string> = {
  Chairperson: 'badge-chairperson',
  Treasurer:   'badge-treasurer',
  Secretary:   'badge-secretary',
  Kagawad:     'badge-kagawad',
}

export default function CitizenMySKs({ user }: CitizenMySKsProps) {
  const barangay = user?.barangay || 'Balibago'
  const myOfficials = skOfficials.filter(o => o.barangay === barangay)
  const myComments  = citizenComments.filter(c => c.barangay === barangay)
  const [activeTab, setActiveTab] = useState<'officials' | 'feedback'>('officials')
  const [search, setSearch] = useState('')

  const filteredOfficials = myOfficials.filter(o =>
    !search || o.name.toLowerCase().includes(search.toLowerCase()) || o.position.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <section className="section">
      <div className="container">

        {/* ── Page Intro ── */}
        <div className="page-intro">
          <span className="page-kicker">My SK · Barangay {barangay}</span>
          <h1 className="page-title">Your Barangay's SK Council</h1>
          <p className="page-subtitle">
            Meet your elected Sangguniang Kabataan officials, view their contact details, and see community feedback for Brgy. {barangay}.
          </p>
        </div>

        {/* ── Barangay Info Banner ── */}
        <div className="card" style={{ marginBottom: '1.5rem', background: 'rgba(118,0,49,0.05)', border: '1.5px solid rgba(118,0,49,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '2.5rem', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.72rem', fontWeight: 700, color: 'var(--maroon)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Barangay</div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.1rem', color: 'var(--ink)' }}>{barangay}</div>
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.72rem', fontWeight: 700, color: 'var(--maroon)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>SK Council Size</div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.1rem', color: 'var(--ink)' }}>{myOfficials.length} Officials</div>
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.72rem', fontWeight: 700, color: 'var(--maroon)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>BSKE Term</div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.1rem', color: 'var(--ink)' }}>2023 – 2025</div>
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.72rem', fontWeight: 700, color: 'var(--maroon)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Community Feedback</div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.1rem', color: 'var(--ink)' }}>{myComments.length} Comments</div>
            </div>
          </div>
          <span style={{ padding: '0.3rem 0.8rem', background: 'rgba(22,101,52,0.1)', color: '#166534', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            ✓ Currently Serving
          </span>
        </div>

        {/* ── Tabs ── */}
        <div className="filter-tabs">
          <button className={`filter-tab${activeTab === 'officials' ? ' active' : ''}`} onClick={() => setActiveTab('officials')}>
            SK Officials ({myOfficials.length})
          </button>
          <button className={`filter-tab${activeTab === 'feedback' ? ' active' : ''}`} onClick={() => setActiveTab('feedback')}>
            Community Feedback ({myComments.length})
          </button>
        </div>

        {activeTab === 'officials' && (
          <>
            {/* Search */}
            <div className="toolbar">
              <div className="search-wrap">
                <svg className="search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
                <input className="search-input" type="text" placeholder="Search SK officials by name or position…"
                  value={search} onChange={e => setSearch(e.target.value)} />
              </div>
            </div>

            {/* Officials Grid */}
            {filteredOfficials.length > 0 ? (
              <div className="card-grid card-grid-3">
                {filteredOfficials.map(o => (
                  <div key={o.id} className="sk-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
                      <div className="sk-avatar" style={{ background: `${posColors[o.position]}18`, borderColor: `${posColors[o.position]}30` }}>
                        <span style={{ color: posColors[o.position] }}>{initials(o.name)}</span>
                      </div>
                      <div>
                        <div className="sk-name">{o.name}</div>
                        <div style={{ marginTop: '0.3rem' }}>
                          <span className={`badge ${posBadge[o.position] ?? 'badge-kagawad'}`}>{o.position}</span>
                        </div>
                      </div>
                    </div>
                    <div style={{ borderTop: '1px solid rgba(118,0,49,0.08)', paddingTop: '0.75rem' }}>
                      <div className="sk-contact">
                        <div>📍 Brgy. {o.barangay}, Santa Rosa City</div>
                        {o.phone && <div>📞 {o.phone}</div>}
                        {o.email && <div>📧 {o.email}</div>}
                        {o.term  && <div style={{ color: 'var(--maroon)', fontWeight: 700, marginTop: '0.15rem' }}>🗓 {o.term}</div>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted)' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔍</div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>No officials found</div>
              </div>
            )}
          </>
        )}

        {activeTab === 'feedback' && (
          <div style={{ display: 'grid', gap: '0.85rem', marginTop: '0.25rem' }}>
            {myComments.length > 0 ? myComments.map(c => (
              <div key={c.id} className="comment-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <span className="comment-author">{c.author}</span>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    {c.type && <span className={`badge ${c.type === 'suggestion' ? 'badge-upcoming' : 'badge-ongoing'}`}>{c.type}</span>}
                    {c.votes !== undefined && (
                      <div className="comment-votes">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                        {c.votes}
                      </div>
                    )}
                  </div>
                </div>
                <span className="comment-date">{c.date}</span>
                <p className="comment-text">{c.text}</p>
              </div>
            )) : (
              <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted)' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💬</div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>No community feedback yet</div>
                <div style={{ fontSize: '0.85rem', marginTop: '0.3rem' }}>Citizen comments and suggestions will appear here.</div>
              </div>
            )}
          </div>
        )}

      </div>
    </section>
  )
}
