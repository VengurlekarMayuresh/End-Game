import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import PublicLayout from './layouts/PublicLayout'
import StudentLayout from './layouts/StudentLayout'
import RecruiterLayout from './layouts/RecruiterLayout'
import AdminLayout from './layouts/AdminLayout'

import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import StudentDashboard from './pages/StudentDashboard'
import Resume from './pages/student/Resume'
import Education from './pages/student/Education'
import Projects from './pages/student/Projects'
import Experience from './pages/student/Experience'
import Certifications from './pages/student/Certifications'
import Documents from './pages/student/Documents'
import RecruiterDashboard from './pages/RecruiterDashboard'
import RecruiterProfile from './pages/RecruiterProfile'
import PostJob from './pages/recruiter/PostJob'
import MyJobs from './pages/recruiter/MyJobs'
import JobApplicants from './pages/recruiter/JobApplicants'
import SmartShortlist from './pages/recruiter/SmartShortlist'
import Candidates from './pages/recruiter/Candidates'
import RecruiterSettings from './pages/recruiter/RecruiterSettings'
import AdminDashboard from './pages/AdminDashboard'
import Jobs from './pages/Jobs'
import JobDetails from './pages/JobDetails'
import Company from './pages/Company'
import Profile from './pages/Profile'
import Settings from './pages/Settings'
import NotFound from './pages/NotFound'
import Unauthorized from './pages/Unauthorized'

// Aptitude Test Pages
import QuestionBank from './pages/recruiter/QuestionBank'
import TestsList from './pages/recruiter/TestsList'
import TestForm from './pages/recruiter/TestForm'
import TestResults from './pages/recruiter/TestResults'
import StudentTests from './pages/student/StudentTests'
import TestInterface from './pages/student/TestInterface'

// Coding Assessment Pages
import CodingAssessmentsList from './pages/recruiter/CodingAssessmentsList'
import CodingAssessmentForm from './pages/recruiter/CodingAssessmentForm'
import CodingAssessmentResults from './pages/recruiter/CodingAssessmentResults'
import CodingTestInterface from './pages/student/CodingTestInterface'

import ProtectedRoute from './components/ProtectedRoute'
import RoleSelection from './pages/onboarding/RoleSelection'
import StudentOnboarding from './pages/onboarding/StudentOnboarding'
import RecruiterOnboarding from './pages/onboarding/RecruiterOnboarding'
import Terms from './pages/Terms'

// Module 13.5 Pages
import ResumeAptitudeTestInterface from './pages/student/ResumeAptitudeTestInterface'
import ResumeAptitudeResults from './pages/recruiter/ResumeAptitudeResults'

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
          <Route path="/jobs/:id" element={<JobDetails />} />
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
            <Route path="resume" element={<Resume />} />
            <Route path="education" element={<Education />} />
            <Route path="projects" element={<Projects />} />
            <Route path="experience" element={<Experience />} />
            <Route path="certifications" element={<Certifications />} />
            <Route path="documents" element={<Documents />} />
            <Route path="tests" element={<StudentTests />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          <Route path="tests/:id/attempt" element={<TestInterface />} />
          <Route path="coding-assessments/:id/attempt" element={<CodingTestInterface />} />
          <Route path="resume-aptitude/:attemptId" element={<ResumeAptitudeTestInterface />} />
        </Route>

        {/* Recruiter Routes */}
        <Route path="/recruiter" element={<ProtectedRoute allowedRoles={['RECRUITER']} />}>
          <Route element={<RecruiterLayout />}>
            <Route index element={<RecruiterDashboard />} />
            <Route path="profile" element={<RecruiterProfile />} />
            <Route path="jobs" element={<MyJobs />} />
            <Route path="jobs/new" element={<PostJob />} />
            <Route path="jobs/:jobId/applications" element={<JobApplicants />} />
            <Route path="jobs/:jobId/shortlist" element={<SmartShortlist />} />
            <Route path="candidates" element={<Candidates />} />
            <Route path="questions" element={<QuestionBank />} />
            <Route path="tests" element={<TestsList />} />
            <Route path="tests/new" element={<TestForm />} />
            <Route path="tests/:id/edit" element={<TestForm />} />
            <Route path="tests/:id/results" element={<TestResults />} />
            <Route path="coding-assessments" element={<CodingAssessmentsList />} />
            <Route path="coding-assessments/new" element={<CodingAssessmentForm />} />
            <Route path="coding-assessments/:id/edit" element={<CodingAssessmentForm />} />
            <Route path="coding-assessments/:id/results" element={<CodingAssessmentResults />} />
            <Route path="resume-aptitude/:attemptId/results" element={<ResumeAptitudeResults />} />
            <Route path="settings" element={<RecruiterSettings />} />
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
