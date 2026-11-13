import { Icon } from '../ui.jsx'
import ProfileMenu from './ProfileMenu.jsx'

export default function Topbar({
  pageLabel,
  currentUser,
  clock,
  notificationOpen,
  setNotificationOpen,
  overdueCount,
  onEditProfile,
  onLogout,
  onOpenDashboard,
}) {
  return (
    <header className="topbar">
      <div className="breadcrumb"><span>Operasional</span><Icon name="chevron" size={14} /><strong>{pageLabel}</strong></div>
      <div className="topbar-actions">
        <div className="clock-chip"><Icon name="clock" size={16} /><strong>{clock.label}</strong><span>WIB</span></div>
        <button
          type="button"
          className={`icon-button notification-button ${notificationOpen ? 'selected' : ''}`}
          aria-label="Notifikasi"
          title="Notifikasi"
          aria-expanded={notificationOpen}
          aria-controls="notification-popover"
          onClick={() => setNotificationOpen((open) => !open)}
        >
          <Icon name="bell" size={19} />
          {overdueCount > 0 && <span className="notification-dot" />}
        </button>
        <span className="topbar-divider" />
        <ProfileMenu currentUser={currentUser} onEditProfile={onEditProfile} onLogout={onLogout} />
      </div>
      {notificationOpen && (
        <div className="notification-popover" id="notification-popover" aria-labelledby="notification-title">
          <div className="popover-heading">
            <strong id="notification-title">Notifikasi</strong>
            <button type="button" className="plain-button" onClick={() => setNotificationOpen(false)} aria-label="Tutup notifikasi"><Icon name="close" size={17} /></button>
          </div>
          {overdueCount
            ? <p><span className="notification-dot inline-dot" /> Ada <strong>{overdueCount} tugas</strong> yang melewati deadline pada filter saat ini.</p>
            : <p className="empty-notification">Tidak ada tugas terlambat. Semua terkendali.</p>}
          <button type="button" className="popover-link" onClick={onOpenDashboard}>Lihat dashboard <Icon name="chevron" size={14} /></button>
        </div>
      )}
    </header>
  )
}
