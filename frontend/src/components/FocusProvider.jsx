import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import api from '../api'
import { useToast } from './Toast'
import Confetti from './Confetti'
import { mmss } from '../format'

const FOCUS_MIN = 1.1
const BREAK_MIN = 5
const KEY = 'focus_timer'

const FocusContext = createContext(null)

function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY))
  } catch {
    return null
  }
}

export function FocusProvider({ children }) {
  const toast = useToast()
  const [timer, setTimer] = useState(load) // { mode, taskId, title, startedAt, endsAt, duration }
  const [now, setNow] = useState(Date.now())
  const [lastLogged, setLastLogged] = useState(null)
  const [celebrate, setCelebrate] = useState(false)
  const timerRef = useRef(timer) // sumber kebenaran, mencegah pencatatan ganda

  const set = useCallback((t) => {
    timerRef.current = t
    setTimer(t)
    if (t) localStorage.setItem(KEY, JSON.stringify(t))
    else localStorage.removeItem(KEY)
  }, [])

  const log = useCallback(
    async (taskId, seconds) => {
      try {
        const { data } = await api.post('/focus-sessions', { task_id: taskId, seconds })
        setLastLogged(data)
        return true
      } catch {
        toast.error('Gagal menyimpan sesi fokus')
        return false
      }
    },
    [toast]
  )

  const finish = useCallback(
    async (completed) => {
      const t = timerRef.current
      if (!t) return
      set(null) // kosongkan dulu supaya finish() tidak terpanggil dua kali

      if (t.mode === 'break') {
        if (completed) toast.info('Istirahat selesai. Siap fokus lagi?')
        return
      }

      const elapsed = completed ? t.duration : Math.min(t.duration, Math.floor((Date.now() - t.startedAt) / 1000))
      if (elapsed < 60) {
        if (!completed) toast.info('Sesi kurang dari 1 menit tidak dicatat')
        return
      }
      if (!(await log(t.taskId, elapsed))) return

      const mins = Math.round(elapsed / 60)
      if (completed) {
        toast.success(`Sesi selesai! +${mins} menit fokus 🎉`)
        setCelebrate(true)
        setTimeout(() => setCelebrate(false), 3500)
        const start = Date.now()
        set({ mode: 'break', taskId: t.taskId, title: t.title, startedAt: start, duration: BREAK_MIN * 60, endsAt: start + BREAK_MIN * 60 * 1000 })
      } else {
        toast.success(`Dicatat ${mins} menit fokus`)
      }
    },
    [log, set, toast]
  )

  // Tick: cek tiap 500ms apakah waktu sudah habis
  useEffect(() => {
    if (!timer) return
    const id = setInterval(() => {
      const t = Date.now()
      setNow(t)
      if (timerRef.current && t >= timerRef.current.endsAt) finish(true)
    }, 500)
    return () => clearInterval(id)
  }, [timer, finish])

  const start = useCallback(
    (task) => {
      if (timerRef.current?.mode === 'focus') {
        toast.info('Selesaikan atau hentikan sesi yang sedang berjalan dulu')
        return
      }
      const t = Date.now()
      set({ mode: 'focus', taskId: task.id, title: task.title, startedAt: t, duration: FOCUS_MIN * 60, endsAt: t + FOCUS_MIN * 60 * 1000 })
    },
    [set, toast]
  )

  const stop = useCallback(() => finish(false), [finish])

  const remaining = timer ? Math.max(0, Math.ceil((timer.endsAt - now) / 1000)) : 0

  // Tampilkan sisa waktu di judul tab browser
  useEffect(() => {
    document.title = timer ? `${mmss(remaining)} · ${timer.mode === 'focus' ? timer.title : 'Istirahat'}` : 'TaskBoard'
  }, [timer, remaining])

  return (
    <FocusContext.Provider value={{ timer, remaining, start, stop, lastLogged }}>
      {children}
      {celebrate && <Confetti />}
    </FocusContext.Provider>
  )
}

export const useFocus = () => useContext(FocusContext)