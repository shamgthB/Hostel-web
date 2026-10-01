import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import {
  DoorClosed,
  Bed,
  Users,
  DollarSign,
  AlertCircle,
  Plus,
  Clock,
  TrendingUp,
  Receipt,
  ArrowRight,
  ShieldCheck,
  MapPin,
  Music,
} from 'lucide-react';
import { StatusBadge } from '../common/Badge';

interface OwnerDashboardProps {
  onNavigate: (view: string) => void;
  onOpenReceipt: (paymentId: string) => void;
}

export const OwnerDashboard: React.FC<OwnerDashboardProps> = ({ onNavigate, onOpenReceipt }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSummary();
  }, []);

  const loadSummary = async () => {
    setLoading(true);
    try {
      const res = await api.getOwnerSummary();
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard overview.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center text-stone-500 text-sm">Loading hostel analytics...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 bg-rose-50 text-rose-700 rounded-xl border border-rose-200 text-sm">
        {error || 'Unable to load dashboard data.'}
      </div>
    );
  }

  const stats = data?.stats || {};
  const recentComplaints = Array.isArray(data?.recentComplaints) ? data.recentComplaints : [];
  const recentPayments = Array.isArray(data?.recentPayments) ? data.recentPayments : [];
  const recentNotices = Array.isArray(data?.recentNotices) ? data.recentNotices : [];

  const statCards = [
    {
      label: 'Total Rooms',
      value: stats.totalRooms,
      sub: `${stats.occupancyRate}% occupancy`,
      icon: DoorClosed,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    },
    {
      label: 'Total Beds',
      value: stats.totalBeds,
      sub: `${stats.occupiedBeds} occupied / ${stats.availableBeds} available`,
      icon: Bed,
      color: 'text-indigo-600 bg-indigo-50 border-indigo-100',
    },
    {
      label: 'Active Residents',
      value: stats.totalResidents,
      sub: 'Enrolled in rooms',
      icon: Users,
      color: 'text-sky-600 bg-sky-50 border-sky-100',
    },
    {
      label: 'Pending Complaints',
      value: stats.pendingComplaints,
      sub: `${stats.inProgressComplaints} in progress`,
      icon: AlertCircle,
      color: stats.pendingComplaints > 0 ? 'text-rose-600 bg-rose-50 border-rose-100' : 'text-stone-600 bg-stone-50 border-stone-100',
    },
    {
      label: 'Collected Fees',
      value: `$${stats.monthlyCollectedFees.toLocaleString()}`,
      sub: 'Total recorded collections',
      icon: DollarSign,
      color: 'text-emerald-700 bg-emerald-50 border-emerald-100',
    },
    {
      label: 'Pending Fees',
      value: `$${stats.pendingFees.toLocaleString()}`,
      sub: 'Outstanding balances',
      icon: TrendingUp,
      color: stats.pendingFees > 0 ? 'text-amber-700 bg-amber-50 border-amber-100' : 'text-stone-600 bg-stone-50 border-stone-100',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Welcome Bar with Quick Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-xl border border-stone-200 shadow-2xs">
        <div>
          <h2 className="text-xl font-bold text-stone-900 tracking-tight">Hostel Operations Overview</h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Monitor real-time room occupancies, resident fees, and maintenance requests
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            id="dash-add-room-btn"
            onClick={() => onNavigate('rooms')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Manage Rooms
          </button>
          <button
            id="dash-add-resident-btn"
            onClick={() => onNavigate('residents')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Add Resident
          </button>
          <button
            id="dash-record-fee-btn"
            onClick={() => onNavigate('fees')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-2xs transition-colors"
          >
            <DollarSign className="w-3.5 h-3.5" /> Record Fee
          </button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className="bg-white p-5 rounded-xl border border-stone-200 shadow-2xs flex items-center justify-between"
            >
              <div>
                <p className="text-xs font-medium text-stone-500 uppercase tracking-wider">{card.label}</p>
                <h3 className="text-2xl font-bold text-stone-900 mt-1 font-mono">{card.value}</h3>
                <p className="text-xs text-stone-500 mt-0.5">{card.sub}</p>
              </div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${card.color}`}>
                <Icon className="w-6 h-6" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Two Column Layout for Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Complaints */}
        <div className="bg-white rounded-xl border border-stone-200 shadow-2xs flex flex-col">
          <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
            <div>
              <h3 className="font-semibold text-stone-900 text-sm">Recent Complaints</h3>
              <p className="text-xs text-stone-500">Resident issues requiring action</p>
            </div>
            <button
              id="view-all-complaints-btn"
              onClick={() => onNavigate('complaints')}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 inline-flex items-center gap-1"
            >
              View All <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="p-4 divide-y divide-stone-100 flex-1">
            {recentComplaints.length === 0 ? (
              <p className="text-xs text-stone-400 py-6 text-center">No pending complaints right now.</p>
            ) : (
              recentComplaints.map((c: any) => (
                <div key={c.id} className="py-3 first:pt-0 last:pb-0 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-stone-900 truncate">{c.title}</span>
                      <StatusBadge status={c.status} />
                    </div>
                    <p className="text-xs text-stone-500 mt-0.5 line-clamp-1">{c.description}</p>
                    <div className="text-[11px] text-stone-400 mt-1 flex items-center gap-2">
                      <span>Resident: {c.residentName} (Room {c.roomNumber})</span>
                      <span>&bull;</span>
                      <span>{new Date(c.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => onNavigate('complaints')}
                    className="shrink-0 text-xs px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-md font-medium"
                  >
                    Respond
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Payment Transactions */}
        <div className="bg-white rounded-xl border border-stone-200 shadow-2xs flex flex-col">
          <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
            <div>
              <h3 className="font-semibold text-stone-900 text-sm">Recent Fee Records</h3>
              <p className="text-xs text-stone-500">Rent collections and pending invoices</p>
            </div>
            <button
              id="view-all-fees-btn"
              onClick={() => onNavigate('fees')}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 inline-flex items-center gap-1"
            >
              View All <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="p-4 divide-y divide-stone-100 flex-1">
            {recentPayments.length === 0 ? (
              <p className="text-xs text-stone-400 py-6 text-center">No payment entries found.</p>
            ) : (
              recentPayments.map((p: any) => (
                <div key={p.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-stone-900">{p.residentName}</span>
                      <span className="text-xs text-stone-500">(Room {p.roomNumber})</span>
                      <StatusBadge status={p.status} />
                    </div>
                    <div className="text-[11px] text-stone-400 mt-0.5">
                      {p.monthYear} &bull; {p.paymentMethod || 'Unpaid'} &bull; #{p.receiptNumber}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-right">
                    <div>
                      <div className="text-xs font-mono font-bold text-emerald-700">${p.amountPaid}</div>
                      {p.remainingAmount > 0 && (
                        <div className="text-[11px] font-mono text-rose-600">${p.remainingAmount} due</div>
                      )}
                    </div>
                    <button
                      onClick={() => onOpenReceipt(p.id)}
                      title="Generate Receipt"
                      className="p-1.5 text-stone-500 hover:text-emerald-600 hover:bg-stone-100 rounded-md transition-colors"
                    >
                      <Receipt className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Grounded AI Tools: Neighborhood Explorer & Hostel Music Studio */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div
          onClick={() => onNavigate('nearby')}
          className="bg-gradient-to-br from-emerald-900 via-teal-900 to-stone-900 rounded-xl p-5 text-white cursor-pointer hover:shadow-md transition-all group relative overflow-hidden"
        >
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-400/30">
              <MapPin className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/30 text-emerald-200 border border-emerald-400/30">
              Google Maps Grounded
            </span>
          </div>
          <h3 className="text-base font-bold text-white mt-3 group-hover:text-emerald-300 transition-colors">
            Nearby Neighborhood & Local Amenities
          </h3>
          <p className="text-xs text-stone-300 mt-1 leading-relaxed">
            Locate grocery stores, clinics, transit stops, and student dining to recommend to residents and inspect the local area.
          </p>
          <div className="flex items-center gap-1 text-xs text-emerald-400 font-semibold mt-3">
            <span>Open Google Maps guide</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        <div
          onClick={() => onNavigate('music')}
          className="bg-gradient-to-br from-purple-900 via-indigo-900 to-stone-900 rounded-xl p-5 text-white cursor-pointer hover:shadow-md transition-all group relative overflow-hidden"
        >
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-400/30">
              <Music className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-purple-500/30 text-purple-200 border border-purple-400/30">
              Google Lyria Music
            </span>
          </div>
          <h3 className="text-base font-bold text-white mt-3 group-hover:text-purple-300 transition-colors">
            Hostel Music & Ambiance Studio
          </h3>
          <p className="text-xs text-stone-300 mt-1 leading-relaxed">
            Create background audio for hostel common rooms, reception lounges, or resident study playlists using Lyria models.
          </p>
          <div className="flex items-center gap-1 text-xs text-purple-300 font-semibold mt-3">
            <span>Launch Music Studio</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>

      {/* Active Notices Card */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-2xs p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-stone-900 text-sm">Active Hostel Announcements</h3>
            <p className="text-xs text-stone-500">Notices currently broadcasted to all residents</p>
          </div>
          <button
            onClick={() => onNavigate('notices')}
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
          >
            Manage Notices
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {recentNotices.slice(0, 2).map((notice: any) => (
            <div
              key={notice.id}
              className="p-3.5 rounded-lg border border-stone-200 bg-stone-50/70 hover:bg-stone-50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-900">{notice.title}</span>
                <StatusBadge status={notice.priority} />
              </div>
              <p className="text-xs text-stone-600 mt-1 line-clamp-2">{notice.content}</p>
              <div className="text-[11px] text-stone-400 mt-2">
                Published {new Date(notice.createdAt).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
