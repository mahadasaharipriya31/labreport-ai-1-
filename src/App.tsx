import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { LoginPage } from './pages/LoginPage';
import { PatientPortalPage } from './pages/PatientPortalPage';
import { Sidebar, PageId } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { DashboardPage } from './pages/DashboardPage';
import { UploadPage } from './pages/UploadPage';
import { PatientsPage } from './pages/PatientsPage';
import { ReportsPage } from './pages/ReportsPage';
import { ReportDetailsPage } from './pages/ReportDetailsPage';
import { DietPlansPage } from './pages/DietPlansPage';
import { ReferenceRangesPage } from './pages/ReferenceRangesPage';
import { AnalyzerMappingPage } from './pages/AnalyzerMappingPage';
import { SettingsPage } from './pages/SettingsPage';
import { DisclaimerBanner } from './components/DisclaimerBanner';
import { DashboardStats } from './types';
import { api } from './services/api';

function MainApp() {
  const { isAuthenticated, isPatient, switchRole } = useAuth();
  const [currentPage, setCurrentPage] = useState<PageId>('dashboard');
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [selectedPatientIdForDiet, setSelectedPatientIdForDiet] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState<boolean>(true);
  const [isLoadingSample, setIsLoadingSample] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchStats = async () => {
    setIsLoadingStats(true);
    try {
      const data = await api.getStats();
      setStats(data);
      // If zero reports, automatically trigger sample data load for seamless hackathon demo
      if (data.total_reports === 0) {
        try {
          await api.loadSampleData();
          const refreshed = await api.getStats();
          setStats(refreshed);
        } catch (e) {
          console.error(e);
        }
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    } finally {
      setIsLoadingStats(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && !isPatient) {
      fetchStats();
    }
  }, [isAuthenticated, isPatient]);

  const handleNavigate = (page: PageId) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectReport = (reportId: string) => {
    setSelectedReportId(reportId);
    setCurrentPage('report-details');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleViewDietPlan = (patientId?: string) => {
    if (patientId) {
      setSelectedPatientIdForDiet(patientId);
    }
    setCurrentPage('diet-plans');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLoadSampleData = async () => {
    setIsLoadingSample(true);
    try {
      await api.loadSampleData();
      await fetchStats();
      showToast('Sample analyzer dataset processed into reports successfully!');
      if (currentPage !== 'dashboard' && currentPage !== 'reports') {
        setCurrentPage('dashboard');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to load sample dataset');
    } finally {
      setIsLoadingSample(false);
    }
  };

  // If user is not authenticated, display the dedicated Medical Portal Login Page
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // If user is a verified Patient, display the dedicated Patient Health & Wellness Portal
  if (isPatient) {
    return <PatientPortalPage onSwitchToDoctor={() => switchRole('doctor')} />;
  }

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl border border-slate-700 text-xs font-bold flex items-center gap-2 animate-bounce">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Sidebar */}
      <Sidebar
        currentPage={currentPage}
        onNavigate={handleNavigate}
        onLoadSampleData={handleLoadSampleData}
        isLoadingSample={isLoadingSample}
        criticalCount={stats?.critical_results || 0}
      />

      {/* Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar
          onNavigate={handleNavigate}
          onLoadSampleData={handleLoadSampleData}
          isLoadingSample={isLoadingSample}
        />

        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
          {currentPage === 'dashboard' && (
            <DashboardPage
              stats={stats}
              isLoading={isLoadingStats}
              onNavigate={handleNavigate}
              onSelectReport={handleSelectReport}
              onLoadSampleData={handleLoadSampleData}
              isLoadingSample={isLoadingSample}
            />
          )}

          {currentPage === 'upload' && (
            <UploadPage
              onNavigate={handleNavigate}
              onSelectReport={handleSelectReport}
              onRefreshStats={fetchStats}
            />
          )}

          {currentPage === 'patients' && (
            <PatientsPage
              onSelectReport={handleSelectReport}
              onViewDietPlan={handleViewDietPlan}
            />
          )}

          {currentPage === 'reports' && (
            <ReportsPage
              onSelectReport={handleSelectReport}
              onLoadSampleData={handleLoadSampleData}
              isLoadingSample={isLoadingSample}
            />
          )}

          {currentPage === 'report-details' && selectedReportId && (
            <ReportDetailsPage
              reportId={selectedReportId}
              onBack={() => setCurrentPage('reports')}
              onViewDietPlan={handleViewDietPlan}
            />
          )}

          {currentPage === 'diet-plans' && (
            <DietPlansPage
              onSelectReport={handleSelectReport}
              initialPatientId={selectedPatientIdForDiet}
            />
          )}

          {currentPage === 'reference-ranges' && <ReferenceRangesPage />}

          {currentPage === 'analyzer-mapping' && <AnalyzerMappingPage />}

          {currentPage === 'settings' && (
            <SettingsPage
              onLoadSampleData={handleLoadSampleData}
              isLoadingSample={isLoadingSample}
              onRefreshStats={fetchStats}
            />
          )}
        </main>

        <DisclaimerBanner compact />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </LanguageProvider>
  );
}
