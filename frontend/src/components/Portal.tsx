/**
 * eSKala — Portal component
 * Renders children directly into document.body via ReactDOM.createPortal.
 * This escapes ALL stacking contexts (app-shell, main, etc.) and guarantees
 * that modals/overlays always appear above the sticky header and footer.
 */
import { createPortal } from 'react-dom'
import type { ReactNode } from 'react'

interface PortalProps {
  children: ReactNode
}

export default function Portal({ children }: PortalProps) {
  return createPortal(children, document.body)
}
