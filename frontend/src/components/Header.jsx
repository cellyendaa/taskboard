import { useEffect, useRef, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import api from '../api'
import ThemeToggle from './ThemeToggle'
import { useFocus } from './FocusProvider'
import { useToast } from './Toast'

export default function Header() {
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') || 'null')
  const { lastLogged } = useFocus()
  const toast = useToast()
  const [streak, setStreak] = useState(null)
  const [pop, setPop] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const prev = useRef(null)

  // Board mengirim event ini setiap status task berubah
  useEffect(() => {
    const h = () => setRefreshKey((k) => k + 1)
    window.addEventListener('streak-refresh', h)
    return () => window.removeEventListener('streak-refresh', h)
  }, [])

  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    api
      .get('/stats/focus', { params: { tz } })
      .then(({ data }) => {
        // animasi hanya kalau streak BERTAMBAH setelah halaman terbuka
        if (prev.current !== null && data.streak > prev.current) {
          setPop(true)
          setTimeout(() => setPop(false), 700)
          toast.success(`🔥 Streak ${data.streak} hari! Pertahankan ya`)
        }
        prev.current = data.streak
        setStreak(data.streak)
      })
      .catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastLogged, refreshKey])

  const logout = () => {
    ;['token', 'user', 'focus_timer'].forEach((k) => localStorage.removeItem(k))
    navigate('/login', { replace: true })
  }

  const linkCls = ({ isActive }) =>
    `rounded-lg px-3 py-1.5 text-sm font-medium transition ${
      isActive ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-100'
    }`

  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-3">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 font-bold text-white">T</div>
            <span className="text-lg font-bold">TaskBoard</span>
          </div>
          <nav className="flex gap-1">
            <NavLink to="/" end className={linkCls}>Board</NavLink>
            <NavLink to="/stats" className={linkCls}>Statistik</NavLink>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          {streak !== null && (
            <span
              className={`rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-700 ${pop ? 'animate-pop' : ''}`}
              title="Streak harian (fokus atau task selesai)"
            >
              🔥 {streak}
            </span>
          )}
          <span className="hidden text-sm text-slate-500 sm:block">{user?.name}</span>
          <ThemeToggle />
          <button onClick={logout} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium hover:bg-slate-100">
            Keluar
          </button>
        </div>
      </div>
    </header>
  )
}