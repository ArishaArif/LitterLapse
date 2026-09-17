import { normalizeBBox } from '../../lib/incidents'
import './BoundingBox.css'

function BoundingBox({ bbox }) {
  const box = normalizeBBox(bbox)
  if (!box) return null
  return (
    <span
      className="bounding-box"
      aria-hidden="true"
      style={{
        left: `${box.x * 100}%`,
        top: `${box.y * 100}%`,
        width: `${box.w * 100}%`,
        height: `${box.h * 100}%`,
      }}
    />
  )
}

export default BoundingBox
