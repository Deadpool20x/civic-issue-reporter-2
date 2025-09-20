import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from '@/components/ui/toaster'
import AuthProvider from './contexts/AuthContext'
import AdminAuthProvider from './contexts/AdminAuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import AdminProtectedRoute from './components/admin/AdminProtectedRoute'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import ReportIssue from './pages/ReportIssue'
import MyIssues from './pages/MyIssues'
import Profile from './pages/Profile'
import Layout from './components/Layout'
import AdminLogin from './pages/admin/AdminLogin'
import AdminDashboard from './pages/admin/AdminDashboard'
import IssueManagement from './pages/admin/IssueManagement'
import DepartmentView from './pages/admin/DepartmentView'
import AdminLayout from './components/admin/AdminLayout'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

function AppInner() {
  return (
    <Router>
      <Routes>
        {/* Citizen Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <Layout>
                <Routes>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/report" element={<ReportIssue />} />
                  <Route path="/my-issues" element={<MyIssues />} />
                  <Route path="/profile" element={<Profile />} />
                </Routes>
              </Layout>
            </ProtectedRoute>
          }
        />
        
        {/* Admin Routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin/*"
          element={
            <AdminProtectedRoute>
              <AdminLayout>
                <Routes>
                  <Route path="/dashboard" element={<AdminDashboard />} />
                  <Route path="/issues" element={<IssueManagement />} />
                  <Route path="/departments" element={<DepartmentView />} />
                </Routes>
              </AdminLayout>
            </AdminProtectedRoute>
          }
        />
      </Routes>
      <Toaster />
    </Router>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AdminAuthProvider>
          <div className="min-h-screen bg-background text-foreground">
            <AppInner />
          </div>
        </AdminAuthProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}