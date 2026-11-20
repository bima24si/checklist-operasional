import { useState } from 'react'
import { Icon } from '../components/ui.jsx'
import { roles } from '../data/roles.js'
import { formatActivityTimestamp } from '../lib/dateTime.js'

const activityPeriods = [
  { value: 'day', label: 'Harian' },
  { value: 'week', label: 'Mingguan' },
  { value: 'month', label: 'Bulanan' },
]

const wibDatePartsFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Jakarta',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})
const dailyPeriodFormatter = new Intl.DateTimeFormat('id-ID', {
  timeZone: 'UTC',
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})
const dateFormatter = new Intl.DateTimeFormat('id-ID', {
  timeZone: 'UTC',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})
const monthlyPeriodFormatter = new Intl.DateTimeFormat('id-ID', {
  timeZone: 'UTC',
  month: 'long',
  year: 'numeric',
})

function getWibDateParts(timestamp) {
  const parts = wibDatePartsFormatter.formatToParts(new Date(timestamp))
  return Object.fromEntries(parts.map(({ type, value }) => [type, value]))
}

function getActivityPeriod(timestamp, period) {
  const { year, month, day } = getWibDateParts(timestamp)
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)))

  if (period === 'day') {
    return {
      key: `${year}-${month}-${day}`,
      label: dailyPeriodFormatter.format(date),
    }
  }

  if (period === 'week') {
    const weekday = date.getUTCDay() || 7
    const weekStart = new Date(date)
    weekStart.setUTCDate(date.getUTCDate() - weekday + 1)
    const weekEnd = new Date(weekStart)
    weekEnd.setUTCDate(weekStart.getUTCDate() + 6)
    return {
      key: weekStart.toISOString().slice(0, 10),
      label: `${dateFormatter.format(weekStart)} – ${dateFormatter.format(weekEnd)}`,
    }
  }

  return {
    key: `${year}-${month}`,
    label: monthlyPeriodFormatter.format(date),
  }
}

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
  openActivityEvidence,
}) {
  const [activityPeriod, setActivityPeriod] = useState('day')
  const activityRoles = [...new Set([...roles, ...activities.map((activity) => activity.role)])].filter(Boolean)
  const periodGroupsByKey = new Map()
  visibleActivities.forEach((activity) => {
    const period = getActivityPeriod(activity.timestamp, activityPeriod)
    let group = periodGroupsByKey.get(period.key)
    if (!group) {
      group = { ...period, activities: [] }
      periodGroupsByKey.set(period.key, group)
    }
    group.activities.push(activity)
  })
  const periodGroups = [...periodGroupsByKey.values()]
  periodGroups.forEach((periodGroup) => {
    periodGroup.roleGroups = [...new Set([
      ...roles,
      ...periodGroup.activities.map((activity) => activity.role),
    ])]
      .filter(Boolean)
      .map((role) => ({
        role,
        activities: periodGroup.activities.filter((activity) => activity.role === role),
      }))
      .filter((roleGroup) => roleGroup.activities.length > 0)
  })

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
          <div className="activity-period-control" role="group" aria-label="Kelompokkan aktivitas berdasarkan periode">
            <span>Catatan per</span>
            {activityPeriods.map((period) => (
              <button
                type="button"
                key={period.value}
                className={`activity-period-button ${activityPeriod === period.value ? 'active' : ''}`}
                aria-pressed={activityPeriod === period.value}
                onClick={() => setActivityPeriod(period.value)}
              >
                {period.label}
              </button>
            ))}
          </div>
          <label className="search-field"><Icon name="search" size={16} /><input value={activityQuery} onChange={(event) => setActivityQuery(event.target.value)} placeholder="Cari nama atau tugas..." /></label>
          <label className="select-field"><Icon name="filter" size={16} /><select value={activityRole} onChange={(event) => setActivityRole(event.target.value)} aria-label="Filter aktivitas berdasarkan role"><option>Semua role</option>{activityRoles.map((role) => <option key={role}>{role}</option>)}</select></label>
          <label className="select-field unit-select"><Icon name="building" size={16} /><select value={activityUnit} onChange={(event) => setActivityUnit(event.target.value)} aria-label="Filter aktivitas berdasarkan unit"><option value="Semua unit">Semua unit</option>{unitNames.map((unitName) => <option key={unitName} value={unitName}>{unitName}</option>)}</select></label>
        </div>
        {visibleActivities.length ? (
          <div className="activity-list">
            {periodGroups.map((group) => (
              <section className="activity-period-group" key={group.key}>
                <header className="activity-period-heading">
                  <h3>{group.label}</h3>
                  <span>{group.activities.length} aktivitas</span>
                </header>
                {group.roleGroups.map((roleGroup) => (
                  <section className="activity-role-group" key={roleGroup.role}>
                    <header className="activity-role-heading">
                      <h3>{roleGroup.role}</h3>
                      <span>{roleGroup.activities.length} aktivitas</span>
                    </header>
                    {roleGroup.activities.map((activity) => (
                      <article className="activity-row" key={activity.id}>
                        <span className={`activity-event-icon ${activity.action === 'Penyelesaian dibatalkan' ? 'activity-event-undo' : ''} ${activity.action === 'Bukti foto diunggah' ? 'activity-event-evidence' : ''}`}><Icon name={activity.action === 'Bukti foto diunggah' ? 'camera' : activity.action === 'Penyelesaian dibatalkan' ? 'close' : 'check'} size={16} /></span>
                        <div className="activity-who"><strong>{activity.staffName}</strong><span>{activity.role} <i>·</i> {activity.unitName}</span></div>
                        <div className="activity-what"><strong>{activity.taskTitle}</strong><span>Sesi {activity.session}</span></div>
                        <div className="activity-action-group">
                          {activity.action === 'Bukti foto diunggah' ? (
                            <button type="button" className="activity-action activity-action-button" onClick={() => void openActivityEvidence(activity)}>
                              Bukti foto diunggah
                            </button>
                          ) : (
                            <span className={`activity-action ${activity.action === 'Penyelesaian dibatalkan' ? 'activity-action-undo' : ''}`}>{activity.action}</span>
                          )}
                        </div>
                        <time className="activity-time" dateTime={activity.timestamp}>{formatActivityTimestamp(activity.timestamp)} WIB</time>
                      </article>
                    ))}
                  </section>
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
