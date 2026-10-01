import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Modal } from '../common/Modal';
import { StatusBadge } from '../common/Badge';
import {
  CreditCard,
  Plus,
  Search,
  Filter,
  Receipt,
  CheckCircle,
  Clock,
  Trash2,
  DollarSign,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import type { Payment, Resident, PaymentMethod, PaymentStatus } from '../../types';

interface FeeManagementProps {
  onOpenReceipt: (paymentId: string) => void;
}

export const FeeManagement: React.FC<FeeManagementProps> = ({ onOpenReceipt }) => {
  const [payments, setPayments] = useState<any[]>([]);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [monthFilter, setMonthFilter] = useState('all');

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any | null>(null);

  // Add form state
  const [formData, setFormData] = useState({
    residentId: '',
    monthYear: 'September 2026',
    amountDue: 400,
    amountPaid: 400,
    paymentMethod: 'UPI/Online',
    paymentDate: new Date().toISOString().split('T')[0],
    notes: 'Monthly room rent & maintenance fee',
  });

  // Edit payment form
  const [editFormData, setEditFormData] = useState({
    amountPaid: 0,
    paymentMethod: 'Cash' as PaymentMethod,
    paymentDate: new Date().toISOString().split('T')[0],
    status: 'Paid' as PaymentStatus,
    notes: '',
  });

  useEffect(() => {
    fetchData();
  }, [statusFilter, monthFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [payList, resList] = await Promise.all([
        api.getPayments({ status: statusFilter, monthYear: monthFilter, search }),
        api.getResidents({ status: 'active' }),
      ]);
      setPayments(payList);
      setResidents(resList);
    } catch (err: any) {
      console.error('Failed to load payments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData();
  };

  const handleOpenAdd = () => {
    const defaultRes = residents?.[0];
    setFormData({
      residentId: defaultRes?.id || '',
      monthYear: 'September 2026',
      amountDue: defaultRes?.monthlyRent || 400,
      amountPaid: defaultRes?.monthlyRent || 400,
      paymentMethod: 'UPI/Online',
      paymentDate: new Date().toISOString().split('T')[0],
      notes: 'Monthly room rent & maintenance fee',
    });
    setIsAddOpen(true);
  };

  const handleOpenEdit = (p: any) => {
    setSelectedPayment(p);
    setEditFormData({
      amountPaid: p.amountPaid,
      paymentMethod: p.paymentMethod || 'Cash',
      paymentDate: p.paymentDate || new Date().toISOString().split('T')[0],
      status: p.status,
      notes: p.notes || '',
    });
    setIsEditOpen(true);
  };

  const handleCreatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.residentId) {
      alert('Please select a resident.');
      return;
    }
    try {
      await api.createPayment(formData);
      setIsAddOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to record payment');
    }
  };

  const handleUpdatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPayment) return;
    try {
      await api.updatePayment(selectedPayment.id, editFormData);
      setIsEditOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to update payment');
    }
  };

  const handleQuickMarkPaid = async (p: any) => {
    try {
      await api.updatePayment(p.id, {
        status: 'Paid',
        amountPaid: p.amountDue,
        paymentDate: new Date().toISOString().split('T')[0],
        paymentMethod: p.paymentMethod || 'Cash',
      });
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Error updating status');
    }
  };

  const handleDeletePayment = async (p: any) => {
    if (window.confirm(`Delete payment record #${p.receiptNumber}?`)) {
      try {
        await api.deletePayment(p.id);
        fetchData();
      } catch (err: any) {
        alert(err.message || 'Error deleting payment');
      }
    }
  };

  // Financial summary metrics
  const totalCollected = payments.reduce((sum, p) => sum + p.amountPaid, 0);
  const totalDue = payments.reduce((sum, p) => sum + p.amountDue, 0);
  const totalPending = payments.reduce((sum, p) => sum + p.remainingAmount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-xl border border-stone-200 shadow-2xs">
        <div>
          <h2 className="text-xl font-bold text-stone-900 tracking-tight">Fee & Payment Records</h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Track monthly rents, collections, pending balances, and issue official receipts
          </p>
        </div>
        <button
          id="record-payment-btn"
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-2xs transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Record New Payment / Invoice
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Total Collected</span>
            <div className="text-2xl font-bold font-mono text-emerald-700 mt-1">${totalCollected.toLocaleString()}</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Total Pending</span>
            <div className="text-2xl font-bold font-mono text-rose-600 mt-1">${totalPending.toLocaleString()}</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
            <TrendingDown className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Total Invoiced</span>
            <div className="text-2xl font-bold font-mono text-stone-900 mt-1">${totalDue.toLocaleString()}</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-stone-100 text-stone-700 flex items-center justify-center border border-stone-200">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs flex flex-col sm:flex-row gap-3 items-center justify-between text-xs">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
          <input
            id="fee-search-input"
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by resident name, receipt #, room..."
            className="w-full pl-9 pr-3 py-1.5 border border-stone-300 rounded-lg text-stone-900 bg-stone-50/50"
          />
        </form>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <div className="flex items-center gap-1.5">
            <span className="text-stone-500 font-medium">Status:</span>
            <select
              id="fee-status-filter"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 border border-stone-300 rounded-md bg-stone-50 text-stone-800 font-medium"
            >
              <option value="all">All Status</option>
              <option value="Paid">Paid</option>
              <option value="Pending">Pending</option>
              <option value="Partial">Partial</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-stone-500 font-medium">Month:</span>
            <select
              id="fee-month-filter"
              value={monthFilter}
              onChange={e => setMonthFilter(e.target.value)}
              className="px-2.5 py-1.5 border border-stone-300 rounded-md bg-stone-50 text-stone-800 font-medium"
            >
              <option value="all">All Months</option>
              <option value="September 2026">September 2026</option>
              <option value="August 2026">August 2026</option>
              <option value="October 2026">October 2026</option>
            </select>
          </div>
        </div>
      </div>

      {/* Fees Table */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-stone-500">Loading payment records...</div>
        ) : payments.length === 0 ? (
          <div className="p-8 text-center text-xs text-stone-500">No payment records found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">Receipt #</th>
                  <th className="py-3 px-4">Resident & Room</th>
                  <th className="py-3 px-4">Period</th>
                  <th className="py-3 px-4">Due ($)</th>
                  <th className="py-3 px-4">Paid ($)</th>
                  <th className="py-3 px-4">Balance ($)</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Method & Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {payments.map(p => (
                  <tr key={p.id} className="hover:bg-stone-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-stone-900">
                      {p.receiptNumber}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-stone-900">{p.residentName}</div>
                      <div className="text-[11px] text-stone-400">Room {p.roomNumber} (Floor {p.floor})</div>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-stone-700">
                      {p.monthYear}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-stone-600">
                      ${p.amountDue}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-700">
                      ${p.amountPaid}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-rose-600">
                      ${p.remainingAmount}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-stone-800 font-medium">{p.paymentMethod || 'Unpaid'}</div>
                      <div className="text-[11px] text-stone-400 font-mono">{p.paymentDate || 'Pending'}</div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onOpenReceipt(p.id)}
                          title="Generate Receipt"
                          className="p-1.5 text-stone-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-md transition-colors"
                        >
                          <Receipt className="w-4 h-4" />
                        </button>
                        {p.status !== 'Paid' && (
                          <button
                            onClick={() => handleQuickMarkPaid(p)}
                            title="Mark as Paid"
                            className="p-1.5 text-stone-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenEdit(p)}
                          title="Edit Record"
                          className="px-2 py-1 text-[11px] font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-md"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeletePayment(p)}
                          title="Delete Record"
                          className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-md"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Record New Fee */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Record Fee / Monthly Bill">
        <form onSubmit={handleCreatePayment} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700">Resident *</label>
            <select
              value={formData.residentId}
              onChange={e => {
                const res = residents.find(r => r.id === e.target.value);
                setFormData({
                  ...formData,
                  residentId: e.target.value,
                  amountDue: res?.monthlyRent || formData.amountDue,
                  amountPaid: res?.monthlyRent || formData.amountPaid,
                });
              }}
              className="mt-1 block w-full px-3 py-2 text-sm border border-stone-300 rounded-lg text-stone-900 bg-white"
              required
            >
              {residents.map(r => (
                <option key={r.id} value={r.id}>
                  {r.fullName} (Room {r.roomNumber}) - Rent ${r.monthlyRent}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700">Month & Year *</label>
              <input
                type="text"
                value={formData.monthYear}
                onChange={e => setFormData({ ...formData, monthYear: e.target.value })}
                placeholder="e.g. October 2026"
                className="mt-1 block w-full px-3 py-2 text-sm border border-stone-300 rounded-lg text-stone-900"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700">Amount Due ($) *</label>
              <input
                type="number"
                value={formData.amountDue}
                onChange={e => setFormData({ ...formData, amountDue: Number(e.target.value) })}
                className="mt-1 block w-full px-3 py-2 text-sm border border-stone-300 rounded-lg text-stone-900"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700">Amount Paid Now ($) *</label>
              <input
                type="number"
                value={formData.amountPaid}
                onChange={e => setFormData({ ...formData, amountPaid: Number(e.target.value) })}
                className="mt-1 block w-full px-3 py-2 text-sm border border-stone-300 rounded-lg text-stone-900"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700">Payment Method</label>
              <select
                value={formData.paymentMethod}
                onChange={e => setFormData({ ...formData, paymentMethod: e.target.value })}
                className="mt-1 block w-full px-3 py-2 text-sm border border-stone-300 rounded-lg text-stone-900 bg-white"
              >
                <option value="UPI/Online">UPI / Online</option>
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Card">Credit / Debit Card</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700">Payment Date</label>
            <input
              type="date"
              value={formData.paymentDate}
              onChange={e => setFormData({ ...formData, paymentDate: e.target.value })}
              className="mt-1 block w-full px-3 py-2 text-sm border border-stone-300 rounded-lg text-stone-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700">Notes / Memo</label>
            <input
              type="text"
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              placeholder="e.g. Paid in full via GPay"
              className="mt-1 block w-full px-3 py-2 text-sm border border-stone-300 rounded-lg text-stone-900"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg"
            >
              Save Fee Record
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Edit Payment */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title={`Update Payment #${selectedPayment?.receiptNumber}`}>
        <form onSubmit={handleUpdatePayment} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700">Amount Paid ($)</label>
              <input
                type="number"
                value={editFormData.amountPaid}
                onChange={e => setEditFormData({ ...editFormData, amountPaid: Number(e.target.value) })}
                className="mt-1 block w-full px-3 py-2 text-sm border border-stone-300 rounded-lg text-stone-900"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700">Status</label>
              <select
                value={editFormData.status}
                onChange={e => setEditFormData({ ...editFormData, status: e.target.value as PaymentStatus })}
                className="mt-1 block w-full px-3 py-2 text-sm border border-stone-300 rounded-lg text-stone-900 bg-white"
              >
                <option value="Paid">Paid</option>
                <option value="Partial">Partial</option>
                <option value="Pending">Pending</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700">Payment Method</label>
              <select
                value={editFormData.paymentMethod}
                onChange={e => setEditFormData({ ...editFormData, paymentMethod: e.target.value as PaymentMethod })}
                className="mt-1 block w-full px-3 py-2 text-sm border border-stone-300 rounded-lg text-stone-900 bg-white"
              >
                <option value="UPI/Online">UPI / Online</option>
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Card">Card</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700">Payment Date</label>
              <input
                type="date"
                value={editFormData.paymentDate}
                onChange={e => setEditFormData({ ...editFormData, paymentDate: e.target.value })}
                className="mt-1 block w-full px-3 py-2 text-sm border border-stone-300 rounded-lg text-stone-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700">Notes</label>
            <input
              type="text"
              value={editFormData.notes}
              onChange={e => setEditFormData({ ...editFormData, notes: e.target.value })}
              className="mt-1 block w-full px-3 py-2 text-sm border border-stone-300 rounded-lg text-stone-900"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setIsEditOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg"
            >
              Update Record
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
