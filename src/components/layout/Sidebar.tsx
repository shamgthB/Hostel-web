import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  DoorClosed,
  Users,
  CreditCard,
  AlertCircle,
  Bell,
  UserCheck,
  X,
  Building,
  MapPin,
  Music,
} from 'lucide-react';

interface SidebarProps {
  activeView: string;
  onSelectView: (view: string) => void;
  isOpen: boolean;
  onClose: () => void;
  pendingComplaintsCount?: number;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number | null;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  onSelectView,
  isOpen,
  onClose,
  pendingComplaintsCount = 0,
}) => {
  const { user } = useAuth();
  const isOwner = user?.role === 'owner';

  const ownerNavItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'rooms', label: 'Room Management', icon: DoorClosed },
    { id: 'residents', label: 'Resident Management', icon: Users },
    { id: 'fees', label: 'Fee Management', icon: CreditCard },
    {
      id: 'complaints',
      label: 'Complaints',
      icon: AlertCircle,
      badge: pendingComplaintsCount > 0 ? pendingComplaintsCount : null,
    },
    { id: 'notices', label: 'Notice Board', icon: Bell },
    { id: 'nearby', label: 'Nearby & Maps', icon: MapPin },
    { id: 'music', label: 'Hostel Music Studio', icon: Music },
  ];

  const residentNavItems: NavItem[] = [
    { id: 'dashboard', label: 'My Dashboard', icon: LayoutDashboard },
    { id: 'profile', label: 'My Profile & Room', icon: UserCheck },
    { id: 'fees', label: 'Fees & Receipts', icon: CreditCard },
    { id: 'complaints', label: 'Report a Problem', icon: AlertCircle },
    { id: 'notices', label: 'Hostel Notices', icon: Bell },
    { id: 'nearby', label: 'Nearby & Maps', icon: MapPin },
    { id: 'music', label: 'Study & Music Lounge', icon: Music },
  ];

  const navItems: NavItem[] = isOwner ? ownerNavItems : residentNavItems;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-stone-900/50 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        id="app-sidebar"
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-stone-900 text-stone-200 flex flex-col transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Mobile Header with close button */}
        <div className="flex items-center justify-between p-4 border-b border-stone-800 lg:hidden">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Building className="w-5 h-5 text-emerald-400" />
            <span>Hostel Portal</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sidebar Brand / Mode indicator */}
        <div className="hidden lg:flex items-center gap-3 px-6 py-5 border-b border-stone-800/80">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
            <Building className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs uppercase font-bold tracking-wider text-stone-400">
              {isOwner ? 'Owner Dashboard' : 'Resident Portal'}
            </div>
            <div className="text-xs text-stone-300 font-medium">Digital Hostel System</div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                id={`nav-${item.id}`}
                onClick={() => {
                  onSelectView(item.id);
                  onClose();
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-stone-300 hover:bg-stone-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-stone-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      isActive ? 'bg-white text-emerald-700' : 'bg-rose-500 text-white'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom Role Info Card */}
        <div className="p-4 border-t border-stone-800 m-3 rounded-lg bg-stone-950/60 text-xs">
          <div className="text-stone-400">Logged in as</div>
          <div className="text-stone-200 font-medium truncate mt-0.5">{user?.email}</div>
          <div className="mt-2 inline-flex items-center gap-1.5 text-[11px] text-emerald-400 bg-emerald-950/80 border border-emerald-800/60 px-2 py-0.5 rounded">
            Role: {isOwner ? 'Administrator' : 'Hostel Resident'}
          </div>
        </div>
      </aside>
    </>
  );
};
