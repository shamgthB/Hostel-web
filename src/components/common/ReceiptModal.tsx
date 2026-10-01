import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { Printer, CheckCircle, Clock } from 'lucide-react';
import { api } from '../../services/api';
import type { ReceiptData } from '../../types';

interface ReceiptModalProps {
  isOpen?: boolean;
  onClose: () => void;
  receipt?: ReceiptData | null;
  paymentId?: string | null;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ isOpen, onClose, receipt: propReceipt, paymentId }) => {
  const [receipt, setReceipt] = useState<ReceiptData | null>(propReceipt || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isModalOpen = isOpen !== undefined ? isOpen : Boolean(paymentId);

  useEffect(() => {
    if (propReceipt) {
      setReceipt(propReceipt);
      setError(null);
    } else if (paymentId) {
      setLoading(true);
      setError(null);
      api.getReceipt(paymentId)
        .then(data => {
          setReceipt(data);
        })
        .catch(err => {
          console.error('Failed to load receipt:', err);
          setError('Unable to load receipt details.');
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setReceipt(null);
    }
  }, [paymentId, propReceipt]);

  if (!isModalOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isModalOpen}
      onClose={onClose}
      title="Hostel Fee Receipt"
      subtitle={receipt ? `Official Receipt #${receipt.receiptNumber}` : undefined}
      maxWidth="2xl"
    >
      {loading ? (
        <div className="p-12 text-center text-xs text-stone-500">
          <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          Generating computerized receipt...
        </div>
      ) : error || !receipt ? (
        <div className="p-6 text-center text-xs text-rose-600">
          {error || 'Receipt details could not be found.'}
        </div>
      ) : (
        <div className="space-y-6">
        {/* Printable Receipt Container */}
        <div
          id="printable-receipt"
          className="p-6 sm:p-8 bg-white border border-stone-200 rounded-xl shadow-xs text-stone-800 space-y-6 print:border-none print:p-0 print:shadow-none"
        >
          {/* Top Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-6 border-b border-stone-200 gap-4">
            <div>
              <span className="text-xs uppercase font-bold tracking-widest text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded">
                Official Receipt
              </span>
              <h2 className="text-2xl font-bold text-stone-900 mt-2">{receipt.hostel.name}</h2>
              <p className="text-xs text-stone-500 mt-0.5">{receipt.hostel.address}</p>
              <p className="text-xs text-stone-500">Phone: {receipt.hostel.phone}</p>
            </div>
            <div className="text-left sm:text-right">
              <div className="text-xs text-stone-400 font-medium">Receipt No.</div>
              <div className="font-mono text-base font-bold text-stone-900">{receipt.receiptNumber}</div>
              <div className="text-xs text-stone-500 mt-1">Date: {receipt.paymentDate}</div>
              <div className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border">
                {receipt.status === 'Paid' ? (
                  <span className="text-emerald-700 bg-emerald-50 border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> PAID IN FULL
                  </span>
                ) : (
                  <span className="text-amber-700 bg-amber-50 border-amber-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> {receipt.status.toUpperCase()}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Resident & Room Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-stone-50 rounded-lg text-sm">
            <div>
              <span className="text-xs font-medium text-stone-400 uppercase tracking-wider block">
                Resident Details
              </span>
              <p className="font-semibold text-stone-900 text-base mt-0.5">{receipt.resident.name}</p>
              <p className="text-stone-600 text-xs mt-0.5">Mobile: {receipt.resident.phone}</p>
              <p className="text-stone-600 text-xs">ID No: {receipt.resident.idNumber}</p>
            </div>
            <div>
              <span className="text-xs font-medium text-stone-400 uppercase tracking-wider block">
                Accommodation Details
              </span>
              <p className="font-semibold text-stone-900 text-base mt-0.5">
                Room {receipt.resident.roomNumber} &bull; Bed #{receipt.resident.bedNumber}
              </p>
              <p className="text-stone-600 text-xs mt-0.5">Billing Period: {receipt.monthYear}</p>
              <p className="text-stone-600 text-xs">Method: {receipt.paymentMethod}</p>
            </div>
          </div>

          {/* Itemized Table */}
          <div>
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="border-b border-stone-200 text-stone-500 text-xs uppercase">
                  <th className="py-2.5 font-medium">Description</th>
                  <th className="py-2.5 font-medium text-right">Amount Due</th>
                  <th className="py-2.5 font-medium text-right">Amount Paid</th>
                  <th className="py-2.5 font-medium text-right">Balance Due</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                <tr>
                  <td className="py-3 font-medium text-stone-800">
                    Hostel Accommodation & Maintenance Fee ({receipt.monthYear})
                    <span className="block text-xs text-stone-400 font-normal mt-0.5">{receipt.notes}</span>
                  </td>
                  <td className="py-3 text-right font-mono text-stone-600">${receipt.amountDue.toFixed(2)}</td>
                  <td className="py-3 text-right font-mono font-semibold text-emerald-600">
                    ${receipt.amountPaid.toFixed(2)}
                  </td>
                  <td className="py-3 text-right font-mono font-semibold text-stone-900">
                    ${receipt.remainingAmount.toFixed(2)}
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-stone-200">
                  <td colSpan={2} className="py-3 font-semibold text-stone-900 text-right pr-4">
                    Total Collected:
                  </td>
                  <td className="py-3 text-right font-mono font-bold text-lg text-emerald-700">
                    ${receipt.amountPaid.toFixed(2)}
                  </td>
                  <td className="py-3 text-right font-mono font-bold text-stone-800">
                    ${receipt.remainingAmount.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Stamp & Authorized Signature */}
          <div className="pt-6 border-t border-stone-200 flex flex-col sm:flex-row justify-between items-end gap-6">
            <div className="text-xs text-stone-500 max-w-xs space-y-1">
              <p className="font-semibold text-stone-700">Terms & Notes:</p>
              <p>
                Fees are payable in advance on or before the 5th of each month. Retain this computerized receipt for
                your records.
              </p>
            </div>
            <div className="text-center sm:text-right w-48">
              <div className="border-b border-stone-400 h-10 w-full mb-1"></div>
              <p className="text-xs font-semibold text-stone-900">{receipt.hostel.adminName}</p>
              <p className="text-[11px] text-stone-500">Authorized Signatory / Warden</p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-end gap-3 pt-2 print:hidden">
          <button
            id="close-receipt-btn"
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors"
          >
            Close
          </button>
          <button
            id="print-receipt-btn"
            type="button"
            onClick={handlePrint}
            className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg flex items-center gap-2 shadow-xs transition-colors"
          >
            <Printer className="w-4 h-4" />
            Print Receipt
          </button>
        </div>
      </div>
      )}
    </Modal>
  );
};
