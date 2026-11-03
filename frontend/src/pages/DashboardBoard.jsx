import { Fragment, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import TaskModal from '../components/TaskModal'
import ThemeToggle from '../components/ThemeToggle'
import { useToast } from '../components/Toast'

const COLUMNS = [
  { key: 'TODO', label: 'To Do', dot: 'bg-slate-400' },
  { key: 'IN_PROGRESS', label: 'In Progress', dot: 'bg-amber-400' },
  { key: 'DONE', label: 'Done', dot: 'bg-emerald-500' },
]
const ORDER = COLUMNS.map((c) => c.key)
const LABEL = Object.fromEntries(COLUMNS.map((c) => [c.key, c.label]))

const PRIORITY_STYLE = {
  LOW: 'bg-slate-100 text-slate-600',
  MEDIUM: 'bg-amber-100 text-amber-700',
  HIGH: 'bg-red-100 text-red-700',
}

const todayStr = () => new Date().toISOString().slice(0, 10)
const isOverdue = (t) => t.due_date && t.status !== 'DONE' && t.due_date.slice(0, 10) < todayStr()
const fmtDate = (d) => new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', timeZone: 'UTC' })

export default function DashboardBoard() {
  const navigate = useNavigate()
  const toast = useToast()
  const user = JSON.parse(localStorage.getItem('user') || 'null')

  const [projects, setProjects] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null) // { status } (tambah) | { task } (edit)
  const [showProjectForm, setShowProjectForm] = useState(false)
  const [projectTitle, setProjectTitle] = useState('')

  const [search, setSearch] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('ALL')

  // drag & drop: dragId = kartu yang diseret, drop = { col, index } tempat jatuh
  const [dragId, setDragId] = useState(null)
  const [drop, setDrop] = useState(null)

  useEffect(() => {
    api
      .get('/projects')
      .then(({ data }) => {
        const list = data ?? []
        setProjects(list)
        if (list.length) setActiveId(list[0].id)
      })
      .catch(() => toast.error('Gagal memuat project'))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!activeId) {
      setTasks([])
      return
    }
    api
      .get('/tasks', { params: { project_id: activeId } })
      .then(({ data }) => setTasks(data ?? []))
      .catch(() => toast.error('Gagal memuat task'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId])

  const activeProject = projects.find((p) => p.id === activeId)

  // task terurut berdasarkan position, lalu difilter
  const grouped = useMemo(() => {
    const q = search.trim().toLowerCase()
    const g = { TODO: [], IN_PROGRESS: [], DONE: [] }
    ;[...tasks]
      .sort((a, b) => a.position - b.position)
      .filter(
        (t) =>
          (priorityFilter === 'ALL' || t.priority === priorityFilter) &&
          (!q || t.title.toLowerCase().includes(q) || (t.description || '').toLowerCase().includes(q))
      )
      .forEach((t) => g[t.status]?.push(t))
    return g
  }, [tasks, search, priorityFilter])

  const stats = useMemo(() => {
    const done = tasks.filter((t) => t.status === 'DONE').length
    return {
      total: tasks.length,
      done,
      overdue: tasks.filter(isOverdue).length,
      pct: tasks.length ? Math.round((done / tasks.length) * 100) : 0,
    }
  }, [tasks])

  // ---------- Project ----------
  const createProject = async (e) => {
    e.preventDefault()
    if (!projectTitle.trim()) return
    try {
      const { data } = await api.post('/projects', { title: projectTitle })
      setProjects((p) => [data, ...p])
      setActiveId(data.id)
      setProjectTitle('')
      setShowProjectForm(false)
      toast.success('Project dibuat')
    } catch {
      toast.error('Gagal membuat project')
    }
  }

  const renameProject = async () => {
    const title = window.prompt('Nama project baru:', activeProject.title)
    if (!title || !title.trim() || title === activeProject.title) return
    try {
      const { data } = await api.patch(`/projects/${activeId}`, { title })
      setProjects((ps) => ps.map((p) => (p.id === data.id ? data : p)))
      toast.success('Nama project diubah')
    } catch {
      toast.error('Gagal mengubah nama project')
    }
  }

  const deleteProject = async () => {
    if (!window.confirm(`Hapus project "${activeProject.title}" beserta semua task-nya?`)) return
    try {
      await api.delete(`/projects/${activeId}`)
      const rest = projects.filter((p) => p.id !== activeId)
      setProjects(rest)
      setActiveId(rest[0]?.id ?? null)
      toast.success('Project dihapus')
    } catch {
      toast.error('Gagal menghapus project')
    }
  }

  // ---------- Task ----------
  // Optimistic update: UI berubah dulu, rollback kalau request gagal
  const applyMove = async (task, status, position) => {
    const snapshot = tasks
    setTasks((ts) => ts.map((t) => (t.id === task.id ? { ...t, status, position } : t)))
    try {
      await api.patch(`/tasks/${task.id}`, { status, position })
      if (status !== task.status) toast.success(`Dipindah ke ${LABEL[status]}`)
    } catch {
      setTasks(snapshot)
      toast.error('Gagal memindahkan task')
    }
  }

  const endPosition = (status) =>
    Math.max(0, ...tasks.filter((t) => t.status === status).map((t) => t.position)) + 1

  const moveByArrow = (task, dir) => {
    const next = ORDER[ORDER.indexOf(task.status) + dir]
    if (next) applyMove(task, next, endPosition(next))
  }

  const deleteTask = async (task) => {
    if (!window.confirm(`Hapus task "${task.title}"?`)) return
    const snapshot = tasks
    setTasks((ts) => ts.filter((t) => t.id !== task.id))
    try {
      await api.delete(`/tasks/${task.id}`)
      toast.success('Task dihapus')
    } catch {
      setTasks(snapshot)
      toast.error('Gagal menghapus task')
    }
  }

  const handleSaved = (saved) => {
    const isNew = !tasks.some((t) => t.id === saved.id)
    setTasks((ts) => (isNew ? [...ts, saved] : ts.map((t) => (t.id === saved.id ? saved : t))))
    toast.success(isNew ? 'Task ditambahkan' : 'Perubahan disimpan')
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login', { replace: true })
  }

  // ---------- Drag & drop + reorder ----------
  const onCardDragOver = (e, col, idx) => {
    e.preventDefault()
    e.stopPropagation()
    const rect = e.currentTarget.getBoundingClientRect()
    const after = e.clientY > rect.top + rect.height / 2
    setDrop({ col, index: after ? idx + 1 : idx })
  }

  const resetDrag = () => {
    setDragId(null)
    setDrop(null)
  }

  const onDrop = (e) => {
    e.preventDefault()
    const task = tasks.find((t) => t.id === dragId)
    if (!task || !drop) return resetDrag()

    const colList = grouped[drop.col]
    const origIdx = colList.findIndex((t) => t.id === task.id)
    let index = drop.index
    if (origIdx !== -1 && origIdx < index) index -= 1 // kartu sendiri dikeluarkan dulu

    const list = colList.filter((t) => t.id !== task.id)
    const prev = list[index - 1]?.position
    const next = list[index]?.position

    let position
    if (prev === undefined && next === undefined) position = 1
    else if (prev === undefined) position = next - 1
    else if (next === undefined) position = prev + 1
    else position = (prev + next) / 2

    if (task.status !== drop.col || position !== task.position) applyMove(task, drop.col, position)
    resetDrag()
  }

  const showLine = (col, idx) => dragId && drop?.col === col && drop.index === idx
  const Line = () => <div className="h-1 rounded-full bg-indigo-400" />

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 font-bold text-white">T</div>
            <span className="text-lg font-bold">TaskBoard</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-slate-500 sm:block">{user?.name}</span>
            <ThemeToggle />
            <button onClick={logout} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium hover:bg-slate-100">Keluar</button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-6">
        {/* Project tabs */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
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
                className="rounded-full border border-slate-300 bg-white px-4 py-1.5 text-sm outline-none focus:border-indigo-500"
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

        {loading ? (
          <p className="text-slate-500">Memuat...</p>
        ) : !activeId ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-20 text-center">
            <p className="font-semibold">Belum ada project</p>
            <p className="mt-1 text-sm text-slate-500">Klik "+ Project" untuk membuat project pertama kamu.</p>
          </div>
        ) : (
          <>
            <div className="mb-5 rounded-2xl bg-white p-4 ring-1 ring-slate-200">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h1 className="text-lg font-bold">{activeProject?.title}</h1>
                  {activeProject?.description && <p className="text-sm text-slate-500">{activeProject.description}</p>}
                </div>
                <div className="flex gap-2">
                  <button onClick={renameProject} className="rounded-lg px-3 py-1.5 text-sm text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100">✎ Ubah nama</button>
                  <button onClick={deleteProject} className="rounded-lg px-3 py-1.5 text-sm text-red-600 ring-1 ring-red-200 hover:bg-red-50">Hapus project</button>
                </div>
              </div>

              <div className="mt-4">
                <div className="mb-1 flex justify-between text-xs text-slate-500">
                  <span>{stats.done} dari {stats.total} task selesai</span>
                  <span className="font-semibold">{stats.pct}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${stats.pct}%` }} />
                </div>
                {stats.overdue > 0 && <p className="mt-2 text-xs font-medium text-red-600">⚠ {stats.overdue} task melewati tenggat</p>}
              </div>
            </div>

            <div className="mb-5 flex flex-wrap gap-3">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari task..."
                className="w-full max-w-xs rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              />
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500"
              >
                <option value="ALL">Semua prioritas</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              {COLUMNS.map((col) => (
                <section
                  key={col.key}
                  onDragOver={(e) => {
                    e.preventDefault()
                    setDrop({ col: col.key, index: grouped[col.key].length })
                  }}
                  onDrop={onDrop}
                  className={`rounded-2xl p-3 transition ${
                    dragId && drop?.col === col.key ? 'bg-indigo-100 ring-2 ring-indigo-300' : 'bg-slate-100/70'
                  }`}
                >
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
                    {grouped[col.key].map((task, idx) => {
                      const i = ORDER.indexOf(task.status)
                      const overdue = isOverdue(task)
                      return (
                        <Fragment key={task.id}>
                          {showLine(col.key, idx) && <Line />}
                          <article
                            draggable
                            onDragStart={() => setDragId(task.id)}
                            onDragEnd={resetDrag}
                            onDragOver={(e) => onCardDragOver(e, col.key, idx)}
                            onClick={() => setModal({ task })}
                            className={`group cursor-grab rounded-xl bg-white p-4 shadow-sm ring-1 transition hover:shadow-md ${
                              overdue ? 'ring-red-300' : 'ring-slate-200'
                            } ${dragId === task.id ? 'opacity-40' : ''}`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="text-sm font-semibold leading-snug">{task.title}</h3>
                              <button
                                onClick={(e) => { e.stopPropagation(); deleteTask(task) }}
                                className="text-slate-300 opacity-0 transition hover:text-red-500 group-hover:opacity-100"
                                title="Hapus"
                              >
                                ✕
                              </button>
                            </div>
                            {task.description && <p className="mt-1 line-clamp-2 text-xs text-slate-500">{task.description}</p>}

                            <div className="mt-3 flex items-center justify-between">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${PRIORITY_STYLE[task.priority]}`}>{task.priority}</span>
                                {task.due_date && (
                                  <span className={`text-[11px] ${overdue ? 'font-semibold text-red-600' : 'text-slate-400'}`}>
                                    📅 {fmtDate(task.due_date)}{overdue && ' · terlambat'}
                                  </span>
                                )}
                              </div>
                              <div className="flex gap-1">
                                <button
                                  disabled={i === 0}
                                  onClick={(e) => { e.stopPropagation(); moveByArrow(task, -1) }}
                                  className="rounded-md px-2 py-1 text-xs font-medium ring-1 ring-slate-200 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent"
                                  title="Pindah ke kiri"
                                >
                                  ←
                                </button>
                                <button
                                  disabled={i === ORDER.length - 1}
                                  onClick={(e) => { e.stopPropagation(); moveByArrow(task, 1) }}
                                  className="rounded-md bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-600 ring-1 ring-indigo-200 hover:bg-indigo-100 disabled:opacity-30 disabled:hover:bg-indigo-50"
                                  title="Pindah ke kanan"
                                >
                                  →
                                </button>
                              </div>
                            </div>
                          </article>
                        </Fragment>
                      )
                    })}
                    {showLine(col.key, grouped[col.key].length) && <Line />}

                    {grouped[col.key].length === 0 && <p className="py-6 text-center text-xs text-slate-400">Belum ada task</p>}
                  </div>
                </section>
              ))}
            </div>
          </>
        )}
      </main>

      {modal && (
        <TaskModal
          projectId={activeId}
          task={modal.task}
          defaultStatus={modal.status}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}