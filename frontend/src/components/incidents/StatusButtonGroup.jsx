import { useState } from 'react'
import { STATUS_ACTIONS, REJECT_REASONS, sanitizeReasonText } from '../../lib/incidents'
import './StatusButtonGroup.css'

const NOTE_MAX_LENGTH = 120

function StatusButtonGroup({ status, onChange, size = 'md' }) {
  const [rejecting, setRejecting] = useState(false)
  const [reason, setReason] = useState(REJECT_REASONS[0].value)
  const [note, setNote] = useState('')

  const closeRejectFlow = () => {
    setRejecting(false)
    setReason(REJECT_REASONS[0].value)
    setNote('')
  }

  const handleAction = (actionStatus) => {
    if (actionStatus === 'rejected') {
      setRejecting(true)
      return
    }
    closeRejectFlow()
    onChange?.(actionStatus)
  }

  const handleConfirmReject = () => {
    const detail = reason === 'other' ? sanitizeReasonText(note, NOTE_MAX_LENGTH) : reason
    closeRejectFlow()
    onChange?.('rejected', detail)
  }

  const canConfirm =
    reason !== 'other' || sanitizeReasonText(note, NOTE_MAX_LENGTH).length > 0

  return (
    <div className={`status-buttons status-buttons--${size}`}>
      {STATUS_ACTIONS.map((action) => {
        const isActive = status === action.status
        const isRejecting = rejecting && action.status === 'rejected'
        return (
          <button
            key={action.status}
            type="button"
            className={`status-buttons__btn status-buttons__btn--${action.modifier}${isActive ? ' is-active' : ''}${isRejecting ? ' is-rejecting' : ''}`}
            aria-pressed={isActive}
            onClick={() => handleAction(action.status)}
          >
            {action.label}
          </button>
        )
      })}

      {rejecting ? (
        <div className="status-buttons__reason" role="group" aria-label="Reject reason">
          <span className="status-buttons__reason-label">Reject Reason</span>
          <select
            className="status-buttons__reason-select"
            aria-label="Reject reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          >
            {REJECT_REASONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {reason === 'other' ? (
            <input
              className="status-buttons__reason-input"
              type="text"
              maxLength={NOTE_MAX_LENGTH}
              placeholder="Short note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
          ) : null}
          <div className="status-buttons__reason-actions">
            <button
              type="button"
              className="status-buttons__reason-confirm"
              disabled={!canConfirm}
              onClick={handleConfirmReject}
            >
              Confirm Reject
            </button>
            <button
              type="button"
              className="status-buttons__reason-cancel"
              onClick={closeRejectFlow}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default StatusButtonGroup
