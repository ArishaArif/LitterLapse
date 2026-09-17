export const VIOLATION_LABELS = {
  littering: 'Litter Violation',
  smoke: 'Smoke Emission',
}

export const STATUS_LABELS = {
  pending: 'Pending',
  accepted: 'Accepted',
  needs_investigation: 'Investigating',
  rejected: 'Rejected',
}

export const STATUS_ACTIONS = [
  { status: 'accepted', label: 'Accept', modifier: 'accept' },
  { status: 'needs_investigation', label: 'Investigate', modifier: 'investigate' },
  { status: 'rejected', label: 'Reject', modifier: 'reject' },
]

export function formatTimeAgo(timestamp) {
  if (timestamp == null) return ''
  const then = new Date(timestamp).getTime()
  if (Number.isNaN(then)) return ''

  const seconds = Math.max(0, Math.round((Date.now() - then) / 1000))
  if (seconds < 60) return `${seconds}s ago`

  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`

  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export function formatConfidence(value) {
  if (value == null || Number.isNaN(value)) return ''
  return `${Math.round(value * 100)}%`
}

export function evidenceSrc(incident) {
  return incident?.evidence_url ?? incident?.evidence_path ?? null
}

export const SEVERITY_LABELS = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
}

export const REJECT_REASONS = [
  { value: 'unclear-evidence', label: 'Unclear evidence' },
  { value: 'plate-mismatch', label: 'Plate mismatch' },
  { value: 'duplicate-incident', label: 'Duplicate incident' },
  { value: 'no-violation-visible', label: 'No violation visible' },
  { value: 'other', label: 'Other (short note)' },
]

export function sanitizeReasonText(value, maxLength = 120) {
  if (typeof value !== 'string') return ''
  const cleaned = Array.from(value)
    .filter((char) => {
      const code = char.charCodeAt(0)
      return code > 0x1f && code !== 0x7f
    })
    .join('')
    .replace(/\s+/g, ' ')
    .trim()
  return cleaned.slice(0, maxLength)
}

export function normalizeBBox(raw) {
  if (raw == null || typeof raw !== 'object') return null
  const x = Number(raw.x)
  const y = Number(raw.y)
  const w = Number(raw.w)
  const h = Number(raw.h)
  if (![x, y, w, h].every((value) => Number.isFinite(value))) return null
  if (w <= 0 || h <= 0) return null
  const clamp = (value) => Math.min(1, Math.max(0, value))
  const box = { x: clamp(x), y: clamp(y), w: Math.min(w, 1), h: Math.min(h, 1) }
  box.w = Math.min(box.w, 1 - box.x)
  box.h = Math.min(box.h, 1 - box.y)
  if (box.w <= 0 || box.h <= 0) return null
  return box
}

function contextPlate(incident) {
  const plate = incident?.plate_number
  if (typeof plate !== 'string') return null
  const trimmed = plate.trim()
  return trimmed || null
}

function contextLocationKey(plate, lat, lng) {
  const latKey = Number.isFinite(lat) ? Number(lat).toFixed(4) : 'na'
  const lngKey = Number.isFinite(lng) ? Number(lng).toFixed(4) : 'na'
  return `${plate}|${latKey}|${lngKey}`
}

export function buildIncidentContext(incidents) {
  const entries = new Map()
  const plateTotals = new Map()
  const plateLocationTotals = new Map()
  const list = Array.isArray(incidents)
    ? incidents.filter((incident) => incident && Number.isFinite(incident.id))
    : []
  const chronological = [...list].sort((a, b) => {
    const aTime = new Date(a.timestamp).getTime()
    const bTime = new Date(b.timestamp).getTime()
    const aRank = Number.isNaN(aTime) ? 0 : aTime
    const bRank = Number.isNaN(bTime) ? 0 : bTime
    return aRank - bRank || a.id - b.id
  })
  for (const incident of chronological) {
    const plate = contextPlate(incident)
    let occurrence = null
    let locationRepeatCount = null
    if (plate) {
      occurrence = (plateTotals.get(plate) ?? 0) + 1
      plateTotals.set(plate, occurrence)
      const key = contextLocationKey(plate, incident.location_lat, incident.location_lng)
      locationRepeatCount = (plateLocationTotals.get(key) ?? 0) + 1
      plateLocationTotals.set(key, locationRepeatCount)
    }
    entries.set(incident.id, { occurrence, locationRepeatCount })
  }
  return { entries, plateTotals, plateLocationTotals }
}

export function incidentContextFor(context, incident) {
  if (!incident || !Number.isFinite(incident.id)) {
    return { occurrence: null, locationRepeatCount: null }
  }
  const entry = context?.entries?.get(incident.id)
  if (entry) return entry
  const plate = contextPlate(incident)
  if (!plate || !context) {
    return { occurrence: null, locationRepeatCount: null }
  }
  const occurrence = (context.plateTotals.get(plate) ?? 0) + 1
  const key = contextLocationKey(plate, incident.location_lat, incident.location_lng)
  const locationRepeatCount = (context.plateLocationTotals.get(key) ?? 0) + 1
  return { occurrence, locationRepeatCount }
}

export function severityFor(incident, entry) {
  const confidence = Number(incident?.confidence)
  const repeats = Number(entry?.locationRepeatCount) || 1
  if ((Number.isFinite(confidence) && confidence >= 0.85) || repeats >= 3) return 'high'
  if ((Number.isFinite(confidence) && confidence >= 0.7) || repeats >= 2) return 'medium'
  return 'low'
}
