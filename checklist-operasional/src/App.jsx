import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'

const roles = ['Teller', 'Customer Service', 'Relationship Manager', 'Satpam']

const taskTemplates = [
  {
    role: 'Teller',
    session: 'Pagi',
    deadline: '07:45',
    title: 'Hitung modal kas harian',
    description: 'Pastikan jumlah fisik modal kas sesuai dengan catatan awal hari.',
    type: 'CHECKBOX',
  },
  {
    role: 'Teller',
    session: 'Pagi',
    deadline: '07:45',
    title: 'Uji cetak printer passbook',
    description: 'Periksa hasil cetak dan pastikan tinta tercetak jelas.',
    type: 'CHECKBOX',
  },
  {
    role: 'Teller',
    session: 'Pagi',
    deadline: '07:45',
    title: 'Dokumentasikan laci kasir',
    description: 'Foto laci kasir dalam keadaan rapi dan terkunci sebelum layanan.',
    type: 'CHECKBOX_WITH_IMAGE',
  },
  {
    role: 'Teller',
    session: 'Sore',
    deadline: '16:00',
    title: 'Tutup dan rekonsiliasi kas',
    description: 'Hitung sisa kas, cocokkan saldo, lalu setor dan kunci di vault bersama supervisor.',
    type: 'CHECKBOX',
  },
  {
    role: 'Customer Service',
    session: 'Pagi',
    deadline: '07:45',
    title: 'Siapkan area layanan nasabah',
    description: 'Bersihkan counter dan pastikan dokumen formulir tersedia serta tertata.',
    type: 'CHECKBOX',
  },
  {
    role: 'Customer Service',
    session: 'Sore',
    deadline: '16:30',
    title: 'Arsipkan formulir pembukaan rekening',
    description: 'Simpan formulir fisik ke dalam lemari arsip yang terkunci.',
    type: 'CHECKBOX',
  },
  {
    role: 'Relationship Manager',
    session: 'Pagi',
    deadline: '08:00',
    title: 'Periksa meja dari berkas agunan',
    description: 'Pastikan tidak ada sertifikat, BPKB, atau dokumen jaminan yang tertinggal.',
    type: 'CHECKBOX',
  },
  {
    role: 'Relationship Manager',
    session: 'Pagi',
    deadline: '08:00',
    title: 'Pastikan akses BRISPOT aktif',
    description: 'Nyalakan PC dan periksa koneksi VPN serta jaringan internal.',
    type: 'CHECKBOX',
  },
  {
    role: 'Relationship Manager',
    session: 'Pagi',
    deadline: '08:00',
    title: 'Buktikan clean desk policy',
    description: 'Foto meja kerja yang bersih tanpa dokumen nasabah terbuka.',
    type: 'CHECKBOX_WITH_IMAGE',
  },
  {
    role: 'Relationship Manager',
    session: 'Sore',
    deadline: '16:30',
    title: 'Simpan berkas kredit dan dokumen hukum',
    description: 'Rapikan berkas fisik jaminan dan simpan ke lemari arsip terkunci.',
    type: 'CHECKBOX',
  },
  {
    role: 'Satpam',
    session: 'Pagi',
    deadline: '07:15',
    title: 'Periksa CCTV, ATM, dan area luar',
    description: 'Pastikan CCTV berfungsi, ATM center rapi, dan area luar terpantau.',
    type: 'CHECKBOX',
  },
  {
    role: 'Satpam',
    session: 'Sore',
    deadline: '17:00',
    title: 'Lakukan pemeriksaan akhir gedung',
    description: 'Matikan AC dan PC, kunci ruang arsip, lalu gembok pintu dan gerbang.',
    type: 'CHECKBOX',
  },
]

function createTasksForStaff(staff) {
  return taskTemplates
    .map((template, index) => ({ ...template, index }))
    .filter((template) => template.role === staff.role)
    .map((template) => ({
      ...template,
      id: `${staff.id}-${template.index}`,
      staffId: staff.id,
      unitId: staff.unitName,
      unitName: staff.unitName,
      staffName: staff.name,
      completed: false,
      evidence: '',
    }))
}

