import { Icon } from '../ui.jsx'

export default function CameraModal({
  videoRef,
  loading,
  ready,
  error,
  onReady,
  onClose,
  onSelectFile,
  onCapture,
}) {
  return (
    <div className="evidence-modal-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose()
    }}>
      <section className="camera-modal" role="dialog" aria-modal="true" aria-labelledby="camera-modal-title">
        <div className="evidence-modal-header">
          <div><h2 id="camera-modal-title">Ambil foto bukti</h2><p>Arahkan kamera ke bukti tugas, lalu ambil foto.</p></div>
          <button type="button" className="plain-button" aria-label="Tutup kamera" onClick={onClose}><Icon name="close" size={19} /></button>
        </div>
        <div className="camera-preview">
          <video ref={videoRef} autoPlay playsInline muted onCanPlay={onReady} />
          {loading && <p role="status">Meminta izin dan membuka kamera...</p>}
          {error && <p className="camera-error" role="alert">{error}</p>}
        </div>
        <div className="camera-modal-actions">
          <button type="button" className="secondary-button" onClick={onSelectFile}>Pilih foto dari perangkat</button>
          <button type="button" className="primary-button" disabled={!ready} onClick={onCapture}>Ambil foto</button>
        </div>
      </section>
    </div>
  )
}
