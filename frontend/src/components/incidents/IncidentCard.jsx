import { useState } from 'react'
import { Link } from 'react-router-dom'
import ViolationTag from './ViolationTag'
import SeverityBadge from './SeverityBadge'
import RepeatBadge from './RepeatBadge'
import BoundingBox from './BoundingBox'
import StatusButtonGroup from './StatusButtonGroup'
import { STATUS_LABELS, formatTimeAgo, formatConfidence, evidenceSrc } from '../../lib/incidents'
import './IncidentCard.css'

function IncidentCard({ incident, severity, plateOccurrence, onStatusChange }) {
  const {
    id,
    plate_number,
    violation_type,
    timestamp,
    confidence,
    review_status,
  } = incident

  const [thumbFailed, setThumbFailed] = useState(false)

  const timeAgo = formatTimeAgo(timestamp)
  const incidentId = `INC-${id}`
  const plateLabel = plate_number ?? 'No Plate'
  const confidenceLabel = formatConfidence(confidence)
  const statusLabel = STATUS_LABELS[review_status] ?? review_status
  const thumbSrc = evidenceSrc(incident)
  const showThumb = Boolean(thumbSrc) && !thumbFailed

  return (
    <article className="incident-card" data-status={review_status}>
      {/* Status buttons below are interactive controls of their own, so they
          stay outside this Link rather than nested inside an <a> — only the
          "view details" part of the card is a link. */}
      <Link to={`/incident/${id}`} className="incident-card__link">
        <header className="incident-card__head">
          <div className="incident-card__head-tags">
            <ViolationTag violationType={violation_type} />
            <SeverityBadge severity={severity} />
          </div>
          <div className="incident-card__head-right">
            <span className="incident-card__status">{statusLabel}</span>
            <span className="incident-card__id">{incidentId}</span>
          </div>
        </header>

        <div className="incident-card__body">
          <div className="incident-card__thumb">
            {showThumb ? (
              <>
                <img
                  className="incident-card__thumb-img"
                  src={thumbSrc}
                  alt={`Evidence for ${plateLabel}`}
                  onError={() => setThumbFailed(true)}
                />
                <BoundingBox bbox={incident.bbox} />
              </>
            ) : null}
          </div>

          <div className="incident-card__info">
            <div className="incident-card__plate-row">
              <div className="incident-card__plate">{plateLabel}</div>
              <RepeatBadge occurrence={plateOccurrence} />
            </div>
            <div className="incident-card__meta">
              <span className="incident-card__meta-time">TIME {timeAgo}</span>
              <span className="incident-card__meta-sep" aria-hidden="true">
                |
              </span>
              <span className="incident-card__meta-conf">CONF {confidenceLabel}</span>
            </div>
          </div>
        </div>
      </Link>

      <StatusButtonGroup
        status={review_status}
        onChange={(newStatus, reason) => onStatusChange?.(id, newStatus, reason)}
      />
    </article>
  )
}

export default IncidentCard
