import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import { supabase, supabaseConfigured } from './supabase'
import { Icon } from './components/ui.jsx'
import Sidebar from './components/layout/Sidebar.jsx'
import Topbar from './components/layout/Topbar.jsx'
import LoginScreen from './components/auth/LoginScreen.jsx'
import PendingApprovalScreen from './components/auth/PendingApprovalScreen.jsx'
import EvidencePreviewModal from './components/modals/EvidencePreviewModal.jsx'
import CameraModal from './components/modals/CameraModal.jsx'
import LogoutConfirmationModal from './components/modals/LogoutConfirmationModal.jsx'
import ProfileEditModal from './components/modals/ProfileEditModal.jsx'
import { roles } from './data/roles.js'
import { taskTemplates } from './data/taskTemplates.js'
import { getTaskStatus, getWibTime } from './lib/dateTime.js'

const DashboardPage = lazy(() => import('./pages/DashboardPage.jsx'))
const ApprovalsPage = lazy(() => import('./pages/ApprovalsPage.jsx'))
const ActivityPage = lazy(() => import('./pages/ActivityPage.jsx'))
const ChecklistPage = lazy(() => import('./pages/ChecklistPage.jsx'))
const EmployeesPage = lazy(() => import('./pages/EmployeesPage.jsx'))



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

