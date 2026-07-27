import { useState, useEffect } from 'react'
import { BARANGAYS } from '../constants'
import type { SKOfficial, SKPosition } from '../types'
import { fetchSKOfficialsApi } from '../services/api'

const POSITIONS: (SKPosition | 'All')[] = ['All', 'Chairperson', 'Secretary', 'Treasurer', 'Kagawad']

const positionBadgeClass: Record<string, string> = {
  Chairperson: 'badge-chairperson',
  Secretary:   'badge-secretary',
  Treasurer:   'badge-treasurer',
  Kagawad:     'badge-kagawad',
}

const FEMALE_NAMES = ['Carmela','Kristine','Alyssa','Maria','Hannah','Sophia','Bianca','Lea','Nicole','Ria','Pamela','Diana','Jessa','Mika','Lorraine','Aileen','Roselyn','Liza','Joy','Angelica','Mariz','Leilanie','Trisha','Vanessa','Christine']

function getPortrait(name: string, id: string): string {
  const num = parseInt(id.replace(/\D/g, '')) % 50 || 1
  const firstName = name.split(' ')[0]
  const isFemale  = FEMALE_NAMES.includes(firstName)
  const gender    = isFemale ? 'women' : 'men'
  return `https://randomuser.me/api/portraits/${gender}/${num}.jpg`
}

function initials(name: string) {
  return name.split(' ')
    .filter(w => w.length > 1 && !/^(Jr|Sr|II|III|IV)$/i.test(w))
    .slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

export default function SKsPage() {
  const [search, setSearch]     = useState('')
  const [brgy, setBarangay]     = useState('All')
  const [position, setPosition] = useState<SKPosition | 'All'>('All')
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({})
  const [officials, setOfficials] = useState<SKOfficial[]>([])

  useEffect(() => {
    async function loadSKs() {
      try {
        const res = await fetchSKOfficialsApi()
        if (Array.isArray(res)) {
          setOfficials(res.map((o: any) => ({
            id: String(o.userID || o.id),
            barangay: o.userLocation,
            name: o.userName,
            position: (o.userRole ? o.userRole.replace('SK ', '') : 'Chairperson') as SKPosition,
            email: o.userEmail,
          })))
        }
      } catch (err) {
        console.warn('API error fetching SK officials:', err)
      }
    }
    loadSKs()
  }, [])

  const allBarangays = ['All', ...BARANGAYS]

  const filtered = officials.filter(o => {
    const matchBrgy = brgy === 'All' || o.barangay === brgy
    const matchPos  = position === 'All' || o.position === position
    const q = search.toLowerCase()
    const matchQ = !q || o.name.toLowerCase().includes(q) || o.barangay.toLowerCase().includes(q) || o.position.toLowerCase().includes(q)
    return matchBrgy && matchPos && matchQ
  })

  return (
    <section className="section">
      <div className="container">

        {/* ── Page Intro ── */}
        <div className="page-intro reveal">
          <span className="page-kicker">SK Officials Directory</span>
          <h1 className="page-title">Sangguniang Kabataan Council Roster</h1>
          <p className="page-subtitle">
            Meet the elected youth leaders serving Santa Rosa City's 18 barangays for the 2023–2025 BSKE term.
          </p>
        </div>

        {/* ── Term Info Banner ── */}
        <div className="card reveal" style={{ background: 'rgba(118,0,49,0.04)', border: '1.5px solid rgba(118,0,49,0.14)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '2.5rem', flexWrap: 'wrap' }}>
            {[
              { l: 'Election', v: 'October 30, 2023 (BSKE)' },
              { l: 'Term',     v: '2023 – 2025' },
              { l: 'Coverage', v: '18 Barangays' },
              { l: 'Officials',v: `${officials.length}+ Elected` },
            ].map(s => (
              <div key={s.l}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.72rem', fontWeight: 700, color: 'var(--maroon)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{s.l}</div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.92rem', color: 'var(--ink)', marginTop: '0.1rem' }}>{s.v}</div>
              </div>
            ))}
          </div>
          <div style={{ padding: '0.3rem 0.8rem', background: 'rgba(22,101,52,0.1)', color: '#166534', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Currently Serving
          </div>
        </div>

        {/* ── Position Tabs ── */}
        <div className="filter-tabs">
          {POSITIONS.map(p => (
            <button key={p} className={`filter-tab${position === p ? ' active' : ''}`} onClick={() => setPosition(p)}>{p}</button>
          ))}
        </div>

        {/* ── Toolbar ── */}
        <div className="toolbar">
          <div className="toolbar-left">
            <div className="search-wrap">
              <svg className="search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input className="search-input" type="text" placeholder="Search name, barangay, or position…"
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select className="search-input" style={{ width: 'auto', paddingLeft: '0.85rem', appearance: 'none', backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23760031' stroke-width='2.5'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.6rem center', paddingRight: '1.8rem' }}
              value={brgy} onChange={e => setBarangay(e.target.value)}>
              {allBarangays.map(b => <option key={b} value={b}>{b === 'All' ? 'All Barangays' : b}</option>)}
            </select>
          </div>
          <div className="toolbar-right">
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.82rem', color: 'var(--muted)', fontWeight: 600 }}>
              Showing {filtered.length} official{filtered.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* ── Person Cards Grid ── */}
        {filtered.length > 0 ? (
          <div className="card-grid card-grid-3" style={{ rowGap: '3.5rem' }}>
            {filtered.map(o => {
              const portrait = getPortrait(o.name, o.id)
              const hasErr   = imgErrors[o.id]
              return (
                <div key={o.id} className="person-card-wrap">
                  <div className="person-card">
                    {/* Avatar bust — overflows above card */}
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

                    {/* Badge */}
                    <span className={`badge ${positionBadgeClass[o.position] ?? 'badge-kagawad'}`} style={{ marginBottom: '0.4rem' }}>
                      {o.position}
                    </span>

                    {/* Name */}
                    <div className="person-card-name">{o.name}</div>
                    <div className="person-card-barangay">Barangay {o.barangay}</div>

                    <div className="person-card-divider" />

                    {/* Contact */}
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
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: '0.3rem' }}>No officials found</div>
            <div style={{ fontSize: '0.86rem' }}>Try adjusting your search or filter criteria.</div>
          </div>
        )}

        {/* ── CYDO Note ── */}
        <div style={{ marginTop: '4rem', padding: '1rem 1.2rem', background: 'rgba(254,236,65,0.1)', border: '1.5px solid rgba(254,236,65,0.3)', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7a5200" strokeWidth="2" style={{ flexShrink: 0, marginTop: '1px' }}>
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.85rem', color: '#7a5200', marginBottom: '0.2rem' }}>Directory Notice</div>
            <p style={{ fontSize: '0.82rem', color: '#7a5200', margin: 0, lineHeight: 1.65 }}>
              This directory reflects the 2023–2025 BSKE term officials. For verification or inquiries, contact the City Youth Development Office (CYDO) at (049) 530-0015 local 5011 or email cydo@santarosacity.gov.ph.
            </p>
          </div>
        </div>

      </div>
    </section>
  )
}
