import { Navigate, Route, Routes } from 'react-router-dom'
import { type JSX } from 'react'
import Login from './pages/Login'
import HallazgosPage from './pages/hallazgos/HallazgosPage'
import CoberturaPage from './pages/cobertura/CoberturaPage'
import SnapshotListPage from './pages/snapshots/SnapshotListPage'
import UploadsPage from './pages/uploads/UploadsPage'
import CatalogosPage from './pages/catalogos/CatalogosPage'
import { useAuth } from './lib/auth'

function HomeRedirect() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  return <Navigate to="/hallazgos" replace />
}

function AnyAuthRoute({ children }: { children: JSX.Element }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  return children
}

function AdminOnlyRoute({ children }: { children: JSX.Element }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'admin') return <Navigate to="/hallazgos" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/login" element={<Login />} />

      {/* MONITORES */}
      <Route path="/hallazgos" element={<AnyAuthRoute><HallazgosPage /></AnyAuthRoute>} />
      <Route path="/cobertura" element={<AnyAuthRoute><CoberturaPage /></AnyAuthRoute>} />

      {/* INPUTS */}
      <Route path="/snapshots" element={<AnyAuthRoute><SnapshotListPage /></AnyAuthRoute>} />
      <Route path="/uploads" element={<AnyAuthRoute><UploadsPage /></AnyAuthRoute>} />
      <Route path="/catalogos" element={<AnyAuthRoute><CatalogosPage /></AnyAuthRoute>} />

      {/* CONFIGURACIÓN */}
      {/* /usuarios viene en commit 3 */}
      <Route path="/usuarios" element={<AdminOnlyRoute><div className="p-8 text-app">Próximamente</div></AdminOnlyRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
