import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import { supabase, supabaseConfigured } from './supabase'
import { Icon } from './components/ui.jsx'
import { roles } from './data/roles.js'
import { taskTemplates } from './data/taskTemplates.js'
import { getTaskStatus, getWibTime } from './lib/dateTime.js'

const DashboardPage = lazy(() => import('./pages/DashboardPage.jsx'))
const ApprovalsPage = lazy(() => import('./pages/ApprovalsPage.jsx'))
const ActivityPage = lazy(() => import('./pages/ActivityPage.jsx'))
const ChecklistPage = lazy(() => import('./pages/ChecklistPage.jsx'))



async function getProfileByUserId(userId) {
  if (!supabase || !userId) {
    return null
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, access_role, staff_id, approval_status')
    .eq('id', userId)
    .limit(2)

  if (error) throw error

  if (!data || data.length === 0) {
    return null
  }

  if (data.length > 1) {
    console.warn('Profil pengguna memiliki lebih dari satu baris. Menggunakan baris pertama.', data)
  }

  return data[0]
}

function App() {
  const [currentUser, setCurrentUser] = useState(null)
  const [page, setPage] = useState('dashboard')
  const [staff, setStaff] = useState([])
  const [tasks, setTasks] = useState([])
  const [activities, setActivities] = useState([])
  const [pendingApprovals, setPendingApprovals] = useState([])
  const [approvalBusyId, setApprovalBusyId] = useState('')
  const [backendError, setBackendError] = useState(() => (
    supabaseConfigured
      ? ''
      : 'Konfigurasi Supabase belum tersedia. Isi VITE_SUPABASE_URL dan VITE_SUPABASE_PUBLISHABLE_KEY di file .env.local.'
  ))
  const [authReady, setAuthReady] = useState(!supabaseConfigured)
  const [selectedRole, setSelectedRole] = useState('Semua role')
  const [selectedUnit, setSelectedUnit] = useState('Semua unit')
  const [checklistStaffId, setChecklistStaffId] = useState('')
  const [session, setSession] = useState('Pagi')
  const [taskFilter, setTaskFilter] = useState('Semua')
  const [clock, setClock] = useState(getWibTime)
  const [notificationOpen, setNotificationOpen] = useState(false)
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false)
  const [authMode, setAuthMode] = useState('login')
  const [loginName, setLoginName] = useState('')
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginPasswordConfirm, setLoginPasswordConfirm] = useState('')
  const [showLoginPassword, setShowLoginPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loginStaffRole, setLoginStaffRole] = useState(roles[0])
  const [loginError, setLoginError] = useState('')
  const [authBusy, setAuthBusy] = useState(false)
  const [evidenceError, setEvidenceError] = useState('')
  const [evidencePreview, setEvidencePreview] = useState(null)
  const [openNoteIds, setOpenNoteIds] = useState({})
  const [noteDrafts, setNoteDrafts] = useState({})
  const [query, setQuery] = useState('')
  const [activityQuery, setActivityQuery] = useState('')
  const [activityRole, setActivityRole] = useState('Semua role')
  const [activityUnit, setActivityUnit] = useState('Semua unit')
  const [authNotice, setAuthNotice] = useState('')
  const fileInputRef = useRef(null)
  const uploadTaskRef = useRef(null)
  const sessionLoadId = useRef(0)
  const registrationInProgress = useRef(false)

  useEffect(() => {
    const timer = window.setInterval(() => setClock(getWibTime()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!supabaseConfigured || !supabase) {
      return undefined
    }

    let active = true
    const loadSession = async (session) => {
      const requestId = ++sessionLoadId.current
      if (!session?.user) {
        setCurrentUser(null)
        setStaff([])
        setTasks([])
        setActivities([])
        setPendingApprovals([])
        setAuthReady(true)
        return
      }

      setAuthReady(false)
      setBackendError('')
      try {
        let profile = await getProfileByUserId(session.user.id)
        if (!profile) {
          throw new Error('Profil pengguna belum tersedia di Supabase. Silakan masuk kembali atau daftar ulang.')
        }

        if (profile.approval_status !== 'approved') {
          if (!active || requestId !== sessionLoadId.current) return
          setStaff([])
          setTasks([])
          setActivities([])
          setPendingApprovals([])
          setCurrentUser({
            id: session.user.id,
            email: session.user.email,
            name: profile.full_name,
            accessRole: profile.access_role,
            approvalStatus: profile.approval_status,
          })
          setAuthReady(true)
          return
        }

        if (profile.access_role === 'Pegawai' && !profile.staff_id) {
          const employeeRole = session.user.user_metadata?.job_role
          const employeeTasks = taskTemplates
            .filter((template) => template.role === employeeRole)
            .map((template, taskIndex) => ({ ...template, taskIndex }))
            .map((template) => ({
              task_index: template.taskIndex,
              session: template.session,
              deadline: template.deadline,
              title: template.title,
              description: template.description,
              task_type: template.type,
            }))
          const { error: initializeError } = await supabase.rpc('initialize_employee_profile', {
            p_tasks: employeeTasks,
          })
          if (initializeError) throw initializeError
          const refreshedProfile = await getProfileByUserId(session.user.id)
          if (!refreshedProfile) {
            throw new Error('Profil pengguna tidak bisa diinisialisasi. Cek data auth dan trigger Supabase.')
          }
          profile = refreshedProfile
        }

        const [staffResult, tasksResult, activitiesResult, approvalsResult] = await Promise.all([
          supabase.from('staff').select('*').order('name'),
          supabase.from('checklist_tasks').select('*').eq('is_active', true).order('id'),
          supabase.from('activities').select('*').order('timestamp', { ascending: false }),
          profile.access_role === 'Supervisor'
            ? supabase.rpc('list_pending_employee_approvals')
            : Promise.resolve({ data: [], error: null }),
        ])
        if (staffResult.error) throw staffResult.error
        if (tasksResult.error) throw tasksResult.error
        if (activitiesResult.error) throw activitiesResult.error
        if (approvalsResult.error) throw approvalsResult.error

        const evidencePaths = [...new Set([
          ...tasksResult.data.map((task) => task.evidence_path),
          ...activitiesResult.data.map((activity) => activity.evidence_path),
        ].filter(Boolean))]
        const signedEvidence = await Promise.all(evidencePaths.map(async (path) => {
          const { data, error: signedUrlError } = await supabase.storage
            .from('evidence')
            .createSignedUrl(path, 3600)
          if (signedUrlError) throw signedUrlError
          return [path, data.signedUrl]
        }))
        if (!active || requestId !== sessionLoadId.current) return

        const evidenceUrlByPath = new Map(signedEvidence)
        const loadedStaff = staffResult.data.map((person) => ({
          id: person.id,
          name: person.name,
          role: person.role,
          unitName: person.unit_name,
        }))
        const loadedTasks = tasksResult.data.map((task) => ({
          id: task.id,
          staffId: task.staff_id,
          staffName: task.staff_name,
          role: task.role,
          unitId: task.unit_id,
          unitName: task.unit_name,
          session: task.session,
          deadline: task.deadline,
          title: task.title,
          description: task.description,
          type: task.type,
          completed: task.completed,
          evidencePath: task.evidence_path,
          evidence: task.evidence_path ? evidenceUrlByPath.get(task.evidence_path) : '',
          obstacleNote: task.obstacle_note,
          obstacleNoteUpdatedAt: task.obstacle_note_updated_at,
        }))
        const loadedActivities = activitiesResult.data.map((activity) => ({
          id: activity.id,
          staffId: activity.staff_id,
          staffName: activity.staff_name,
          role: activity.role,
          unitName: activity.unit_name,
          taskId: activity.task_id,
          taskTitle: activity.task_title,
          session: activity.session,
          action: activity.action,
          evidencePath: activity.evidence_path || loadedTasks.find((task) => task.id === activity.task_id)?.evidencePath || '',
          evidence: evidenceUrlByPath.get(activity.evidence_path)
            || loadedTasks.find((task) => task.id === activity.task_id)?.evidence
            || '',
          timestamp: activity.timestamp,
        }))
        setStaff(loadedStaff)
        setTasks(loadedTasks)
        setActivities(loadedActivities)
        setPendingApprovals(approvalsResult.data ?? [])
        setNoteDrafts(Object.fromEntries(loadedTasks.map((task) => [task.id, task.obstacleNote ?? ''])))
        setChecklistStaffId(profile.staff_id ?? '')
        setCurrentUser({
          id: session.user.id,
          email: session.user.email,
          name: profile.full_name,
          role: loadedStaff.find((person) => person.id === profile.staff_id)?.role ?? profile.access_role,
          unitName: loadedStaff.find((person) => person.id === profile.staff_id)?.unitName ?? '',
          accessRole: profile.access_role,
        })
        setPage(profile.access_role === 'Supervisor' ? 'dashboard' : 'checklist')
      } catch (error) {
        console.error('Data Supabase gagal dimuat.', error)
        if (active && requestId === sessionLoadId.current) {
          setCurrentUser(null)
          setBackendError(`Data Supabase gagal dimuat: ${error.message}`)
        }
      } finally {
        if (active && requestId === sessionLoadId.current) setAuthReady(true)
      }
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (registrationInProgress.current && event === 'SIGNED_IN') return
      window.setTimeout(() => {
        if (active) void loadSession(session)
      }, 0)
    })
    supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        console.error('Sesi Supabase gagal diperiksa.', error)
        if (active) setBackendError(`Sesi Supabase gagal diperiksa: ${error.message}`)
      }
      if (active) void loadSession(data?.session)
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

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
  const sessionDeadline = myTasks.reduce(
    (latest, task) => task.deadline > latest ? task.deadline : latest,
    '',
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
  const groupedActivities = roles
    .map((role) => ({
      role,
      activities: visibleActivities.filter((activity) => activity.role === role),
    }))
    .filter((group) => group.activities.length > 0)

  async function recordActivity(task, action, evidencePath = '', evidence = task.evidence || '') {
    const activity = {
      id: `activity-${window.crypto.randomUUID()}`,
      staffId: task.staffId,
      staffName: task.staffName,
      role: task.role,
      unitName: task.unitName,
      taskId: task.id,
      taskTitle: task.title,
      session: task.session,
      action,
      evidencePath,
      evidence,
      timestamp: new Date().toISOString(),
    }
    const { error } = await supabase.from('activities').insert({
      id: activity.id,
      staff_id: activity.staffId,
      staff_name: activity.staffName,
      role: activity.role,
      unit_name: activity.unitName,
      task_id: activity.taskId,
      task_title: activity.taskTitle,
      session: activity.session,
      action: activity.action,
      evidence_path: activity.evidencePath,
      timestamp: activity.timestamp,
    })
    if (error) throw error
    setActivities((currentActivities) => [activity, ...currentActivities])
  }

  async function updateTask(task, changes) {
    const databaseChanges = {}
    if ('completed' in changes) databaseChanges.completed = changes.completed
    if ('evidencePath' in changes) databaseChanges.evidence_path = changes.evidencePath
    if ('obstacleNote' in changes) databaseChanges.obstacle_note = changes.obstacleNote
    if ('obstacleNoteUpdatedAt' in changes) databaseChanges.obstacle_note_updated_at = changes.obstacleNoteUpdatedAt

    let evidence = task.evidence
    if ('evidencePath' in changes) {
      evidence = ''
      if (changes.evidencePath) {
        const { data, error: signedUrlError } = await supabase.storage
          .from('evidence')
          .createSignedUrl(changes.evidencePath, 3600)
        if (signedUrlError) throw signedUrlError
        evidence = data.signedUrl
      }
    }

    const { error } = await supabase
      .from('checklist_tasks')
      .update(databaseChanges)
      .eq('id', task.id)
    if (error) throw error

    const updatedTask = { ...task, ...changes, evidence }
    setTasks((currentTasks) => currentTasks.map((item) => item.id === task.id ? updatedTask : item))
    return updatedTask
  }

  async function toggleTask(taskId) {
    const task = tasks.find((item) => item.id === taskId)
    if (!task || task.type === 'CHECKBOX_WITH_IMAGE') return

    const completed = !task.completed
    try {
      await updateTask(task, { completed })
      await recordActivity(task, completed ? 'Tugas diselesaikan' : 'Penyelesaian dibatalkan')
      setBackendError('')
    } catch (error) {
      console.error('Perubahan checklist gagal disimpan.', error)
      setBackendError(`Perubahan checklist gagal disimpan: ${error.message}`)
    }
  }

  function openEvidenceUpload(taskId) {
    setEvidenceError('')
    uploadTaskRef.current = taskId
    fileInputRef.current?.click()
  }

  function openEvidencePreview(task) {
    if (!task.evidence) return
    setEvidencePreview({ src: task.evidence, title: task.title })
  }

  async function openActivityEvidence(activity) {
    const task = tasks.find((item) => item.id === activity.taskId)
    const evidencePath = activity.evidencePath || task?.evidencePath
    if (!evidencePath) {
      setBackendError(`Foto bukti untuk aktivitas "${activity.taskTitle}" tidak ditemukan.`)
      return
    }

    try {
      const { data, error } = await supabase.storage
        .from('evidence')
        .createSignedUrl(evidencePath, 3600)
      if (error) throw error
      setEvidencePreview({ src: data.signedUrl, title: activity.taskTitle })
      setBackendError('')
    } catch (error) {
      console.error('Foto bukti aktivitas gagal dimuat.', error)
      setBackendError(`Foto bukti aktivitas gagal dimuat: ${error.message}`)
    }
  }

  function handleEvidenceChange(event) {
    const file = event.target.files?.[0]
    const taskId = uploadTaskRef.current
    event.target.value = ''
    if (!file || !taskId) return

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setEvidenceError('Pilih gambar berformat JPG, PNG, atau WebP.')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setEvidenceError('Ukuran foto maksimal 2 MB.')
      return
    }

    const task = tasks.find((item) => item.id === taskId)
    if (!task) return
    const evidencePath = `${currentUser.id}/${task.id}/${window.crypto.randomUUID()}`
    setAuthBusy(true)
    void (async () => {
      let uploaded = false
      let taskSaved = false
      try {
        const { error: uploadError } = await supabase.storage
          .from('evidence')
          .upload(evidencePath, file, { contentType: file.type, upsert: false })
        if (uploadError) throw uploadError
        uploaded = true
        const updatedTask = await updateTask(task, { completed: true, evidencePath })
        taskSaved = true
        await recordActivity(task, 'Bukti foto diunggah', updatedTask.evidencePath, updatedTask.evidence)
        setEvidenceError('')
        setBackendError('')
      } catch (error) {
        if (uploaded && !taskSaved) {
          const { error: cleanupError } = await supabase.storage.from('evidence').remove([evidencePath])
          if (cleanupError) {
            console.error('Pembersihan unggahan bukti yang gagal juga gagal.', cleanupError)
          }
        }
        console.error('Bukti foto gagal disimpan.', error)
        setEvidenceError(`Bukti foto gagal disimpan: ${error.message}`)
        setBackendError(`Bukti foto gagal disimpan: ${error.message}`)
      } finally {
        setAuthBusy(false)
      }
    })()
  }

  async function saveObstacleNote(task) {
    const note = (noteDrafts[task.id] ?? '').trim()
    const previousNote = task.obstacleNote ?? ''
    if (note === previousNote) return

    try {
      await updateTask(task, { obstacleNote: note, obstacleNoteUpdatedAt: new Date().toISOString() })
      await recordActivity(task, note ? 'Catatan kendala diperbarui' : 'Catatan kendala dihapus')
      setBackendError('')
    } catch (error) {
      console.error('Catatan kendala gagal disimpan.', error)
      setBackendError(`Catatan kendala gagal disimpan: ${error.message}`)
    }
  }

  async function undoCompletion(task) {
    try {
      await updateTask(task, { completed: false, evidencePath: '' })
      await recordActivity(task, 'Penyelesaian dibatalkan')
      if (task.evidencePath) {
        const { error } = await supabase.storage.from('evidence').remove([task.evidencePath])
        if (error) throw error
      }
      setBackendError('')
    } catch (error) {
      console.error('Pembatalan checklist gagal disimpan.', error)
      setBackendError(`Pembatalan checklist gagal disimpan: ${error.message}`)
    }
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
    if (loginPassword.length < (authMode === 'register' ? 8 : 1)) {
      setLoginError(authMode === 'register' ? 'Password minimal 8 karakter.' : 'Password wajib diisi.')
      return
    }
    if (authMode === 'register' && loginPassword !== loginPasswordConfirm) {
      setLoginError('Konfirmasi password tidak sama.')
      return
    }

    setAuthBusy(true)
    try {
      if (authMode === 'register') {
        registrationInProgress.current = true
        const { data, error } = await supabase.auth.signUp({
          email,
          password: loginPassword,
          options: {
            data: {
              full_name: name,
              job_role: loginStaffRole,
              unit_name: 'kcp iskandar',
            },
          },
        })
        if (error) throw error

        if (data.session) {
          const { error: signOutError } = await supabase.auth.signOut()
          if (signOutError) throw signOutError
        }

        setAuthMode('login')
        setLoginPassword('')
        setLoginPasswordConfirm('')
        setAuthNotice(data.session
          ? 'Pendaftaran berhasil dikirim dan sedang menunggu persetujuan supervisor. Anda baru dapat masuk setelah disetujui.'
          : 'Pendaftaran berhasil dikirim. Periksa email untuk konfirmasi, lalu tunggu persetujuan supervisor sebelum masuk.')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password: loginPassword })
        if (error) throw error
        setLoginPassword('')
      }
    } catch (error) {
      console.error('Autentikasi Supabase gagal.', error)
      setLoginError(error.message)
    } finally {
      registrationInProgress.current = false
      setAuthBusy(false)
    }
  }

  async function confirmLogout() {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Keluar dari Supabase gagal.', error)
      setBackendError(`Tidak dapat keluar: ${error.message}`)
      return
    }
    setLogoutConfirmOpen(false)
    setPage('dashboard')
    setNotificationOpen(false)
  }

  async function approveRegistration(approval) {
    setApprovalBusyId(approval.user_id)
    setBackendError('')
    try {
      const { error } = await supabase.rpc('approve_employee_registration', {
        p_user_id: approval.user_id,
      })
      if (error) throw error
      setPendingApprovals((current) => current.filter((item) => item.user_id !== approval.user_id))
    } catch (error) {
      console.error('Persetujuan pendaftaran pegawai gagal.', error)
      setBackendError(`Persetujuan pendaftaran pegawai gagal: ${error.message}`)
    } finally {
      setApprovalBusyId('')
    }
  }

  const navItems = currentUser?.accessRole === 'Supervisor'
    ? [
      { id: 'dashboard', label: 'Dashboard', icon: 'grid' },
      { id: 'approvals', label: 'Persetujuan pegawai', icon: 'checklist' },
      { id: 'activity', label: 'Riwayat aktivitas', icon: 'history' },
    ]
    : [{ id: 'checklist', label: 'Checklist harian', icon: 'checklist' }]

  const dashboardPageProps = {
    overdueTasks, filteredOverdueTasks, selectedRole, setSelectedRole, selectedUnit,
    setSelectedUnit, unitNames, query, setQuery, dashboardTasks, completedCount,
    compliance, tasksWithNotes, staff, setPage,
  }
  const approvalsPageProps = { pendingApprovals, approvalBusyId, approveRegistration }
  const activityPageProps = {
    clock, visibleActivities, activities, activityQuery, setActivityQuery, activityRole,
    setActivityRole, activityUnit, setActivityUnit, unitNames, groupedActivities,
    openActivityEvidence,
  }
  const checklistPageProps = {
    currentUser, session, setSession, sessionDeadline, clock, checklistStaff, myTasks,
    evidenceError, setEvidenceError, taskFilter, setTaskFilter, visibleMyTasks, toggleTask,
    openEvidencePreview, openEvidenceUpload, openNoteIds, setOpenNoteIds, noteDrafts,
    setNoteDrafts, saveObstacleNote, undoCompletion, fileInputRef, handleEvidenceChange,
  }

  if (!authReady) {
    return <main className="login-page"><section className="login-card"><p>Memuat sesi dan data Supabase...</p></section></main>
  }

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
          {backendError && <p className="login-error" role="alert">{backendError}</p>}
          <form className="login-form" onSubmit={submitAuthentication}>
            {authMode === 'register' && <label>Nama lengkap<input autoComplete="name" value={loginName} onChange={(event) => setLoginName(event.target.value)} placeholder="Masukkan nama lengkap" /></label>}
            <label>Email<input type="email" autoComplete="email" required value={loginEmail} onChange={(event) => setLoginEmail(event.target.value)} placeholder="nama@contoh.com" /></label>
            {authMode === 'register' && <label>Role pekerjaan<select value={loginStaffRole} onChange={(event) => setLoginStaffRole(event.target.value)}>{roles.map((role) => <option key={role}>{role}</option>)}</select></label>}
            <label>Password
              <span className="password-input">
                <input type={showLoginPassword ? 'text' : 'password'} autoComplete={authMode === 'login' ? 'current-password' : 'new-password'} value={loginPassword} onChange={(event) => setLoginPassword(event.target.value)} placeholder={authMode === 'login' ? 'Masukkan password' : 'Buat password (minimal 8 karakter)'} />
                <button type="button" className="password-toggle" aria-label={showLoginPassword ? 'Sembunyikan password' : 'Tampilkan password'} aria-pressed={showLoginPassword} onClick={() => setShowLoginPassword((visible) => !visible)}><Icon name={showLoginPassword ? 'eyeOff' : 'eye'} size={17} /></button>
              </span>
            </label>
            {authMode === 'register' && <label>Konfirmasi password
              <span className="password-input">
                <input type={showConfirmPassword ? 'text' : 'password'} autoComplete="new-password" value={loginPasswordConfirm} onChange={(event) => setLoginPasswordConfirm(event.target.value)} placeholder="Masukkan ulang password" />
                <button type="button" className="password-toggle" aria-label={showConfirmPassword ? 'Sembunyikan konfirmasi password' : 'Tampilkan konfirmasi password'} aria-pressed={showConfirmPassword} onClick={() => setShowConfirmPassword((visible) => !visible)}><Icon name={showConfirmPassword ? 'eyeOff' : 'eye'} size={17} /></button>
              </span>
            </label>}
            {loginError && <p className="login-error" role="alert">{loginError}</p>}
            {authNotice && <p className="auth-notice" role="status">{authNotice}</p>}
            <button type="submit" className="login-submit" disabled={authBusy || !supabaseConfigured}>{authBusy ? 'Memproses...' : authMode === 'login' ? 'Masuk' : 'Daftar'}<Icon name="chevron" size={16} /></button>
          </form>
          <div className="auth-switch">{authMode === 'login' ? 'Belum punya akun?' : 'Sudah punya akun?'} <button onClick={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setLoginError(''); setAuthNotice('') }}>{authMode === 'login' ? 'Daftar' : 'Masuk'}</button></div>
        </section>
        <span className="login-footer">BRI <i>·</i> Internal Compliance</span>
      </main>
    )
  }

  if (currentUser.approvalStatus === 'pending') {
    return (
      <main className="login-page">
        <section className="login-card approval-pending-card">
          <span className="approval-pending-icon"><Icon name="clock" size={23} /></span>
          <div className="login-heading">
            <span className="eyebrow">PENDAFTARAN PEGAWAI</span>
            <h1>Menunggu persetujuan</h1>
            <p>Akun {currentUser.name} belum dapat digunakan. Supervisor perlu menyetujui pendaftaran Anda terlebih dahulu.</p>
          </div>
          <button type="button" className="login-submit" onClick={confirmLogout}>Keluar dan kembali ke halaman masuk<Icon name="logout" size={16} /></button>
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
            <img src="/bri-logo.png" alt="" />
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
              {item.id === 'approvals' && pendingApprovals.length > 0 && (
                <span className="nav-count">{pendingApprovals.length}</span>
              )}
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
          <button className="profile-button" onClick={() => setLogoutConfirmOpen(true)}>
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
            <button className="icon-button logout-button" aria-label="Keluar" onClick={() => setLogoutConfirmOpen(true)}><Icon name="logout" size={18} /></button>
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
          <Suspense fallback={<div className="grid min-h-48 place-items-center text-sm text-bri-blue" role="status"><span className="flex items-center gap-2"><span className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent" />Memuat halaman...</span></div>}>
            {backendError && <div className="storage-warning" role="alert"><Icon name="alert" size={15} />{backendError}</div>}
            {currentUser.accessRole === 'Supervisor' && page === 'dashboard' && (
              <DashboardPage {...dashboardPageProps} />
            )}
            {currentUser.accessRole === 'Supervisor' && page === 'approvals' && (
              <ApprovalsPage {...approvalsPageProps} />
            )}
            {currentUser.accessRole === 'Supervisor' && page === 'activity' && (
              <ActivityPage {...activityPageProps} />
            )}
            {currentUser.accessRole === 'Pegawai' && page === 'checklist' && (
              <ChecklistPage {...checklistPageProps} />
            )}
          </Suspense>
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
        {logoutConfirmOpen && (
          <div
            className="modal-backdrop logout-modal-backdrop"
            role="presentation"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setLogoutConfirmOpen(false)
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
                <button type="button" className="secondary-button" onClick={() => setLogoutConfirmOpen(false)}>Batal</button>
                <button type="button" className="logout-confirm-button" onClick={confirmLogout}>Ya, keluar</button>
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
