/**
 * eSKala — GlobalSearchBar
 *
 * Trigger: a search icon button in the header (+ Ctrl/Cmd+K shortcut).
 * Opens a full-screen overlay with a large search input and rich results.
 * Results show an icon, label, and category tag. No paths visible.
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, X,
  LayoutDashboard, FolderOpen, FolderPlus, Newspaper,
  PieChart, Receipt, MessageSquare, MessageSquarePlus,
  Users, UserPlus, BadgeCheck, ClipboardList,
  FileDown, FilePlus, MapPin, Info,
} from 'lucide-react'
import { searchEntries } from '../data/searchRegistry'
import type { SearchEntry } from '../data/searchRegistry'
import type { Role, SKPosition } from '../types'

// ── Icon map ──────────────────────────────────────────────────────────────────
const ICON_MAP: Record<string, React.ElementType> = {
  LayoutDashboard, FolderOpen, FolderPlus, Newspaper,
  PieChart, Receipt, MessageSquare, MessageSquarePlus,
  Users, UserPlus, BadgeCheck, ClipboardList,
  FileDown, FilePlus, MapPin, Info, Search,
}

// ── Category colour accents ───────────────────────────────────────────────────
const CATEGORY_ACCENT: Record<string, string> = {
  Home:       'var(--maroon)',
  Projects:   '#2563eb',
  Finance:    '#059669',
  Community:  '#7c3aed',
  News:       '#d97706',
  Officials:  '#0891b2',
  Reports:    '#dc2626',
  Accounts:   '#0369a1',
  Audit:      '#64748b',
  Filters:    '#065f46',
  Info:       '#6b7280',
}

interface GlobalSearchBarProps {
  role: Role
  skPosition?: SKPosition
}

export default function GlobalSearchBar({ role, skPosition }: GlobalSearchBarProps) {
  const [open, setOpen]       = useState(false)
  const [query, setQuery]     = useState('')
  const [active, setActive]   = useState(0)
  const results               = searchEntries(query, role, skPosition)
  const inputRef              = useRef<HTMLInputElement>(null)
  const listRef               = useRef<HTMLUListElement>(null)
  const navigate              = useNavigate()

  // Open / close helpers
  const openModal  = useCallback(() => { setOpen(true);  setQuery(''); setActive(0) }, [])
  const closeModal = useCallback(() => { setOpen(false); setQuery(''); setActive(0) }, [])

  // Global Ctrl+K / Cmd+K shortcut
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        open ? closeModal() : openModal()
      }
      if (e.key === 'Escape' && open) closeModal()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, openModal, closeModal])

  // Focus input when overlay opens
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 60)
  }, [open])

  // Reset active index when results change
  useEffect(() => { setActive(0) }, [query])

  // Keyboard navigation inside the list
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!results.length) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive(i => (i + 1) % results.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive(i => (i - 1 + results.length) % results.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (results[active]) handleSelect(results[active])
    }
  }

  const handleSelect = (entry: SearchEntry) => {
    closeModal()
    navigate(entry.path)
  }

  // Scroll active item into view
  useEffect(() => {
    const el = listRef.current?.children[active] as HTMLElement | undefined
    el?.scrollIntoView({ block: 'nearest' })
  }, [active])

  if (role === 'guest') return null

  const IconComponent = ({ name }: { name: string }) => {
    const Ic = ICON_MAP[name] ?? Search
    return <Ic size={18} />
  }

  return (
    <>
      {/* ── Trigger button (in header) ── */}
      <button
        className="gsb-trigger"
        onClick={openModal}
        aria-label="Search features (Ctrl+K)"
        title="Search features  Ctrl+K"
      >
        <Search size={15} strokeWidth={2.2} />
        <span className="gsb-trigger-label">Search</span>
        <kbd className="gsb-kbd">Ctrl K</kbd>
      </button>

      {/* ── Overlay ── */}
      {open && (
        <div className="gsb-overlay" onClick={e => { if (e.target === e.currentTarget) closeModal() }}>
          <div className="gsb-modal" role="dialog" aria-modal="true" aria-label="Search">

            {/* Search input row */}
            <div className="gsb-input-row">
              <Search size={18} className="gsb-input-icon" strokeWidth={2} />
              <input
                ref={inputRef}
                className="gsb-input"
                type="text"
                placeholder="Search features, pages, actions…"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={onKeyDown}
                autoComplete="off"
                spellCheck={false}
              />
              {query && (
                <button className="gsb-clear" onClick={() => { setQuery(''); inputRef.current?.focus() }} aria-label="Clear">
                  <X size={15} />
                </button>
              )}
              <button className="gsb-close-btn" onClick={closeModal} aria-label="Close search">
                <kbd className="gsb-kbd gsb-kbd--esc">ESC</kbd>
              </button>
            </div>

            {/* Results */}
            {query && (
              <div className="gsb-results-wrap">
                {results.length === 0 ? (
                  <div className="gsb-empty">
                    <div className="gsb-empty-icon"><Search size={28} strokeWidth={1.5} /></div>
                    <p className="gsb-empty-title">No results for &ldquo;{query}&rdquo;</p>
                    <p className="gsb-empty-sub">Try a different keyword, like "projects" or "budget".</p>
                  </div>
                ) : (
                  <ul className="gsb-list" ref={listRef} role="listbox">
                    {results.map((entry, i) => {
                      const accent = CATEGORY_ACCENT[entry.category] ?? 'var(--maroon)'
                      return (
                        <li
                          key={`${entry.path}-${entry.label}`}
                          className={`gsb-item${i === active ? ' gsb-item--active' : ''}`}
                          role="option"
                          aria-selected={i === active}
                          onMouseEnter={() => setActive(i)}
                          onClick={() => handleSelect(entry)}
                        >
                          {/* Icon chip */}
                          <span className="gsb-item-icon" style={{ background: `${accent}14`, color: accent }}>
                            <IconComponent name={entry.icon} />
                          </span>

                          {/* Label + category */}
                          <span className="gsb-item-text">
                            <span className="gsb-item-label">{entry.label}</span>
                          </span>

                          {/* Category tag */}
                          <span className="gsb-item-tag" style={{ color: accent, background: `${accent}12`, borderColor: `${accent}28` }}>
                            {entry.category}
                          </span>

                          {/* Arrow */}
                          <span className="gsb-item-arrow">↵</span>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            )}

            {/* Footer hint */}
            <div className="gsb-footer">
              <span><kbd className="gsb-kbd-sm">↑</kbd><kbd className="gsb-kbd-sm">↓</kbd> Navigate</span>
              <span><kbd className="gsb-kbd-sm">↵</kbd> Go</span>
              <span><kbd className="gsb-kbd-sm">Esc</kbd> Close</span>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
