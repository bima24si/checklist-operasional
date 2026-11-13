import { Icon, StatusBadge } from '../components/ui.jsx'
import { formatToday } from '../lib/dateTime.js'

export default function ChecklistPage({
  currentUser,
  session,
  setSession,
  sessionDeadline,
  clock,
  checklistStaff,
  myTasks,
  evidenceError,
  setEvidenceError,
  taskFilter,
  setTaskFilter,
  visibleMyTasks,
  toggleTask,
  openEvidencePreview,
  openEvidenceUpload,
  openNoteIds,
  setOpenNoteIds,
  noteDrafts,
  setNoteDrafts,
  saveObstacleNote,
  undoCompletion,
  fileInputRef,
  handleEvidenceChange,
}) {
  const completedTasks = myTasks.filter((task) => task.status === 'COMPLETED').length

  return (
    <>
      <section className="page-heading">
        <div>
          <div className="eyebrow"><span className="live-indicator" /> TUGAS HARIAN</div>
          <h1>Checklist Operasional</h1>
          <p>Pastikan setiap langkah kerja harian terlaksana dan tercatat.</p>
        </div>
        <div className="date-card"><span className="date-icon"><Icon name="clock" size={17} /></span><span><small>HARI INI</small><strong>{formatToday()}</strong></span></div>
      </section>

      <section className="checklist-toolbar panel">
        <div className="checklist-selects">
          <label><span>PEGAWAI</span><select value={currentUser.id} disabled><option value={currentUser.id}>{currentUser.name} — {currentUser.role}</option></select></label>
        </div>
        <div className="session-toggle" role="tablist" aria-label="Sesi checklist">
          {['Pagi', 'Sore'].map((value) => <button key={value} role="tab" aria-selected={session === value} className={session === value ? 'active' : ''} onClick={() => setSession(value)}>{value === 'Pagi' ? '☀' : '◒'} Sesi {value}</button>)}
        </div>
      </section>

      {evidenceError && <div className="evidence-error" role="alert"><Icon name="alert" size={16} />{evidenceError}<button onClick={() => setEvidenceError('')} aria-label="Tutup pesan"><Icon name="close" size={15} /></button></div>}

      {checklistStaff ? (
        <section className="checklist-overview">
          <div><span className="staff-avatar large-avatar">{checklistStaff.name.split(' ').map((part) => part[0]).slice(0, 2).join('')}</span><span><small>CHECKLIST STAF</small><strong>{checklistStaff.name}</strong><em>{checklistStaff.role} <i>·</i> {checklistStaff.unitName}</em></span></div>
          <div className="session-deadline"><Icon name="clock" size={17} /><span>Deadline sesi <strong>{sessionDeadline || '—'} WIB</strong></span></div>
          <div className="session-progress"><strong>{completedTasks}<span>/{myTasks.length}</span></strong><small>tugas selesai</small><div className="mini-progress"><span style={{ width: `${myTasks.length ? (completedTasks / myTasks.length) * 100 : 0}%` }} /></div></div>
        </section>
      ) : (
        <section className="panel empty-checklist"><span className="empty-check"><Icon name="add" size={21} /></span><strong>Checklist belum tersedia</strong><span>Data pegawai ini tidak ditemukan. Silakan keluar dan masuk kembali.</span></section>
      )}

      {checklistStaff && <section className="panel tasks-panel">
        <div className="panel-header task-panel-header">
          <div><h2>Tugas sesi {session.toLowerCase()}</h2><p>{myTasks.length} langkah wajib · Deadline {sessionDeadline || '—'} WIB</p></div>
          <label className="select-field compact-select"><Icon name="filter" size={16} /><select value={taskFilter} onChange={(event) => setTaskFilter(event.target.value)} aria-label="Filter status tugas"><option>Semua</option><option>Belum selesai</option><option>Selesai</option></select></label>
        </div>
        <div className="task-list">
          {visibleMyTasks.map((task, index) => (
            <article className={`task-row ${task.status === 'OVERDUE' ? 'task-row-overdue' : ''} ${task.status === 'COMPLETED' ? 'task-row-complete' : ''}`} key={task.id}>
              {task.type === 'CHECKBOX' ? (
                <button className={`task-checkbox ${task.completed ? 'checked' : ''}`} role="checkbox" aria-checked={task.completed} aria-label={`${task.completed ? 'Batalkan ' : 'Selesaikan '}${task.title}`} onClick={() => toggleTask(task.id)}>{task.completed && <Icon name="check" size={15} />}</button>
              ) : (
                <span className={`task-checkbox ${task.completed ? 'checked' : ''} image-checkbox`}>{task.completed ? <Icon name="check" size={15} /> : <Icon name="camera" size={15} />}</span>
              )}
              <div className="task-number">{String(index + 1).padStart(2, '0')}</div>
              <div className="task-description">
                <strong>{task.title}</strong>
                <span>{task.description}</span>
                <div className="evidence-line">
                  {task.evidence
                    ? <button type="button" className="evidence-preview-button" onClick={() => openEvidencePreview(task)}><img className="evidence-thumb" src={task.evidence} alt="" /><span>Lihat foto bukti</span></button>
                    : <><Icon name="camera" size={14} /><span>{task.type === 'CHECKBOX_WITH_IMAGE' ? 'Bukti foto wajib' : 'Foto bukti opsional'}</span></>}
                  {!task.completed && <button className="upload-button" onClick={() => openEvidenceUpload(task.id)}>{task.type === 'CHECKBOX_WITH_IMAGE' ? 'Unggah foto' : 'Tambah foto'}</button>}
                  {task.completed && <button className="replace-button" onClick={() => openEvidenceUpload(task.id)}>{task.evidence ? 'Ganti foto' : 'Tambah foto'}</button>}
                </div>
                <div className="obstacle-entry">
                  {task.obstacleNote && !openNoteIds[task.id] && (
                    <div className="saved-obstacle-note"><Icon name="note" size={14} /><span><strong>Catatan kendala:</strong> {task.obstacleNote}</span></div>
                  )}
                  <button
                    type="button"
                    className="obstacle-toggle"
                    aria-expanded={Boolean(openNoteIds[task.id])}
                    onClick={() => setOpenNoteIds((current) => ({ ...current, [task.id]: !current[task.id] }))}
                  >
                    <Icon name="note" size={14} />{openNoteIds[task.id] ? 'Tutup catatan' : task.obstacleNote ? 'Ubah catatan kendala' : 'Tambah catatan kendala'}
                  </button>
                  {openNoteIds[task.id] && (
                    <div className="obstacle-editor">
                      <textarea
                        aria-label={`Catatan kendala untuk ${task.title}`}
                        maxLength={500}
                        placeholder="Jelaskan kendala yang menghambat tugas ini (opsional)"
                        value={noteDrafts[task.id] ?? task.obstacleNote ?? ''}
                        onChange={(event) => setNoteDrafts((current) => ({ ...current, [task.id]: event.target.value }))}
                      />
                      <div className="obstacle-editor-footer">
                        <span>{(noteDrafts[task.id] ?? task.obstacleNote ?? '').length}/500</span>
                        <button type="button" className="upload-button" disabled={(noteDrafts[task.id] ?? task.obstacleNote ?? '').trim() === (task.obstacleNote ?? '')} onClick={() => saveObstacleNote(task)}>Simpan catatan</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="task-deadline"><small>DEADLINE</small><strong>{task.deadline} <span>WIB</span></strong></div>
              <div className="task-status-cell"><StatusBadge status={task.status} />{task.completed && <button className="undo-button" onClick={() => undoCompletion(task)}>Batalkan</button>}</div>
            </article>
          ))}
          {visibleMyTasks.length === 0 && <div className="empty-state task-empty"><span className="empty-check"><Icon name="check" size={21} /></span><strong>Tidak ada tugas pada filter ini</strong><span>Pilih filter status lain untuk melihat checklist.</span></div>}
        </div>
        <div className="task-panel-footer"><span><Icon name="alert" size={15} /> Tugas yang belum selesai setelah deadline otomatis ditandai terlambat.</span><span>Waktu terakhir diperbarui {clock.label} WIB</span></div>
      </section>}
      <input ref={fileInputRef} className="hidden-input" type="file" accept="image/jpeg,image/png,image/webp" onChange={handleEvidenceChange} />
      <footer className="page-footer"><span>BRI <span>·</span> Internal Compliance</span><span>Bukti foto tersimpan di Supabase.</span></footer>
    </>
  )
}
