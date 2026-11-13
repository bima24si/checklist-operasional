import { Icon } from '../ui.jsx'

export default function Sidebar({
  currentUser,
  navItems,
  page,
  setPage,
  pendingApprovalsCount,
  overdueCount,
  unitNames,
  sidebarUnit,
  onLogout,
}) {
  return (
    <aside className="sidebar">
      <a className="brand" href="#" onClick={(event) => { event.preventDefault(); setPage('dashboard') }}>
        <span className="brand-mark" aria-hidden="true">
          <img src="/bri-logo.png" alt="" />
        </span>
        <span className="brand-copy">
          <strong>BRI</strong>
          <small>OPERASIONAL BANK</small>
        </span>
      </a>

      <div className="sidebar-section-label">MENU UTAMA</div>
      <nav className="main-nav" aria-label="Navigasi utama">
        {navItems.map((item) => (
          <button
            type="button"
            className={`nav-item ${page === item.id ? 'active' : ''}`}
            key={item.id}
            onClick={() => setPage(item.id)}
          >
            <Icon name={item.icon} size={19} />
            <span>{item.label}</span>
            {item.id === 'approvals' && pendingApprovalsCount > 0 && (
              <span className="nav-count">{pendingApprovalsCount}</span>
            )}
            {item.id === 'dashboard' && overdueCount > 0 && (
              <span className="nav-count">{overdueCount}</span>
            )}
          </button>
        ))}
      </nav>

      <div className="sidebar-section-label sidebar-section-spaced">UNIT KERJA</div>
      <div className="sidebar-unit-card">
        <span className="unit-icon"><Icon name="building" size={17} /></span>
        <span>
          <strong>{currentUser.accessRole === 'Supervisor' ? (sidebarUnit ?? 'Belum ada unit') : currentUser.unitName}</strong>
          <small>{currentUser.accessRole === 'Supervisor' ? `${unitNames.length} unit terdaftar` : currentUser.role}</small>
        </span>
        {sidebarUnit && <span className="online-dot" title="Unit terdaftar" />}
      </div>

      <div className="sidebar-footer">
        <button
          type="button"
          className="nav-item sidebar-logout-button"
          aria-label="Keluar"
          title="Keluar"
          onClick={onLogout}
        >
          <Icon name="logout" size={19} />
          <span>Keluar</span>
        </button>
      </div>
    </aside>
  )
}
