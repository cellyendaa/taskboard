import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import DashboardBoard from './pages/DashboardBoard'
import StatsPage from './pages/StatsPage'
import { FocusProvider } from './components/FocusProvider'
import FocusWidget from './components/FocusWidget'

function ProtectedLayout() {
  if (!localStorage.getItem('token')) return <Navigate to="/login" replace />
  return (
    <FocusProvider>
      <Outlet />
      <FocusWidget />
    </FocusProvider>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedLayout />}>
          <Route path="/" element={<DashboardBoard />} />
          <Route path="/stats" element={<StatsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}