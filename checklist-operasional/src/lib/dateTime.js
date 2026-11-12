export function getWibTime() {
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

export function getTaskStatus(task, currentMinutes) {
  if (task.completed) return 'COMPLETED'
  const [hours, minutes] = task.deadline.split(':').map(Number)
  return currentMinutes > hours * 60 + minutes ? 'OVERDUE' : 'PENDING'
}

export function formatToday() {
  return new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date())
}

export function formatActivityTimestamp(timestamp) {
  return new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    dateStyle: 'medium',
    timeStyle: 'medium',
  }).format(new Date(timestamp))
}