function Icon({ name, size = 20 }) {
  const paths = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /></>,
    checklist: <><path d="m4 6 1.5 1.5L8 5" /><path d="M11 6h9M4 13l1.5 1.5L8 12" /><path d="M11 13h9M4 20l1.5 1.5L8 19" /><path d="M11 20h9" /></>,
    report: <><path d="M4 19V5M4 19h17" /><path d="m7 15 4-4 3 2 6-7" /></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    alert: <><path d="M10.3 3.9 2.5 17.4A1.8 1.8 0 0 0 4 20h16a1.8 1.8 0 0 0 1.5-2.6L13.7 3.9a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4m0 3h.01" /></>,
    camera: <><path d="M14 5h-4L8 8H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-3l-2-3Z" /><circle cx="12" cy="13" r="3" /></>,
    chevron: <path d="m9 18 6-6-6-6" />,
    filter: <><path d="M4 7h16M7 12h10m-7 5h4" /><circle cx="8" cy="7" r="1" /><circle cx="15" cy="12" r="1" /><circle cx="12" cy="17" r="1" /></>,
    building: <><path d="M3 21h18M5 21V7l7-4 7 4v14M9 10h.01M15 10h.01M9 14h.01M15 14h.01M10 21v-3h4v3" /></>,
    logout: <><path d="M10 17l5-5-5-5M15 12H3" /><path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" /></>,
    close: <><path d="m18 6-12 12M6 6l12 12" /></>,
    add: <><path d="M12 5v14M5 12h14" /></>,
    history: <><path d="M3 12a9 9 0 1 0 2.6-6.4L3 8" /><path d="M3 3v5h5m4-1v5l3 2" /></>,
    note: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6M8 13h8m-8 4h8" /></>,
  }

  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  )
}

function getWibTime() {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Jakarta',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date())
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]))

  return {
    label: `${values.hour}:${values.minute}:${values.second}`,
    minutes: Number(values.hour) * 60 + Number(values.minute) + Number(values.second) / 60,
  }
}

function getTaskStatus(task, currentMinutes) {
  if (task.completed) return 'COMPLETED'
  const [hours, minutes] = task.deadline.split(':').map(Number)
  return currentMinutes > hours * 60 + minutes ? 'OVERDUE' : 'PENDING'
}

function formatToday() {
  return new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date())
}

function formatActivityTimestamp(timestamp) {
  return new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    dateStyle: 'medium',
    timeStyle: 'medium',
  }).format(new Date(timestamp))
}

function toBase64(bytes) {
  return btoa(String.fromCharCode(...bytes))
}

async function hashPassword(password, salt = crypto.getRandomValues(new Uint8Array(16))) {
  if (!crypto.subtle) throw new Error('Browser tidak mendukung penyimpanan password yang di-hash.')

  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 150000, hash: 'SHA-256' },
    key,
    256,
  )

  return { salt: toBase64(salt), passwordHash: toBase64(new Uint8Array(bits)) }
}

function fromBase64(value) {
  return Uint8Array.from(atob(value), (character) => character.charCodeAt(0))
}

async function verifyPassword(password, account) {
  const { passwordHash } = await hashPassword(password, fromBase64(account.passwordSalt))
  const expected = fromBase64(account.passwordHash)
  const actual = fromBase64(passwordHash)
  return actual.length === expected.length && actual.every((value, index) => value === expected[index])
}

function StatusBadge({ status }) {
  const labels = {
    COMPLETED: 'Selesai',
    PENDING: 'Belum dikerjakan',
    OVERDUE: 'Terlambat',
  }

  return <span className={`status-badge status-${status.toLowerCase()}`}>{labels[status]}</span>
}

function loadStoredData() {
  try {
    const saved = window.localStorage.getItem('ruangpatuh:data')
    if (!saved) return { staff: [], tasks: [], activities: [], accounts: [], error: '' }

    const data = JSON.parse(saved)
    if (!Array.isArray(data.staff) || !Array.isArray(data.tasks)) {
      throw new Error('Format data tidak sesuai.')
    }

    return {
      staff: data.staff,
      tasks: data.tasks,
      activities: Array.isArray(data.activities) ? data.activities : [],
      accounts: Array.isArray(data.accounts) ? data.accounts : [],
      error: '',
    }
  } catch (error) {
    console.error('Data lokal RuangPatuh gagal dimuat.', error)
    return {
      staff: [],
      tasks: [],
      activities: [],
      accounts: [],
      error: 'Data lokal tidak dapat dibaca. Perubahan hanya berlaku selama halaman ini terbuka.',
    }
  }
}

