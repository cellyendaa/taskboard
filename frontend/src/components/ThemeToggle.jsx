import { useState } from 'react'

export default function ThemeToggle() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'))

  const toggle = () => {
    const next = !dark
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('theme', next ? 'dark' : 'light')
    setDark(next)
  }

  return (
    <button
      onClick={toggle}
      title={dark ? 'Mode terang' : 'Mode gelap'}
      className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100"
    >
      {dark ? '☀️' : '🌙'}
    </button>
  )
}