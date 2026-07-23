const TICKER_ITEMS = [
  'SK Q1 2025 Financial Transparency Report — Now Published for All 18 Barangays',
  'eSKala Citizen Suggestion Portal Now Active across Santa Rosa City',
  'SK Federation President joins City Council Education Committee',
  'CYDO Youth Leadership Summit 2025 — 400 Participants Registered',
  'RA 11768 Amendment: Enhanced SK Fund Guidelines Effective July 2025',
  'Santa Rosa Named Top Youth-Friendly City in Region IV-A (Calabarzon)',
]

export default function NewsTicker() {
  return (
    <div className="news-ticker-wrap">
      <div className="news-ticker">
        <div className="ticker-track">
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
            <span key={i} className="ticker-item">
              <span className="ticker-sep">◆</span>&nbsp;{item}&nbsp;
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
