import { Navigate, Route, Routes } from 'react-router-dom'
import { type JSX } from 'react'
import Login from './pages/Login'
import UsuariosPage from './pages/usuarios/UsuariosPage'
import LogUsuariosPage from './pages/usuarios/LogUsuariosPage'
import ConfiguracionPage from './pages/configuracion/ConfiguracionPage'
import ProyectosPage from './pages/proyectos/ProyectosPage'
import NuevoProyectoPage from './pages/proyectos/NuevoProyectoPage'
import ProyectoDetailPage from './pages/proyectos/ProyectoDetailPage'
import MaterialesPage from './pages/catalogos/MaterialesPage'
import ClientesPage from './pages/catalogos/ClientesPage'
import RecetasPage from './pages/catalogos/RecetasPage'
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

function MinLevelRoute({ min, children }: { min: number; children: JSX.Element }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (user.level < min) return <Navigate to="/" replace />
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

      {/* PROYECTOS */}
      <Route path="/proyectos" element={<AnyAuthRoute><ProyectosPage /></AnyAuthRoute>} />
      <Route path="/proyectos/nuevo" element={<AnyAuthRoute><NuevoProyectoPage /></AnyAuthRoute>} />
      <Route path="/proyectos/:id" element={<AnyAuthRoute><ProyectoDetailPage /></AnyAuthRoute>} />

      {/* CATÁLOGOS */}
      <Route path="/clientes" element={<AnyAuthRoute><ClientesPage /></AnyAuthRoute>} />
      <Route path="/materiales" element={<AnyAuthRoute><MaterialesPage /></AnyAuthRoute>} />
      <Route path="/recetas" element={<AnyAuthRoute><RecetasPage /></AnyAuthRoute>} />

      {/* CONFIGURACIÓN */}
      <Route path="/usuarios" element={<MinLevelRoute min={5}><UsuariosPage /></MinLevelRoute>} />
      <Route path="/usuarios/log" element={<MinLevelRoute min={6}><LogUsuariosPage /></MinLevelRoute>} />
      <Route path="/configuracion" element={<Level9Route><ConfiguracionPage /></Level9Route>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
