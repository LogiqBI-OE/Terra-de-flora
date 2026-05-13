import { Navigate, Route, Routes } from 'react-router-dom'
import { type JSX } from 'react'
import Login from './pages/Login'
import HallazgosPage from './pages/hallazgos/HallazgosPage'
import CoberturaPage from './pages/cobertura/CoberturaPage'
import SnapshotListPage from './pages/snapshots/SnapshotListPage'
import UploadsPage from './pages/uploads/UploadsPage'
import CatalogosPage from './pages/catalogos/CatalogosPage'
import UsuariosPage from './pages/usuarios/UsuariosPage'
import ConfiguracionPage from './pages/configuracion/ConfiguracionPage'
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

function Level9Route({ children }: { children: JSX.Element }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (user.level < 9) return <Navigate to="/hallazgos" replace />
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
      <Route path="/usuarios" element={<Level9Route><UsuariosPage /></Level9Route>} />
      <Route path="/configuracion" element={<Level9Route><ConfiguracionPage /></Level9Route>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
