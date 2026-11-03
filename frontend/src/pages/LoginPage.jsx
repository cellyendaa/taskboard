import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'

export default function LoginPage() {
  const navigate = useNavigate()
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const isRegister = mode === 'register'
  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const payload = isRegister ? form : { email: form.email, password: form.password }
      const { data } = await api.post(`/${mode}`, payload)
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.response?.data?.error || 'Tidak bisa terhubung ke server')
    } finally {
      setLoading(false)
    }
  }

  const inputCls =
    'w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200'

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-slate-100 p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/60">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-xl font-bold text-white">
            T
          </div>
          <h1 className="text-2xl font-bold">{isRegister ? 'Buat akun baru' : 'Selamat datang kembali'}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {isRegister ? 'Mulai kelola project kamu' : 'Masuk untuk membuka board kamu'}
          </p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="mb-1 block text-sm font-medium">Nama</label>
              <input name="name" value={form.name} onChange={update} required minLength={2} className={inputCls} placeholder="Nama lengkap" />
            </div>
          )}
          <div>
            <label className="mb-1 block text-sm font-medium">Email</label>
            <input type="email" name="email" value={form.email} onChange={update} required className={inputCls} placeholder="kamu@email.com" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Password</label>
            <input type="password" name="password" value={form.password} onChange={update} required minLength={6} className={inputCls} placeholder="Minimal 6 karakter" />
          </div>

          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

          <button
            disabled={loading}
            className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
          >
            {loading ? 'Memproses...' : isRegister ? 'Daftar' : 'Masuk'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          {isRegister ? 'Sudah punya akun?' : 'Belum punya akun?'}{' '}
          <button
            type="button"
            onClick={() => { setMode(isRegister ? 'login' : 'register'); setError('') }}
            className="font-semibold text-indigo-600 hover:underline"
          >
            {isRegister ? 'Masuk' : 'Daftar'}
          </button>
        </p>
      </div>
    </div>
  )
}