import { useEffect, useMemo, useState } from 'react'
import IncidentCard from '../components/incidents/IncidentCard'
import ViolationMap from '../components/map/ViolationMap'
import { apiFetch, API_BASE } from '../lib/api'
import { buildIncidentContext, incidentContextFor, severityFor } from '../lib/incidents'
import './FullConsole.css'

function FullConsole() {
  const [incidents, setIncidents] = useState([])
  const incidentContext = useMemo(() => buildIncidentContext(incidents), [incidents])

  useEffect(() => {
    let cancelled = false

    async function loadIncidents() {
      try {
        const res = await apiFetch(`${API_BASE}/incidents/`)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        const list = Array.isArray(data) ? data : []
        if (!cancelled) {
          setIncidents(list)
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to load live incidents from backend.', err)
        }
      }
    }

    loadIncidents()
    return () => {
      cancelled = true
    }
  }, [])

  const handleStatusChange = async (id, newStatus, reason) => {
    const previousIncident = incidents.find((incident) => incident.id === id)
    const previousStatus = previousIncident?.review_status
    const previousReason = previousIncident?.reject_reason ?? null

    setIncidents((current) =>
      current.map((incident) =>
        incident.id === id
          ? {
              ...incident,
              review_status: newStatus,
              reject_reason: newStatus === 'rejected' ? (reason ?? null) : null,
            }
          : incident,
      ),
    )

    try {
      const res = await apiFetch(`${API_BASE}/incidents/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ review_status: newStatus }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
    } catch (err) {
      console.error(`Status update failed for incident ${id}; reverting.`, err)
      setIncidents((current) =>
        current.map((incident) =>
          incident.id === id
            ? {
                ...incident,
                review_status: previousStatus,
                reject_reason: previousReason,
              }
            : incident,
        ),
      )
    }
  }

  return (
    <div className="full-console">
      <section className="full-console__feed" aria-label="Live incident feed">
        <div className="full-console__section-head">
          <h2 className="full-console__section-title">Live Incident Feed</h2>
        </div>
        <div className="full-console__feed-list">
          {incidents.map((incident) => {
            const contextEntry = incidentContextFor(incidentContext, incident)
            return (
              <IncidentCard
                key={incident.id}
                incident={incident}
                severity={severityFor(incident, contextEntry)}
                plateOccurrence={contextEntry.occurrence}
                onStatusChange={handleStatusChange}
              />
            )
          })}
        </div>
      </section>

      <section className="full-console__map" aria-label="Lahore active violation plot">
        <div className="full-console__section-head">
          <h2 className="full-console__section-title">Lahore Active Violation Plot</h2>
        </div>
        <div className="full-console__map-body">
          <ViolationMap incidents={incidents} />
        </div>
      </section>
    </div>
  )
}

export default FullConsole