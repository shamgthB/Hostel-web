import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { StatusBadge } from '../common/Badge';
import { Receipt, DollarSign, Calendar, CheckCircle2, Clock, ShieldCheck } from 'lucide-react';

interface ResidentFeesProps {
  onOpenReceipt: (paymentId: string) => void;
}

export const ResidentFees: React.FC<ResidentFeesProps> = ({ onOpenReceipt }) => {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const data = await api.getPayments();
      setPayments(data);
    } catch (err: any) {
      console.error('Failed to load payments:', err);
    } finally {
      setLoading(false);
    }
  };

  const totalPaid = payments.reduce((sum, p) => sum + p.amountPaid, 0);
  const totalPending = payments.reduce((sum, p) => sum + p.remainingAmount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-2xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-stone-900 tracking-tight">Fee Ledger & Payment Receipts</h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Access your full rental transaction history and download official hostel receipts
          </p>
        </div>

        {/* Quick summary */}
        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs">
            <span className="text-stone-500">Total Paid: </span>
            <strong className="font-mono text-emerald-800">${totalPaid.toLocaleString()}</strong>
          </div>
          {totalPending > 0 && (
            <div className="px-3 py-1.5 bg-rose-50 border border-rose-200 rounded-lg text-xs">
              <span className="text-stone-500">Balance Due: </span>
              <strong className="font-mono text-rose-800">${totalPending.toLocaleString()}</strong>
            </div>
          )}
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-stone-500">Loading fee records...</div>
        ) : payments.length === 0 ? (
          <div className="p-8 text-center text-xs text-stone-500">No rent records found on file.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">Receipt #</th>
                  <th className="py-3 px-4">Billing Month</th>
                  <th className="py-3 px-4">Amount Due</th>
                  <th className="py-3 px-4">Amount Paid</th>
                  <th className="py-3 px-4">Balance Due</th>
                  <th className="py-3 px-4">Payment Status</th>
                  <th className="py-3 px-4">Method & Date</th>
                  <th className="py-3 px-4 text-right">Official Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {payments.map(p => (
                  <tr key={p.id} className="hover:bg-stone-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-stone-900">
                      {p.receiptNumber}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-stone-800">
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
                      <button
                        onClick={() => onOpenReceipt(p.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md transition-colors"
                      >
                        <Receipt className="w-3.5 h-3.5" />
                        View Receipt
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
