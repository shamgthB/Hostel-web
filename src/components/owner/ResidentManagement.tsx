import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Modal } from '../common/Modal';
import { StatusBadge } from '../common/Badge';
import {
  Users,
  Plus,
  Search,
  Filter,
  Eye,
  Edit2,
  UserX,
  Phone,
  Mail,
  MapPin,
  Calendar,
  CreditCard,
  AlertCircle,
  Copy,
  Check,
  Building,
} from 'lucide-react';
import type { Resident, Room } from '../../types';

export const ResidentManagement: React.FC = () => {
  const [residents, setResidents] = useState<Resident[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [credentialsModal, setCredentialsModal] = useState<{
    isOpen: boolean;
    credentials: any;
    residentName: string;
  }>({
    isOpen: false,
    credentials: null,
    residentName: '',
  });

  const [selectedResident, setSelectedResident] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);

  // Add/Edit Form state
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    mobileNumber: '',
    emergencyContact: '',
    permanentAddress: '',
    city: '',
    idType: 'National ID / Passport',
    idNumber: '',
    joiningDate: new Date().toISOString().split('T')[0],
    roomId: '',
    bedId: '',
    monthlyRent: 400,
    securityDeposit: 800,
    profilePhoto: '',
    notes: '',
    status: 'active',
  });

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resList, roomsList] = await Promise.all([
        api.getResidents({ status: statusFilter, search }),
        api.getRooms(),
      ]);
      setResidents(resList);
      setRooms(roomsList);
    } catch (err: any) {
      console.error('Error fetching residents:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData();
  };

  const handleOpenAdd = () => {
    const firstAvailableRoom = rooms?.find(r => r.availableBeds > 0) || rooms?.[0];
    const availableBed = firstAvailableRoom?.beds?.find((b: any) => b.status === 'available');

    setFormData({
      fullName: '',
      email: '',
      mobileNumber: '',
      emergencyContact: '',
      permanentAddress: '',
      city: '',
      idType: 'National ID / Passport',
      idNumber: '',
      joiningDate: new Date().toISOString().split('T')[0],
      roomId: firstAvailableRoom?.id || '',
      bedId: availableBed?.id || '',
      monthlyRent: firstAvailableRoom?.monthlyRent || 400,
      securityDeposit: (firstAvailableRoom?.monthlyRent || 400) * 2,
      profilePhoto: `https://images.unsplash.com/photo-${1534528741775 + Math.floor(Math.random() * 500)}?w=150&auto=format&fit=crop&q=80`,
      notes: '',
      status: 'active',
    });
    setIsAddOpen(true);
  };

  const handleOpenEdit = (res: Resident) => {
    setSelectedResident(res);
    setFormData({
      fullName: res.fullName,
      email: res.email,
      mobileNumber: res.mobileNumber,
      emergencyContact: res.emergencyContact,
      permanentAddress: res.permanentAddress,
      city: res.city,
      idType: res.idType,
      idNumber: res.idNumber,
      joiningDate: res.joiningDate,
      roomId: res.roomId,
      bedId: res.bedId,
      monthlyRent: res.monthlyRent,
      securityDeposit: res.securityDeposit,
      profilePhoto: res.profilePhoto || '',
      notes: res.notes || '',
      status: res.status,
    });
    setIsEditOpen(true);
  };

  const handleOpenDetails = async (res: Resident) => {
    try {
      const fullRes = await api.getResidentById(res.id);
      setSelectedResident(fullRes);
      setIsDetailsOpen(true);
    } catch (err: any) {
      alert(err.message || 'Failed to load details');
    }
  };

  const handleCreateResident = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await api.createResident(formData);
      setIsAddOpen(false);
      fetchData();
      // Show credentials popup so owner can copy and provide to resident
      setCredentialsModal({
        isOpen: true,
        credentials: response.generatedCredentials,
        residentName: response.resident.fullName,
      });
    } catch (err: any) {
      alert(err.message || 'Failed to add resident');
    }
  };

  const handleUpdateResident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedResident) return;
    try {
      await api.updateResident(selectedResident.id, formData);
      setIsEditOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to update resident');
    }
  };

  const handleRemoveResident = async (res: Resident) => {
    if (
      window.confirm(
        `Vacate resident ${res.fullName}? Their bed in Room ${res.roomNumber} will be freed to 'available'.`
      )
    ) {
      try {
        await api.removeResident(res.id);
        fetchData();
      } catch (err: any) {
        alert(err.message || 'Failed to vacate resident');
      }
    }
  };

  // Rooms and bed helpers for form
  const selectedRoomForForm = rooms.find(r => r.id === formData.roomId);
  const availableBedsForForm =
    selectedRoomForForm?.beds?.filter(
      (b: any) => b.status === 'available' || (selectedResident && b.id === selectedResident.bedId)
    ) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-xl border border-stone-200 shadow-2xs">
        <div>
          <h2 className="text-xl font-bold text-stone-900 tracking-tight">Resident Directory</h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Manage tenant enrollments, room assignments, documents, and contact profiles
          </p>
        </div>
        <button
          id="add-resident-btn"
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-2xs transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Resident
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
          <input
            id="resident-search-input"
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email, phone, city..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-stone-300 rounded-lg text-stone-900 bg-stone-50/50"
          />
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <span className="text-xs text-stone-500 font-medium">Status:</span>
          <select
            id="resident-status-filter"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs border border-stone-300 rounded-md bg-stone-50 text-stone-800 font-medium"
          >
            <option value="all">All Residents</option>
            <option value="active">Active Residents</option>
            <option value="left">Vacated / Left</option>
          </select>
        </div>
      </div>

      {/* Residents Table */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-stone-500">Loading residents directory...</div>
        ) : residents.length === 0 ? (
          <div className="p-8 text-center text-xs text-stone-500">No resident records found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">Resident</th>
                  <th className="py-3 px-4">Room & Bed</th>
                  <th className="py-3 px-4">Contact Info</th>
                  <th className="py-3 px-4">Joining Date</th>
                  <th className="py-3 px-4">Monthly Rent</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {residents.map(res => (
                  <tr key={res.id} className="hover:bg-stone-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={res.profilePhoto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                          alt={res.fullName}
                          className="w-8 h-8 rounded-full object-cover border border-stone-200"
                        />
                        <div>
                          <div className="font-bold text-stone-900">{res.fullName}</div>
                          <div className="text-[11px] text-stone-400">{res.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-stone-800">
                        Room {res.roomNumber}
                      </div>
                      <div className="text-[11px] text-stone-500">Bed #{res.bedNumber} &bull; Floor {res.floor}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-stone-800 font-medium">{res.mobileNumber}</div>
                      <div className="text-[11px] text-stone-400">{res.city}</div>
                    </td>
                    <td className="py-3.5 px-4 text-stone-600 font-mono">
                      {res.joiningDate}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-700">
                      ${res.monthlyRent}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={res.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenDetails(res)}
                          title="View Resident Dossier"
                          className="p-1.5 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-md"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(res)}
                          title="Edit Resident"
                          className="p-1.5 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-md"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {res.status === 'active' && (
                          <button
                            onClick={() => handleRemoveResident(res)}
                            title="Vacate Resident"
                            className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-md"
                          >
                            <UserX className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Add Resident */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Register New Resident" maxWidth="2xl">
        <form onSubmit={handleCreateResident} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700">Full Name *</label>
              <input
                type="text"
                value={formData.fullName}
                onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="e.g. Alex Johnson"
                className="mt-1 block w-full px-3 py-2 text-sm border border-stone-300 rounded-lg text-stone-900"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700">Email Address (Login ID) *</label>
              <input
                type="email"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                placeholder="alex@example.com"
                className="mt-1 block w-full px-3 py-2 text-sm border border-stone-300 rounded-lg text-stone-900"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700">Mobile Number *</label>
              <input
                type="text"
                value={formData.mobileNumber}
                onChange={e => setFormData({ ...formData, mobileNumber: e.target.value })}
                placeholder="+1 555-0192"
                className="mt-1 block w-full px-3 py-2 text-sm border border-stone-300 rounded-lg text-stone-900"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700">Emergency Contact</label>
              <input
                type="text"
                value={formData.emergencyContact}
                onChange={e => setFormData({ ...formData, emergencyContact: e.target.value })}
                placeholder="+1 555-9988 (Parent / Guardian)"
                className="mt-1 block w-full px-3 py-2 text-sm border border-stone-300 rounded-lg text-stone-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700">Select Room *</label>
              <select
                value={formData.roomId}
                onChange={e => {
                  const targetRoom = rooms.find(r => r.id === e.target.value);
                  const firstAvailBed = targetRoom?.beds?.find((b: any) => b.status === 'available');
                  setFormData({
                    ...formData,
                    roomId: e.target.value,
                    bedId: firstAvailBed?.id || '',
                    monthlyRent: targetRoom?.monthlyRent || formData.monthlyRent,
                  });
                }}
                className="mt-1 block w-full px-3 py-2 text-sm border border-stone-300 rounded-lg text-stone-900 bg-white"
                required
              >
                {rooms.map(r => (
                  <option key={r.id} value={r.id}>
                    Room {r.roomNumber} - Floor {r.floor} ({r.availableBeds} beds available)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700">Select Bed *</label>
              <select
                value={formData.bedId}
                onChange={e => setFormData({ ...formData, bedId: e.target.value })}
                className="mt-1 block w-full px-3 py-2 text-sm border border-stone-300 rounded-lg text-stone-900 bg-white"
                required
              >
                <option value="">-- Choose Bed --</option>
                {availableBedsForForm.map((b: any) => (
                  <option key={b.id} value={b.id}>
                    Bed #{b.bedNumber} ({b.status})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700">Monthly Rent ($) *</label>
              <input
                type="number"
                value={formData.monthlyRent}
                onChange={e => setFormData({ ...formData, monthlyRent: Number(e.target.value) })}
                className="mt-1 block w-full px-3 py-2 text-sm border border-stone-300 rounded-lg text-stone-900"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700">Security Deposit ($)</label>
              <input
                type="number"
                value={formData.securityDeposit}
                onChange={e => setFormData({ ...formData, securityDeposit: Number(e.target.value) })}
                className="mt-1 block w-full px-3 py-2 text-sm border border-stone-300 rounded-lg text-stone-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700">Joining Date</label>
              <input
                type="date"
                value={formData.joiningDate}
                onChange={e => setFormData({ ...formData, joiningDate: e.target.value })}
                className="mt-1 block w-full px-3 py-2 text-sm border border-stone-300 rounded-lg text-stone-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700">ID / Document Type</label>
              <select
                value={formData.idType}
                onChange={e => setFormData({ ...formData, idType: e.target.value })}
                className="mt-1 block w-full px-3 py-2 text-sm border border-stone-300 rounded-lg text-stone-900 bg-white"
              >
                <option value="National ID / Passport">National ID / Passport</option>
                <option value="Driver's License">Driver's License</option>
                <option value="Student Card">Student Card</option>
                <option value="Aadhar / Resident Card">Aadhar / Resident Card</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700">ID / Document Number</label>
              <input
                type="text"
                value={formData.idNumber}
                onChange={e => setFormData({ ...formData, idNumber: e.target.value })}
                placeholder="e.g. DL-99201934"
                className="mt-1 block w-full px-3 py-2 text-sm border border-stone-300 rounded-lg text-stone-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700">City</label>
              <input
                type="text"
                value={formData.city}
                onChange={e => setFormData({ ...formData, city: e.target.value })}
                placeholder="e.g. Boston, MA"
                className="mt-1 block w-full px-3 py-2 text-sm border border-stone-300 rounded-lg text-stone-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700">Permanent Address</label>
              <input
                type="text"
                value={formData.permanentAddress}
                onChange={e => setFormData({ ...formData, permanentAddress: e.target.value })}
                placeholder="Home address"
                className="mt-1 block w-full px-3 py-2 text-sm border border-stone-300 rounded-lg text-stone-900"
              />
            </div>
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
              Complete Registration
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Edit Resident */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Resident Information">
        <form onSubmit={handleUpdateResident} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700">Full Name *</label>
            <input
              type="text"
              value={formData.fullName}
              onChange={e => setFormData({ ...formData, fullName: e.target.value })}
              className="mt-1 block w-full px-3 py-2 text-sm border border-stone-300 rounded-lg text-stone-900"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700">Mobile Number</label>
              <input
                type="text"
                value={formData.mobileNumber}
                onChange={e => setFormData({ ...formData, mobileNumber: e.target.value })}
                className="mt-1 block w-full px-3 py-2 text-sm border border-stone-300 rounded-lg text-stone-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700">Emergency Contact</label>
              <input
                type="text"
                value={formData.emergencyContact}
                onChange={e => setFormData({ ...formData, emergencyContact: e.target.value })}
                className="mt-1 block w-full px-3 py-2 text-sm border border-stone-300 rounded-lg text-stone-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700">Monthly Rent ($)</label>
              <input
                type="number"
                value={formData.monthlyRent}
                onChange={e => setFormData({ ...formData, monthlyRent: Number(e.target.value) })}
                className="mt-1 block w-full px-3 py-2 text-sm border border-stone-300 rounded-lg text-stone-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700">Resident Status</label>
              <select
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value })}
                className="mt-1 block w-full px-3 py-2 text-sm border border-stone-300 rounded-lg text-stone-900 bg-white"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="left">Left / Vacated</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700">Permanent Address</label>
            <input
              type="text"
              value={formData.permanentAddress}
              onChange={e => setFormData({ ...formData, permanentAddress: e.target.value })}
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
              Update Resident
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: View Full Resident Dossier */}
      <Modal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        title={selectedResident ? `${selectedResident.fullName}'s Profile` : 'Resident Details'}
        maxWidth="2xl"
      >
        {selectedResident && (
          <div className="space-y-5 text-sm">
            <div className="flex items-center gap-4 pb-4 border-b border-stone-200">
              <img
                src={selectedResident.profilePhoto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                alt={selectedResident.fullName}
                className="w-16 h-16 rounded-full object-cover border-2 border-emerald-500"
              />
              <div>
                <h3 className="text-lg font-bold text-stone-900">{selectedResident.fullName}</h3>
                <p className="text-xs text-stone-500">{selectedResident.email}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <StatusBadge status={selectedResident.status} />
                  <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-stone-100 text-stone-700">
                    Room {selectedResident.room?.roomNumber} &bull; Bed #{selectedResident.bed?.bedNumber}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs bg-stone-50 p-4 rounded-lg">
              <div>
                <span className="text-stone-400 block font-medium">Mobile:</span>
                <span className="font-semibold text-stone-800">{selectedResident.mobileNumber}</span>
              </div>
              <div>
                <span className="text-stone-400 block font-medium">Emergency Contact:</span>
                <span className="font-semibold text-stone-800">{selectedResident.emergencyContact || 'N/A'}</span>
              </div>
              <div>
                <span className="text-stone-400 block font-medium">Document ID:</span>
                <span className="font-semibold text-stone-800">
                  {selectedResident.idType}: {selectedResident.idNumber || 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-stone-400 block font-medium">Joining Date:</span>
                <span className="font-semibold text-stone-800">{selectedResident.joiningDate}</span>
              </div>
              <div>
                <span className="text-stone-400 block font-medium">Monthly Rent:</span>
                <span className="font-mono font-bold text-emerald-700">${selectedResident.monthlyRent}</span>
              </div>
              <div>
                <span className="text-stone-400 block font-medium">Security Deposit:</span>
                <span className="font-mono font-bold text-stone-800">${selectedResident.securityDeposit}</span>
              </div>
              <div className="col-span-2">
                <span className="text-stone-400 block font-medium">Permanent Address:</span>
                <span className="text-stone-700">{selectedResident.permanentAddress}, {selectedResident.city}</span>
              </div>
            </div>

            {/* Payment Records */}
            <div>
              <h4 className="font-semibold text-xs text-stone-800 uppercase tracking-wider mb-2">
                Payment History ({selectedResident.payments?.length || 0})
              </h4>
              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {selectedResident.payments?.map((p: any) => (
                  <div
                    key={p.id}
                    className="p-2.5 bg-stone-50 rounded-lg text-xs flex items-center justify-between"
                  >
                    <div>
                      <span className="font-semibold text-stone-900">{p.monthYear}</span>
                      <span className="text-stone-400 text-[11px] ml-2 font-mono">#{p.receiptNumber}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-emerald-700">${p.amountPaid}</span>
                      <StatusBadge status={p.status} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Complaints */}
            <div>
              <h4 className="font-semibold text-xs text-stone-800 uppercase tracking-wider mb-2">
                Filed Complaints ({selectedResident.complaints?.length || 0})
              </h4>
              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {selectedResident.complaints?.map((c: any) => (
                  <div
                    key={c.id}
                    className="p-2.5 bg-stone-50 rounded-lg text-xs flex items-center justify-between"
                  >
                    <span className="font-medium text-stone-900 truncate max-w-xs">{c.title}</span>
                    <StatusBadge status={c.status} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal: Generated Credentials */}
      <Modal
        isOpen={credentialsModal.isOpen}
        onClose={() => setCredentialsModal({ isOpen: false, credentials: null, residentName: '' })}
        title="Resident Login Credentials"
      >
        <div className="space-y-4 text-xs">
          <p className="text-stone-600">
            A resident account has been created for <strong className="text-stone-900">{credentialsModal.residentName}</strong>. Provide them with these login credentials so they can access their portal:
          </p>

          <div className="p-3 bg-stone-50 border border-stone-200 rounded-lg font-mono space-y-1.5 text-stone-800">
            <div>
              <span className="text-stone-400">Email: </span>
              <strong>{credentialsModal.credentials?.email}</strong>
            </div>
            <div>
              <span className="text-stone-400">Username: </span>
              <strong>{credentialsModal.credentials?.username}</strong>
            </div>
            <div>
              <span className="text-stone-400">Password: </span>
              <strong className="text-emerald-700">{credentialsModal.credentials?.temporaryPassword}</strong>
            </div>
          </div>

          <button
            onClick={() => {
              navigator.clipboard.writeText(
                `Login URL: ${window.location.origin}\nEmail: ${credentialsModal.credentials?.email}\nPassword: ${credentialsModal.credentials?.temporaryPassword}`
              );
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied to Clipboard!' : 'Copy Credentials'}
          </button>
        </div>
      </Modal>
    </div>
  );
};
