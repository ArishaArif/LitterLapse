import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import ViolationTag from '../components/incidents/ViolationTag'
import SeverityBadge from '../components/incidents/SeverityBadge'
import BoundingBox from '../components/incidents/BoundingBox'
import StatusButtonGroup from '../components/incidents/StatusButtonGroup'
import PlateReadout from '../components/incidents/PlateReadout'
import { formatTimeAgo, evidenceSrc, buildIncidentContext, incidentContextFor, severityFor } from '../lib/incidents'
import { apiFetch, API_BASE } from '../lib/api'
import './IncidentDetail.css'

function toNumericId(idParam) {
  const numeric = String(idParam ?? '').replace(/\D/g, '')
  return numeric || null
}

function formatCoordinates(lat, lng) {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return 'Location unavailable'
  const ns = lat >= 0 ? 'N' : 'S'
  const ew = lng >= 0 ? 'E' : 'W'
  return `${Math.abs(lat).toFixed(4)}° ${ns}, ${Math.abs(lng).toFixed(4)}° ${ew}`
}

function cameraId(id) {
  return `CAM-LHR-${String(id).slice(-2)}`
}

function EvidenceImage({ src, alt }) {
  const [failed, setFailed] = useState(false)

  if (!src || failed) {
    return (
      <div className="incident-detail__evidence-fallback">
        <span className="incident-detail__evidence-icon" aria-hidden="true" />
        <span className="incident-detail__evidence-note">Evidence frame unavailable</span>
      </div>
    )
  }

  return (
    <img
      className="incident-detail__evidence-img"
      src={src}
      alt={alt}
      onError={() => setFailed(true)}
    />
  )
}

function IncidentDetail() {
  const { id } = useParams()
  const numericId = toNumericId(id)

  const [loadedForId, setLoadedForId] = useState(null)
  const [loadedIncident, setLoadedIncident] = useState(null)
  const [plateHistory, setPlateHistory] = useState(null)
  const incident = loadedForId === numericId ? loadedIncident : null
  const loading = numericId !== null && loadedForId !== numericId

  useEffect(() => {
    let cancelled = false

    async function loadIncident() {
      if (!numericId) return

      try {
        const res = await apiFetch(`${API_BASE}/incidents/${numericId}`)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        if (!cancelled) {
          setLoadedForId(numericId)
          setLoadedIncident(data)
        }
      } catch (err) {
        console.error(`Could not load incident ${numericId} from backend.`, err)
        if (!cancelled) {
          setLoadedForId(numericId)
          setLoadedIncident(null)
        }
      }
    }

    loadIncident()
    return () => {
      cancelled = true
    }
  }, [numericId])

  useEffect(() => {
    let cancelled = false
    const plate = incident?.plate_number
    if (!plate) return undefined
    async function loadPlateHistory() {
      try {
        const res = await apiFetch(`${API_BASE}/incidents/?limit=200`)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        if (!cancelled) {
          setPlateHistory({
            plate,
            context: buildIncidentContext(Array.isArray(data) ? data : []),
          })
        }
      } catch (err) {
        console.error('Could not load incident history for repeat tracking.', err)
      }
    }
    loadPlateHistory()
    return () => {
      cancelled = true
    }
  }, [incident?.plate_number])

  if (loading) {
    return (
      <section className="incident-detail">
        <div className="incident-detail__inner">
          <Link className="incident-detail__back" to="/">
            Full Console
          </Link>
          <p className="incident-detail__missing-text">Loading incident…</p>
        </div>
      </section>
    )
  }

  if (!incident) {
    return (
      <section className="incident-detail">
        <div className="incident-detail__inner">
          <Link className="incident-detail__back" to="/">
            Full Console
          </Link>
          <div className="incident-detail__missing">
            <span className="incident-detail__missing-code">Incident Not Found</span>
            <p className="incident-detail__missing-text">
              No incident matches “{id}”. It may have been cleared from the active queue.
            </p>
          </div>
        </div>
      </section>
    )
  }

  const incidentId = `INC-${incident.id}`
  const timeAgo = formatTimeAgo(incident.timestamp)
  const status = incident.review_status
  const contextEntry =
    plateHistory?.plate === incident.plate_number
      ? incidentContextFor(plateHistory.context, incident)
      : { occurrence: null, locationRepeatCount: null }

  const setStatus = async (newStatus, reason) => {
    const previousStatus = incident.review_status
    const previousReason = incident.reject_reason ?? null

    setLoadedIncident((current) => ({
      ...current,
      review_status: newStatus,
      reject_reason: newStatus === 'rejected' ? (reason ?? null) : null,
    }))

    try {
      const res = await apiFetch(`${API_BASE}/incidents/${incident.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ review_status: newStatus }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
    } catch (err) {
      console.error(`Could not save status change for incident ${incident.id}; reverting.`, err)
      setLoadedIncident((current) => ({
        ...current,
        review_status: previousStatus,
        reject_reason: previousReason,
      }))
    }
  }

  return (
    <section className="incident-detail">
      <div className="incident-detail__inner">
        <Link className="incident-detail__back" to="/">
          Full Console
        </Link>

        <header className="incident-detail__head">
          <div className="incident-detail__heading">
            <span className="incident-detail__id">{incidentId}</span>
            <span className="incident-detail__tag">Incident Review</span>
          </div>
          <div className="incident-detail__head-meta">
            <ViolationTag violationType={incident.violation_type} />
            <SeverityBadge severity={severityFor(incident, contextEntry)} />
            <span className="incident-detail__time">Detected {timeAgo}</span>
          </div>
        </header>

        <figure className="incident-detail__evidence">
          <EvidenceImage
            src={evidenceSrc(incident)}
            alt={`Evidence for ${incident.plate_number ?? 'unidentified plate'}`}
          />
          <BoundingBox bbox={incident.bbox} />
        </figure>

        <div className="incident-detail__grid">
          <PlateReadout
            plate={incident.plate_number}
            confidence={incident.plate_confidence}
            occurrence={contextEntry.occurrence}
          />

          <div className="location-block">
            <span className="location-block__label">Location</span>
            <dl className="location-block__list">
              <div className="location-block__row">
                <dt>Camera</dt>
                <dd>{cameraId(incident.id)}</dd>
              </div>
              <div className="location-block__row">
                <dt>Coordinates</dt>
                <dd>{formatCoordinates(incident.location_lat, incident.location_lng)}</dd>
              </div>
              <div className="location-block__row">
                <dt>Zone</dt>
                <dd>Lahore Metro</dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="incident-detail__actions">
          <span className="incident-detail__actions-label">Dispatch Decision</span>
          <StatusButtonGroup size="lg" status={status} onChange={setStatus} />
        </div>
      </div>
    </section>
  )
}

export default IncidentDetail