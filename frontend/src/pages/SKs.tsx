import { useState } from 'react'
import { skOfficials } from '../data/mockData'
import type { SKPosition } from '../types'

const POSITIONS: (SKPosition | 'All')[] = ['All', 'Chairperson', 'Secretary', 'Treasurer', 'Kagawad']

const positionBadgeClass: Record<string, string> = {
  Chairperson: 'badge-chairperson',
  Secretary:   'badge-secretary',
  Treasurer:   'badge-treasurer',
  Kagawad:     'badge-kagawad',
}

function initials(name: string) {
  return name.split(' ').filter(w => w.length > 1 && !/^(Jr|Sr|II|III|IV)$/i.test(w)).slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

export default function SKsPage() {
  const [search, setSearch]     = useState('')
  const [brgy, setBarangay]     = useState('All')
  const [position, setPosition] = useState<SKPosition | 'All'>('All')

  const allBarangays = ['All', ...Array.from(new Set(skOfficials.map(o => o.barangay))).sort()]

  const filtered = skOfficials.filter(o => {
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
        <div className="page-intro">
          <span className="page-kicker">SK Officials Directory</span>
          <h1 className="page-title">Barangay SK Leadership Roster — Santa Rosa City</h1>
          <p className="page-subtitle">
            Official directory of elected Sangguniang Kabataan officials across all 18 barangays for the 2023–2025 BSKE term. Officials elected under RA 10742 as amended by RA 11768.
          </p>
        </div>

        {/* ── Term Info Banner ── */}
        <div className="card" style={{ background: 'rgba(118,0,49,0.05)', border: '1.5px solid rgba(118,0,49,0.14)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '2.5rem', flexWrap: 'wrap' }}>
            {[
              { l: 'Election', v: 'October 30, 2023 (BSKE)' },
              { l: 'Term',     v: '2023 – 2025' },
              { l: 'Coverage', v: '18 Barangays' },
              { l: 'Officials',v: `${skOfficials.length}+ Elected` },
            ].map(s => (
              <div key={s.l}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.72rem', fontWeight: 700, color: 'var(--maroon)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{s.l}</div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.92rem', color: 'var(--ink)', marginTop: '0.1rem' }}>{s.v}</div>
              </div>
            ))}
          </div>
          <div style={{ padding: '0.3rem 0.8rem', background: 'rgba(22,101,52,0.1)', color: '#166534', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            ✓ Currently Serving
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
              <input className="search-input" type="text" placeholder="Search by name, barangay, or position…"
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

        {/* ── SK Cards Grid ── */}
        {filtered.length > 0 ? (
          <div className="card-grid card-grid-3">
            {filtered.map(o => (
              <div key={o.id} className="sk-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <div className="sk-avatar">{initials(o.name)}</div>
                  <div>
                    <div className="sk-name">{o.name}</div>
                    <div className="sk-brgy">📍 Brgy. {o.barangay}</div>
                    <div style={{ marginTop: '0.35rem' }}>
                      <span className={`badge ${positionBadgeClass[o.position] ?? 'badge-kagawad'}`}>{o.position}</span>
                    </div>
                  </div>
                </div>
                <div style={{ borderTop: '1px solid rgba(118,0,49,0.08)', paddingTop: '0.75rem', marginTop: '0.25rem' }}>
                  <div className="sk-contact">
                    {o.phone && <div>📞 {o.phone}</div>}
                    {o.email && <div>📧 {o.email}</div>}
                    {o.term  && <div style={{ color: 'var(--maroon)', fontWeight: 600, marginTop: '0.2rem' }}>🗓 Term: {o.term}</div>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted)' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔍</div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>No officials found</div>
            <div style={{ fontSize: '0.86rem', marginTop: '0.3rem' }}>Try adjusting your search or filter criteria.</div>
          </div>
        )}

        {/* ── CYDO Note ── */}
        <div style={{ marginTop: '2rem', padding: '1rem 1.2rem', background: 'rgba(254,236,65,0.12)', border: '1.5px solid rgba(254,236,65,0.3)', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
          <span style={{ fontSize: '1.3rem', flexShrink: 0 }}>ℹ️</span>
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
