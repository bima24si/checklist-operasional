import { useEffect, useRef, useState } from 'react'

export default function ProfileMenu({ currentUser, onEditProfile, onLogout }) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef(null)
  const initials = currentUser.name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase()

  useEffect(() => {
    if (!open) return undefined

    function closeOnOutsideClick(event) {
      if (!menuRef.current?.contains(event.target)) setOpen(false)
    }

    function closeOnEscape(event) {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('pointerdown', closeOnOutsideClick)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [open])

  return (
    <div className="profile-menu" ref={menuRef}>
      <button
        type="button"
        className="profile-trigger topbar-user"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((isOpen) => !isOpen)}
      >
        <span className="avatar avatar-supervisor">
          {currentUser.avatarUrl ? <img src={currentUser.avatarUrl} alt="" /> : initials}
        </span>
        <span><strong>{currentUser.name}</strong><small>{currentUser.accessRole}</small></span>
      </button>
      {open && (
        <div className="profile-menu-popover" role="menu" aria-label="Menu profil">
          <button type="button" role="menuitem" onClick={() => { setOpen(false); onEditProfile() }}>Edit profil</button>
          <button type="button" role="menuitem" className="profile-logout-action" onClick={() => { setOpen(false); onLogout() }}>Keluar</button>
        </div>
      )}
    </div>
  )
}
