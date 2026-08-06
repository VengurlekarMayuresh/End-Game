import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import PublicLayout from './layouts/PublicLayout'
import StudentLayout from './layouts/StudentLayout'
import RecruiterLayout from './layouts/RecruiterLayout'
import AdminLayout from './layouts/AdminLayout'

import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import StudentDashboard from './pages/StudentDashboard'
import RecruiterDashboard from './pages/RecruiterDashboard'
import AdminDashboard from './pages/AdminDashboard'
import Jobs from './pages/Jobs'
import Company from './pages/Company'
import Profile from './pages/Profile'
import Settings from './pages/Settings'
import NotFound from './pages/NotFound'
import Unauthorized from './pages/Unauthorized'

import ProtectedRoute from './components/ProtectedRoute'
import RoleSelection from './pages/onboarding/RoleSelection'
import StudentOnboarding from './pages/onboarding/StudentOnboarding'
import RecruiterOnboarding from './pages/onboarding/RecruiterOnboarding'
import Terms from './pages/Terms'

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/jobs" element={<Jobs />} />
          <Route path="/company" element={<Company />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/404" element={<NotFound />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
        </Route>

        {/* Onboarding Routes - Protected but PENDING allowed */}
        <Route element={<ProtectedRoute />}>
          <Route path="/onboarding/role" element={<RoleSelection />} />
          <Route path="/onboarding/student" element={<StudentOnboarding />} />
          <Route path="/onboarding/recruiter" element={<RecruiterOnboarding />} />
        </Route>

        {/* Student Routes */}
        <Route path="/student" element={<ProtectedRoute allowedRoles={['STUDENT']} />}>
          <Route element={<StudentLayout />}>
            <Route index element={<StudentDashboard />} />
            <Route path="profile" element={<Profile />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Route>

        {/* Recruiter Routes */}
        <Route path="/recruiter" element={<ProtectedRoute allowedRoles={['RECRUITER']} />}>
          <Route element={<RecruiterLayout />}>
            <Route index element={<RecruiterDashboard />} />
            <Route path="profile" element={<Profile />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Route>

        {/* Admin Routes */}
        <Route path="/admin" element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
          <Route element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Route>

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </Router>
  )
}

export default App
