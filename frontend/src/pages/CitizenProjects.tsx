import { useState, useEffect } from 'react'
import type { UserAccount } from '../types'
import ProjectDetailModal from '../components/ProjectDetailModal'
import type { ReportProject } from '../types'
import { fetchProjectsApi } from '../services/api'

interface CitizenProjectsProps { user?: UserAccount | null }

// Unsplash images by category
const CATEGORY_IMAGES: Record<string, string> = {
  'Education': 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=640&q=75',
  'Health': 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=640&q=75',
  'Sports': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=640&q=75',
  'Environment': 'https://images.unsplash.com/photo-1588880331179-bc9b93a8cb5e?w=640&q=75',
  'Infrastructure': 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=640&q=75',
  'Livelihood': 'https://images.unsplash.com/photo-1556761175-b413da4baf72?w=640&q=75',
  'Capacity Building': 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=640&q=75',
  'Peace & Order': 'https://images.unsplash.com/photo-1589994160839-163cd867cfe8?w=640&q=75',
  'Arts & Culture': 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=640&q=75',
  'Disaster Preparedness': 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=640&q=75',
  'Governance': 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=640&q=75',
  'Other': 'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=640&q=75',
}

const CATEGORY_GRAD: Record<string, string> = {
  'Education': 'linear-gradient(135deg,#1d4ed8,#1e40af)',
  'Health': 'linear-gradient(135deg,#166534,#15803d)',
  'Sports': 'linear-gradient(135deg,#b45309,#d97706)',
  'Environment': 'linear-gradient(135deg,#166534,#4ade80)',
  'Livelihood': 'linear-gradient(135deg,#6d28d9,#7c3aed)',
  'Arts & Culture': 'linear-gradient(135deg,#be185d,#e11d48)',
  'Peace & Order': 'linear-gradient(135deg,#374151,#4b5563)',
  'default': 'linear-gradient(135deg,#760031,#9a0040)',
}

function getCover(category?: string) {
  return CATEGORY_IMAGES[category ?? 'Other'] ?? CATEGORY_IMAGES['Other']
}
function getGrad(category?: string) {
  return CATEGORY_GRAD[category ?? 'default'] ?? CATEGORY_GRAD['default']
}

const FILTER_OPTIONS = [
  { key: 'all', label: 'All' },
  { key: 'ongoing', label: 'Ongoing' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'completed', label: 'Completed' },
]

