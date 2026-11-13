import { Icon } from '../ui.jsx'

export default function PendingApprovalScreen({ name, onLogout }) {
  return (
    <main className="login-page">
      <section className="login-card approval-pending-card">
        <span className="approval-pending-icon"><Icon name="clock" size={23} /></span>
        <div className="login-heading">
          <span className="eyebrow">PENDAFTARAN PEGAWAI</span>
          <h1>Menunggu persetujuan</h1>
          <p>Akun {name} belum dapat digunakan. Supervisor perlu menyetujui pendaftaran Anda terlebih dahulu.</p>
        </div>
        <button type="button" className="login-submit" onClick={onLogout}>Keluar dan kembali ke halaman masuk<Icon name="logout" size={16} /></button>
      </section>
      <span className="login-footer">BRI <i>·</i> Internal Compliance</span>
    </main>
  )
}
