import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import { supabase, supabaseConfigured } from './supabase'

const roles = ['Teller', 'Customer Service', 'Relationship Manager', 'Satpam']

const taskTemplates = [
  {
    role: 'Satpam',
    session: 'Pagi',
    deadline: '07:15',
    title: 'Doa pagi',
    description: 'Mengikuti doa pagi sebelum memulai kegiatan operasional.',
    type: 'CHECKBOX',
  },
  {
    role: 'Satpam',
    session: 'Pagi',
    deadline: '16:00',
    title: 'Tanyakan kebutuhan transaksi nasabah',
    description: 'Menyapa nasabah dan menanyakan keperluan transaksinya selama layanan banking.',
    type: 'CHECKBOX',
  },
  {
    role: 'Satpam',
    session: 'Pagi',
    deadline: '16:00',
    title: 'Arahkan nasabah ke mesin digital',
    description: 'Mengarahkan transaksi nasabah ke mesin Digital (ATM dan CRM).',
    type: 'CHECKBOX',
  },
  {
    role: 'Satpam',
    session: 'Pagi',
    deadline: '16:00',
    title: 'Edukasi transaksi melalui BRIMO',
    description: 'Mengedukasi nasabah agar bertransaksi melalui BRIMO.',
    type: 'CHECKBOX',
  },
  {
    role: 'Teller',
    session: 'Pagi',
    deadline: '07:15',
    title: 'Doa pagi',
    description: 'Mengikuti doa pagi sebelum memulai kegiatan operasional.',
    type: 'CHECKBOX',
  },
  {
    role: 'Teller',
    session: 'Pagi',
    deadline: '07:30',
    title: 'Tambahkan kas ke SPV',
    description: 'Mengambil tambahan kas dan menyerahkannya kepada SPV.',
    type: 'CHECKBOX',
  },
  {
    role: 'Teller',
    session: 'Pagi',
    deadline: '14:30',
    title: 'Layanan transaksi tunai',
    description: 'Melayani transaksi tunai nasabah dari pukul 08.00 sampai 14.30.',
    type: 'CHECKBOX',
  },
  {
    role: 'Teller',
    session: 'Sore',
    deadline: '15:00',
    title: 'Periksa dan setorkan kas ke SPV',
    description: 'Memeriksa kas dan menyetorkannya kepada SPV dari pukul 14.30 sampai 15.00.',
    type: 'CHECKBOX',
  },
  {
    role: 'Teller',
    session: 'Sore',
    deadline: '16:00',
    title: 'Susun bukti transaksi AATR',
    description: 'Menyusun bukti transaksi AATR dan menyerahkannya kepada SPV.',
    type: 'CHECKBOX',
  },
  {
    role: 'Teller',
    session: 'Sore',
    deadline: '16:30',
    title: 'Kegiatan roleplay',
    description: 'Mengikuti kegiatan roleplay sesuai jadwal dari pukul 16.00 sampai 16.30.',
    type: 'CHECKBOX',
  },
  {
    role: 'Customer Service',
    session: 'Pagi',
    deadline: '07:15',
    title: 'Doa pagi',
    description: 'Mengikuti doa pagi sebelum memulai kegiatan operasional.',
    type: 'CHECKBOX',
  },
  {
    role: 'Customer Service',
    session: 'Pagi',
    deadline: '07:30',
    title: 'Periksa kartu dan stok kartu',
    description: 'Memeriksa kartu dan meminta tambahan stok kartu kepada SPV.',
    type: 'CHECKBOX',
  },
  {
    role: 'Customer Service',
    session: 'Pagi',
    deadline: '16:00',
    title: 'Layanan transaksi non-tunai',
    description: 'Melayani transaksi non-tunai nasabah dari pukul 08.00 sampai 16.00.',
    type: 'CHECKBOX',
  },
  {
    role: 'Customer Service',
    session: 'Sore',
    deadline: '16:30',
    title: 'Register bukti transaksi',
    description: 'Meregister bukti transaksi dan menyerahkannya kepada SPV dari pukul 16.00 sampai 16.30.',
    type: 'CHECKBOX',
  },
  {
    role: 'Customer Service',
    session: 'Sore',
    deadline: '16:30',
    title: 'Kegiatan roleplay',
    description: 'Mengikuti kegiatan roleplay sesuai jadwal dari pukul 16.00 sampai 16.30.',
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
]

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
    eye: <><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></>,
    eyeOff: <><path d="m3 3 18 18M10.6 10.6a2 2 0 0 0 2.8 2.8" /><path d="M9.9 5.2A10.7 10.7 0 0 1 12 5c6.4 0 10 7 10 7a15.8 15.8 0 0 1-3.1 3.8M6.2 6.2C3.5 8 2 12 2 12s3.6 7 10 7a10.7 10.7 0 0 0 3-.4" /></>,
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

function StatusBadge({ status }) {
  const labels = {
    COMPLETED: 'Selesai',
    PENDING: 'Belum dikerjakan',
    OVERDUE: 'Terlambat',
  }

  return <span className={`status-badge status-${status.toLowerCase()}`}>{labels[status]}</span>
}

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
          <div className="login-notice"><Icon name="alert" size={15} /><span><strong>Autentikasi Supabase</strong><br />Akun dan data checklist disimpan di Supabase. Registrasi hanya untuk pegawai.</span></div>
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
          {backendError && <div className="storage-warning" role="alert"><Icon name="alert" size={15} />{backendError}</div>}
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

          {currentUser.accessRole === 'Supervisor' && page === 'approvals' && (
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
                    {groupedActivities.map((group) => (
                      <section className="activity-role-group" key={group.role}>
                        <header className="activity-role-heading">
                          <h3>{group.role}</h3>
                          <span>{group.activities.length} aktivitas</span>
                        </header>
                        {group.activities.map((activity) => (
                          <article className="activity-row" key={activity.id}>
                            <span className={`activity-event-icon ${activity.action === 'Penyelesaian dibatalkan' ? 'activity-event-undo' : ''} ${activity.action === 'Bukti foto diunggah' ? 'activity-event-evidence' : ''}`}><Icon name={activity.action === 'Bukti foto diunggah' ? 'camera' : activity.action === 'Penyelesaian dibatalkan' ? 'close' : 'check'} size={16} /></span>
                            <div className="activity-who"><strong>{activity.staffName}</strong><span>{activity.role} <i>·</i> {activity.unitName}</span></div>
                            <div className="activity-what"><strong>{activity.taskTitle}</strong><span>Sesi {activity.session}</span></div>
                            <div className="activity-action-group">
                              <span className={`activity-action ${activity.action === 'Penyelesaian dibatalkan' ? 'activity-action-undo' : ''}`}>{activity.action}</span>
                              {activity.action === 'Bukti foto diunggah' && (
                                <button type="button" className="activity-photo-button" onClick={() => void openActivityEvidence(activity)}>
                                  Lihat foto
                                </button>
                              )}
                            </div>
                            <time className="activity-time" dateTime={activity.timestamp}>{formatActivityTimestamp(activity.timestamp)} WIB</time>
                          </article>
                        ))}
                      </section>
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
                  <div className="session-deadline"><Icon name="clock" size={17} /><span>Deadline sesi <strong>{sessionDeadline || '—'} WIB</strong></span></div>
                  <div className="session-progress"><strong>{myTasks.filter((task) => task.status === 'COMPLETED').length}<span>/{myTasks.length}</span></strong><small>tugas selesai</small><div className="mini-progress"><span style={{ width: `${myTasks.length ? (myTasks.filter((task) => task.status === 'COMPLETED').length / myTasks.length) * 100 : 0}%` }} /></div></div>
                </section>
              ) : (
                <section className="panel empty-checklist"><span className="empty-check"><Icon name="add" size={21} /></span><strong>Checklist belum tersedia</strong><span>Data pegawai ini tidak ditemukan. Silakan keluar dan masuk kembali.</span></section>
              )}

              {checklistStaff && <section className="panel tasks-panel">
                <div className="panel-header task-panel-header">
                  <div><h2>Tugas sesi {session.toLowerCase()}</h2><p>{myTasks.length} langkah wajib · Deadline {sessionDeadline || '—'} WIB</p></div>
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
                        <div className="evidence-line">
                          {task.evidence
                            ? <button type="button" className="evidence-preview-button" onClick={() => openEvidencePreview(task)}><img className="evidence-thumb" src={task.evidence} alt="" /><span>Lihat foto bukti</span></button>
                            : <><Icon name="camera" size={14} /><span>{task.type === 'CHECKBOX_WITH_IMAGE' ? 'Bukti foto wajib' : 'Foto bukti opsional'}</span></>}
                          {!task.completed && <button className="upload-button" onClick={() => openEvidenceUpload(task.id)}>{task.type === 'CHECKBOX_WITH_IMAGE' ? 'Unggah foto' : 'Tambah foto'}</button>}
                          {task.completed && <button className="replace-button" onClick={() => openEvidenceUpload(task.id)}>{task.evidence ? 'Ganti foto' : 'Tambah foto'}</button>}
                        </div>
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
              <input ref={fileInputRef} className="hidden-input" type="file" accept="image/jpeg,image/png,image/webp" capture="environment" onChange={handleEvidenceChange} />
              <footer className="page-footer"><span>BRI <span>·</span> Internal Compliance</span><span>Bukti foto tersimpan di Supabase.</span></footer>
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
