import { SEVERITY_LABELS } from '../../lib/incidents'
import './SeverityBadge.css'

function SeverityBadge({ severity }) {
  const label = SEVERITY_LABELS[severity]
  if (!label) return null
  return (
    <span className="severity-badge" data-severity={severity}>
      {label} Severity
    </span>
  )
}

export default SeverityBadge
