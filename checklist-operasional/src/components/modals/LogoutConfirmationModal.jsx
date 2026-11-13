import { Icon } from '../ui.jsx'

export default function LogoutConfirmationModal({ onCancel, onConfirm }) {
  return (
    <div
      className="modal-backdrop logout-modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCancel()
      }}
    >
      <section className="staff-modal logout-modal" role="dialog" aria-modal="true" aria-labelledby="logout-modal-title">
        <div className="modal-header">
          <div>
            <span className="modal-icon"><Icon name="logout" size={17} /></span>
            <div>
              <h2 id="logout-modal-title">Keluar dari akun?</h2>
              <p>Anda perlu masuk kembali untuk melanjutkan.</p>
            </div>
          </div>
        </div>
        <div className="logout-modal-actions">
          <button type="button" className="secondary-button" onClick={onCancel}>Batal</button>
          <button type="button" className="logout-confirm-button" onClick={onConfirm}>Ya, keluar</button>
        </div>
      </section>
    </div>
  )
}