function getProfileSetupError(error) {
  const message = error?.message ?? String(error)
  if (/bucket not found/i.test(message)) {
    return new Error('Bucket foto profil belum dibuat. Jalankan supabase/profile_features.sql di SQL Editor Supabase, lalu coba lagi.')
  }
  if (error?.code === 'PGRST202' || /update_own_profile_name.*schema cache|schema cache.*update_own_profile_name/i.test(message)) {
    return new Error('Fitur ubah nama belum terpasang di Supabase. Jalankan supabase/profile_features.sql di SQL Editor, tunggu sebentar, lalu muat ulang aplikasi.')
  }
  return error instanceof Error ? error : new Error(message)
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
  const [profileEditOpen, setProfileEditOpen] = useState(false)
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
  const [activityRefreshBusy, setActivityRefreshBusy] = useState(false)
  const [activityRefreshError, setActivityRefreshError] = useState('')
  const [openNoteIds, setOpenNoteIds] = useState({})
  const [noteDrafts, setNoteDrafts] = useState({})
  const [query, setQuery] = useState('')
  const [activityQuery, setActivityQuery] = useState('')
  const [activityRole, setActivityRole] = useState('Semua role')
  const [activityUnit, setActivityUnit] = useState('Semua unit')
  const [authNotice, setAuthNotice] = useState('')
  const [cameraOpen, setCameraOpen] = useState(false)
  const [cameraLoading, setCameraLoading] = useState(false)
  const [cameraReady, setCameraReady] = useState(false)
  const [cameraError, setCameraError] = useState('')
  const fileInputRef = useRef(null)
  const cameraVideoRef = useRef(null)
  const cameraStreamRef = useRef(null)
  const cameraRequestIdRef = useRef(0)
  const uploadTaskRef = useRef(null)
  const activityRefreshInFlightRef = useRef(false)
  const sessionLoadId = useRef(0)
  const registrationInProgress = useRef(false)

  useEffect(() => {
    const timer = window.setInterval(() => setClock(getWibTime()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => () => {
    cameraRequestIdRef.current += 1
    cameraStreamRef.current?.getTracks().forEach((track) => track.stop())
  }, [])

  useEffect(() => {
    if (cameraOpen && cameraStreamRef.current && cameraVideoRef.current) {
      cameraVideoRef.current.srcObject = cameraStreamRef.current
    }
  }, [cameraOpen, cameraLoading])

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
        const avatarPath = session.user.user_metadata?.avatar_path ?? ''
        let avatarUrl = ''
        if (avatarPath) {
          const { data: avatarData, error: avatarError } = await supabase.storage
            .from('avatars')
            .createSignedUrl(avatarPath, 3600)
          if (avatarError) throw avatarError
          avatarUrl = avatarData.signedUrl
        }
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
          avatarUrl,
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
      if (event === 'USER_UPDATED' && session?.user) {
        setCurrentUser((user) => user && user.id === session.user.id
          ? {
            ...user,
            email: session.user.email,
            avatarPath: session.user.user_metadata?.avatar_path ?? user.avatarPath,
          }
          : user)
        return
      }
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
  const activityRoles = [...new Set([...roles, ...visibleActivities.map((activity) => activity.role)])]
    .filter(Boolean)
  const groupedActivities = activityRoles
    .map((role) => ({
      role,
      activities: visibleActivities.filter((activity) => activity.role === role),
    }))
    .filter((group) => group.activities.length > 0)

  const refreshSupervisorActivities = useCallback(async () => {
    if (!supabase || activityRefreshInFlightRef.current) return
    activityRefreshInFlightRef.current = true
    setActivityRefreshBusy(true)
    try {
      const latestTimestamp = activities[0]?.timestamp
      let activitiesQuery = supabase.from('activities').select('*').order('timestamp', { ascending: false })
      if (latestTimestamp) activitiesQuery = activitiesQuery.gte('timestamp', latestTimestamp)
      const { data, error } = await activitiesQuery
      if (error) throw error

      const existingIds = new Set(activities.map((activity) => activity.id))
      const newRows = (data ?? []).filter((activity) => !existingIds.has(activity.id))
      if (!newRows.length) {
        setActivityRefreshError('')
        return
      }

      const evidencePathById = new Map(newRows.map((activity) => [
        activity.id,
        activity.evidence_path || tasks.find((task) => task.id === activity.task_id)?.evidencePath || '',
      ]))
      const evidencePaths = [...new Set([...evidencePathById.values()].filter(Boolean))]
      const signedEvidence = await Promise.all(evidencePaths.map(async (path) => {
        const { data: signedData, error: signedUrlError } = await supabase.storage
          .from('evidence')
          .createSignedUrl(path, 3600)
        if (signedUrlError) throw signedUrlError
        return [path, signedData.signedUrl]
      }))
      const evidenceUrlByPath = new Map(signedEvidence)
      const newActivities = newRows.map((activity) => {
        const evidencePath = evidencePathById.get(activity.id)
        return {
          id: activity.id,
          staffId: activity.staff_id,
          staffName: activity.staff_name,
          role: activity.role,
          unitName: activity.unit_name,
          taskId: activity.task_id,
          taskTitle: activity.task_title,
          session: activity.session,
          action: activity.action,
          evidencePath,
          evidence: evidenceUrlByPath.get(evidencePath) || '',
          timestamp: activity.timestamp,
        }
      })
      setActivities((currentActivities) => {
        const currentIds = new Set(currentActivities.map((activity) => activity.id))
        return [...newActivities.filter((activity) => !currentIds.has(activity.id)), ...currentActivities]
          .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
      })
      setActivityRefreshError('')
    } catch (error) {
      console.error('Aktivitas terbaru gagal dimuat.', error)
      setActivityRefreshError(`Aktivitas terbaru gagal dimuat: ${error.message}`)
    } finally {
      activityRefreshInFlightRef.current = false
      setActivityRefreshBusy(false)
    }
  }, [activities, tasks])

  useEffect(() => {
    if (currentUser?.accessRole !== 'Supervisor') return undefined
    const timer = window.setInterval(() => void refreshSupervisorActivities(), 30000)
    return () => window.clearInterval(timer)
  }, [currentUser?.accessRole, refreshSupervisorActivities])

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

  function stopCameraStream() {
    cameraStreamRef.current?.getTracks().forEach((track) => track.stop())
    cameraStreamRef.current = null
    if (cameraVideoRef.current) cameraVideoRef.current.srcObject = null
    setCameraReady(false)
  }

  function closeCamera() {
    cameraRequestIdRef.current += 1
    stopCameraStream()
    setCameraOpen(false)
    setCameraLoading(false)
  }

  function openEvidenceUpload(taskId) {
    setEvidenceError('')
    uploadTaskRef.current = taskId
    setCameraError('')
    setCameraReady(false)
    setCameraOpen(true)
    setCameraLoading(true)
    const requestId = ++cameraRequestIdRef.current

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraLoading(false)
      setCameraError('Kamera tidak tersedia. Buka aplikasi melalui HTTPS atau localhost, lalu pilih foto dari perangkat.')
      return
    }

    navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: 'environment' } },
      audio: false,
    }).then((stream) => {
      if (requestId !== cameraRequestIdRef.current) {
        stream.getTracks().forEach((track) => track.stop())
        return
      }
      cameraStreamRef.current = stream
      setCameraLoading(false)
    }).catch((error) => {
      if (requestId !== cameraRequestIdRef.current) return
      setCameraLoading(false)
      if (!window.isSecureContext) {
        setCameraError('Kamera memerlukan koneksi HTTPS atau localhost. Anda tetap bisa memilih foto dari perangkat.')
      } else if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        setCameraError('Izin kamera ditolak. Izinkan akses kamera di pengaturan browser, atau pilih foto dari perangkat.')
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        setCameraError('Kamera tidak ditemukan. Periksa kamera perangkat, atau pilih foto dari perangkat.')
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        setCameraError('Kamera sedang digunakan aplikasi lain. Tutup aplikasi tersebut, atau pilih foto dari perangkat.')
      } else {
        setCameraError(`Kamera tidak dapat dibuka: ${error.message}`)
      }
    })
  }

  function openEvidenceFilePicker() {
    fileInputRef.current?.click()
  }

  function captureEvidencePhoto() {
    const video = cameraVideoRef.current
    if (!video?.videoWidth || !video.videoHeight) {
      setCameraError('Kamera belum siap. Tunggu sebentar lalu coba lagi.')
      return
    }
    const canvas = document.createElement('canvas')
    const scale = Math.min(1, 1600 / Math.max(video.videoWidth, video.videoHeight))
    canvas.width = Math.round(video.videoWidth * scale)
    canvas.height = Math.round(video.videoHeight * scale)
    const context = canvas.getContext('2d')
    if (!context) {
      setCameraError('Foto gagal diproses. Silakan coba lagi.')
      return
    }
    context.drawImage(video, 0, 0, canvas.width, canvas.height)
    canvas.toBlob((blob) => {
      if (!blob) {
        setCameraError('Foto gagal diproses. Silakan coba lagi.')
        return
      }
      closeCamera()
      handleEvidenceFile(new File([blob], `bukti-${Date.now()}.jpg`, { type: 'image/jpeg' }))
    }, 'image/jpeg', 0.82)
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
    event.target.value = ''
    if (!file) return
    if (cameraOpen) closeCamera()
    handleEvidenceFile(file)
  }

  function handleEvidenceFile(file) {
    const taskId = uploadTaskRef.current
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

  async function saveProfileName(value) {
    const name = value.trim()
    if (!supabase) {
      throw new Error('Konfigurasi Supabase belum tersedia.')
    }
    if (name.length < 2 || name.length > 100) {
      throw new Error('Nama harus berisi 2 sampai 100 karakter.')
    }

    const { data, error } = await supabase.rpc('update_own_profile_name', {
      p_full_name: name,
    })
    if (error) throw getProfileSetupError(error)
    if (typeof data !== 'string') throw new Error('Nama profil tidak dikembalikan oleh server.')

    setCurrentUser((user) => user ? { ...user, name: data } : user)
    setStaff((current) => current.map((person) => person.id === checklistStaffId ? { ...person, name: data } : person))
    setTasks((current) => current.map((task) => task.staffId === checklistStaffId ? { ...task, staffName: data } : task))
    return data
  }

  async function saveProfileEmail(value) {
    const email = value.trim().toLowerCase()
    if (!supabase) throw new Error('Konfigurasi Supabase belum tersedia.')
    if (!email || email === currentUser.email?.toLowerCase()) {
      throw new Error('Masukkan alamat email baru yang berbeda.')
    }

    const { error } = await supabase.auth.updateUser({ email })
    if (error) throw error
  }

  async function saveProfilePassword(value) {
    if (!supabase) throw new Error('Konfigurasi Supabase belum tersedia.')
    if (value.length < 8) throw new Error('Password baru minimal 8 karakter.')

    const { error } = await supabase.auth.updateUser({ password: value })
    if (error) throw error
  }

  async function uploadProfilePhoto(file) {
    if (!supabase) throw new Error('Konfigurasi Supabase belum tersedia.')
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      throw new Error('Pilih foto berformat JPG, PNG, atau WebP.')
    }
    if (file.size > 2 * 1024 * 1024) throw new Error('Ukuran foto maksimal 2 MB.')

    const avatarPath = `${currentUser.id}/profile`
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(avatarPath, file, { contentType: file.type, cacheControl: '0', upsert: true })
    if (uploadError) throw getProfileSetupError(uploadError)

    const { data, error: signedUrlError } = await supabase.storage
      .from('avatars')
      .createSignedUrl(avatarPath, 3600)
    if (signedUrlError) throw signedUrlError

    const { error: metadataError } = await supabase.auth.updateUser({
      data: { avatar_path: avatarPath },
    })
    if (metadataError) throw metadataError

    setCurrentUser((user) => user ? { ...user, avatarUrl: data.signedUrl } : user)
    return data.signedUrl
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
      { id: 'employees', label: 'Daftar pegawai', icon: 'profile' },
      { id: 'approvals', label: 'Persetujuan pegawai', icon: 'checklist' },
      { id: 'activity', label: 'Riwayat aktivitas', icon: 'history' },
    ]
    : [{ id: 'checklist', label: 'Checklist harian', icon: 'checklist' }]

  const dashboardPageProps = {
    overdueTasks, filteredOverdueTasks, selectedRole, setSelectedRole, selectedUnit,
    setSelectedUnit, unitNames, query, setQuery, dashboardTasks, completedCount,
    compliance, tasksWithNotes, staff, setPage, activities, openActivityEvidence,
    refreshSupervisorActivities, activityRefreshBusy, activityRefreshError,
  }
  const approvalsPageProps = { pendingApprovals, approvalBusyId, approveRegistration }
  const activityPageProps = {
    clock, visibleActivities, activities, activityQuery, setActivityQuery, activityRole,
    setActivityRole, activityUnit, setActivityUnit, unitNames, groupedActivities,
    openActivityEvidence,
  }
  const employeesPageProps = { staff }
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
      <LoginScreen
        authMode={authMode}
        setAuthMode={setAuthMode}
        loginName={loginName}
        setLoginName={setLoginName}
        loginEmail={loginEmail}
        setLoginEmail={setLoginEmail}
        loginPassword={loginPassword}
        setLoginPassword={setLoginPassword}
        loginPasswordConfirm={loginPasswordConfirm}
        setLoginPasswordConfirm={setLoginPasswordConfirm}
        showLoginPassword={showLoginPassword}
        setShowLoginPassword={setShowLoginPassword}
        showConfirmPassword={showConfirmPassword}
        setShowConfirmPassword={setShowConfirmPassword}
        loginStaffRole={loginStaffRole}
        setLoginStaffRole={setLoginStaffRole}
        roles={roles}
        loginError={loginError}
        authNotice={authNotice}
        backendError={backendError}
        authBusy={authBusy}
        supabaseConfigured={supabaseConfigured}
        onSubmit={submitAuthentication}
        onClearMessages={() => { setLoginError(''); setAuthNotice('') }}
      />
    )
  }

  if (currentUser.approvalStatus === 'pending') {
    return <PendingApprovalScreen name={currentUser.name} onLogout={confirmLogout} />
  }

  return (
    <div className="app-shell">
      <Sidebar
        currentUser={currentUser}
        navItems={navItems}
        page={page}
        setPage={setPage}
        pendingApprovalsCount={pendingApprovals.length}
        overdueCount={overdueTasks.length}
        unitNames={unitNames}
        sidebarUnit={sidebarUnit}
        onLogout={() => setLogoutConfirmOpen(true)}
      />

      <main className="main-content">
        <Topbar
          pageLabel={navItems.find((item) => item.id === page)?.label}
          currentUser={currentUser}
          clock={clock}
          notificationOpen={notificationOpen}
          setNotificationOpen={setNotificationOpen}
          overdueCount={overdueTasks.length}
          onEditProfile={() => setProfileEditOpen(true)}
          onLogout={() => setLogoutConfirmOpen(true)}
          onOpenDashboard={() => { setPage('dashboard'); setNotificationOpen(false) }}
        />

        <div className="page-container">
          <Suspense fallback={<div className="grid min-h-48 place-items-center text-sm text-bri-blue" role="status"><span className="flex items-center gap-2"><span className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent" />Memuat halaman...</span></div>}>
            {backendError && <div className="storage-warning" role="alert"><Icon name="alert" size={15} />{backendError}</div>}
            {currentUser.accessRole === 'Supervisor' && page === 'dashboard' && (
              <DashboardPage {...dashboardPageProps} />
            )}
            {currentUser.accessRole === 'Supervisor' && page === 'approvals' && (
              <ApprovalsPage {...approvalsPageProps} />
            )}
            {currentUser.accessRole === 'Supervisor' && page === 'employees' && (
              <EmployeesPage {...employeesPageProps} />
            )}
            {currentUser.accessRole === 'Supervisor' && page === 'activity' && (
              <ActivityPage {...activityPageProps} />
            )}
            {currentUser.accessRole === 'Pegawai' && page === 'checklist' && (
              <ChecklistPage {...checklistPageProps} />
            )}
          </Suspense>
        </div>
        <EvidencePreviewModal evidencePreview={evidencePreview} onClose={() => setEvidencePreview(null)} />
        {cameraOpen && (
          <CameraModal
            videoRef={cameraVideoRef}
            loading={cameraLoading}
            ready={cameraReady}
            error={cameraError}
            onReady={() => setCameraReady(true)}
            onClose={closeCamera}
            onSelectFile={openEvidenceFilePicker}
            onCapture={captureEvidencePhoto}
          />
        )}
        {logoutConfirmOpen && (
          <LogoutConfirmationModal onCancel={() => setLogoutConfirmOpen(false)} onConfirm={confirmLogout} />
        )}
        {profileEditOpen && (
          <ProfileEditModal
            currentUser={currentUser}
            onClose={() => setProfileEditOpen(false)}
            onSaveName={saveProfileName}
            onSaveEmail={saveProfileEmail}
            onSavePassword={saveProfilePassword}
            onUploadPhoto={uploadProfilePhoto}
          />
        )}
      </main>
    </div>
  )
}

export default App
