import Portal from './Portal'

interface PolicyModalProps {
  isOpen: boolean
  type: 'terms' | 'privacy' | null
  onClose: () => void
}

export default function PolicyModal({ isOpen, type, onClose }: PolicyModalProps) {
  if (!isOpen || !type) return null

  return (
    <Portal>
      <div
        className="modal-overlay"
        onClick={e => { if (e.target === e.currentTarget) onClose() }}
        style={{ zIndex: 10000, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)' }}
      >
        <div
          className="modal"
          style={{
            width: 'min(640px, 95vw)',
            maxHeight: '88vh',
            display: 'flex',
            flexDirection: 'column',
            padding: 0,
            overflow: 'hidden',
            borderRadius: '24px',
            border: '1px solid rgba(255,255,255,0.4)',
            boxShadow: '0 24px 60px rgba(0,0,0,0.4)'
          }}
        >
          {/* Header Banner */}
          <div
            style={{
              background: 'linear-gradient(135deg, #760031 0%, #4a001f 60%, #1a000b 100%)',
              padding: '1.5rem 1.5rem 1.25rem',
              color: '#fff',
              position: 'relative'
            }}
          >
            <button
              onClick={onClose}
              aria-label="Close modal"
              style={{
                position: 'absolute', top: '1rem', right: '1rem',
                background: 'rgba(255,255,255,0.15)', color: '#fff',
                border: 'none', borderRadius: '50%', width: '32px', height: '32px',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                backdropFilter: 'blur(8px)', fontWeight: 800
              }}
            >
              ✕
            </button>
            <div style={{ fontSize: '0.72rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#FEEC41', fontWeight: 800, marginBottom: '0.25rem' }}>
              OFFICIAL LEGAL POLICY · SANTA ROSA CITY, LAGUNA
            </div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '1.35rem', margin: 0, color: '#fff' }}>
              {type === 'terms' ? '📋 Terms & Conditions of Use' : '🛡️ Data Privacy Policy (RA 10173)'}
            </h2>
          </div>

          {/* Scrollable Body */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '1.5rem',
              fontSize: '0.88rem',
              lineHeight: 1.65,
              color: 'var(--ink)'
            }}
          >
            {type === 'terms' ? (
              <>
                <div style={{ background: '#fdfafd', padding: '1rem 1.25rem', borderRadius: '12px', borderLeft: '4px solid var(--maroon)', marginBottom: '1.25rem' }}>
                  <strong style={{ color: 'var(--maroon)' }}>Governing Framework:</strong> This transparency portal is operated by the City Youth Development Office (CYDO) of Santa Rosa City, Laguna pursuant to Republic Act No. 10742 (SK Reform Act of 2015) as amended by RA 11768.
                </div>

                <h4 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--maroon)', marginBottom: '0.35rem' }}>1. Scope & Access Rights</h4>
                <p style={{ marginTop: 0, marginBottom: '1rem' }}>
                  eSKala provides citizen access to Sangguniang Kabataan (SK) annual investment plans (ABYIP), financial reports, purchase orders, and project status trackers across all 18 barangays of Santa Rosa City.
                </p>

                <h4 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--maroon)', marginBottom: '0.35rem' }}>2. Residency & Registration Verification</h4>
                <p style={{ marginTop: 0, marginBottom: '1rem' }}>
                  Citizen registration is strictly reserved for current residents of Santa Rosa City, Laguna. Falsification of barangay affiliation or identity is prohibited under municipal governance policies.
                </p>

                <h4 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--maroon)', marginBottom: '0.35rem' }}>3. Public Comments & Citizen Conduct</h4>
                <p style={{ marginTop: 0, marginBottom: '1rem' }}>
                  Citizens may submit comments and project suggestions to local SK councils. Submissions containing profanity, hate speech, libel, or unauthorized solicitations will be removed by system administrators.
                </p>

                <h4 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--maroon)', marginBottom: '0.35rem' }}>4. Financial Transparency Records</h4>
                <p style={{ marginTop: 0, marginBottom: '0.5rem' }}>
                  All uploaded financial receipts, purchase orders, and project summaries are public disclosure records. Tampering with or misrepresenting financial documentation is subject to COA and DILG audit sanctions.
                </p>
              </>
            ) : (
              <>
                <div style={{ background: '#f0fdf4', padding: '1rem 1.25rem', borderRadius: '12px', borderLeft: '4px solid #166534', marginBottom: '1.25rem' }}>
                  <strong style={{ color: '#166534' }}>Data Privacy Act Compliance (RA 10173):</strong> The City Government of Santa Rosa guarantees that all citizen personal data is protected under strict cryptographic and administrative safeguards.
                </div>

                <h4 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, color: '#166534', marginBottom: '0.35rem' }}>1. Personal Information Collected</h4>
                <p style={{ marginTop: 0, marginBottom: '1rem' }}>
                  We collect your Full Name, Email Address, Barangay of Residence, and optional profile picture upon registration solely for identity verification and localized transparency reporting.
                </p>

                <h4 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, color: '#166534', marginBottom: '0.35rem' }}>2. Purpose of Data Processing</h4>
                <p style={{ marginTop: 0, marginBottom: '1rem' }}>
                  Your information is processed to authenticate civic participation, route suggestions to your assigned barangay SK council, and provide audit trail compliance under DILG guidelines.
                </p>

                <h4 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, color: '#166534', marginBottom: '0.35rem' }}>3. Non-Disclosure Commitment</h4>
                <p style={{ marginTop: 0, marginBottom: '1rem' }}>
                  The City of Santa Rosa will never sell, rent, or commercialize citizen personal data. Data is shared exclusively with authorized CYDO municipal administrators.
                </p>

                <h4 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, color: '#166534', marginBottom: '0.35rem' }}>4. Your Rights under RA 10173</h4>
                <p style={{ marginTop: 0, marginBottom: '0.5rem' }}>
                  You retain the right to inspect, update, or permanently delete your account data at any time through the Account Management settings or by submitting a request to <code>cydo@santarosacity.gov.ph</code>.
                </p>
              </>
            )}
          </div>

          {/* Footer Action */}
          <div
            style={{
              padding: '1rem 1.5rem',
              background: '#f8fafc',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'flex-end'
            }}
          >
            <button
              onClick={onClose}
              className="btn btn-primary btn-sm"
              style={{
                fontWeight: 800,
                padding: '0.65rem 1.8rem',
                background: 'linear-gradient(135deg, #760031, #4a001f)',
                borderRadius: '10px'
              }}
            >
              I Understand &amp; Close
            </button>
          </div>
        </div>
      </div>
    </Portal>
  )
}
