// 5400 detik -> "1j 30m"
export function formatDuration(seconds) {
  const totalMin = Math.floor(seconds / 60)
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  if (h > 0) return `${h}j ${m}m`
  return `${m}m`
}

export function mmss(seconds) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}