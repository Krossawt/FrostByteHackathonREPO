/**
 * eSKala — Reusable Confirmation Dialog
 * Used for: logout, delete, suspend, approve actions
 */
import Portal from './Portal'

interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  variant?: 'danger' | 'info' | 'success'
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({
  isOpen, title, message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = false,
  variant,
  onConfirm, onCancel,
}: ConfirmDialogProps) {
  if (!isOpen) return null

  // variant takes priority if passed; otherwise fall back to the danger boolean
  const resolvedVariant: 'danger' | 'info' | 'success' = variant ?? (danger ? 'danger' : 'info')
  const iconClass =
    resolvedVariant === 'danger' ? '' :
      resolvedVariant === 'success' ? 'success' : 'info'
  const btnClass =
    resolvedVariant === 'danger' ? 'btn-danger' :
      resolvedVariant === 'success' ? 'btn-save' : 'btn-primary'

  return (
    <Portal>
      <div
        className="modal-overlay"
        onClick={e => { if (e.target === e.currentTarget) onCancel() }}
      >
        <div className="modal confirm-dialog">
          <div className={`confirm-dialog-icon ${iconClass}`}>
            {resolvedVariant === 'danger' ? (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            ) : resolvedVariant === 'success' ? (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            ) : (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            )}
          </div>
          <div className="confirm-dialog-title">{title}</div>
          <p className="confirm-dialog-message">{message}</p>
          <div className="confirm-dialog-actions">
            <button className="btn btn-secondary" onClick={onCancel}>{cancelLabel}</button>
            <button
              className={`btn ${btnClass}`}
              onClick={onConfirm}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </Portal>
  )
}
