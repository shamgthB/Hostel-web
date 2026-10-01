import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge } from '../common/Badge';
import {
  DoorClosed,
  Bed,
  DollarSign,
  AlertCircle,
  Plus,
  Receipt,
  ArrowRight,
  Bell,
  Clock,
  CheckCircle2,
  Calendar,
} from 'lucide-react';

interface ResidentDashboardProps {
  onNavigate: (view: string) => void;
  onOpenReceipt: (paymentId: string) => void;
}

export const ResidentDashboard: React.FC<ResidentDashboardProps> = ({ onNavigate, onOpenReceipt }) => {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSummary();
  }, []);

  const loadSummary = async () => {
    setLoading(true);
    try {
      const res = await api.getResidentSummary();
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load resident summary.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center text-stone-500 text-sm">Loading your resident portal...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 bg-rose-50 text-rose-700 rounded-xl border border-rose-200 text-sm">
        {error || 'Unable to load profile data.'}
      </div>
    );
  }

  const resident = data?.resident || {};
  const room = data?.room || null;
  const bed = data?.bed || null;
  const payments: any[] = Array.isArray(data?.payments) ? data.payments : (data?.recentPayments || []);
  const complaints: any[] = Array.isArray(data?.complaints) ? data.complaints : (data?.recentComplaints || []);
  const notices: any[] = Array.isArray(data?.notices) ? data.notices : [];

  const currentMonthPayment = payments?.[0] || data?.feesSummary?.latestPayment || null;
  const pendingComplaints = complaints.filter((c: any) => c.status !== 'Resolved');

  return (
    <div className="space-y-6">
      {/* Resident Welcome Hero Banner */}
      <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <img
            src={resident.profilePhoto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
            alt={resident.fullName}
            className="w-14 h-14 rounded-full object-cover border-2 border-emerald-500 shadow-2xs"
          />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-stone-900 tracking-tight">Welcome, {resident.fullName}</h2>
              <StatusBadge status={resident.status} />
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              Room {room?.roomNumber || 'N/A'} (Floor {room?.floor || '1'}) &bull; Bed #{bed?.bedNumber || '1'} &bull; Joined {resident.joiningDate}
            </p>
          </div>
        </div>

        <button
          id="file-complaint-cta-btn"
          onClick={() => onNavigate('my-complaints')}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-2xs transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Report an Issue / Complaint
        </button>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Room Info */}
        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Assigned Room</p>
            <h3 className="text-2xl font-bold text-stone-900 mt-1 font-mono">
              Room {room?.roomNumber || resident.roomNumber}
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Bed #{bed?.bedNumber || resident.bedNumber} &bull; {room?.roomType || 'Double'}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center">
            <DoorClosed className="w-6 h-6" />
          </div>
        </div>

        {/* Monthly Rent Status */}
        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Current Rent Status</p>
            <div className="flex items-center gap-2 mt-1">
              <h3 className="text-2xl font-bold text-stone-900 font-mono">
                ${resident.monthlyRent}
              </h3>
              {currentMonthPayment && <StatusBadge status={currentMonthPayment.status} />}
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              {currentMonthPayment?.status === 'Paid' ? 'Paid in full' : `$${currentMonthPayment?.remainingAmount || 0} due for this month`}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* Complaints status */}
        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Active Complaints</p>
            <h3 className="text-2xl font-bold text-stone-900 mt-1 font-mono">
              {pendingComplaints.length}
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              {complaints.length} total submitted
            </p>
          </div>
          <div className={`w-12 h-12 rounded-xl border flex items-center justify-center ${
            pendingComplaints.length > 0 ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-stone-50 text-stone-500 border-stone-100'
          }`}>
            <AlertCircle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Two Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Rent Records */}
        <div className="bg-white rounded-xl border border-stone-200 shadow-2xs flex flex-col">
          <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
            <div>
              <h3 className="font-semibold text-stone-900 text-sm">Rent & Payments</h3>
              <p className="text-xs text-stone-500">Your recent rent invoices and payment receipts</p>
            </div>
            <button
              id="view-all-my-fees-btn"
              onClick={() => onNavigate('my-fees')}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 inline-flex items-center gap-1"
            >
              View Ledger <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="p-4 divide-y divide-stone-100 flex-1">
            {payments.length === 0 ? (
              <p className="text-xs text-stone-400 py-6 text-center">No payment history recorded.</p>
            ) : (
              payments.slice(0, 3).map((p: any) => (
                <div key={p.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-stone-900">{p.monthYear}</span>
                      <StatusBadge status={p.status} />
                    </div>
                    <div className="text-[11px] text-stone-400 mt-0.5 font-mono">
                      Receipt #{p.receiptNumber} &bull; Paid: {p.paymentDate || 'Pending'}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="text-right font-mono">
                      <div className="text-xs font-bold text-emerald-700">${p.amountPaid}</div>
                      {p.remainingAmount > 0 && (
                        <div className="text-[11px] text-rose-600">${p.remainingAmount} due</div>
                      )}
                    </div>
                    <button
                      onClick={() => onOpenReceipt(p.id)}
                      title="View Official Receipt"
                      className="p-1.5 text-stone-500 hover:text-emerald-700 hover:bg-stone-100 rounded-md"
                    >
                      <Receipt className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Complaints Tracker */}
        <div className="bg-white rounded-xl border border-stone-200 shadow-2xs flex flex-col">
          <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
            <div>
              <h3 className="font-semibold text-stone-900 text-sm">Your Reported Complaints</h3>
              <p className="text-xs text-stone-500">Track hostel administration responses</p>
            </div>
            <button
              id="view-all-my-complaints-btn"
              onClick={() => onNavigate('my-complaints')}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 inline-flex items-center gap-1"
            >
              View All <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="p-4 divide-y divide-stone-100 flex-1">
            {complaints.length === 0 ? (
              <p className="text-xs text-stone-400 py-6 text-center">You haven't reported any issues.</p>
            ) : (
              complaints.slice(0, 3).map((c: any) => (
                <div key={c.id} className="py-3 first:pt-0 last:pb-0 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-stone-900">{c.title}</span>
                    <StatusBadge status={c.status} />
                  </div>
                  <p className="text-xs text-stone-500 line-clamp-1">{c.description}</p>
                  {c.ownerResponse && (
                    <div className="p-2 bg-emerald-50 border border-emerald-200 rounded text-[11px] text-emerald-800 flex items-start gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <strong>Admin Response:</strong> {c.ownerResponse}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Latest Notices */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-2xs p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-amber-500" />
            <h3 className="font-semibold text-stone-900 text-sm">Hostel Notices & Announcements</h3>
          </div>
          <button
            onClick={() => onNavigate('my-notices')}
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
          >
            All Notices
          </button>
        </div>

        <div className="space-y-3">
          {notices.slice(0, 2).map((notice: any) => (
            <div key={notice.id} className="p-3.5 bg-stone-50 border border-stone-200 rounded-lg">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-stone-900">{notice.title}</h4>
                <StatusBadge status={notice.priority} />
              </div>
              <p className="text-xs text-stone-600 mt-1">{notice.content}</p>
              <div className="text-[11px] text-stone-400 mt-2">
                Posted {new Date(notice.createdAt).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
