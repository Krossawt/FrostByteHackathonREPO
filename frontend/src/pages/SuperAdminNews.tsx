import { useState, useEffect, FormEvent, ChangeEvent } from 'react'
import type { NewsItem } from '../types'
import ConfirmDialog from '../components/ConfirmDialog'
import Portal from '../components/Portal'
import { fetchNewsApi, createNewsletterApi, updateNewsletterApi, deleteNewsletterApi, uploadNewsImageApi, resolveImageUrl } from '../services/api'

const CATEGORIES = ['Transparency', 'Youth Programs', 'SK Update', 'Health', 'Education', 'Environment', 'Sports', 'City News', 'Emergency']

type Feedback = { type: 'success' | 'info'; message: string }

export default function SuperAdminNews() {
  const [articles, setArticles] = useState<NewsItem[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editTarget, setEditTarget] = useState<NewsItem | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<NewsItem | null>(null)
  const [confirmAction, setConfirmAction] = useState<'cancel' | null>(null)
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('All')

  const [formTitle, setFormTitle] = useState('')
  const [formCat, setFormCat] = useState('SK Update')
  const [formSummary, setFormSummary] = useState('')
  const [formDate, setFormDate] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imageUrl, setImageUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [formError, setFormError] = useState('')

  // Snapshot of the form's values right after opening — used to detect
  // whether the user actually changed anything before requesting a close
  const [initialSnapshot, setInitialSnapshot] = useState({
    title: '', cat: 'SK Update', summary: '', date: '', imageUrl: '',
  })

  // Feedback banner (glass-style, portal-rendered — see below)
  const [feedback, setFeedback] = useState<Feedback | null>(null)

  async function loadNews() {
    try {
      const res = await fetchNewsApi()
      if (Array.isArray(res)) {
        setArticles(res.map((n: any) => ({
          id: String(n.id || n.newsletterID || `news-${Math.random()}`),
          title: n.title,
          category: n.category || 'City News',
          summary: n.summary || n.fullContent || '',
          date: n.date || (n.publishedAt ? new Date(n.publishedAt).toLocaleDateString() : 'Today'),
          image: n.image || n.imageURL || undefined,
          imageURL: n.image || n.imageURL || undefined,
        })))
      }
    } catch (err) {
      console.warn('API error fetching news:', err)
    }
  }

  useEffect(() => {
    loadNews()
  }, [])

  // Auto-dismiss feedback banner after 3 seconds
  useEffect(() => {
    if (!feedback) return
    const timer = setTimeout(() => setFeedback(null), 3000)
    return () => clearTimeout(timer)
  }, [feedback])

  const allCats = ['All', ...Array.from(new Set(articles.map(a => a.category)))]

  const filtered = articles.filter(a => {
    const matchCat = filterCat === 'All' || a.category === filterCat
    const q = search.toLowerCase()
    const matchQ = !q || a.title.toLowerCase().includes(q) || a.summary?.toLowerCase().includes(q)
    return matchCat && matchQ
  })

  const openModal = (item?: NewsItem) => {
    if (item) {
      const todayStr = new Date().toISOString().split('T')[0]
      setEditTarget(item)
      setFormTitle(item.title)
      setFormCat(item.category)
      setFormSummary(item.summary ?? '')
      setFormDate(todayStr)
      setImageUrl(item.image ?? '')
      setImageFile(null)
      setInitialSnapshot({ title: item.title, cat: item.category, summary: item.summary ?? '', date: todayStr, imageUrl: item.image ?? '' })
    } else {
      const today = new Date().toISOString().split('T')[0]
      setEditTarget(null)
      setFormTitle(''); setFormCat('SK Update'); setFormSummary('')
      setFormDate(today)
      setImageUrl(''); setImageFile(null); setFormError('')
      setInitialSnapshot({ title: '', cat: 'SK Update', summary: '', date: today, imageUrl: '' })
    }
    setFormError('')
    setShowModal(true)
  }

  // Returns true if any field differs from the snapshot taken when the modal opened
  const isFormDirty = () =>
    formTitle !== initialSnapshot.title ||
    formCat !== initialSnapshot.cat ||
    formSummary !== initialSnapshot.summary ||
    formDate !== initialSnapshot.date ||
    imageUrl !== initialSnapshot.imageUrl

  // X button, overlay click, and Cancel button all request a close.
  // If nothing was actually changed, close immediately — only prompt
  // the "Discard Changes" confirmation when the form is dirty.
  const requestCloseModal = () => {
    if (isFormDirty()) {
      setConfirmAction('cancel')
    } else {
      setShowModal(false)
    }
  }

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setImageFile(file)
      setUploading(true)
      const reader = new FileReader()
      reader.onload = ev => {
        if (ev.target?.result) {
          setImageUrl(String(ev.target.result))
        }
        setUploading(false)
      }
      reader.onerror = () => setUploading(false)
      reader.readAsDataURL(file)
    }
  }

  const handleSave = async (e: FormEvent) => {
    e.preventDefault()
    if (isSaving) return // guard against rapid double-submits
    setFormError('')
    if (!formTitle.trim()) { setFormError('Article title is required.'); return }
    if (formTitle.trim().length < 5) { setFormError('Article title must be at least 5 characters.'); return }
    if (!formSummary.trim()) { setFormError('Summary / Body is required.'); return }
    if (formSummary.trim().length < 10) { setFormError('Summary must be at least 10 characters.'); return }
    if (formSummary.trim().length > 2000) { setFormError('Summary must not exceed 2000 characters.'); return }

    const isEditing = !!editTarget
    setIsSaving(true)

    try {
      let finalImg = imageUrl
      if (imageFile && !finalImg) {
        setUploading(true)
        const uploaded = await uploadNewsImageApi(imageFile)
        finalImg = uploaded.imageURL
      }

      const payload = {
        title: formTitle.trim(),
        summary: formSummary.trim(),
        category: formCat,
        imageURL: finalImg || undefined,
      }

      if (isEditing && editTarget) {
        // Update the existing article instead of creating a new one
        await updateNewsletterApi(Number(editTarget.id), payload)
      } else {
        await createNewsletterApi(payload)
      }

      await loadNews()
      setShowModal(false)
      setFeedback({ type: 'success', message: isEditing ? 'Article updated successfully' : 'Article published successfully' })
    } catch (err: any) {
      setFormError(`Failed to ${isEditing ? 'update' : 'publish'} news: ${err.message}`)
    } finally {
      setUploading(false)
      setIsSaving(false)
    }
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    const deletedTitle = deleteTarget.title
    try {
      await deleteNewsletterApi(Number(deleteTarget.id))
      await loadNews()
      setFeedback({ type: 'success', message: `"${deletedTitle}" deleted successfully` })
    } catch (err) {
      setArticles(prev => prev.filter(a => a.id !== deleteTarget.id))
      setFeedback({ type: 'info', message: `"${deletedTitle}" removed locally — sync may be delayed` })
    } finally {
      setDeleteTarget(null)
    }
  }

  return (
    <section className="section">
      <div className="container">

        {/* ── Feedback Banner ── */}
        {feedback && (
          <Portal>
            <div
              style={{
                position: 'fixed',
                top: 'calc(var(--header-height, 78px) + 1rem)',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 10000,
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                background: feedback.type === 'success' ? 'rgba(22, 101, 52, 0.22)' : 'rgba(118, 0, 49, 0.18)',
                backdropFilter: 'blur(16px) saturate(1.6)',
                WebkitBackdropFilter: 'blur(16px) saturate(1.6)',
                color: feedback.type === 'success' ? '#0d3d20' : '#5c0026',
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: '0.9rem',
                padding: '0.9rem 1.4rem',
                borderRadius: '14px',
                border: '1.5px solid rgba(255, 255, 255, 0.35)',
                boxShadow: feedback.type === 'success'
                  ? '0 12px 32px rgba(22,101,52,0.25), inset 0 1px 0 rgba(255,255,255,0.4)'
                  : '0 12px 32px rgba(118,0,49,0.18), inset 0 1px 0 rgba(255,255,255,0.4)',
                maxWidth: '90vw',
                animation: 'toastPop 220ms ease-out',
              }}
            >
              {feedback.type === 'success' ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ flexShrink: 0 }}>
                  <circle cx="12" cy="12" r="10" />
                  <path d="M8 12l3 3 5-6" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ flexShrink: 0 }}>
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v5" />
                  <path d="M12 16h.01" />
                </svg>
              )}
              <span>{feedback.message}</span>
            </div>
            <style>{`
              @keyframes toastPop {
                from { opacity: 0; transform: translateX(-50%) translateY(-12px) scale(0.96); }
                to { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
              }
            `}</style>
          </Portal>
        )}

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
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
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
              <div key={article.id} className="news-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 0, overflow: 'hidden' }}>
                <div>
                  <div style={{ width: '100%', height: '165px', position: 'relative', overflow: 'hidden', background: '#111' }}>
                    <img
                      src={resolveImageUrl(article.image || article.imageURL) || 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=700&q=80'}
                      alt={article.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={e => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=700&q=80'
                      }}
                    />
                    <div style={{ position: 'absolute', top: '0.65rem', left: '0.65rem' }}>
                      <span className="news-cat" style={{ margin: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>{article.category}</span>
                    </div>
                  </div>
                  <div style={{ padding: '1rem 1.1rem 0' }}>
                    <div className="news-title" style={{ fontSize: '1rem', fontWeight: 800 }}>{article.title}</div>
                    <span className="news-date">{article.date}</span>
                    {article.summary && <p className="news-summary" style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--ink-2)' }}>{article.summary}</p>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', padding: '0.85rem 1.1rem 1rem', borderTop: '1px solid rgba(118,0,49,0.08)' }}>
                  <button className="btn btn-secondary btn-sm" style={{ flex: 1, fontWeight: 700 }} onClick={() => openModal(article)}>✏️ Edit Article</button>
                  <button className="btn btn-danger btn-sm" style={{ fontWeight: 700 }} onClick={() => setDeleteTarget(article)}>Delete</button>
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
            <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) requestCloseModal() }}>
              <div className="modal">
                <div className="modal-header">
                  <span className="modal-title">{editTarget ? 'Edit Article' : 'Publish New Article'}</span>
                  <button className="modal-close" onClick={requestCloseModal}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
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
                      <label className="form-label">Article Banner Image</label>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                        {imageUrl && (
                          <div style={{ width: '100%', height: '140px', borderRadius: '8px', overflow: 'hidden', border: '1.5px solid rgba(118,0,49,0.2)', position: 'relative' }}>
                            <img
                              src={resolveImageUrl(imageUrl)}
                              alt="Banner Preview"
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                            />
                            <button
                              type="button"
                              onClick={() => { setImageUrl(''); setImageFile(null) }}
                              style={{ position: 'absolute', top: '0.4rem', right: '0.4rem', background: 'rgba(0,0,0,0.7)', color: '#fff', border: 'none', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', fontWeight: 800 }}
                              title="Remove Image"
                            >
                              ✕
                            </button>
                          </div>
                        )}
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <label className="btn btn-secondary btn-sm" style={{ flex: 1, cursor: 'pointer', textAlign: 'center', justifyContent: 'center', fontWeight: 700 }}>
                            🖼️ Select Image File
                            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageChange} />
                          </label>
                          <input
                            className="form-input"
                            type="text"
                            placeholder="Or paste image URL..."
                            value={imageUrl}
                            onChange={e => setImageUrl(e.target.value)}
                            style={{ flex: 1.5, fontSize: '0.8rem' }}
                          />
                        </div>
                        {uploading && <div style={{ fontSize: '0.78rem', color: 'var(--maroon)' }}>Processing image...</div>}
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Summary / Body *</label>
                      <textarea className="form-input" value={formSummary} onChange={e => setFormSummary(e.target.value)}
                        placeholder="Brief description of the announcement…" style={{ minHeight: '110px', resize: 'vertical' }} required />
                    </div>
                  </div>
                  <div className="modal-footer" style={{ display: 'flex', alignItems: 'center' }}>
                    {editTarget && !isFormDirty() && (
                      <span style={{
                        fontSize: '0.78rem',
                        color: 'var(--maroon)',
                        fontFamily: 'var(--font-display)',
                        fontWeight: 600,
                        marginRight: 'auto',
                        lineHeight: 1,
                      }}>
                        Edit a field to enable saving
                      </span>
                    )}
                    <button type="button" className="btn btn-secondary" onClick={requestCloseModal} disabled={isSaving}>Cancel</button>
                    {(!editTarget || isFormDirty()) && (
                      <button type="submit" className="btn btn-primary" disabled={uploading || isSaving}>
                        {uploading
                          ? 'Uploading Image…'
                          : isSaving
                            ? (editTarget ? 'Saving…' : 'Publishing…')
                            : (editTarget ? 'Save Changes' : 'Publish Article')}
                      </button>
                    )}
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

        {/* ── Discard Changes Confirmation ── */}
        <ConfirmDialog
          isOpen={confirmAction === 'cancel'}
          title="Discard Changes"
          message="Any unsaved changes will be lost. Are you sure you want to close this form?"
          confirmLabel="Discard"
          cancelLabel="Keep Editing"
          variant="danger"
          onConfirm={() => {
            setShowModal(false)
            setConfirmAction(null)
            setFeedback({ type: 'info', message: 'Changes discarded' })
          }}
          onCancel={() => setConfirmAction(null)}
        />

      </div>
    </section>
  )
}
