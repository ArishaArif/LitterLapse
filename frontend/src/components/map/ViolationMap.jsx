import { MapContainer, ImageOverlay, Marker, Tooltip } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import MapLegend from './MapLegend'
import { VIOLATION_LABELS, buildIncidentContext, incidentContextFor, severityFor } from '../../lib/incidents'
import './ViolationMap.css'

// Updated to center on your Liberty Market export
const LAHORE_CENTER = [31.51133, 74.33948]
const DEFAULT_ZOOM = 16

// IMPORTANT: Replace these 4 numbers with the exact bounds from your OSM export panel
const MAP_BOUNDS = [
  [31.5050, 74.3350], // [South, West]
  [31.5250, 74.3580]  // [North, East]
]

const CAMERAS_ACTIVE = 24
const HOURLY_RATE = [4, 6, 3, 7, 5, 8, 6, 9, 7, 6, 8, 5]

const MARKER_ICONS = {
  littering: L.divIcon({
    className: 'violation-pin',
    html: '<span class="violation-pin__shape violation-pin__shape--litter"></span>',
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  }),
  smoke: L.divIcon({
    className: 'violation-pin',
    html: '<span class="violation-pin__shape violation-pin__shape--smoke"></span>',
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  }),
}

function iconFor(violationType) {
  return MARKER_ICONS[violationType] ?? MARKER_ICONS.littering
}

function hasCoordinates(incident) {
  return (
    Number.isFinite(incident?.location_lat) &&
    Number.isFinite(incident?.location_lng)
  )
}

function HourlyRateChart() {
  const peak = Math.max(...HOURLY_RATE, 1)
  return (
    <div
      className="hourly-chart"
      role="img"
      aria-label="Hourly violation rate over the last twelve hours"
    >
      {HOURLY_RATE.map((value, index) => (
        <div
          className="hourly-chart__bar"
          key={index}
          style={{ height: `${Math.max(8, (value / peak) * 100)}%` }}
          title={`${value} violations`}
        />
      ))}
    </div>
  )
}

function StatTile({ tone, label, value }) {
  return (
    <div className="stat-tile">
      <div className="stat-tile__head">
        <span
          className={`stat-tile__mark stat-tile__mark--${tone}`}
          aria-hidden="true"
        />
        <span className="stat-tile__label">{label}</span>
      </div>
      <span className="stat-tile__value">{value}</span>
    </div>
  )
}

function ViolationMap({ incidents = [] }) {
  const plotted = incidents.filter(hasCoordinates)

  const litterDetected = incidents.filter(
    (incident) => incident.violation_type === 'littering',
  ).length

  const unresolvedAlerts = incidents.filter(
    (incident) =>
      incident.review_status === 'pending' ||
      incident.review_status === 'needs_investigation',
  ).length

  const incidentContext = buildIncidentContext(incidents)

  const severityCounts = { low: 0, medium: 0, high: 0 }
  for (const incident of incidents) {
    const severity = severityFor(incident, incidentContextFor(incidentContext, incident))
    if (Object.prototype.hasOwnProperty.call(severityCounts, severity)) {
      severityCounts[severity] += 1
    }
  }

  return (
    <div className="violation-map">
      <div className="violation-map__canvas">
        <MapContainer
          className="violation-map__leaflet"
          center={LAHORE_CENTER}
          zoom={DEFAULT_ZOOM}
          scrollWheelZoom={true}
        >
          {/* Swapped TileLayer for ImageOverlay for offline rendering */}
          <ImageOverlay
            url="/map.png"
            bounds={MAP_BOUNDS}
          />
          {plotted.map((incident) => (
            <Marker
              key={incident.id}
              position={[incident.location_lat, incident.location_lng]}
              icon={iconFor(incident.violation_type)}
            >
              <Tooltip
                className="violation-tooltip"
                direction="top"
                offset={[0, -10]}
                opacity={1}
              >
                <span className="violation-tooltip__plate">
                  {incident.plate_number ?? 'NO PLATE'}
                </span>
                <span className="violation-tooltip__type">
                  {VIOLATION_LABELS[incident.violation_type] ??
                    incident.violation_type}
                </span>
              </Tooltip>
            </Marker>
          ))}
        </MapContainer>
        <MapLegend />
      </div>

      <div className="violation-map__stats">
        <StatTile tone="litter" label="Litter Detected" value={litterDetected} />
        <StatTile tone="cameras" label="Cameras Active" value={CAMERAS_ACTIVE} />
        <StatTile tone="alerts" label="Unresolved Alerts" value={unresolvedAlerts} />
        <div className="stat-tile stat-tile--severity">
          <div className="stat-tile__head">
            <span
              className="stat-tile__mark stat-tile__mark--severity"
              aria-hidden="true"
            />
            <span className="stat-tile__label">Severity Breakdown</span>
          </div>
          <div className="severity-tally">
            <span className="severity-tally__item" data-severity="high">
              <span className="severity-tally__count">{severityCounts.high}</span>
              <span className="severity-tally__label">High</span>
            </span>
            <span className="severity-tally__item" data-severity="medium">
              <span className="severity-tally__count">{severityCounts.medium}</span>
              <span className="severity-tally__label">Med</span>
            </span>
            <span className="severity-tally__item" data-severity="low">
              <span className="severity-tally__count">{severityCounts.low}</span>
              <span className="severity-tally__label">Low</span>
            </span>
          </div>
        </div>
        <div className="stat-tile stat-tile--chart">
          <div className="stat-tile__head">
            <span className="stat-tile__label">Hourly Rate</span>
          </div>
          <HourlyRateChart />
        </div>
      </div>
    </div>
  )
}

export default ViolationMap