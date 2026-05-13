import { Navigate, Route, Routes } from 'react-router-dom'
import Login from './pages/Login'
import ClienteDashboard from './pages/ClienteDashboard'
import AdminDashboard from './pages/AdminDashboard'
import SnapshotListPage from './pages/snapshots/SnapshotListPage'
import UploadsPage from './pages/uploads/UploadsPage'
import CoberturaPage from './pages/cobertura/CoberturaPage'
import ProtectedRoute from './components/ProtectedRoute'
import { useAuth } from './lib/auth'

function HomeRedirect() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  // Después del login, todos van a Cobertura por default.
  return <Navigate to="/cobertura" replace />
}

function AnyAuthRoute({ children }: { children: JSX.Element }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/login" element={<Login />} />

      {/* Páginas comunes a admin y cliente */}
      <Route path="/snapshots" element={<AnyAuthRoute><SnapshotListPage /></AnyAuthRoute>} />
      <Route path="/uploads" element={<AnyAuthRoute><UploadsPage /></AnyAuthRoute>} />
      <Route path="/cobertura" element={<AnyAuthRoute><CoberturaPage /></AnyAuthRoute>} />

      {/* Dashboards específicos por rol (legacy) */}
      <Route
        path="/cliente"
        element={
          <ProtectedRoute role="cliente">
            <ClienteDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute role="admin">
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
