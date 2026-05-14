import { Navigate, Route, Routes } from 'react-router-dom'
import { type JSX } from 'react'
import Login from './pages/Login'
import UsuariosPage from './pages/usuarios/UsuariosPage'
import ConfiguracionPage from './pages/configuracion/ConfiguracionPage'
import AppShell from './components/layout/AppShell'
import EmptyState from './components/ui/EmptyState'
import { useAuth } from './lib/auth'

function AnyAuthRoute({ children }: { children: JSX.Element }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  return children
}

function Level9Route({ children }: { children: JSX.Element }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (user.level < 9) return <Navigate to="/" replace />
  return children
}

function HomePage() {
  return (
    <AppShell title="Inicio">
      <div className="max-w-2xl mx-auto mt-12">
        <EmptyState
          title="Bienvenido a Terra de Flora"
          description="Configura tus primeras páginas para empezar."
        />
      </div>
    </AppShell>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route path="/" element={<AnyAuthRoute><HomePage /></AnyAuthRoute>} />

      {/* CONFIGURACIÓN */}
      <Route path="/usuarios" element={<Level9Route><UsuariosPage /></Level9Route>} />
      <Route path="/configuracion" element={<Level9Route><ConfiguracionPage /></Level9Route>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
