import { useEffect, useRef, useState } from 'react'
import { useNotifications } from '../context/NotificationsContext'
import { formatDate } from '../utils/format'

const STATUS_LABEL = { open: 'Онлайн', connecting: 'Подключение…', closed: 'Нет соединения' }
const TYPE_ICON = { welcome: '👋', broadcast: '📣', 'order.created': '🧾', 'order.status': '📦' }

export default function NotificationBell() {
  const { status, items, unread, markAllRead } = useNotifications()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const close = (e) => { if (!ref.current?.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  const toggle = () => {
    setOpen((v) => !v)
    markAllRead()
  }

  return (
    <div className="bell" ref={ref}>
      <button className="bell__button" onClick={toggle} title="Уведомления" data-testid="notification-bell">
        🔔
        {unread > 0 && <span className="bell__count" data-testid="notification-count">{unread}</span>}
        <span className={`ws-dot ws-dot--${status}`} data-testid="ws-status" data-state={status} title={STATUS_LABEL[status]} />
      </button>

      {open && (
        <div className="bell__panel panel" data-testid="notification-panel">
          <div className="bell__head">
            <b>Уведомления</b>
            <span className={`ws-label ws-label--${status}`}>{STATUS_LABEL[status]}</span>
          </div>
          {items.length ? (
            items.map((n) => (
              <div className="bell__item" key={n.id} data-testid="notification-item" data-type={n.type}>
                <span className="bell__icon">{TYPE_ICON[n.type] || '🔔'}</span>
                <div>
                  <div>{n.text}</div>
                  <div className="muted small">{formatDate(n.ts)}</div>
                </div>
              </div>
            ))
          ) : (
            <div className="muted small bell__empty">Пока пусто</div>
          )}
        </div>
      )}
    </div>
  )
}
