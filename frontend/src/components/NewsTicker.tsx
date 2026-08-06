import { useEffect, useState } from 'react'

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
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchNewsletters = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Fetch from your backend API (full URL for cross-port requests)
      const API_URL = import.meta.env.VITE_API_URL || 'https://frostbytehackathonrepo.onrender.com/api/v1'
        const response = await fetch(`${API_URL}/newsletter?limit=20`)
        
        if (!response.ok) {
          throw new Error(`Failed to fetch newsletters: ${response.statusText}`)
        }
        
        const newsletters: Newsletter[] = await response.json()
        
        // Extract titles and create ticker items
        const titles = newsletters.map(n => n.title)
        setTickerItems(titles)
        
        // If fewer than 3 items, duplicate them to ensure smooth scrolling
        if (titles.length < 3) {
          setTickerItems([...titles, ...titles, ...titles])
        }
      } catch (err) {
        console.error('Error fetching newsletters:', err)
        setError(err instanceof Error ? err.message : 'Failed to load news')
        // Fallback to empty state - ticker won't show if no data
        setTickerItems([])
      } finally {
        setLoading(false)
      }
    }

    fetchNewsletters()
    
    // Optional: Refresh every 5 minutes
    const interval = setInterval(fetchNewsletters, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  // Don't render ticker if empty or loading
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