function App() {
  const [initialData] = useState(loadStoredData)
  const [currentUser, setCurrentUser] = useState(null)
  const [page, setPage] = useState('dashboard')
  const [staff, setStaff] = useState(initialData.staff)
  const [tasks, setTasks] = useState(initialData.tasks)
  const [activities, setActivities] = useState(initialData.activities)
  const [accounts, setAccounts] = useState(initialData.accounts)
  const [storageError] = useState(initialData.error)
  const [selectedRole, setSelectedRole] = useState('Semua role')
  const [selectedUnit, setSelectedUnit] = useState('Semua unit')
  const [checklistStaffId, setChecklistStaffId] = useState('')
  const [session, setSession] = useState('Pagi')
  const [taskFilter, setTaskFilter] = useState('Semua')
  const [clock, setClock] = useState(getWibTime)
  const [notificationOpen, setNotificationOpen] = useState(false)
  const [authMode, setAuthMode] = useState('login')
  const [loginName, setLoginName] = useState('')
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginPasswordConfirm, setLoginPasswordConfirm] = useState('')
  const [loginStaffRole, setLoginStaffRole] = useState(roles[0])
  const [loginUnit, setLoginUnit] = useState('')
  const [loginError, setLoginError] = useState('')
  const [authBusy, setAuthBusy] = useState(false)
  const [evidenceError, setEvidenceError] = useState('')
  const [evidencePreview, setEvidencePreview] = useState(null)
  const [openNoteIds, setOpenNoteIds] = useState({})
  const [noteDrafts, setNoteDrafts] = useState(() => Object.fromEntries(
    initialData.tasks.map((task) => [task.id, task.obstacleNote ?? '']),
  ))
  const [query, setQuery] = useState('')
  const [activityQuery, setActivityQuery] = useState('')
  const [activityRole, setActivityRole] = useState('Semua role')
  const [activityUnit, setActivityUnit] = useState('Semua unit')
  const [authNotice, setAuthNotice] = useState('')
  const fileInputRef = useRef(null)
  const uploadTaskRef = useRef(null)
  const storageWritable = useRef(!initialData.error)

  useEffect(() => {
    const timer = window.setInterval(() => setClock(getWibTime()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!storageWritable.current) return

    try {
      window.localStorage.setItem('ruangpatuh:data', JSON.stringify({ staff, tasks, activities, accounts }))
    } catch (error) {
      storageWritable.current = false
      console.error('Perubahan RuangPatuh tidak dapat disimpan ke browser.', error)
    }
  }, [staff, tasks, activities, accounts])

  const unitNames = [...new Set(staff.map((person) => person.unitName))]
  const checklistStaff = staff.find((person) => person.id === checklistStaffId)
  const sidebarUnit = unitNames[0]
  const tasksWithStatus = useMemo(
    () => tasks.map((task) => ({ ...task, status: getTaskStatus(task, clock.minutes) })),
    [tasks, clock.minutes],
  )

  const dashboardTasks = tasksWithStatus.filter((task) =>
    (selectedRole === 'Semua role' || task.role === selectedRole)
      && (selectedUnit === 'Semua unit' || task.unitId === selectedUnit),
  )
  const completedCount = dashboardTasks.filter((task) => task.status === 'COMPLETED').length
  const overdueTasks = dashboardTasks
    .filter((task) => task.status === 'OVERDUE')
    .sort((a, b) => a.deadline.localeCompare(b.deadline))
  const filteredOverdueTasks = overdueTasks.filter((task) =>
    !query || `${task.staffName} ${task.title} ${task.role}`.toLowerCase().includes(query.toLowerCase()),
  )
  const compliance = dashboardTasks.length
    ? Math.round((completedCount / dashboardTasks.length) * 100)
    : 0
  const myTasks = tasksWithStatus.filter((task) =>
    task.staffId === checklistStaffId && task.session === session,
  )
  const tasksWithNotes = dashboardTasks.filter((task) => task.obstacleNote?.trim())
  const visibleMyTasks = myTasks.filter((task) => {
    if (taskFilter === 'Semua') return true
    if (taskFilter === 'Belum selesai') return task.status !== 'COMPLETED'
    return task.status === 'COMPLETED'
  })
  const visibleActivities = activities
    .filter((activity) =>
      (activityRole === 'Semua role' || activity.role === activityRole)
      && (activityUnit === 'Semua unit' || activity.unitName === activityUnit)
      && (!activityQuery || `${activity.staffName} ${activity.taskTitle} ${activity.action}`.toLocaleLowerCase().includes(activityQuery.toLocaleLowerCase())),
    )
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))

  function recordActivity(task, action) {
    setActivities((currentActivities) => [{
      id: `activity-${window.crypto.randomUUID()}`,
      staffId: task.staffId,
      staffName: task.staffName,
      role: task.role,
      unitName: task.unitName,
      taskId: task.id,
      taskTitle: task.title,
      session: task.session,
      action,
      timestamp: new Date().toISOString(),
    }, ...currentActivities])
  }

  function toggleTask(taskId) {
    const task = tasks.find((item) => item.id === taskId)
    if (!task || task.type === 'CHECKBOX_WITH_IMAGE') return

    const completed = !task.completed
    setTasks((currentTasks) => currentTasks.map((item) => (
      item.id === taskId ? { ...item, completed } : item
    )))
    recordActivity(task, completed ? 'Tugas diselesaikan' : 'Penyelesaian dibatalkan')
  }

  function openEvidenceUpload(taskId) {
    setEvidenceError('')
    uploadTaskRef.current = taskId
    fileInputRef.current?.click()
  }

  function openEvidencePreview(task) {
    if (!task.evidence?.startsWith('data:image')) return
    setEvidencePreview({ src: task.evidence, title: task.title })
  }

  function handleEvidenceChange(event) {
    const file = event.target.files?.[0]
    const taskId = uploadTaskRef.current
    event.target.value = ''
    if (!file || !taskId) return

    if (!file.type.startsWith('image/')) {
      setEvidenceError('Pilih file gambar untuk bukti checklist.')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setEvidenceError('Ukuran foto maksimal 2 MB.')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const task = tasks.find((item) => item.id === taskId)
      setTasks((currentTasks) => currentTasks.map((task) => (
        task.id === taskId
          ? { ...task, completed: true, evidence: String(reader.result) }
          : task
      )))
      if (task) recordActivity(task, 'Bukti foto diunggah')
      setEvidenceError('')
    }
    reader.onerror = () => setEvidenceError('Foto tidak dapat dibaca. Silakan coba lagi.')
    reader.readAsDataURL(file)
  }

  function saveObstacleNote(task) {
    const note = (noteDrafts[task.id] ?? '').trim()
    const previousNote = task.obstacleNote ?? ''
    if (note === previousNote) return

    setTasks((currentTasks) => currentTasks.map((item) => (
      item.id === task.id
        ? { ...item, obstacleNote: note, obstacleNoteUpdatedAt: new Date().toISOString() }
        : item
    )))
    recordActivity(task, note ? 'Catatan kendala diperbarui' : 'Catatan kendala dihapus')
  }

  function undoCompletion(task) {
    setTasks((currentTasks) => currentTasks.map((item) => (
      item.id === task.id ? { ...item, completed: false, evidence: '' } : item
    )))
    recordActivity(task, 'Penyelesaian dibatalkan')
  }

  function enterAccount(account) {
    if (account.accessRole === 'Supervisor') {
      setCurrentUser({ id: account.id, name: account.name, role: 'Supervisor', accessRole: 'Supervisor' })
      setPage('dashboard')
    } else {
      const employee = staff.find((person) => person.id === account.staffId)
      if (!employee) {
        setLoginError('Profil pegawai untuk akun ini tidak ditemukan.')
        return
      }
      setChecklistStaffId(employee.id)
      setCurrentUser({ ...employee, accessRole: 'Pegawai' })
      setPage('checklist')
    }

    setLoginPassword('')
    setLoginPasswordConfirm('')
    setLoginError('')
    setAuthNotice('')
  }

  async function submitAuthentication(event) {
    event.preventDefault()
    setLoginError('')
    setAuthNotice('')

    const email = loginEmail.trim().toLocaleLowerCase()
    const name = loginName.trim()
    if (!email || (authMode === 'register' && !name)) {
      setLoginError(authMode === 'register' ? 'Email dan nama lengkap wajib diisi.' : 'Email wajib diisi.')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setLoginError('Masukkan alamat email yang valid.')
      return
    }
    if (!loginPassword) {
      setLoginError('Password wajib diisi.')
      return
    }

    if (authMode === 'register') {
      if (accounts.some((account) => (account.email ?? account.username)?.toLocaleLowerCase() === email)) {
        setLoginError('Email sudah terdaftar.')
        return
      }
      if (loginPassword.length < 4) {
        setLoginError('Password minimal 4 karakter.')
        return
      }
      if (loginPassword !== loginPasswordConfirm) {
        setLoginError('Konfirmasi password tidak sama.')
        return
      }

      const unitName = loginUnit.trim()
      if (!unitName) {
        setLoginError('Unit kerja wajib diisi.')
        return
      }

      setAuthBusy(true)
      try {
        const { salt, passwordHash } = await hashPassword(loginPassword)
        const existingStaff = staff.find((person) =>
          person.name.toLocaleLowerCase() === name.toLocaleLowerCase()
          && person.role === loginStaffRole
          && person.unitName.toLocaleLowerCase() === unitName.toLocaleLowerCase(),
        )
        const employee = existingStaff ?? {
          id: `staff-${window.crypto.randomUUID()}`,
          name,
          role: loginStaffRole,
          unitName,
        }
        const account = {
          id: `account-${window.crypto.randomUUID()}`,
          email,
          name,
          accessRole: 'Pegawai',
          staffId: employee.id,
          passwordSalt: salt,
          passwordHash,
        }

        if (!existingStaff) {
          setStaff((currentStaff) => [...currentStaff, employee])
          setTasks((currentTasks) => [...currentTasks, ...createTasksForStaff(employee)])
        }
        setAccounts((currentAccounts) => [...currentAccounts, account])
        setAuthMode('login')
        setLoginPassword('')
        setLoginPasswordConfirm('')
        setLoginError('')
        setAuthNotice('Akun berhasil dibuat. Silakan masuk dengan email dan password Anda.')
      } catch (error) {
        console.error('Pembuatan akun lokal gagal.', error)
        setLoginError('Akun tidak dapat dibuat karena fitur keamanan browser tidak tersedia.')
      } finally {
        setAuthBusy(false)
      }
      return
    }

    const account = accounts.find((item) =>
      (item.email ?? item.username)?.toLocaleLowerCase() === email
    )
    if (!account) {
      setLoginError('Akun tidak ditemukan. Periksa email atau daftar terlebih dahulu.')
      return
    }

    setAuthBusy(true)
    try {
      if (await verifyPassword(loginPassword, account)) {
        enterAccount(account)
      } else {
        setLoginError('Password salah.')
      }
    } catch (error) {
      console.error('Verifikasi akun lokal gagal.', error)
      setLoginError('Login gagal karena fitur keamanan browser tidak tersedia.')
    } finally {
      setAuthBusy(false)
    }
  }

  function logout() {
    setCurrentUser(null)
    setPage('dashboard')
    setNotificationOpen(false)
  }

  const navItems = currentUser?.accessRole === 'Supervisor'
    ? [
      { id: 'dashboard', label: 'Dashboard', icon: 'grid' },
      { id: 'activity', label: 'Riwayat aktivitas', icon: 'history' },
    ]
    : [{ id: 'checklist', label: 'Checklist harian', icon: 'checklist' }]

  if (!currentUser) {
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
          <div className="login-heading"><span className="eyebrow"><span className="live-indicator" /> INTERNAL COMPLIANCE</span><h1>{authMode === 'login' ? 'Selamat datang' : 'Buat akun baru'}</h1><p>{authMode === 'login' ? 'Masuk untuk melanjutkan aktivitas operasional harian.' : 'Daftarkan akun untuk mengakses checklist operasional.'}</p></div>
          <form className="login-form" onSubmit={submitAuthentication}>
            {authMode === 'register' && <label>Nama lengkap<input autoComplete="name" value={loginName} onChange={(event) => setLoginName(event.target.value)} placeholder="Masukkan nama lengkap" /></label>}
            <label>Email<input type="email" autoComplete="email" required value={loginEmail} onChange={(event) => setLoginEmail(event.target.value)} placeholder="nama@contoh.com" /></label>
            {authMode === 'register' && (
              <>
                <label>Role pekerjaan<select value={loginStaffRole} onChange={(event) => setLoginStaffRole(event.target.value)}>{roles.map((role) => <option key={role}>{role}</option>)}</select></label>
                <label>Unit kerja<input value={loginUnit} onChange={(event) => setLoginUnit(event.target.value)} placeholder="Masukkan nama cabang atau unit" /></label>
              </>
            )}
            <label>Password<input type="password" autoComplete={authMode === 'login' ? 'current-password' : 'new-password'} value={loginPassword} onChange={(event) => setLoginPassword(event.target.value)} placeholder={authMode === 'login' ? 'Masukkan password' : 'Buat password (minimal 4 karakter)'} /></label>
            {authMode === 'register' && <label>Konfirmasi password<input type="password" autoComplete="new-password" value={loginPasswordConfirm} onChange={(event) => setLoginPasswordConfirm(event.target.value)} placeholder="Masukkan ulang password" /></label>}
            {loginError && <p className="login-error" role="alert">{loginError}</p>}
            {authNotice && <p className="auth-notice" role="status">{authNotice}</p>}
            <button type="submit" className="login-submit" disabled={authBusy}>{authBusy ? 'Memproses...' : authMode === 'login' ? 'Masuk' : 'Daftar'}<Icon name="chevron" size={16} /></button>
          </form>
          <div className="auth-switch">{authMode === 'login' ? 'Belum punya akun?' : 'Sudah punya akun?'} <button onClick={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setLoginError(''); setAuthNotice('') }}>{authMode === 'login' ? 'Daftar' : 'Masuk'}</button></div>
          <div className="login-notice"><Icon name="alert" size={15} /><span><strong>Prototipe lokal</strong><br />Akun pegawai dan password di-hash lalu disimpan di browser ini.</span></div>
        </section>
        <span className="login-footer">BRI <i>·</i> Internal Compliance</span>
      </main>
    )
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#" onClick={(event) => { event.preventDefault(); setPage('dashboard') }}>
          <span className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 32 32" focusable="false">
              <path fill="#00529b" d="M5 8h14v5H5zm0 8h22v5H5zm0 8h14v5H5z" />
              <path fill="#f4c542" d="M21 8h6v5h-6zm-4 16h10v5H17z" />
            </svg>
          </span>
          <span className="brand-copy">
            <strong>BRI</strong>
            <small>OPERASIONAL BANK</small>
          </span>
        </a>

        <div className="sidebar-section-label">MENU UTAMA</div>
        <nav className="main-nav" aria-label="Navigasi utama">
          {navItems.map((item) => (
            <button
              className={`nav-item ${page === item.id ? 'active' : ''}`}
              key={item.id}
              onClick={() => setPage(item.id)}
            >
              <Icon name={item.icon} size={19} />
              <span>{item.label}</span>
              {item.id === 'dashboard' && overdueTasks.length > 0 && (
                <span className="nav-count">{overdueTasks.length}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-section-label sidebar-section-spaced">UNIT KERJA</div>
        <div className="sidebar-unit-card">
          <span className="unit-icon"><Icon name="building" size={17} /></span>
          <span><strong>{currentUser.accessRole === 'Supervisor' ? (sidebarUnit ?? 'Belum ada unit') : currentUser.unitName}</strong><small>{currentUser.accessRole === 'Supervisor' ? `${unitNames.length} unit terdaftar` : currentUser.role}</small></span>
          {sidebarUnit && <span className="online-dot" title="Unit terdaftar" />}
        </div>

        <div className="sidebar-footer">
          <div className="security-note">
            <span className="security-lock">✓</span>
            <p><strong>Data staf lokal</strong><br />Tersimpan di browser ini</p>
          </div>
          <button className="profile-button" onClick={logout}>
            <span className="avatar avatar-supervisor">{currentUser.name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase()}</span>
            <span className="profile-copy"><strong>{currentUser.name}</strong><small>{currentUser.accessRole === 'Supervisor' ? 'Supervisor' : currentUser.role}</small></span>
            <Icon name="logout" size={17} />
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumb"><span>Operasional</span><Icon name="chevron" size={14} /><strong>{navItems.find((item) => item.id === page)?.label}</strong></div>
          <div className="topbar-actions">
            <div className="clock-chip"><Icon name="clock" size={16} /><strong>{clock.label}</strong><span>WIB</span></div>
            <button
              className={`icon-button notification-button ${notificationOpen ? 'selected' : ''}`}
              aria-label="Notifikasi"
              onClick={() => setNotificationOpen((open) => !open)}
            >
              <Icon name="bell" size={19} />
              {overdueTasks.length > 0 && <span className="notification-dot" />}
            </button>
            <button className="icon-button logout-button" aria-label="Keluar" onClick={logout}><Icon name="logout" size={18} /></button>
            <span className="topbar-divider" />
            <div className="topbar-user">
              <span className="avatar avatar-supervisor">{currentUser.name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase()}</span>
              <span><strong>{currentUser.name}</strong><small>{currentUser.accessRole}</small></span>
            </div>
          </div>
          {notificationOpen && (
            <div className="notification-popover">
              <div className="popover-heading"><strong>Notifikasi</strong><button className="plain-button" onClick={() => setNotificationOpen(false)} aria-label="Tutup notifikasi"><Icon name="close" size={17} /></button></div>
              {overdueTasks.length
                ? <p><span className="notification-dot inline-dot" /> Ada <strong>{overdueTasks.length} tugas</strong> yang melewati deadline pada filter saat ini.</p>
                : <p className="empty-notification">Tidak ada tugas terlambat. Semua terkendali.</p>}
              <button className="popover-link" onClick={() => { setPage('dashboard'); setNotificationOpen(false) }}>Lihat dashboard <Icon name="chevron" size={14} /></button>
            </div>
          )}
        </header>

        <div className="page-container">
          {storageError && <div className="storage-warning" role="status"><Icon name="alert" size={15} />{storageError}</div>}
          {currentUser.accessRole === 'Supervisor' && page === 'dashboard' && (
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

              <section className="dashboard-lower">
                <article className="panel attention-panel" id="attention-list">
                  <div className="panel-header">
                    <div><h2>Perlu perhatian</h2><p>Daftar tugas staf yang melewati deadline</p></div>
                    <span className="count-pill">{overdueTasks.length} terlambat</span>
                  </div>
                  <div className="filter-row">
                    <label className="search-field"><Icon name="search" size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari nama atau tugas..." /></label>
                    <label className="select-field"><Icon name="filter" size={16} /><select value={selectedRole} onChange={(event) => setSelectedRole(event.target.value)} aria-label="Filter role"><option>Semua role</option>{roles.map((role) => <option key={role}>{role}</option>)}</select></label>
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
                    {roles.map((role, index) => {
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
          )}

          {currentUser.accessRole === 'Supervisor' && page === 'activity' && (
            <>
              <section className="page-heading">
                <div>
                  <div className="eyebrow"><span className="live-indicator" /> AUDIT AKTIVITAS</div>
                  <h1>Riwayat Aktivitas</h1>
                  <p>Lihat waktu pegawai mengisi checklist dan mengunggah bukti.</p>
                </div>
                <div className="date-card">
                  <span className="date-icon"><Icon name="clock" size={17} /></span>
                  <span><small>WAKTU SEKARANG</small><strong>{clock.label} WIB</strong></span>
                </div>
              </section>

              <section className="activity-summary-grid">
                <article className="metric-card">
                  <div className="metric-topline"><span>TOTAL AKTIVITAS</span><span className="metric-icon blue"><Icon name="history" size={17} /></span></div>
                  <div className="metric-main"><strong>{visibleActivities.length}</strong><span className="metric-note">sesuai filter saat ini</span></div>
                </article>
                <article className="metric-card">
                  <div className="metric-topline"><span>PEGAWAI TERCATAT</span><span className="metric-icon green"><Icon name="checklist" size={17} /></span></div>
                  <div className="metric-main"><strong>{new Set(visibleActivities.map((activity) => activity.staffId)).size}</strong><span className="metric-note">mengisi checklist</span></div>
                </article>
                <article className="metric-card">
                  <div className="metric-topline"><span>TERAKHIR DICATAT</span><span className="metric-icon green"><Icon name="clock" size={17} /></span></div>
                  <div className="activity-last-time">{visibleActivities.length ? formatActivityTimestamp(visibleActivities[0].timestamp) : 'Belum ada aktivitas'}</div>
                </article>
              </section>

              <section className="panel activity-panel">
                <div className="panel-header">
                  <div><h2>Aktivitas pengisian checklist</h2><p>Waktu ditampilkan dalam WIB (Asia/Jakarta)</p></div>
                  <span className="count-pill activity-count">{visibleActivities.length} aktivitas</span>
                </div>
                <div className="activity-filters">
                  <label className="search-field"><Icon name="search" size={16} /><input value={activityQuery} onChange={(event) => setActivityQuery(event.target.value)} placeholder="Cari nama atau tugas..." /></label>
                  <label className="select-field"><Icon name="filter" size={16} /><select value={activityRole} onChange={(event) => setActivityRole(event.target.value)} aria-label="Filter aktivitas berdasarkan role"><option>Semua role</option>{roles.map((role) => <option key={role}>{role}</option>)}</select></label>
                  <label className="select-field unit-select"><Icon name="building" size={16} /><select value={activityUnit} onChange={(event) => setActivityUnit(event.target.value)} aria-label="Filter aktivitas berdasarkan unit"><option value="Semua unit">Semua unit</option>{unitNames.map((unitName) => <option key={unitName} value={unitName}>{unitName}</option>)}</select></label>
                </div>
                {visibleActivities.length ? (
                  <div className="activity-list">
                    {visibleActivities.map((activity) => (
                      <article className="activity-row" key={activity.id}>
                        <span className={`activity-event-icon ${activity.action === 'Penyelesaian dibatalkan' ? 'activity-event-undo' : ''} ${activity.action === 'Bukti foto diunggah' ? 'activity-event-evidence' : ''}`}><Icon name={activity.action === 'Bukti foto diunggah' ? 'camera' : activity.action === 'Penyelesaian dibatalkan' ? 'close' : 'check'} size={16} /></span>
                        <div className="activity-who"><strong>{activity.staffName}</strong><span>{activity.role} <i>·</i> {activity.unitName}</span></div>
                        <div className="activity-what"><strong>{activity.taskTitle}</strong><span>Sesi {activity.session}</span></div>
                        <span className={`activity-action ${activity.action === 'Penyelesaian dibatalkan' ? 'activity-action-undo' : ''}`}>{activity.action}</span>
                        <time className="activity-time" dateTime={activity.timestamp}>{formatActivityTimestamp(activity.timestamp)} WIB</time>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state activity-empty">
                    <span className="empty-check"><Icon name={activityQuery || activityRole !== 'Semua role' || activityUnit !== 'Semua unit' ? 'search' : 'history'} size={21} /></span>
                    <strong>{activities.length ? 'Aktivitas tidak ditemukan' : 'Belum ada aktivitas tercatat'}</strong>
                    <span>{activities.length ? 'Coba ubah pencarian atau filter.' : 'Aktivitas akan muncul saat pegawai menyelesaikan checklist atau mengunggah bukti.'}</span>
                  </div>
                )}
              </section>
              <footer className="page-footer"><span>BRI <span>·</span> Riwayat aktivitas</span><span>Waktu aktivitas menggunakan WIB (Asia/Jakarta)</span></footer>
            </>
          )}

          {currentUser.accessRole === 'Pegawai' && page === 'checklist' && (
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
                  <div className="session-deadline"><Icon name="clock" size={17} /><span>Deadline sesi <strong>{myTasks[0]?.deadline ?? '—'} WIB</strong></span></div>
                  <div className="session-progress"><strong>{myTasks.filter((task) => task.status === 'COMPLETED').length}<span>/{myTasks.length}</span></strong><small>tugas selesai</small><div className="mini-progress"><span style={{ width: `${myTasks.length ? (myTasks.filter((task) => task.status === 'COMPLETED').length / myTasks.length) * 100 : 0}%` }} /></div></div>
                </section>
              ) : (
                <section className="panel empty-checklist"><span className="empty-check"><Icon name="add" size={21} /></span><strong>Checklist belum tersedia</strong><span>Data pegawai ini tidak ditemukan. Silakan keluar dan masuk kembali.</span></section>
              )}

              {checklistStaff && <section className="panel tasks-panel">
                <div className="panel-header task-panel-header">
                  <div><h2>Tugas sesi {session.toLowerCase()}</h2><p>{myTasks.length} langkah wajib · Deadline {myTasks[0]?.deadline ?? '—'} WIB</p></div>
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
                        {task.type === 'CHECKBOX_WITH_IMAGE' && (
                          <div className="evidence-line">
                            {task.evidence && task.evidence.startsWith('data:image')
                              ? <><button type="button" className="evidence-preview-button" onClick={() => openEvidencePreview(task)}><img className="evidence-thumb" src={task.evidence} alt="" /><span>Lihat foto bukti</span></button></>
                              : task.evidence
                                ? <><span className="evidence-saved"><Icon name="check" size={13} /></span><span>{task.evidence}</span></>
                                : <><Icon name="camera" size={14} /><span>Bukti foto wajib</span></>}
                            {!task.completed && <button className="upload-button" onClick={() => openEvidenceUpload(task.id)}>Unggah foto</button>}
                            {task.completed && <button className="replace-button" onClick={() => openEvidenceUpload(task.id)}>Ganti foto</button>}
                          </div>
                        )}
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
              <input ref={fileInputRef} className="hidden-input" type="file" accept="image/*" capture="environment" onChange={handleEvidenceChange} />
              <footer className="page-footer"><span>BRI <span>·</span> Internal Compliance</span><span>Foto bukti diproses di perangkat ini dalam prototipe.</span></footer>
            </>
          )}

        </div>
        {evidencePreview && (
          <div className="evidence-modal-backdrop" role="presentation" onMouseDown={(event) => {
            if (event.target === event.currentTarget) setEvidencePreview(null)
          }}>
            <section className="evidence-modal" role="dialog" aria-modal="true" aria-labelledby="evidence-modal-title">
              <div className="evidence-modal-header"><div><h2 id="evidence-modal-title">Bukti foto</h2><p>{evidencePreview.title}</p></div><button type="button" className="plain-button" aria-label="Tutup pratinjau" onClick={() => setEvidencePreview(null)}><Icon name="close" size={19} /></button></div>
              <img src={evidencePreview.src} alt={`Bukti foto: ${evidencePreview.title}`} />
            </section>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
