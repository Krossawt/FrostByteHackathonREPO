import { useState, useEffect, FormEvent } from 'react'
import type { NewsItem } from '../types'
import ConfirmDialog from '../components/ConfirmDialog'
import Portal from '../components/Portal'
import { fetchNewsApi } from '../services/api'

const CATEGORIES = ['Transparency', 'Youth Programs', 'SK Update', 'Health', 'Education', 'Environment', 'Sports', 'City News', 'Emergency']

export default function SuperAdminNews() {
  const [articles, setArticles] = useState<NewsItem[]>([])
  const [showModal, setShowModal]   = useState(false)
  const [editTarget, setEditTarget] = useState<NewsItem | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<NewsItem | null>(null)
  const [search, setSearch]         = useState('')
  const [filterCat, setFilterCat]   = useState('All')

  const [formTitle, setFormTitle]     = useState('')
  const [formCat, setFormCat]         = useState('SK Update')
  const [formSummary, setFormSummary] = useState('')
  const [formDate, setFormDate]       = useState('')
  const [formError, setFormError]     = useState('')

  useEffect(() => {
    async function loadNews() {
      try {
        const res = await fetchNewsApi()
        if (Array.isArray(res)) {
          setArticles(res.map((n: any) => ({
            id: String(n.newsletterID || n.id),
            title: n.title,
            category: n.category || 'City News',
            summary: n.summary || n.fullContent || '',
            date: n.publishedAt ? new Date(n.publishedAt).toLocaleDateString() : 'Today',
            image: n.imageURL || undefined,
          })))
        }
      } catch (err) {
        console.warn('API error fetching news:', err)
      }
    }
    loadNews()
  }, [])

  const allCats = ['All', ...Array.from(new Set(articles.map(a => a.category)))]

  const filtered = articles.filter(a => {
    const matchCat = filterCat === 'All' || a.category === filterCat
    const q = search.toLowerCase()
    const matchQ = !q || a.title.toLowerCase().includes(q) || a.summary?.toLowerCase().includes(q)
    return matchCat && matchQ
  })

  const openModal = (item?: NewsItem) => {
    if (item) {
      setEditTarget(item)
      setFormTitle(item.title)
      setFormCat(item.category)
      setFormSummary(item.summary ?? '')
      setFormDate(item.date)
    } else {
      setEditTarget(null)
      setFormTitle(''); setFormCat('SK Update'); setFormSummary(''); setFormDate(''); setFormError('')
    }
    setShowModal(true)
  }

  const handleSave = (e: FormEvent) => {
    e.preventDefault(); setFormError('')
    if (!formTitle.trim() || !formDate) { setFormError('Title and date are required.'); return }
    if (editTarget) {
      setArticles(prev => prev.map(a => a.id === editTarget.id
        ? { ...a, title: formTitle.trim(), category: formCat, summary: formSummary.trim(), date: formDate }
        : a
      ))
    } else {
      const newArticle: NewsItem = {
        id: `n-${Math.random().toString(36).slice(2, 8)}`,
        title: formTitle.trim(), category: formCat,
        summary: formSummary.trim(), date: formDate,
      }
      setArticles(prev => [newArticle, ...prev])
    }
    setShowModal(false)
  }

  const confirmDelete = () => {
    if (!deleteTarget) return
    setArticles(prev => prev.filter(a => a.id !== deleteTarget.id))
    setDeleteTarget(null)
  }

  return (
    <section className="section">
      <div className="container">

        {/* ── Page Intro ── */}
        <div className="page-intro reveal" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.8rem' }}>
          <div>
            <span className="page-kicker">News Management · Super Admin</span>
            <h1 className="page-title" style={{ marginTop: '0.3rem' }}>City-Wide Announcements &amp; News</h1>
            <p className="page-subtitle" style={{ marginTop: '0.4rem' }}>
              Publish and manage official news, announcements, and updates for all 18 barangay SK units and citizens of Santa Rosa City.
            </p>
          </div>
          <button className="btn btn-primary" style={{ alignSelf: 'flex-start', marginTop: '0.4rem' }} onClick={() => openModal()}>
            + Publish New Article
          </button>
        </div>

        {/* ── Stat Cards ── */}
        <div className="card-grid card-grid-4 reveal" style={{ marginBottom: '1.5rem' }}>
          <div className="stat-card card-accent">
            <div className="stat-value">{articles.length}</div>
            <div className="stat-label">Total Articles</div>
            <div className="stat-sub">All categories</div>
          </div>
          {['Transparency', 'Youth Programs', 'SK Update'].map(cat => (
            <div key={cat} className="stat-card">
              <div className="stat-value">{articles.filter(a => a.category === cat).length}</div>
              <div className="stat-label">{cat}</div>
            </div>
          ))}
        </div>

        {/* ── Category Tabs ── */}
        <div className="filter-tabs">
          {allCats.map(c => (
            <button key={c} className={`filter-tab${filterCat === c ? ' active' : ''}`} onClick={() => setFilterCat(c)}>
              {c}
            </button>
          ))}
        </div>

        {/* ── Search ── */}
        <div className="toolbar">
          <div className="search-wrap">
            <svg className="search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input className="search-input" type="text" placeholder="Search articles by title or content…"
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.82rem', color: 'var(--muted)', fontWeight: 600 }}>
            {filtered.length} article{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* ── News Cards Grid ── */}
        {filtered.length > 0 ? (
          <div className="card-grid card-grid-3">
            {filtered.map(article => (
              <div key={article.id} className="news-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <span className="news-cat">{article.category}</span>
                  <div className="news-title">{article.title}</div>
                  <span className="news-date">{article.date}</span>
                  {article.summary && <p className="news-summary" style={{ marginTop: '0.5rem' }}>{article.summary}</p>}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.85rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(118,0,49,0.08)' }}>
                  <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => openModal(article)}>Edit</button>
                  <button className="btn btn-danger btn-sm" onClick={() => setDeleteTarget(article)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted)' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>No articles found</div>
            <button className="btn btn-primary btn-sm" style={{ marginTop: '1rem' }} onClick={() => openModal()}>
              Publish First Article
            </button>
          </div>
        )}

        {/* ── Publish / Edit Modal ── */}
        {showModal && (
          <Portal>
          <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}>
            <div className="modal">
              <div className="modal-header">
                <span className="modal-title">{editTarget ? 'Edit Article' : 'Publish New Article'}</span>
                <button className="modal-close" onClick={() => setShowModal(false)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
              </div>
              <form onSubmit={handleSave}>
                <div className="modal-body">
                  {formError && <div className="alert-error">{formError}</div>}

                  <div className="form-group">
                    <label className="form-label">Article Title *</label>
                    <input className="form-input" type="text" value={formTitle} onChange={e => setFormTitle(e.target.value)}
                      placeholder="e.g., SK Federation General Assembly — Q3 2025" required />
                  </div>

                  <div className="form-row-2">
                    <div className="form-group">
                      <label className="form-label">Category *</label>
                      <select className="form-input" value={formCat} onChange={e => setFormCat(e.target.value)}>
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Date Published *</label>
                      <input className="form-input" type="date" value={formDate} onChange={e => setFormDate(e.target.value)} required />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Summary / Body</label>
                    <textarea className="form-input" value={formSummary} onChange={e => setFormSummary(e.target.value)}
                      placeholder="Brief description of the announcement…" style={{ minHeight: '110px', resize: 'vertical' }} />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">{editTarget ? 'Save Changes' : 'Publish Article'}</button>
                </div>
              </form>
            </div>
          </div>
          </Portal>
        )}

        {/* ── Delete Confirmation ── */}
        <ConfirmDialog
          isOpen={!!deleteTarget}
          title="Delete News Article"
          message={`Delete "${deleteTarget?.title}"? This cannot be undone.`}
          confirmLabel="Delete Article"
          cancelLabel="Cancel"
          danger={true}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />

      </div>
    </section>
  )
}
