import { useState } from 'react'
import { skOfficials, citizenComments } from '../data/mockData'
import type { UserAccount, SKPosition } from '../types'

interface CitizenMySKsProps { user?: UserAccount | null }

const FEMALE_NAMES = ['Carmela','Kristine','Alyssa','Maria','Hannah','Sophia','Bianca','Lea','Nicole','Ria','Pamela','Diana','Jessa','Mika','Lorraine','Aileen','Roselyn','Liza','Joy','Angelica','Mariz','Leilanie','Trisha','Vanessa','Christine']

function getPortrait(name: string, id: string): string {
  const num = parseInt(id.replace(/\D/g, '')) % 50 || 1
  const firstName = name.split(' ')[0]
  const isFemale  = FEMALE_NAMES.includes(firstName)
  const gender    = isFemale ? 'women' : 'men'
  return `https://randomuser.me/api/portraits/${gender}/${num}.jpg`
}

function initials(name: string) {
  return name.split(' ').filter(w => w.length > 1 && !/^(Jr|Sr|II|III|IV)$/i.test(w)).slice(0, 2).map(w => w[0]).join('').toUpperCase()
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
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({})

  const filteredOfficials = myOfficials.filter(o =>
    !search || o.name.toLowerCase().includes(search.toLowerCase()) || o.position.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <section className="section">
      <div className="container">

        {/* ── Page Intro ── */}
        <div className="page-intro">
          <span className="page-kicker">My SK Council · Barangay {barangay}</span>
          <h1 className="page-title">Your Barangay's SK Council</h1>
          <p className="page-subtitle">
            Meet your elected Sangguniang Kabataan officials, view their contact details, and inspect community feedback for Barangay {barangay}.
          </p>
        </div>

        {/* ── Barangay Info Banner ── */}
        <div className="card" style={{ marginBottom: '1.5rem', background: 'rgba(118,0,49,0.04)', border: '1.5px solid rgba(118,0,49,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
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
            Currently Serving
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

            {/* Officials Bust Grid */}
            {filteredOfficials.length > 0 ? (
              <div className="card-grid card-grid-3" style={{ rowGap: '3.5rem' }}>
                {filteredOfficials.map(o => {
                  const portrait = getPortrait(o.name, o.id)
                  const hasErr   = imgErrors[o.id]
                  return (
                    <div key={o.id} className="person-card-wrap">
                      <div className="person-card">
                        <div className="person-card-avatar-wrap">
                          {!hasErr ? (
                            <img
                              src={portrait}
                              alt={o.name}
                              className="person-card-avatar"
                              onError={() => setImgErrors(prev => ({ ...prev, [o.id]: true }))}
                            />
                          ) : (
                            <div className="person-card-avatar-initials">{initials(o.name)}</div>
                          )}
                        </div>

                        <div className="person-card-spacer" />

                        <span className={`badge ${posBadge[o.position] ?? 'badge-kagawad'}`} style={{ marginBottom: '0.4rem' }}>
                          {o.position}
                        </span>

                        <div className="person-card-name">{o.name}</div>
                        <div className="person-card-barangay">Barangay {o.barangay}</div>

                        <div className="person-card-divider" />

                        <div className="person-card-contact">
                          {o.phone && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'center' }}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13 19.79 19.79 0 0 1 1.62 4.45 2 2 0 0 1 3.6 2.27h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6 6l.92-.92a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 17l.19-.08z"/>
                              </svg>
                              {o.phone}
                            </div>
                          )}
                          {o.email && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'center' }}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                              </svg>
                              <span style={{ wordBreak: 'break-word', fontSize: '0.73rem' }}>{o.email}</span>
                            </div>
                          )}
                          {o.term && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'center', color: 'var(--maroon)', fontWeight: 600, marginTop: '0.15rem' }}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                              </svg>
                              Term: {o.term}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted)' }}>
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
