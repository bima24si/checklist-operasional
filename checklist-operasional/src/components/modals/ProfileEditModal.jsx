import { useRef, useState } from 'react'
import { Icon } from '../ui.jsx'

function ProfileStatus({ value }) {
  if (!value) return null
  return <p className={`profile-status profile-status-${value.type}`} role={value.type === 'error' ? 'alert' : 'status'}>{value.text}</p>
}

export default function ProfileEditModal({
  currentUser,
  onClose,
  onSaveName,
  onSaveEmail,
  onSavePassword,
  onUploadPhoto,
}) {
  const [name, setName] = useState(currentUser.name)
  const [email, setEmail] = useState(currentUser.email ?? '')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [formSaving, setFormSaving] = useState(false)
  const [photoSaving, setPhotoSaving] = useState(false)
  const [formStatus, setFormStatus] = useState(null)
  const [photoStatus, setPhotoStatus] = useState(null)
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState(currentUser.avatarUrl ?? '')
  const photoInputRef = useRef(null)
  const isSaving = formSaving || photoSaving
  const initials = currentUser.name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase()

  async function runAction(action, setSaving, setStatus, successMessage, onSuccess) {
    setSaving(true)
    setStatus(null)
    try {
      const result = await action()
      onSuccess?.(result)
      setStatus({ type: 'success', text: successMessage })
    } catch (error) {
      console.error('Perubahan profil gagal.', error)
      setStatus({ type: 'error', text: error.message })
    } finally {
      setSaving(false)
    }
  }

  async function submitChanges(event) {
    event.preventDefault()
    const hasNameChange = name.trim() !== currentUser.name.trim()
    const hasEmailChange = email.trim().toLowerCase() !== currentUser.email?.trim().toLowerCase()
    const hasPasswordChange = Boolean(newPassword || confirmPassword)

    if (hasPasswordChange && (newPassword.length < 8 || confirmPassword.length < 8)) {
      setFormStatus({ type: 'error', text: 'Password baru dan konfirmasi harus berisi minimal 8 karakter.' })
      return
    }
    if (hasPasswordChange && newPassword !== confirmPassword) {
      setFormStatus({ type: 'error', text: 'Konfirmasi password tidak sama.' })
      return
    }

    if (!hasNameChange && !hasEmailChange && !hasPasswordChange) {
      setFormStatus({ type: 'success', text: 'Tidak ada perubahan yang perlu disimpan.' })
      return
    }

    setFormSaving(true)
    setFormStatus(null)
    const completedChanges = []
    try {
      if (hasNameChange) {
        await onSaveName(name)
        completedChanges.push('nama')
      }
      if (hasEmailChange) {
        await onSaveEmail(email)
        completedChanges.push('email')
      }
      if (hasPasswordChange) {
        await onSavePassword(newPassword)
        completedChanges.push('password')
        setNewPassword('')
        setConfirmPassword('')
      }

      setFormStatus({
        type: 'success',
        text: hasEmailChange
          ? 'Perubahan berhasil disimpan. Cek email baru untuk konfirmasi.'
          : 'Perubahan profil berhasil disimpan.',
      })
    } catch (error) {
      console.error('Perubahan profil gagal.', error)
      const partialChanges = completedChanges.length
        ? ` Yang sudah tersimpan: ${completedChanges.join(', ')}.`
        : ''
      setFormStatus({
        type: 'error',
        text: `Tidak semua perubahan berhasil disimpan.${partialChanges} ${error.message ?? 'Silakan coba lagi.'}`,
      })
    } finally {
      setFormSaving(false)
    }
  }

  function handlePhotoChange(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    void runAction(
      () => onUploadPhoto(file),
      setPhotoSaving,
      setPhotoStatus,
      'Foto profil berhasil diperbarui.',
      setPhotoPreviewUrl,
    )
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !isSaving) onClose()
    }}>
      <section className="staff-modal profile-edit-modal" role="dialog" aria-modal="true" aria-labelledby="profile-edit-title">
        <div className="modal-header profile-edit-header">
          <div>
            <span className="modal-icon"><Icon name="profile" size={17} /></span>
            <div>
              <h2 id="profile-edit-title">Edit profil</h2>
              <p>Kelola foto, nama, email, dan password.</p>
            </div>
          </div>
          <button type="button" className="plain-button modal-close" aria-label="Tutup" disabled={isSaving} onClick={onClose}><Icon name="close" size={18} /></button>
        </div>

        <div className="profile-edit-content">
          <section className="profile-edit-section profile-photo-section">
            <div className="profile-avatar-preview avatar avatar-supervisor">
              {photoPreviewUrl ? <img src={photoPreviewUrl} alt="Foto profil saat ini" /> : initials}
            </div>
            <div className="profile-photo-details">
              <strong>Foto profil</strong>
              <small>JPG, PNG, atau WebP · Maksimal 2 MB</small>
              <button type="button" className="secondary-button" disabled={isSaving} onClick={() => photoInputRef.current?.click()}>
                {photoPreviewUrl ? 'Ubah foto' : 'Tambah foto'}
              </button>
              <input ref={photoInputRef} className="hidden-input" type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoChange} />
              <ProfileStatus value={photoStatus} />
            </div>
          </section>

          <form className="profile-edit-form" onSubmit={submitChanges}>
            <section className="profile-edit-section profile-edit-form-section">
              <label>Nama lengkap
                <input autoComplete="name" maxLength={100} minLength={2} required value={name} onChange={(event) => setName(event.target.value)} />
              </label>
            </section>

            <section className="profile-edit-section profile-edit-form-section">
              <label>Email
                <input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
              </label>
              <p className="profile-edit-note">Masukkan email baru yang berbeda. Perubahan berlaku setelah konfirmasi melalui email.</p>
            </section>

            <section className="profile-edit-section profile-edit-form-section">
              <label>Password baru
                <input type="password" autoComplete="new-password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} />
              </label>
              <label>Konfirmasi password baru
                <input type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
              </label>
              <p className="profile-edit-note">Kosongkan jika tidak ingin mengganti password. Minimal 8 karakter dan kedua kolom harus sama.</p>
            </section>

            <section className="profile-edit-section profile-edit-form-section">
              <ProfileStatus value={formStatus} />
              <button type="submit" className="primary-button" disabled={isSaving}>
                {formSaving ? 'Menyimpan...' : 'Simpan semua perubahan'}
              </button>
            </section>
          </form>
        </div>
      </section>
    </div>
  )
}
