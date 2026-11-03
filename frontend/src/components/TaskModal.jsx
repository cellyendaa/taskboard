import { useState } from 'react'
import api from '../api'

export default function TaskModal({ projectId, task, defaultStatus, onClose, onSaved }) {
  const isEdit = Boolean(task)
  const [form, setForm] = useState({
    title: task?.title ?? '',
    description: task?.description ?? '',
    status: task?.status ?? defaultStatus ?? 'TODO',
    priority: task?.priority ?? 'MEDIUM',
    due_date: task?.due_date ? task.due_date.slice(0, 10) : '',
  })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      let res
      if (isEdit) {
        // due_date "" = hapus tenggat (sesuai logika UpdateTaskInput di backend)
        res = await api.patch(`/tasks/${task.id}`, form)
      } else {
        res = await api.post('/tasks', { ...form, project_id: projectId, due_date: form.due_date || null })
      }
      onSaved(res.data)
      onClose()
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal menyimpan task')
      setSaving(false)
    }
  }

  const inputCls =
    'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6 shadow-2xl"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">{isEdit ? 'Edit task' : 'Task baru'}</h2>
          <button type="button" onClick={onClose} className="text-2xl leading-none text-slate-400 hover:text-slate-600">×</button>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Judul</label>
          <input name="title" value={form.title} onChange={update} required maxLength={200} autoFocus className={inputCls} placeholder="Apa yang perlu dikerjakan?" />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Deskripsi</label>
          <textarea name="description" value={form.description} onChange={update} rows={3} className={inputCls} placeholder="Opsional" />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium">Status</label>
            <select name="status" value={form.status} onChange={update} className={inputCls}>
              <option value="TODO">To Do</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="DONE">Done</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Prioritas</label>
            <select name="priority" value={form.priority} onChange={update} className={inputCls}>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Tenggat</label>
            <input type="date" name="due_date" value={form.due_date} onChange={update} className={inputCls} />
          </div>
        </div>

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">Batal</button>
          <button disabled={saving} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">
            {saving ? 'Menyimpan...' : isEdit ? 'Simpan perubahan' : 'Simpan'}
          </button>
        </div>
      </form>
    </div>
  )
}