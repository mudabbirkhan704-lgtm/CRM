import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { LoginPage } from '@/pages/LoginPage';
import { AppLayout } from '@/components/AppLayout';
import { DashboardPage } from '@/pages/DashboardPage';
import { LeadsPage, LeadDetailPage } from '@/pages/LeadsPage';
import { StudentsPage } from '@/pages/StudentsPage';
import { UniversitiesPage } from '@/pages/UniversitiesPage';
import { ApplicationsPage, ApplicationDetailPage } from '@/pages/ApplicationsPage';
import { TasksPage } from '@/pages/TasksPage';
import { CalendarPage } from '@/pages/CalendarPage';
import { FinancePage } from '@/pages/FinancePage';
import { VisaPage } from '@/pages/VisaPage';
import { ReportsPage } from '@/pages/ReportsPage';
import { SettingsPage } from '@/pages/SettingsPage';

function ProtectedRoutes() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/leads" element={<LeadsPage />} />
        <Route path="/leads/:id" element={<LeadDetailPage />} />
        <Route path="/students" element={<StudentsPage />} />
        <Route path="/universities" element={<UniversitiesPage />} />
        <Route path="/applications" element={<ApplicationsPage />} />
        <Route path="/applications/:id" element={<ApplicationDetailPage />} />
        <Route path="/tasks" element={<TasksPage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/finance" element={<FinancePage />} />
        <Route path="/visa" element={<VisaPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppLayout>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/*" element={<ProtectedRoutes />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
