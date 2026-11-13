import { Icon } from '../ui.jsx'

export default function EvidencePreviewModal({ evidencePreview, onClose }) {
  if (!evidencePreview) return null

  return (
    <div className="evidence-modal-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose()
    }}>
      <section className="evidence-modal" role="dialog" aria-modal="true" aria-labelledby="evidence-modal-title">
        <div className="evidence-modal-header">
          <div><h2 id="evidence-modal-title">Bukti foto</h2><p>{evidencePreview.title}</p></div>
          <button type="button" className="plain-button" aria-label="Tutup pratinjau" onClick={onClose}><Icon name="close" size={19} /></button>
        </div>
        <img src={evidencePreview.src} alt={`Bukti foto: ${evidencePreview.title}`} />
      </section>
    </div>
  )
}
