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
  Home: 'var(--maroon)',
  Projects: '#2563eb',
  Finance: '#059669',
  Community: '#7c3aed',
  News: '#d97706',
  Officials: '#0891b2',
  Reports: '#dc2626',
  Accounts: '#0369a1',
  Audit: '#64748b',
  Filters: '#065f46',
  Info: '#6b7280',
}

interface GlobalSearchBarProps {
  role: Role
  skPosition?: SKPosition
}

export default function GlobalSearchBar({ role, skPosition }: GlobalSearchBarProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const results = searchEntries(query, role, skPosition)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const navigate = useNavigate()

  // "Compact" mode = anything below laptop width (1050px). At these sizes
  // there's no physical keyboard to rely on, so we swap the Esc/↑/↓/↵
  // hints for a tappable close button and hide the footer legend — same
  // treatment a phone gets. This now also covers the 900–1050px band
  // (small laptops / split-screen windows), not just phones/tablets.
  const [isCompact, setIsCompact] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1049px)')
    const update = () => setIsCompact(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  // Open / close helpers
  const openModal = useCallback(() => { setOpen(true); setQuery(''); setActive(0) }, [])
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

  // Smooth scroll handler for page sections / hashes
  const handleSelect = (entry: SearchEntry) => {
    closeModal()

    if (entry.path.includes('#')) {
      const [pathname, hash] = entry.path.split('#')
      navigate(pathname + '#' + hash)

      // The target section exists in the DOM right away, but pages like
      // CitizenHome fetch projects/news/suggestions asynchronously and the
      // section's real height (and therefore position) only settles once
      // that data — and any images inside it — finish loading. Scrolling
      // once, immediately, lands us at a position that's about to shift
      // out from under us. So: keep re-measuring and re-scrolling for a
      // window after navigation, and only stop once the position holds
      // steady across a couple of checks (i.e. the layout has settled).
      const headerOffset = 80 // adjust to your sticky header's real height
      let ticks = 0
      const maxTicks = 20      // ~3s ceiling
      let stableCount = 0
      let lastTop: number | null = null

      const tick = () => {
        const targetElement = document.getElementById(hash)
        if (!targetElement) {
          if (ticks++ < maxTicks) setTimeout(tick, 150)
          return
        }

        const rect = targetElement.getBoundingClientRect()
        const top = rect.top + window.scrollY - headerOffset

        // Only re-scroll if the position actually moved meaningfully —
        // avoids fighting the user if they try to scroll away manually.
        if (lastTop === null || Math.abs(top - lastTop) > 4) {
          window.scrollTo({ top, behavior: lastTop === null ? 'smooth' : 'auto' })
          stableCount = 0
        } else {
          stableCount++
        }
        lastTop = top

        // Two consecutive stable reads (300ms of no movement) = layout settled.
        if (stableCount < 2 && ticks++ < maxTicks) {
          setTimeout(tick, 150)
        }
      }

      setTimeout(tick, 80)
    } else {
      navigate(entry.path)
    }
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

  // Below 1050px there's no keyboard-hint UI, so tapping anywhere inside
  // the modal that ISN'T the input row or the results list closes the
  // search overlay instead (same as before, just at the wider breakpoint).
  const onModalTap = (e: React.MouseEvent) => {
    if (!isCompact) return
    const target = e.target as HTMLElement
    if (target.closest('.gsb-input-row') || target.closest('.gsb-results-wrap')) return
    closeModal()
  }

  return (
    <>
      {/* Responsive overrides. If these rules already live in your global
          stylesheet, remove this block to avoid duplicating them. */}
      <style>{`
        /* Compact "no physical keyboard" styling — phones, tablets, and
           now small laptop / split-screen widths (900–1050px) too. */
        @media (max-width: 900px) {
          .gsb-item-label   { font-size: 13px; line-height: 1.25; }
          .gsb-item-tag     { font-size: 10px; padding: 2px 6px; }
          .gsb-item-icon    { width: 28px; height: 28px; flex-shrink: 0; }
          .gsb-item         { padding: 8px 10px; gap: 8px; }
          .gsb-item-arrow   { display: none; } /* Enter-key hint, meaningless on touch */
          .gsb-input        { font-size: 15px; }
          .gsb-empty-title  { font-size: 13px; }
          .gsb-empty-sub    { font-size: 12px; }
        }

        .gsb-close-btn--mobile {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: rgba(0,0,0,0.05);
          flex-shrink: 0;
        }

        /* Narrow phones: give the trigger a bit more horizontal room so the
           "Search" label stays visible instead of collapsing to icon-only. 
        @media (max-width: 500px) {
          .gsb-trigger {
            padding: 8px 12px;
            min-width: 108px;
            gap: 6px;
          }
          .gsb-trigger-label {
            display: inline;
            font-size: 13px;
          }
        }*/
      `}</style>

      {/* ── Trigger button (in header) ── */}
      <button
        className="gsb-trigger"
        onClick={openModal}
        aria-label="Search features (Ctrl+K)"
        title="Search features  Ctrl+K"
      >
        <Search size={15} strokeWidth={2.2} />
        <span className="gsb-trigger-label">Search</span>
        {/* Ctrl+K badge only makes sense with a physical keyboard, so it's
            reserved for laptop-and-up widths (≥1050px). */}
        {!isCompact && <kbd className="gsb-kbd">Ctrl K</kbd>}
      </button>

      {/* ── Overlay ── */}
      {open && (
        <div className="gsb-overlay" onClick={e => { if (e.target === e.currentTarget) closeModal() }}>
          <div className="gsb-modal" role="dialog" aria-modal="true" aria-label="Search" onClick={onModalTap}>

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
              {/* ≥1050px: keyboard hint. <1050px: real tap target, since Esc
                  doesn't exist and the modal is full-screen (no empty
                  backdrop to tap outside of). */}
              {isCompact ? (
                <button className="gsb-close-btn gsb-close-btn--mobile" onClick={closeModal} aria-label="Close search">
                  <X size={18} />
                </button>
              ) : (
                <button className="gsb-close-btn" onClick={closeModal} aria-label="Close search">
                  <kbd className="gsb-kbd gsb-kbd--esc">ESC</kbd>
                </button>
              )}
            </div>

            {/* Always show results/shortcuts */}
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

            {/* Footer hint — keyboard-only, so it's meaningless below 1050px */}
            {!isCompact && (
              <div className="gsb-footer">
                <span><kbd className="gsb-kbd-sm">↑</kbd><kbd className="gsb-kbd-sm">↓</kbd> Navigate</span>
                <span><kbd className="gsb-kbd-sm">↵</kbd> Go</span>
                <span><kbd className="gsb-kbd-sm">Esc</kbd> Close</span>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}