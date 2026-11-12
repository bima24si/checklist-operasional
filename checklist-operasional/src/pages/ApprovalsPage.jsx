import { Icon } from '../components/ui.jsx'
import { formatActivityTimestamp } from '../lib/dateTime.js'

export default function ApprovalsPage({ pendingApprovals, approvalBusyId, approveRegistration }) {
  return (
    <>
      <section className="page-heading">
        <div>
          <div className="eyebrow"><span className="live-indicator" /> AKSES PEGAWAI</div>
          <h1>Persetujuan Pendaftaran</h1>
          <p>Tinjau data pegawai baru sebelum memberi akses ke checklist operasional.</p>
        </div>
        <div className="date-card">
          <span className="date-icon"><Icon name="clock" size={17} /></span>
          <span><small>MENUNGGU</small><strong>{pendingApprovals.length} pendaftaran</strong></span>
        </div>
      </section>

      <section className="panel approvals-panel">
        <div className="panel-header">
          <div><h2>Pendaftaran menunggu persetujuan</h2><p>Akun pegawai baru hanya dapat digunakan setelah disetujui.</p></div>
          <span className="count-pill">{pendingApprovals.length} menunggu</span>
        </div>
        {pendingApprovals.length ? (
          <div className="approval-list">
            {pendingApprovals.map((approval) => (
              <article className="approval-card" key={approval.user_id}>
                <span className="avatar staff-avatar">{approval.full_name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase()}</span>
                <div className="approval-details">
                  <strong>{approval.full_name}</strong>
                  <span>{approval.email}</span>
                  <small>{approval.job_role || 'Role belum diisi'} <i>·</i> {approval.unit_name || 'Unit belum diisi'}</small>
                  <small>Mendaftar {formatActivityTimestamp(approval.requested_at)} WIB</small>
                </div>
                <button
                  type="button"
                  className="approval-button"
                  disabled={approvalBusyId !== ''}
                  onClick={() => approveRegistration(approval)}
                >
                  <Icon name="check" size={16} />
                  {approvalBusyId === approval.user_id ? 'Memproses...' : 'Setujui'}
                </button>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state approval-empty">
            <span className="empty-check"><Icon name="check" size={21} /></span>
            <strong>Tidak ada pendaftaran tertunda</strong>
            <span>Pendaftaran pegawai baru akan muncul di halaman ini.</span>
          </div>
        )}
      </section>
      <footer className="page-footer"><span>BRI <span>·</span> Persetujuan pendaftaran</span><span>Akses diberikan setelah persetujuan supervisor</span></footer>
    </>
  )
}
