import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import DisplayNameModal from './components/DisplayNameModal'
import LoginPage from './pages/LoginPage'
import RequestFormPage from './pages/RequestFormPage'
import MyRequestsPage from './pages/MyRequestsPage'
import RequestDetailPage from './pages/RequestDetailPage'
import AdminRequestsPage from './pages/AdminRequestsPage'
import DashboardPage from './pages/DashboardPage'
import AdminUsersPage from './pages/AdminUsersPage'
import SettingsPage from './pages/SettingsPage'

function AppRoutes() {
  const { needsDisplayName, user } = useAuth()

  return (
    <>
      {user && needsDisplayName && <DisplayNameModal />}
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/request/new" element={<ProtectedRoute><RequestFormPage /></ProtectedRoute>} />
        <Route path="/request/:id" element={<ProtectedRoute><RequestDetailPage /></ProtectedRoute>} />
        <Route path="/my-requests" element={<ProtectedRoute><MyRequestsPage /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
        <Route path="/admin/requests" element={<ProtectedRoute requiredRoles={['admin', 'approver']}><AdminRequestsPage /></ProtectedRoute>} />
        <Route path="/admin/dashboard" element={<ProtectedRoute requiredRoles={['admin']}><DashboardPage /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute requiredRoles={['admin']}><AdminUsersPage /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
