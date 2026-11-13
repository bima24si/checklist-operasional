import { Icon } from '../ui.jsx'

export default function LoginScreen({
  authMode,
  setAuthMode,
  loginName,
  setLoginName,
  loginEmail,
  setLoginEmail,
  loginPassword,
  setLoginPassword,
  loginPasswordConfirm,
  setLoginPasswordConfirm,
  showLoginPassword,
  setShowLoginPassword,
  showConfirmPassword,
  setShowConfirmPassword,
  loginStaffRole,
  setLoginStaffRole,
  roles,
  loginError,
  authNotice,
  backendError,
  authBusy,
  supabaseConfigured,
  onSubmit,
  onClearMessages,
}) {
  const isRegistering = authMode === 'register'

  function toggleAuthMode() {
    setAuthMode(isRegistering ? 'login' : 'register')
    onClearMessages()
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <a className="login-brand" href="#" onClick={(event) => event.preventDefault()}>
          <span className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 32 32" focusable="false">
              <path fill="#00529b" d="M5 8h14v5H5zm0 8h22v5H5zm0 8h14v5H5z" />
              <path fill="#f4c542" d="M21 8h6v5h-6zm-4 16h10v5H17z" />
            </svg>
          </span>
          <span className="brand-copy"><strong>BRI</strong><small>OPERASIONAL BANK</small></span>
        </a>

        <div className="login-heading">
          <span className="eyebrow"><span className="live-indicator" /> INTERNAL COMPLIANCE</span>
          <h1>{isRegistering ? 'Buat akun baru' : 'Selamat datang'}</h1>
          <p>{isRegistering ? 'Daftarkan akun untuk mengakses checklist operasional.' : 'Masuk untuk melanjutkan aktivitas operasional harian.'}</p>
        </div>

        {backendError && <p className="login-error" role="alert">{backendError}</p>}
        <form className="login-form" onSubmit={onSubmit}>
          {isRegistering && (
            <label>Nama lengkap<input autoComplete="name" value={loginName} onChange={(event) => setLoginName(event.target.value)} placeholder="Masukkan nama lengkap" /></label>
          )}
          <label>Email<input type="email" autoComplete="email" required value={loginEmail} onChange={(event) => setLoginEmail(event.target.value)} placeholder="nama@contoh.com" /></label>
          {isRegistering && (
            <label>Role pekerjaan<select value={loginStaffRole} onChange={(event) => setLoginStaffRole(event.target.value)}>{roles.map((role) => <option key={role}>{role}</option>)}</select></label>
          )}
          <label>Password
            <span className="password-input">
              <input
                type={showLoginPassword ? 'text' : 'password'}
                autoComplete={isRegistering ? 'new-password' : 'current-password'}
                value={loginPassword}
                onChange={(event) => setLoginPassword(event.target.value)}
                placeholder={isRegistering ? 'Buat password (minimal 8 karakter)' : 'Masukkan password'}
              />
              <button type="button" className="password-toggle" aria-label={showLoginPassword ? 'Sembunyikan password' : 'Tampilkan password'} aria-pressed={showLoginPassword} onClick={() => setShowLoginPassword((visible) => !visible)}>
                <Icon name={showLoginPassword ? 'eyeOff' : 'eye'} size={17} />
              </button>
            </span>
          </label>
          {isRegistering && (
            <label>Konfirmasi password
              <span className="password-input">
                <input type={showConfirmPassword ? 'text' : 'password'} autoComplete="new-password" value={loginPasswordConfirm} onChange={(event) => setLoginPasswordConfirm(event.target.value)} placeholder="Masukkan ulang password" />
                <button type="button" className="password-toggle" aria-label={showConfirmPassword ? 'Sembunyikan konfirmasi password' : 'Tampilkan konfirmasi password'} aria-pressed={showConfirmPassword} onClick={() => setShowConfirmPassword((visible) => !visible)}>
                  <Icon name={showConfirmPassword ? 'eyeOff' : 'eye'} size={17} />
                </button>
              </span>
            </label>
          )}
          {loginError && <p className="login-error" role="alert">{loginError}</p>}
          {authNotice && <p className="auth-notice" role="status">{authNotice}</p>}
          <button type="submit" className="login-submit" disabled={authBusy || !supabaseConfigured}>
            {authBusy ? 'Memproses...' : isRegistering ? 'Daftar' : 'Masuk'}<Icon name="chevron" size={16} />
          </button>
        </form>

        <div className="auth-switch">
          {isRegistering ? 'Sudah punya akun?' : 'Belum punya akun?'} <button type="button" onClick={toggleAuthMode}>{isRegistering ? 'Masuk' : 'Daftar'}</button>
        </div>
      </section>
      <span className="login-footer">BRI <i>·</i> Internal Compliance</span>
    </main>
  )
}
