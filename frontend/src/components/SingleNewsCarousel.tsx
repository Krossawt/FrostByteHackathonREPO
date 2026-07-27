import { useState, useEffect, useRef, useCallback } from 'react'
import type { NewsItem } from '../types'

const NEWS_IMAGES: Record<string, string> = {
  'N-01': 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=700&q=80',
  'N-02': 'https://images.unsplash.com/photo-1531545514256-b1400bc00f31?w=700&q=80',
  'N-03': 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=700&q=80',
  'N-04': 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=700&q=80',
  'N-05': 'https://images.unsplash.com/photo-1568992687947-868a62a9f521?w=700&q=80',
  'N-06': 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=700&q=80',
  'N-07': 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=700&q=80',
  'N-08': 'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=700&q=80',
}

const FALLBACK_ITEMS: NewsItem[] = [
  { id: '1', title: 'Santa Rosa SK Transparency System Operational', category: 'City News', summary: 'Live public financial portal active across 18 barangays.', date: 'Today' }
]

interface SingleNewsCarouselProps {
  items?: NewsItem[]
  autoPlayInterval?: number
}

export default function SingleNewsCarousel({ items = FALLBACK_ITEMS, autoPlayInterval = 4000 }: SingleNewsCarouselProps) {
  const [index, setIndex] = useState(0)
  const [animating, setAnimating] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const count = items.length

  const goTo = useCallback((nextIdx: number) => {
    if (animating) return
    setAnimating(true)
    setIndex((nextIdx + count) % count)
    setTimeout(() => setAnimating(false), 350)
  }, [animating, count])

  const next = useCallback(() => goTo(index + 1), [goTo, index])
  const prev = useCallback(() => goTo(index - 1), [goTo, index])

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setIndex(i => (i + 1) % count)
    }, autoPlayInterval)
  }, [count, autoPlayInterval])

  const stopTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
  }, [])

  useEffect(() => {
    startTimer()
    return () => stopTimer()
  }, [startTimer, stopTimer])

  const item = items[index] || items[0]
  const imgUrl = NEWS_IMAGES[item.id] ?? NEWS_IMAGES['N-01']

  return (
    <div
      className="single-news-container"
      onMouseEnter={stopTimer}
      onMouseLeave={startTimer}
    >
      <div className="single-news-header">
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.1rem', color: 'var(--ink)', margin: 0 }}>
          Latest News
        </h2>
        <div className="single-news-nav-btns">
          <button onClick={prev} className="single-news-nav-btn" aria-label="Previous article">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
          </button>
          <span className="single-news-counter">{index + 1} / {count}</span>
          <button onClick={next} className="single-news-nav-btn" aria-label="Next article">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Featured News Card */}
      <div className={`single-news-card ${animating ? 'transitioning' : ''}`}>
        <div className="single-news-img-wrap">
          <img
            src={imgUrl}
            alt={item.title}
            className="single-news-img"
            onError={e => {
              const el = e.target as HTMLImageElement
              el.style.display = 'none'
            }}
          />
          <div className="single-news-img-overlay" />
          <span className="single-news-badge">{item.category}</span>
        </div>

        <div className="single-news-body">
          <div className="single-news-date">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            {item.date}
          </div>
          <h3 className="single-news-title">{item.title}</h3>
          {item.summary && <p className="single-news-summary">{item.summary}</p>}
        </div>

        {/* Carousel indicators */}
        <div className="single-news-dots">
          {items.map((_, i) => (
            <button
              key={i}
              className={`single-news-dot ${i === index ? 'active' : ''}`}
              onClick={() => goTo(i)}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
