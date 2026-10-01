import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Building2, LogOut, Menu, UserCheck, Shield, RotateCcw } from 'lucide-react';
import { api } from '../../services/api';

interface NavbarProps {
  onToggleSidebar: () => void;
  activeView: string;
  onRefreshData?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar, activeView, onRefreshData }) => {
  const { user, profile, residentInfo, logout } = useAuth();
  const isOwner = user?.role === 'owner';

  const handleResetDemo = async () => {
    if (window.confirm('Reset database to original demo rooms, residents, and payments?')) {
      try {
        await api.resetDemo();
        if (onRefreshData) onRefreshData();
        window.location.reload();
      } catch (err: any) {
        alert(err.message || 'Failed to reset demo data');
      }
    }
  };

  return (
    <header className="h-16 bg-white border-b border-stone-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <button
          id="mobile-menu-toggle"
          onClick={onToggleSidebar}
          className="p-2 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg lg:hidden"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-stone-900 leading-tight">
              {isOwner ? profile?.hostelName || 'Hostel Management' : 'Resident Portal'}
            </h1>
            <p className="text-[11px] text-stone-500 capitalize leading-none">
              {isOwner ? 'Administration & Operations' : `Welcome, ${residentInfo?.fullName || user?.username}`}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        {isOwner && (
          <button
            id="reset-demo-btn"
            onClick={handleResetDemo}
            title="Reset to default sample data"
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-stone-600 bg-stone-100 hover:bg-stone-200 hover:text-stone-900 rounded-lg transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Demo Data
          </button>
        )}

        <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-stone-200">
          <div className="hidden md:flex flex-col text-right">
            <span className="text-xs font-semibold text-stone-900 leading-tight">
              {isOwner ? profile?.fullName || user?.username : residentInfo?.fullName || user?.username}
            </span>
            <span className="text-[11px] text-stone-500 font-medium">
              {isOwner ? (
                <span className="text-emerald-700 flex items-center gap-1 justify-end">
                  <Shield className="w-3 h-3" /> Hostel Owner
                </span>
              ) : (
                <span className="text-sky-700 flex items-center gap-1 justify-end">
                  <UserCheck className="w-3 h-3" /> Resident (Room {residentInfo?.roomNumber || 'Assigned'})
                </span>
              )}
            </span>
          </div>

          <button
            id="logout-btn"
            onClick={logout}
            title="Sign out"
            className="p-2 text-stone-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors flex items-center gap-1 text-xs font-medium"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
};
