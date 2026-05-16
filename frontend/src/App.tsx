// Router. Las páginas se cargan con React.lazy → cada ruta es su propio
// chunk JS. La página de Login se mantiene eager (es la primera que se ve
// sin sesión y debe pintar instantáneamente).

import { Navigate, Route, Routes } from 'react-router-dom'
import { lazy, Suspense, type JSX } from 'react'
import Login from './pages/Login'
import { useAuth } from './lib/auth'
import { useKeepWarm } from './lib/useKeepWarm'

// Lazy imports: cada chunk se baja solo cuando navegas a esa ruta.
// Beneficio: el bundle inicial baja de ~600KB a ~250KB, primera carga +rápida.
const ProyectosPage = lazy(() => import('./pages/proyectos/ProyectosPage'))
const NuevoProyectoPage = lazy(() => import('./pages/proyectos/NuevoProyectoPage'))
const ProyectoDetailPage = lazy(() => import('./pages/proyectos/ProyectoDetailPage'))
const MuroComentariosPage = lazy(() => import('./pages/muro/MuroComentariosPage'))
const CalendarioPage = lazy(() => import('./pages/calendario/CalendarioPage'))
const MaterialesPage = lazy(() => import('./pages/catalogos/MaterialesPage'))
const ClientesPage = lazy(() => import('./pages/catalogos/ClientesPage'))
const RecetasPage = lazy(() => import('./pages/catalogos/RecetasPage'))
const UsuariosPage = lazy(() => import('./pages/usuarios/UsuariosPage'))
const LogUsuariosPage = lazy(() => import('./pages/usuarios/LogUsuariosPage'))
const ConfiguracionPage = lazy(() => import('./pages/configuracion/ConfiguracionPage'))

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

function PageFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen text-sm text-app-muted">
      Cargando…
    </div>
  )
}

export default function App() {
  // Keep-warm controlado por SystemConfig (apagado por default)
  useKeepWarm()

  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Landing: siempre Gestor de proyectos */}
        <Route path="/" element={<AnyAuthRoute><Navigate to="/proyectos" replace /></AnyAuthRoute>} />

        {/* PROYECTOS */}
        <Route path="/proyectos" element={<AnyAuthRoute><ProyectosPage /></AnyAuthRoute>} />
        <Route path="/proyectos/nuevo" element={<AnyAuthRoute><NuevoProyectoPage /></AnyAuthRoute>} />
        <Route path="/proyectos/:id" element={<AnyAuthRoute><ProyectoDetailPage /></AnyAuthRoute>} />

        {/* MURO DE COMENTARIOS */}
        <Route path="/muro-comentarios" element={<MinLevelRoute min={5}><MuroComentariosPage /></MinLevelRoute>} />

        {/* CALENDARIO */}
        <Route path="/calendario" element={<MinLevelRoute min={5}><CalendarioPage /></MinLevelRoute>} />

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
    </Suspense>
  )
}
