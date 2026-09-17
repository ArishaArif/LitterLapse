import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { getSession, getUserEmail, getRole, logout } from '../../lib/auth'
import './TopBar.css'

const TABS = [
  {
    id: 'full-console',
    label: 'Full Console',
    to: '/',
    isActive: (path) => path === '/',
  },
  {
    id: 'incident-detail',
    label: 'Incident Detail',
    to: '/incident/INC-8821',
    isActive: (path) => path.startsWith('/incident'),
  },
  {
    id: 'expanded-map',
    label: 'Expanded Map',
    to: '/map',
    isActive: (path) => path.startsWith('/map'),
  },
]

const CLOCK_TIME_ZONE = 'America/Los_Angeles'
const CLOCK_LABEL = 'PST'
const clockFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: CLOCK_TIME_ZONE,
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
})

function Clock() {
  const [time, setTime] = useState(() => clockFormatter.format(new Date()))

  useEffect(() => {
    const id = setInterval(
      () => setTime(clockFormatter.format(new Date())),
      1000,
    )
    return () => clearInterval(id)
  }, [])

  return (
    <div className="topbar__clock">
      <span className="topbar__clock-time">{time}</span>
      <span className="topbar__clock-tz">{CLOCK_LABEL}</span>
    </div>
  )
}

function TopBar({ activeDispatches = 0, consoleId = 'LAHORE_CONSOLE_03' }) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const session = getSession()
  const email = getUserEmail()
  const role = getRole()
  const roleLabel = role ? role.charAt(0).toUpperCase() + role.slice(1) : null

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <header className="topbar">
      <div className="topbar__left">
        <img className="topbar__logo" src="/logo.png" alt="" aria-hidden="true" />
        <span className="topbar__wordmark">LITTER LAPSE</span>
        <span className="topbar__badge">
          <span className="topbar__badge-dot" aria-hidden="true" />
          {activeDispatches} Active Dispatches
        </span>
      </div>

      <nav className="topbar__nav" aria-label="Screens">
        {TABS.map((tab, i) => {
          const isActive = tab.isActive(pathname)
          return (
            <Link
              key={tab.id}
              to={tab.to}
              className={`topbar__tab${isActive ? ' is-active' : ''}`}
              aria-current={isActive ? 'page' : undefined}
            >
              {i + 1}. {tab.label}
            </Link>
          )
        })}
      </nav>

      <div className="topbar__right">
        {session ? (
          <span className="topbar__user" title={email ?? undefined}>
            <span className="topbar__user-role">{roleLabel ?? 'Operator'}</span>
            <span className="topbar__user-email">{email ?? 'Signed In'}</span>
          </span>
        ) : null}
        {session ? (
          <button type="button" className="topbar__logout" onClick={handleLogout}>
            Log Out
          </button>
        ) : null}
        <Clock />
        <span className="topbar__console-id">{consoleId}</span>
      </div>
    </header>
  )
}

export default TopBar
