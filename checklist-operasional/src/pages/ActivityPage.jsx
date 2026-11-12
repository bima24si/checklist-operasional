import { Icon } from '../components/ui.jsx'
import { roles } from '../data/roles.js'
import { formatActivityTimestamp } from '../lib/dateTime.js'

export default function ActivityPage({
  clock,
  visibleActivities,
  activities,
  activityQuery,
  setActivityQuery,
  activityRole,
  setActivityRole,
  activityUnit,
  setActivityUnit,
  unitNames,
  groupedActivities,
  openActivityEvidence,
}) {
  return (
    <>
      <section className="page-heading">
        <div>
          <div className="eyebrow"><span className="live-indicator" /> AUDIT AKTIVITAS</div>
          <h1>Riwayat Aktivitas</h1>
          <p>Lihat waktu pegawai mengisi checklist dan mengunggah bukti.</p>
        </div>
        <div className="date-card">
          <span className="date-icon"><Icon name="clock" size={17} /></span>
          <span><small>WAKTU SEKARANG</small><strong>{clock.label} WIB</strong></span>
        </div>
      </section>

      <section className="activity-summary-grid">
        <article className="metric-card">
          <div className="metric-topline"><span>TOTAL AKTIVITAS</span><span className="metric-icon blue"><Icon name="history" size={17} /></span></div>
          <div className="metric-main"><strong>{visibleActivities.length}</strong><span className="metric-note">sesuai filter saat ini</span></div>
        </article>
        <article className="metric-card">
          <div className="metric-topline"><span>PEGAWAI TERCATAT</span><span className="metric-icon green"><Icon name="checklist" size={17} /></span></div>
          <div className="metric-main"><strong>{new Set(visibleActivities.map((activity) => activity.staffId)).size}</strong><span className="metric-note">mengisi checklist</span></div>
        </article>
        <article className="metric-card">
          <div className="metric-topline"><span>TERAKHIR DICATAT</span><span className="metric-icon green"><Icon name="clock" size={17} /></span></div>
          <div className="activity-last-time">{visibleActivities.length ? formatActivityTimestamp(visibleActivities[0].timestamp) : 'Belum ada aktivitas'}</div>
        </article>
      </section>

      <section className="panel activity-panel">
        <div className="panel-header">
          <div><h2>Aktivitas pengisian checklist</h2><p>Waktu ditampilkan dalam WIB (Asia/Jakarta)</p></div>
          <span className="count-pill activity-count">{visibleActivities.length} aktivitas</span>
        </div>
        <div className="activity-filters">
          <label className="search-field"><Icon name="search" size={16} /><input value={activityQuery} onChange={(event) => setActivityQuery(event.target.value)} placeholder="Cari nama atau tugas..." /></label>
          <label className="select-field"><Icon name="filter" size={16} /><select value={activityRole} onChange={(event) => setActivityRole(event.target.value)} aria-label="Filter aktivitas berdasarkan role"><option>Semua role</option>{roles.map((role) => <option key={role}>{role}</option>)}</select></label>
          <label className="select-field unit-select"><Icon name="building" size={16} /><select value={activityUnit} onChange={(event) => setActivityUnit(event.target.value)} aria-label="Filter aktivitas berdasarkan unit"><option value="Semua unit">Semua unit</option>{unitNames.map((unitName) => <option key={unitName} value={unitName}>{unitName}</option>)}</select></label>
        </div>
        {visibleActivities.length ? (
          <div className="activity-list">
            {groupedActivities.map((group) => (
              <section className="activity-role-group" key={group.role}>
                <header className="activity-role-heading">
                  <h3>{group.role}</h3>
                  <span>{group.activities.length} aktivitas</span>
                </header>
                {group.activities.map((activity) => (
                  <article className="activity-row" key={activity.id}>
                    <span className={`activity-event-icon ${activity.action === 'Penyelesaian dibatalkan' ? 'activity-event-undo' : ''} ${activity.action === 'Bukti foto diunggah' ? 'activity-event-evidence' : ''}`}><Icon name={activity.action === 'Bukti foto diunggah' ? 'camera' : activity.action === 'Penyelesaian dibatalkan' ? 'close' : 'check'} size={16} /></span>
                    <div className="activity-who"><strong>{activity.staffName}</strong><span>{activity.role} <i>·</i> {activity.unitName}</span></div>
                    <div className="activity-what"><strong>{activity.taskTitle}</strong><span>Sesi {activity.session}</span></div>
                    <div className="activity-action-group">
                      <span className={`activity-action ${activity.action === 'Penyelesaian dibatalkan' ? 'activity-action-undo' : ''}`}>{activity.action}</span>
                      {activity.action === 'Bukti foto diunggah' && (
                        <button type="button" className="activity-photo-button" onClick={() => void openActivityEvidence(activity)}>
                          Lihat foto
                        </button>
                      )}
                    </div>
                    <time className="activity-time" dateTime={activity.timestamp}>{formatActivityTimestamp(activity.timestamp)} WIB</time>
                  </article>
                ))}
              </section>
            ))}
          </div>
        ) : (
          <div className="empty-state activity-empty">
            <span className="empty-check"><Icon name={activityQuery || activityRole !== 'Semua role' || activityUnit !== 'Semua unit' ? 'search' : 'history'} size={21} /></span>
            <strong>{activities.length ? 'Aktivitas tidak ditemukan' : 'Belum ada aktivitas tercatat'}</strong>
            <span>{activities.length ? 'Coba ubah pencarian atau filter.' : 'Aktivitas akan muncul saat pegawai menyelesaikan checklist atau mengunggah bukti.'}</span>
          </div>
        )}
      </section>
      <footer className="page-footer"><span>BRI <span>·</span> Riwayat aktivitas</span><span>Waktu aktivitas menggunakan WIB (Asia/Jakarta)</span></footer>
    </>
  )
}