export default function CitizenProjects({ user }: CitizenProjectsProps) {
  const userBarangay = user?.barangay || 'Balibago'
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [selectedProject, setSelectedProject] = useState<ReportProject | null>(null)
  const [liveProjects, setLiveProjects] = useState<ReportProject[]>([])

  useEffect(() => {
    async function loadCitizenProjects() {
      try {
        // Citizens only see publicly Posted projects from their own barangay
        const res = await fetchProjectsApi({ barangay: userBarangay, public_only: true })
        if (Array.isArray(res)) {
          setLiveProjects(res.map((p: any) => {
            const rawSt = String(p.projectStatus || p.status || 'ongoing').toLowerCase()
            const mappedStatus: 'ongoing' | 'upcoming' | 'completed' = rawSt.includes('post') || rawSt.includes('complete')
              ? 'completed'
              : rawSt.includes('draft') || rawSt.includes('finance') || rawSt.includes('approval')
                ? 'upcoming'
                : 'ongoing'

            return {
              id: String(p.projectID || p.id),
              title: p.projectName || p.title,
              barangay: p.projectLocation || userBarangay,
              category: p.projectCategory || 'Education',
              status: mappedStatus,
              proposedBudget: Number(p.projectBudget || 0),
              spent: Number(p.projectBreakdown || 0),
              remainingBudget: Math.max(0, Number(p.projectBudget || 0) - Number(p.projectBreakdown || 0)),
              progress: p.projectProgress || 0,
              progressPercent: p.projectProgress || 0,
              startDate: p.projectStartTime ? new Date(p.projectStartTime).toISOString().split('T')[0] : '',
              endDate: p.projectEndTime ? new Date(p.projectEndTime).toISOString().split('T')[0] : '',
              description: p.projectDescription || '',
            }
          }))
        }
      } catch (err) {
        console.warn('API error fetching citizen projects:', err)
      }
    }
    loadCitizenProjects()
  }, [userBarangay])

  const filtered = liveProjects.filter(p => {
    const matchStatus = statusFilter === 'all' || p.status === statusFilter
    const q = search.toLowerCase()
    const matchQ = !q || p.title.toLowerCase().includes(q) || p.barangay.toLowerCase().includes(q) || (p.category?.toLowerCase() ?? '').includes(q)
    return matchStatus && matchQ
  })

  const counts = {
    all: liveProjects.length,
    ongoing: liveProjects.filter((p: any) => p.status === 'ongoing').length,
    upcoming: liveProjects.filter((p: any) => p.status === 'upcoming').length,
    completed: liveProjects.filter((p: any) => p.status === 'completed').length,
  }

  return (
    <section className="section">
      <div className="container">

        {/* ── Page Intro ── */}
        <div className="page-intro">
          <span className="page-kicker">City Projects</span>
          <h1 className="page-title">SK Projects Across Santa Rosa City</h1>
          <p className="page-subtitle">
            Browse all Sangguniang Kabataan projects across all 18 barangays. Click any project card for full details, financial records, and citizen feedback.
          </p>
        </div>

        {/* ── Filter Tabs ── */}
        <div className="filter-tabs">
          {FILTER_OPTIONS.map(f => (
            <button key={f.key} className={`filter-tab${statusFilter === f.key ? ' active' : ''}`}
              onClick={() => setStatusFilter(f.key)}>
              {f.label} ({counts[f.key as keyof typeof counts] ?? filtered.length})
            </button>
          ))}
        </div>

        {/* ── Search ── */}
        <div className="toolbar">
          <div className="toolbar-left">
            <div className="search-wrap">
              <svg className="search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
              <input className="search-input" type="text" placeholder="Search by title, barangay, or category…"
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
          <div className="toolbar-right">
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.82rem', color: 'var(--muted)', fontWeight: 600 }}>
              {filtered.length} project{filtered.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* ── Project Cards Grid ── */}
        {filtered.length > 0 ? (
          <div className="card-grid card-grid-3">
            {filtered.map(p => (
              <div key={p.id} className="v-card" onClick={() => setSelectedProject(p)}>
                {/* Image */}
                <div className="v-card-img-wrap">
                  <img
                    src={getCover(p.category)}
                    alt={p.category}
                    className="v-card-img"
                    onError={e => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1577495508048-b635879837f1?w=640&q=75'
                    }}
                  />
                  <div className="v-card-img-overlay" />
                  <div className="v-card-badge-pin">
                    <span className={`badge badge-${p.status}`}>{p.status}</span>
                  </div>
                </div>

                {/* Body */}
                <div className="v-card-body">
                  <div className="v-card-kicker">{p.category} · Brgy. {p.barangay}</div>
                  <div className="v-card-title">{p.title}</div>
                  <div className="v-card-date">{p.startDate} — {p.endDate}</div>
                  <p className="v-card-desc">{p.description}</p>

                  {/* Budget Utilization */}
                  <div style={{ marginTop: '0.4rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--muted)', fontFamily: 'var(--font-display)', fontWeight: 600 }}>Budget Used</span>
                      <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--maroon)' }}>
                        {p.proposedBudget > 0 ? Math.round((p.spent / p.proposedBudget) * 100) : 0}%
                      </span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${Math.min(100, p.proposedBudget > 0 ? (p.spent / p.proposedBudget) * 100 : 0)}%` }} />
                    </div>
                  </div>

                  <div className="v-card-footer">
                    <div>
                      <div className="v-card-budget">₱{(p.proposedBudget / 1000).toFixed(0)}K</div>
                      <div className="v-card-budget-label">Proposed Budget</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.82rem', color: '#b45309' }}>₱{(p.spent / 1000).toFixed(0)}K</div>
                      <div className="v-card-budget-label">Disbursed</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted)' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: '0.3rem' }}>No projects found</div>
            <div style={{ fontSize: '0.86rem' }}>Try adjusting your search or filter.</div>
          </div>
        )}

        {/* ── Project Detail Modal ── */}
        {selectedProject && (
          <ProjectDetailModal
            project={selectedProject}
            user={user}
            onClose={() => setSelectedProject(null)}
          />
        )}
      </div>
    </section>
  )
}
