import { useState, useRef, useEffect } from 'react'

interface DateInputProps {
    value: string // ISO format yyyy-mm-dd — same as what your handlers already use
    onChange: (value: string) => void
    className?: string
    placeholder?: string
    min?: string
}

function isoToDisplay(iso: string) {
    if (!iso) return ''
    const [y, m, d] = iso.split('-')
    if (!y || !m || !d) return ''
    return `${d}/${m}/${y}`
}

// Parses "DD/MM/YYYY" (also accepts D/M/YYYY, DD-MM-YYYY) into ISO yyyy-mm-dd.
// Returns '' if the text isn't a complete, valid date yet.
function displayToIso(display: string): string {
    const match = display.trim().match(/^(\d{1,2})[/\-](\d{1,2})[/\-](\d{4})$/)
    if (!match) return ''
    const [, dd, mm, yyyy] = match
    const day = Number(dd)
    const month = Number(mm)
    const year = Number(yyyy)
    if (month < 1 || month > 12) return ''
    const daysInMonth = new Date(year, month, 0).getDate()
    if (day < 1 || day > daysInMonth) return ''
    return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`
}

export default function DateInput({ value, onChange, className, placeholder, min }: DateInputProps) {
    const [open, setOpen] = useState(false)
    const [text, setText] = useState(isoToDisplay(value))
    const wrapRef = useRef<HTMLDivElement>(null)

    // Keep the typed text in sync when the value changes from outside
    // (e.g. a calendar pick, or the parent resetting the form).
    useEffect(() => {
        setText(isoToDisplay(value))
    }, [value])

    useEffect(() => {
        function onClickOutside(e: MouseEvent) {
            if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
                setOpen(false)
                // Revert any incomplete/invalid typed text back to the last valid value
                setText(isoToDisplay(value))
            }
        }
        document.addEventListener('mousedown', onClickOutside)
        return () => document.removeEventListener('mousedown', onClickOutside)
    }, [value])

    const base = value ? new Date(value) : new Date()
    const [viewYear, setViewYear] = useState(base.getFullYear())
    const [viewMonth, setViewMonth] = useState(base.getMonth())

    const firstDay = new Date(viewYear, viewMonth, 1)
    const startWeekday = firstDay.getDay()
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
    const monthLabel = firstDay.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })

    const minDate = min ? new Date(min + 'T00:00:00') : null

    function isDisabledDay(day: number) {
        if (!minDate) return false
        const candidate = new Date(viewYear, viewMonth, day)
        return candidate < minDate
    }

    function pick(day: number) {
        if (isDisabledDay(day)) return
        const mm = String(viewMonth + 1).padStart(2, '0')
        const dd = String(day).padStart(2, '0')
        onChange(`${viewYear}-${mm}-${dd}`)
        setOpen(false)
    }
    function prevMonth() {
        if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) } else setViewMonth(m => m - 1)
    }
    function nextMonth() {
        if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) } else setViewMonth(m => m + 1)
    }

    function handleTextChange(raw: string) {
        // Allow only digits and separators while typing
        const cleaned = raw.replace(/[^0-9/\-]/g, '')
        setText(cleaned)
        const iso = displayToIso(cleaned)
        if (iso) {
            if (minDate && new Date(iso + 'T00:00:00') < minDate) return
            onChange(iso)
            const [yyyy, mm] = iso.split('-')
            setViewYear(Number(yyyy))
            setViewMonth(Number(mm) - 1)
        }
    }

    function handleBlur() {
        // If what's left in the box isn't a valid complete date, snap back
        // to the last valid value instead of leaving a half-typed string.
        const iso = displayToIso(text)
        if (!iso) setText(isoToDisplay(value))
    }

    const cells: (number | null)[] = []
    for (let i = 0; i < startWeekday; i++) cells.push(null)
    for (let d = 1; d <= daysInMonth; d++) cells.push(d)

    return (
        <div ref={wrapRef} style={{ position: 'relative' }}>
            <input
                className={className}
                type="text"
                inputMode="numeric"
                value={text}
                placeholder={placeholder || 'DD/MM/YYYY'}
                onChange={e => handleTextChange(e.target.value)}
                onFocus={() => setOpen(true)}
                onBlur={handleBlur}
                style={{ textAlign: 'left', paddingRight: '2.4rem' }}
            />
            <svg
                onClick={() => setOpen(o => !o)}
                width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--maroon)" strokeWidth="2"
                style={{
                    position: 'absolute',
                    right: '0.85rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    cursor: 'pointer',
                }}
            >
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            {open && (
                <div style={{
                    position: 'absolute', top: 'calc(100% + 4px)', left: 0, zIndex: 50,
                    background: '#fff', border: '1.5px solid rgba(118,0,49,0.18)',
                    boxShadow: '0 12px 32px rgba(118,0,49,0.16)', padding: '0.75rem', width: '260px',
                    fontFamily: 'var(--font-display)', boxSizing: 'border-box',
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <button type="button" onClick={prevMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--maroon)', fontWeight: 800, fontSize: '1rem' }}>‹</button>
                        <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{monthLabel}</span>
                        <button type="button" onClick={nextMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--maroon)', fontWeight: 800, fontSize: '1rem' }}>›</button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', fontSize: '0.7rem', color: 'var(--muted)', marginBottom: '0.25rem', textAlign: 'center' }}>
                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <div key={i}>{d}</div>)}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
                        {cells.map((day, i) => {
                            const disabled = !day || isDisabledDay(day)
                            const isSelected = !!day && value === `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                            return (
                                <button
                                    key={i}
                                    type="button"
                                    disabled={disabled}
                                    onClick={() => day && pick(day)}
                                    style={{
                                        aspectRatio: '1', border: 'none',
                                        background: isSelected ? 'var(--maroon)' : 'none',
                                        cursor: !day ? 'default' : disabled ? 'not-allowed' : 'pointer',
                                        fontSize: '0.78rem', fontWeight: isSelected ? 800 : 400, borderRadius: '4px',
                                        color: !day ? 'transparent' : isSelected ? '#fff' : disabled ? '#ccc' : 'var(--ink)',
                                        opacity: disabled && day ? 0.5 : 1,
                                    }}
                                >
                                    {day || ''}
                                </button>
                            )
                        })}
                    </div>
                    <div style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        marginTop: '0.65rem', paddingTop: '0.6rem', borderTop: '1px solid rgba(118,0,49,0.1)',
                    }}>
                        <button
                            type="button"
                            onClick={() => { onChange(''); setText(''); setOpen(false) }}
                            style={{
                                background: 'none', border: 'none', cursor: 'pointer',
                                color: 'var(--muted)', fontSize: '0.76rem', fontWeight: 700,
                                fontFamily: 'var(--font-display)', padding: '0.3rem 0.1rem',
                            }}
                        >
                            Clear
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                const now = new Date()
                                const todayIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
                                if (minDate && now < minDate) return
                                onChange(todayIso)
                                setViewYear(now.getFullYear())
                                setViewMonth(now.getMonth())
                                setOpen(false)
                            }}
                            style={{
                                background: 'none', border: 'none', cursor: 'pointer',
                                color: 'var(--maroon)', fontSize: '0.76rem', fontWeight: 800,
                                fontFamily: 'var(--font-display)', padding: '0.3rem 0.1rem',
                            }}
                        >
                            Today
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}