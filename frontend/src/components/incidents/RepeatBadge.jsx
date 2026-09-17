function ordinalSuffix(value) {
  const rem100 = value % 100
  if (rem100 >= 11 && rem100 <= 13) return 'th'
  const rem10 = value % 10
  if (rem10 === 1) return 'st'
  if (rem10 === 2) return 'nd'
  if (rem10 === 3) return 'rd'
  return 'th'
}

function RepeatBadge({ occurrence }) {
  const count = Number(occurrence)
  if (!Number.isInteger(count) || count < 2) return null
  return (
    <span className="repeat-badge">
      {count}
      {ordinalSuffix(count)} Violation
    </span>
  )
}

export default RepeatBadge
