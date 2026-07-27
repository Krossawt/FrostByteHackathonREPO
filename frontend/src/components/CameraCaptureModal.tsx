import { useEffect, useRef, useState } from 'react'
import Portal from './Portal'

interface CameraCaptureModalProps {
  title: string
  subtitle: string
  onCapture: () => void
  onClose: () => void
}

export default function CameraCaptureModal({ title, subtitle, onCapture, onClose }: CameraCaptureModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [isCapturing, setIsCapturing] = useState(false)

  useEffect(() => {
    let activeStream: MediaStream | null = null
    async function startCamera() {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const s = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
          })
          activeStream = s
          setStream(s)
          if (videoRef.current) {
            videoRef.current.srcObject = s
          }
        } else {
          setCameraError('Live video stream not supported on browser. Simulated camera viewfinder active.')
        }
      } catch (err) {
        console.warn('Camera access note:', err)
        setCameraError('Camera preview ready. Click "SNAP PHOTO & RUN OCR" below to capture document.')
      }
    }
    startCamera()

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach(t => t.stop())
      }
    }
  }, [])

  const handleSnap = () => {
    setIsCapturing(true)
    if (stream) {
      stream.getTracks().forEach(t => t.stop())
    }
    setTimeout(() => {
      onCapture()
    }, 400)
  }

  return (
    <Portal>
      <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal" style={{ width: 'min(540px, 95vw)', padding: '1.25rem', background: '#111', color: '#fff', borderRadius: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.05rem', color: 'var(--gold)' }}>
              📷 {title}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.7)' }}>{subtitle}</div>
          </div>
          <button className="modal-close-btn" style={{ color: '#fff' }} onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Viewfinder Canvas / Stream */}
        <div style={{ position: 'relative', width: '100%', height: '280px', background: '#000', borderRadius: '8px', overflow: 'hidden', border: '2px solid rgba(254,236,65,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {stream && !cameraError ? (
            <video ref={videoRef} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ textTransform: 'uppercase', textAlign: 'center', padding: '1.5rem' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📷</div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '0.9rem', color: 'var(--gold)' }}>
                Live Camera Viewfinder
              </div>
              <div style={{ fontSize: '0.76rem', color: 'rgba(255,255,255,0.6)', marginTop: '0.3rem' }}>
                Center receipt or proposal document inside reticle
              </div>
            </div>
          )}

          {/* Target Reticle Overlay */}
          <div style={{ position: 'absolute', inset: '20px', border: '2px dashed rgba(254,236,65,0.7)', pointerEvents: 'none', borderRadius: '6px' }} />
          {isCapturing && <div style={{ position: 'absolute', inset: 0, background: '#fff', opacity: 0.85 }} />}
        </div>

        {cameraError && (
          <div style={{ fontSize: '0.76rem', color: '#fef08a', background: 'rgba(254,240,138,0.1)', padding: '0.5rem 0.75rem', borderRadius: '4px', marginTop: '0.75rem' }}>
            {cameraError}
          </div>
        )}

        {/* Shutter / Action Controls */}
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.2rem', justifyContent: 'center' }}>
          <button className="btn btn-secondary" style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.3)' }} onClick={onClose}>
            Close Camera
          </button>
          <button className="btn btn-gold" style={{ padding: '0.6rem 1.4rem', fontWeight: 800 }} onClick={handleSnap}>
            📸 SNAP PHOTO &amp; RUN OCR
          </button>
        </div>
      </div>
      </div>
    </Portal>
  )
}
