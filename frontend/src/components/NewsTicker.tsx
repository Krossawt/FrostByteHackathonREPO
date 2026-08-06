import { useEffect, useState } from 'react'

// VITE_API_URL is baked into the build at compile time — always the deployed Render backend URL
const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'https://frostbytehackathonrepo.onrender.com/api/v1'

interface Newsletter {
  newsletterID: number
  title: string
  summary?: string
  imageURL?: string
  category: string
  projectLocation?: string
  publishedAt: string
}

export default function NewsTicker() {
  const [tickerItems, setTickerItems] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchNewsletters = async () => {
      try {
        setLoading(true)

        const response = await fetch(`${API_BASE_URL}/newsletter?limit=20`)

        if (!response.ok) {
          console.warn(`[NewsTicker] Newsletter fetch returned ${response.status}`)
          setTickerItems([])
          return
        }

        // Safely parse — guard against empty response body
        const text = await response.text()
        if (!text || !text.trim()) {
          setTickerItems([])
          return
        }

        let data: any
        try {
          data = JSON.parse(text)
        } catch {
          setTickerItems([])
          return
        }

        // Handle both array responses and object-wrapped responses
        let newsletters: Newsletter[] = []
        if (Array.isArray(data)) {
          newsletters = data
        } else if (data && Array.isArray(data.items)) {
          newsletters = data.items
        } else if (data && Array.isArray(data.data)) {
          newsletters = data.data
        } else if (data && Array.isArray(data.newsletters)) {
          newsletters = data.newsletters
        }

        const titles = newsletters.map(n => n.title).filter(Boolean)

        if (titles.length === 0) {
          setTickerItems([])
          return
        }

        // Ensure enough items for smooth infinite scrolling animation
        if (titles.length < 3) {
          setTickerItems([...titles, ...titles, ...titles])
        } else {
          setTickerItems(titles)
        }
      } catch (err) {
        // Silently fail — do not show ticker if backend is unreachable
        console.warn('[NewsTicker] Could not load headlines:', err)
        setTickerItems([])
      } finally {
        setLoading(false)
      }
    }

    fetchNewsletters()

    // Refresh every 5 minutes
    const interval = setInterval(fetchNewsletters, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  // Don't render ticker if empty or still loading
  if (loading || tickerItems.length === 0) {
    return null
  }

  return (
    <div className="news-ticker-wrap">
      <div className="news-ticker">
        <div className="ticker-track">
          {[...tickerItems, ...tickerItems].map((item, i) => (
            <span key={i} className="ticker-item">
              <span className="ticker-sep">◆</span>&nbsp;{item}&nbsp;
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}