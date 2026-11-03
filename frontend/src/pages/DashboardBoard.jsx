import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import TaskModal from '../components/TaskModal'

const COLUMNS = [
  { key: 'TODO', label: 'To Do', dot: 'bg-slate-400' },
  { key: 'IN_PROGRESS', label: 'In Progress', dot: 'bg-amber-400' },
  { key: 'DONE', label: 'Done', dot: 'bg-emerald-500' },
]
const ORDER = COLUMNS.map((c) => c.key)

const PRIORITY_STYLE = {
  LOW: 'bg-slate-100 text-slate-600',
  MEDIUM: 'bg-amber-100 text-amber-700',
  HIGH: 'bg-red-100 text-red-700',
}

export default function DashboardBoard() {
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') || 'null')

  const [projects, setProjects] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modal, setModal] = useState(null) // null | { status }
  const [showProjectForm, setShowProjectForm] = useState(false)
  const [projectTitle, setProjectTitle] = useState('')

  // Load projects sekali saat halaman dibuka
  useEffect(() => {
    api
      .get('/projects')
      .then(({ data }) => {
        const list = data ?? [] // backend bisa mengembalikan null kalau kosong
        setProjects(list)
        if (list.length) setActiveId(list[0].id)
      })
      .catch(() => setError('Gagal memuat project'))
      .finally(() => setLoading(false))
  }, [])

  // Load task setiap project aktif berganti
  useEffect(() => {
    if (!activeId) {
      setTasks([])
      return
    }
    api
      .get('/tasks', { params: { project_id: activeId } })
      .then(({ data }) => setTasks(data ?? []))
      .catch(() => setError('Gagal memuat task'))
  }, [activeId])

  const grouped = useMemo(() => {
    const g = { TODO: [], IN_PROGRESS: [], DONE: [] }
    tasks.forEach((t) => g[t.status]?.push(t))
    return g
  }, [tasks])

  const createProject = async (e) => {
    e.preventDefault()
    if (!projectTitle.trim()) return
    try {
      const { data } = await api.post('/projects', { title: projectTitle })
      setProjects((p) => [data, ...p])
      setActiveId(data.id)
      setProjectTitle('')
      setShowProjectForm(false)
    } catch {
      setError('Gagal membuat project')
    }
  }

  // Optimistic update: UI berubah dulu, rollback kalau request gagal
  const moveTask = async (task, dir) => {
    const next = ORDER[ORDER.indexOf(task.status) + dir]
    if (!next) return
    const snapshot = tasks
    setTasks((ts) => ts.map((t) => (t.id === task.id ? { ...t, status: next } : t)))
    try {
      await api.patch(`/tasks/${task.id}`, { status: next })
    } catch {
      setTasks(snapshot)
      setError('Gagal memindahkan task')
    }
  }

  const deleteTask = async (task) => {
    if (!window.confirm(`Hapus task "${task.title}"?`)) return
    const snapshot = tasks
    setTasks((ts) => ts.filter((t) => t.id !== task.id))
    try {
      await api.delete(`/tasks/${task.id}`)
    } catch {
      setTasks(snapshot)
      setError('Gagal menghapus task')
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login', { replace: true })
  }

  const fmtDate = (d) => new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', timeZone: 'UTC' })

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 font-bold text-white">T</div>
            <span className="text-lg font-bold">TaskBoard</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-slate-500 sm:block">{user?.name}</span>
            <button onClick={logout} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium hover:bg-slate-100">
              Keluar
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-6">
        {error && (
          <div className="mb-4 flex items-center justify-between rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">
            {error}
            <button onClick={() => setError('')} className="text-lg leading-none">×</button>
          </div>
        )}

        {/* Project tabs */}
        <div className="mb-6 flex flex-wrap items-center gap-2">
          {projects.map((p) => (
            <button
              key={p.id}
              onClick={() => setActiveId(p.id)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                p.id === activeId ? 'bg-indigo-600 text-white shadow' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100'
              }`}
            >
              {p.title}
            </button>
          ))}

          {showProjectForm ? (
            <form onSubmit={createProject} className="flex gap-2">
              <input
                autoFocus
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
                placeholder="Nama project"
                className="rounded-full border border-slate-300 px-4 py-1.5 text-sm outline-none focus:border-indigo-500"
              />
              <button className="rounded-full bg-indigo-600 px-4 py-1.5 text-sm font-semibold text-white">Simpan</button>
              <button type="button" onClick={() => setShowProjectForm(false)} className="px-2 text-sm text-slate-500">Batal</button>
            </form>
          ) : (
            <button
              onClick={() => setShowProjectForm(true)}
              className="rounded-full border border-dashed border-slate-300 px-4 py-1.5 text-sm font-medium text-slate-500 hover:border-indigo-400 hover:text-indigo-600"
            >
              + Project
            </button>
          )}
        </div>

        {/* Board */}
        {loading ? (
          <p className="text-slate-500">Memuat...</p>
        ) : !activeId ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-20 text-center">
            <p className="font-semibold">Belum ada project</p>
            <p className="mt-1 text-sm text-slate-500">Klik "+ Project" untuk membuat project pertama kamu.</p>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-3">
            {COLUMNS.map((col) => (
              <section key={col.key} className="rounded-2xl bg-slate-100/70 p-3">
                <div className="mb-3 flex items-center justify-between px-2">
                  <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${col.dot}`} />
                    <h2 className="text-sm font-semibold">{col.label}</h2>
                    <span className="rounded-full bg-white px-2 py-0.5 text-xs text-slate-500">{grouped[col.key].length}</span>
                  </div>
                  <button
                    onClick={() => setModal({ status: col.key })}
                    className="rounded-md px-2 text-lg leading-none text-slate-400 hover:bg-white hover:text-indigo-600"
                    title="Tambah task"
                  >
                    +
                  </button>
                </div>

                <div className="space-y-3">
                  {grouped[col.key].map((task) => {
                    const idx = ORDER.indexOf(task.status)
                    return (
                      <article key={task.id} className="group rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 transition hover:shadow-md">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-sm font-semibold leading-snug">{task.title}</h3>
                          <button
                            onClick={() => deleteTask(task)}
                            className="text-slate-300 opacity-0 transition hover:text-red-500 group-hover:opacity-100"
                            title="Hapus"
                          >
                            ✕
                          </button>
                        </div>
                        {task.description && <p className="mt-1 line-clamp-2 text-xs text-slate-500">{task.description}</p>}

                        <div className="mt-3 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${PRIORITY_STYLE[task.priority]}`}>
                              {task.priority}
                            </span>
                            {task.due_date && <span className="text-[11px] text-slate-400">📅 {fmtDate(task.due_date)}</span>}
                          </div>

                          {/* Quick actions */}
                          <div className="flex gap-1">
                            <button
                              disabled={idx === 0}
                              onClick={() => moveTask(task, -1)}
                              className="rounded-md px-2 py-1 text-xs font-medium ring-1 ring-slate-200 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent"
                              title="Pindah ke kiri"
                            >
                              ←
                            </button>
                            <button
                              disabled={idx === ORDER.length - 1}
                              onClick={() => moveTask(task, 1)}
                              className="rounded-md bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-600 ring-1 ring-indigo-200 hover:bg-indigo-100 disabled:opacity-30 disabled:hover:bg-indigo-50"
                              title="Pindah ke kanan"
                            >
                              →
                            </button>
                          </div>
                        </div>
                      </article>
                    )
                  })}

                  {grouped[col.key].length === 0 && (
                    <p className="py-6 text-center text-xs text-slate-400">Belum ada task</p>
                  )}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>

      {modal && (
        <TaskModal
          projectId={activeId}
          defaultStatus={modal.status}
          onClose={() => setModal(null)}
          onCreated={(task) => setTasks((ts) => [...ts, task])}
        />
      )}
    </div>
  )
}