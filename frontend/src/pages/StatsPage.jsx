import { useEffect, useState } from 'react'
import api from '../api'
import Header from '../components/Header'
import { formatDuration } from '../format'

function Card({ icon, label, value, hint }) {
  return (
    <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
      <p className="text-sm text-slate-500">{icon} {label}</p>
      <p className="mt-2 text-3xl font-bold">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  )
}

export default function StatsPage() {
  const [stats, setStats] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    api
      .get('/stats/focus', { params: { tz } })
      .then(({ data }) => setStats(data))
      .catch(() => setError('Gagal memuat statistik'))
  }, [])

  const max = stats ? Math.max(60, ...stats.daily.map((d) => d.seconds)) : 60

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-5xl px-6 py-8">
        <h1 className="text-2xl font-bold">Statistik fokus</h1>
        <p className="mt-1 text-sm text-slate-500">Hari aktif = ada sesi fokus atau ada task yang diselesaikan.</p>

        {error && <p className="mt-6 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>}
        {!stats && !error && <p className="mt-6 text-slate-500">Memuat...</p>}

        {stats && (
          <>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card
                icon="🔥"
                label="Streak"
                value={`${stats.streak} hari`}
                hint={stats.streak > 0 ? 'Pertahankan, aktif lagi hari ini!' : 'Selesaikan task atau mulai sesi fokus'}
              />
              <Card icon="⏱" label="Hari ini" value={formatDuration(stats.today_seconds)} />
              <Card icon="📅" label="7 hari terakhir" value={formatDuration(stats.week_seconds)} />
              <Card icon="🏆" label="Total fokus" value={formatDuration(stats.total_seconds)} />
            </div>

            <div className="mt-6 rounded-2xl bg-white p-6 ring-1 ring-slate-200">
              <h2 className="mb-6 font-semibold">Aktivitas 7 hari terakhir</h2>
              <div className="flex h-52 items-stretch gap-3">
                {stats.daily.map((d, i) => {
                  const pct = (d.seconds / max) * 100
                  const isToday = i === stats.daily.length - 1
                  const label = new Date(`${d.date}T00:00:00`).toLocaleDateString('id-ID', { weekday: 'short' })
                  return (
                    <div key={d.date} className="flex flex-1 flex-col items-center gap-2">
                      <span className="h-4 text-[11px] text-slate-500">{d.seconds ? formatDuration(d.seconds) : ''}</span>
                      <div className="flex min-h-0 w-full flex-1 items-end">
                        <div
                          className={`w-full rounded-t-lg transition-all ${isToday ? 'bg-indigo-500' : 'bg-indigo-300'}`}
                          style={{ height: `${d.seconds ? Math.max(pct, 4) : 1}%` }}
                          title={`${d.date}: ${formatDuration(d.seconds)} fokus, ${d.completed} task selesai`}
                        />
                      </div>
                      <span className={`text-xs ${isToday ? 'font-semibold' : 'text-slate-500'}`}>{label}</span>
                      <span className="h-4 text-[11px] text-emerald-600">{d.completed > 0 ? `✓ ${d.completed}` : ''}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}