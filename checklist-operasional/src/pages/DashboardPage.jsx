import { Icon, StatusBadge } from '../components/ui.jsx'
import { roles } from '../data/roles.js'
import { formatToday, formatActivityTimestamp } from '../lib/dateTime.js'

export default function DashboardPage({ overdueTasks, filteredOverdueTasks, selectedRole, setSelectedRole, selectedUnit, setSelectedUnit, unitNames, query, setQuery, dashboardTasks, completedCount, compliance, tasksWithNotes, staff, setPage, activities, openActivityEvidence, refreshSupervisorActivities, activityRefreshBusy, activityRefreshError }) {
  const recentEvidence = activities.filter((activity) => activity.action === 'Bukti foto diunggah').slice(0, 5)
  const reportRoles = [...new Set([...roles, ...dashboardTasks.map((task) => task.role)])].filter(Boolean)

  return (
<>
              <section className="page-heading">
                <div>
                  <div className="eyebrow"><span className="live-indicator" /> PEMANTAUAN HARIAN</div>
                  <h1>Dashboard Kepatuhan</h1>
                  <p>Pantau kesiapan operasional dan tindak lanjut checklist seluruh unit.</p>
                </div>
                <div className="date-card">
                  <span className="date-icon"><Icon name="clock" size={17} /></span>
                  <span><small>HARI INI</small><strong>{formatToday()}</strong></span>
                </div>
              </section>

              {overdueTasks.length > 0 && (
                <section className="critical-alert" aria-live="polite">
                  <span className="alert-icon"><Icon name="alert" size={19} /></span>
                  <span className="alert-copy"><strong>{overdueTasks.length} tugas melewati batas waktu</strong><small>Segera lakukan tindak lanjut pada staf yang belum menyelesaikan checklist.</small></span>
                  <button onClick={() => { setPage('dashboard'); document.getElementById('attention-list')?.scrollIntoView({ behavior: 'smooth' }) }}>Lihat tugas <Icon name="chevron" size={16} /></button>
                </section>
              )}

              <section className="metrics-grid" aria-label="Ringkasan kepatuhan">
                <article className="metric-card compliance-metric">
                  <div className="metric-topline"><span>KEPATUHAN CABANG</span><span className="metric-icon green"><Icon name="check" size={17} /></span></div>
                  <div className="metric-main"><strong>{compliance}<small>%</small></strong><span className="metric-note">dari seluruh checklist</span></div>
                  <div className="progress-track"><span style={{ width: `${compliance}%` }} /></div>
                  <div className="metric-foot"><span>{completedCount} selesai</span><span>{dashboardTasks.length} total tugas</span></div>
                </article>
                <article className="metric-card">
                  <div className="metric-topline"><span>TUGAS SELESAI</span><span className="metric-icon blue"><Icon name="checklist" size={17} /></span></div>
                  <div className="metric-main"><strong>{completedCount}<small>/{dashboardTasks.length}</small></strong><span className="metric-note">Checklist terverifikasi</span></div>
                  <div className="metric-foot metric-foot-standalone"><span className="metric-soft-green"><Icon name="check" size={14} /> Bukti tercatat</span><span>Hari ini</span></div>
                </article>
                <article className={`metric-card ${overdueTasks.length ? 'overdue-metric' : ''}`}>
                  <div className="metric-topline"><span>PERLU TINDAK LANJUT</span><span className={`metric-icon ${overdueTasks.length ? 'red' : 'green'}`}><Icon name="alert" size={17} /></span></div>
                  <div className="metric-main"><strong>{overdueTasks.length}<small> tugas</small></strong><span className="metric-note">{overdueTasks.length ? 'Melewati deadline hari ini' : 'Tidak ada tugas terlambat'}</span></div>
                  <div className="metric-foot metric-foot-standalone"><span className={overdueTasks.length ? 'metric-soft-red' : 'metric-soft-green'}>{overdueTasks.length ? 'Butuh perhatian segera' : 'Semua sesuai jadwal'}</span><span>Real-time</span></div>
                </article>
              </section>

              <section className="panel recent-evidence-panel">
                <div className="panel-header">
                  <div><h2>Bukti foto terbaru</h2><p>Foto yang diunggah pegawai pada checklist</p></div>
                  <div className="recent-evidence-actions">
                    <button type="button" className="plain-button" onClick={() => void refreshSupervisorActivities()} disabled={activityRefreshBusy}>
                      {activityRefreshBusy ? 'Memperbarui...' : 'Perbarui'}
                    </button>
                    <button type="button" className="activity-photo-button" onClick={() => setPage('activity')}>Riwayat aktivitas</button>
                  </div>
                </div>
                {activityRefreshError && <p className="recent-evidence-error" role="alert">{activityRefreshError}</p>}
                {recentEvidence.length ? (
                  <div className="recent-evidence-list">
                    {recentEvidence.map((activity) => (
                      <article className="recent-evidence-row" key={activity.id}>
                        <span className="activity-event-icon activity-event-evidence"><Icon name="camera" size={16} /></span>
                        <div className="recent-evidence-copy">
                          <strong>{activity.staffName}</strong>
                          <span>{activity.taskTitle} · {activity.role} · {formatActivityTimestamp(activity.timestamp)} WIB</span>
                        </div>
                        <button type="button" className="activity-photo-button" onClick={() => void openActivityEvidence(activity)}>Lihat foto</button>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state recent-evidence-empty">
                    <span className="empty-check"><Icon name="camera" size={19} /></span>
                    <strong>Belum ada bukti foto</strong>
                    <span>Foto dari pegawai akan muncul di sini setelah diunggah.</span>
                  </div>
                )}
              </section>

              <section className="dashboard-lower">
                <article className="panel attention-panel" id="attention-list">
                  <div className="panel-header">
                    <div><h2>Perlu perhatian</h2><p>Daftar tugas staf yang melewati deadline</p></div>
                    <span className="count-pill">{overdueTasks.length} terlambat</span>
                  </div>
                  <div className="filter-row">
                    <label className="search-field"><Icon name="search" size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari nama atau tugas..." /></label>
                    <label className="select-field"><Icon name="filter" size={16} /><select value={selectedRole} onChange={(event) => setSelectedRole(event.target.value)} aria-label="Filter role"><option>Semua role</option>{reportRoles.map((role) => <option key={role}>{role}</option>)}</select></label>
                    <label className="select-field unit-select"><Icon name="building" size={16} /><select value={selectedUnit} onChange={(event) => setSelectedUnit(event.target.value)} aria-label="Filter unit"><option value="Semua unit">Semua unit</option>{unitNames.map((unitName) => <option key={unitName} value={unitName}>{unitName}</option>)}</select></label>
                  </div>
                  {filteredOverdueTasks.length > 0 ? (
                    <div className="attention-list">
                      {filteredOverdueTasks.slice(0, 5).map((task) => (
                        <div className="attention-row" key={task.id}>
                          <span className="avatar staff-avatar">{task.staffName.split(' ').map((part) => part[0]).slice(0, 2).join('')}</span>
                          <span className="attention-person"><strong>{task.staffName}</strong><small>{task.role} <i>·</i> {task.unitName}</small></span>
                          <span className="attention-task"><strong>{task.title}</strong><small>Deadline {task.deadline} WIB</small></span>
                          <StatusBadge status={task.status} />
                        </div>
                      ))}
                      {filteredOverdueTasks.length > 5 && <div className="list-more">+ {filteredOverdueTasks.length - 5} tugas lainnya belum ditampilkan</div>}
                    </div>
                  ) : (
                    <div className="empty-state">
                      <span className="empty-check"><Icon name={overdueTasks.length ? 'search' : staff.length ? 'check' : 'add'} size={21} /></span>
                      <strong>{overdueTasks.length ? 'Tugas tidak ditemukan' : staff.length ? 'Tidak ada tugas terlambat' : 'Belum ada staf terdaftar'}</strong>
                      <span>{overdueTasks.length ? 'Coba kata kunci pencarian yang lain.' : staff.length ? 'Semua tugas sesuai jadwal untuk filter ini.' : 'Belum ada pegawai yang mengisi checklist.'}</span>
                    </div>
                  )}
                </article>

                <article className="panel role-panel">
                  <div className="panel-header"><div><h2>Status per role</h2><p>Persentase tugas yang diselesaikan</p></div></div>
                  <div className="role-progress-list">
                    {reportRoles.map((role, index) => {
                      const roleTasks = dashboardTasks.filter((task) => task.role === role)
                      const roleDone = roleTasks.filter((task) => task.status === 'COMPLETED').length
                      const percent = roleTasks.length ? Math.round((roleDone / roleTasks.length) * 100) : 0
                      return (
                        <div className="role-progress-row" key={role}>
                          <span className={`role-symbol role-symbol-${index}`}><Icon name={index === 0 ? 'building' : index === 1 ? 'checklist' : index === 2 ? 'report' : 'alert'} size={16} /></span>
                          <span className="role-progress-info"><strong>{role}</strong><small>{roleDone} dari {roleTasks.length} tugas</small></span>
                          <div className="role-progress-track"><span style={{ width: `${percent}%` }} /></div>
                          <strong className="role-percent">{percent}%</strong>
                        </div>
                      )
                    })}
                  </div>
                  <div className="role-panel-footer"><span><span className="legend-dot green-dot" /> Selesai</span><span><span className="legend-dot gray-dot" /> Belum selesai / terlambat</span></div>
                </article>
              </section>

              <section className="panel obstacle-panel">
                <div className="panel-header">
                  <div><h2>Catatan kendala pegawai</h2><p>Kendala yang disampaikan pegawai pada checklist</p></div>
                  <span className="count-pill obstacle-count">{tasksWithNotes.length} catatan</span>
                </div>
                {tasksWithNotes.length ? (
                  <div className="obstacle-list">
                    {tasksWithNotes
                      .sort((a, b) => (b.obstacleNoteUpdatedAt ?? '').localeCompare(a.obstacleNoteUpdatedAt ?? ''))
                      .slice(0, 6)
                      .map((task) => (
                        <article className="obstacle-row" key={task.id}>
                          <span className="obstacle-icon"><Icon name="note" size={16} /></span>
                          <span className="obstacle-person"><strong>{task.staffName}</strong><small>{task.role} · {task.unitName}</small></span>
                          <span className="obstacle-task"><strong>{task.title}</strong><span>{task.obstacleNote}</span></span>
                          <time>{task.obstacleNoteUpdatedAt ? `${formatActivityTimestamp(task.obstacleNoteUpdatedAt)} WIB` : 'Waktu tidak tercatat'}</time>
                        </article>
                      ))}
                    {tasksWithNotes.length > 6 && <div className="list-more">+ {tasksWithNotes.length - 6} catatan lainnya</div>}
                  </div>
                ) : (
                  <div className="empty-state obstacle-empty"><span className="empty-check"><Icon name="note" size={19} /></span><strong>Belum ada catatan kendala</strong><span>Catatan yang disampaikan pegawai akan muncul di sini.</span></div>
                )}
              </section>

              <footer className="page-footer"><span>BRI <span>·</span> Internal Compliance</span><span>Semua waktu menggunakan WIB (Asia/Jakarta)</span></footer>
            </>
  )
}
