import { useFocus } from './FocusProvider'
import { mmss } from '../format'

export default function FocusWidget() {
  const { timer, remaining, stop } = useFocus()
  if (!timer) return null

  const isFocus = timer.mode === 'focus'
  const pct = Math.min(100, ((timer.duration - remaining) / timer.duration) * 100)

  return (
    <div className="fixed bottom-4 left-4 z-[90] w-72 rounded-2xl bg-white p-4 shadow-2xl ring-1 ring-slate-200">
      <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide">
        <span className={isFocus ? 'text-indigo-600' : 'text-emerald-600'}>
          {isFocus ? '● Sedang fokus' : '☕ Istirahat'}
        </span>
      </div>
      <p className="mt-1 truncate text-sm font-medium">
        {isFocus ? timer.title : 'Regangkan badan sebentar'}
      </p>
      <p className="my-2 text-4xl font-bold tabular-nums">{mmss(remaining)}</p>
      <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-all ${isFocus ? 'bg-indigo-500' : 'bg-emerald-500'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <button
        onClick={stop}
        className="mt-3 w-full rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100"
      >
        {isFocus ? 'Berhenti dan simpan' : 'Lewati istirahat'}
      </button>
    </div>
  )
}