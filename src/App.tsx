import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './components/auth/LoginPage';
import { RegisterPage } from './components/auth/RegisterPage';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { ReceiptModal } from './components/common/ReceiptModal';
import { api } from './services/api';

// Owner Views
import { OwnerDashboard } from './components/owner/OwnerDashboard';
import { RoomManagement } from './components/owner/RoomManagement';
import { ResidentManagement } from './components/owner/ResidentManagement';
import { FeeManagement } from './components/owner/FeeManagement';
import { ComplaintManagement } from './components/owner/ComplaintManagement';
import { NoticeManagement } from './components/owner/NoticeManagement';

// Resident Views
import { ResidentDashboard } from './components/resident/ResidentDashboard';
import { ResidentComplaints } from './components/resident/ResidentComplaints';
import { ResidentFees } from './components/resident/ResidentFees';
import { ResidentNotices } from './components/resident/ResidentNotices';
import { ResidentProfile } from './components/resident/ResidentProfile';

const MainLayout: React.FC = () => {
  const { user, loading } = useAuth();
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [activeView, setActiveView] = useState<string>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [receiptPaymentId, setReceiptPaymentId] = useState<string | null>(null);
  const [pendingComplaintsCount, setPendingComplaintsCount] = useState<number>(0);

  // Poll or refresh pending complaints count for sidebar badge
  useEffect(() => {
    if (user?.role === 'owner') {
      api.getComplaints({ status: 'Pending' })
        .then(res => setPendingComplaintsCount(res.length))
        .catch(() => {});
    }
  }, [user, activeView]);

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-semibold text-stone-600">Initializing Hostel Management System...</p>
        </div>
      </div>
    );
  }

  // Unauthenticated Flow
  if (!user) {
    if (authMode === 'register') {
      return <RegisterPage onSwitchToLogin={() => setAuthMode('login')} />;
    }
    return <LoginPage onSwitchToRegister={() => setAuthMode('register')} />;
  }

  const isOwner = user.role === 'owner';

  // Navigation handler normalizing 'my-' prefix
  const handleNavigate = (view: string) => {
    const cleanView = view.replace(/^my-/, '');
    setActiveView(cleanView);
    setSidebarOpen(false);
  };

  const handleOpenReceipt = (paymentId: string) => {
    setReceiptPaymentId(paymentId);
  };

  // Render view router
  const renderCurrentView = () => {
    if (isOwner) {
      switch (activeView) {
        case 'dashboard':
          return <OwnerDashboard onNavigate={handleNavigate} onOpenReceipt={handleOpenReceipt} />;
        case 'rooms':
          return <RoomManagement />;
        case 'residents':
          return <ResidentManagement />;
        case 'fees':
          return <FeeManagement onOpenReceipt={handleOpenReceipt} />;
        case 'complaints':
          return <ComplaintManagement />;
        case 'notices':
          return <NoticeManagement />;
        default:
          return <OwnerDashboard onNavigate={handleNavigate} onOpenReceipt={handleOpenReceipt} />;
      }
    } else {
      switch (activeView) {
        case 'dashboard':
          return <ResidentDashboard onNavigate={handleNavigate} onOpenReceipt={handleOpenReceipt} />;
        case 'complaints':
          return <ResidentComplaints />;
        case 'fees':
          return <ResidentFees onOpenReceipt={handleOpenReceipt} />;
        case 'notices':
          return <ResidentNotices />;
        case 'profile':
          return <ResidentProfile />;
        default:
          return <ResidentDashboard onNavigate={handleNavigate} onOpenReceipt={handleOpenReceipt} />;
      }
    }
  };

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col font-sans text-stone-900">
      {/* Top Navigation */}
      <Navbar
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        activeView={activeView}
        onRefreshData={() => setActiveView(activeView)}
      />

      {/* Main Content Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Sidebar */}
        <Sidebar
          activeView={activeView}
          onSelectView={handleNavigate}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          pendingComplaintsCount={pendingComplaintsCount}
        />

        {/* Scrollable Main Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">{renderCurrentView()}</div>
        </main>
      </div>

      {/* Global Receipt Modal */}
      <ReceiptModal
        paymentId={receiptPaymentId}
        onClose={() => setReceiptPaymentId(null)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}
