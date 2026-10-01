import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Modal } from '../common/Modal';
import { StatusBadge } from '../common/Badge';
import {
  DoorClosed,
  Plus,
  Edit2,
  Trash2,
  ArrowRightLeft,
  Bed as BedIcon,
  User,
  CheckCircle2,
  AlertCircle,
  Filter,
} from 'lucide-react';
import type { Room, RoomType, Resident } from '../../types';

export const RoomManagement: React.FC = () => {
  const [rooms, setRooms] = useState<any[]>([]);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<any | null>(null);

  // Filter state
  const [floorFilter, setFloorFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Form states
  const [formData, setFormData] = useState<{
    roomNumber: string;
    floor: number;
    roomType: RoomType;
    totalBeds: number;
    monthlyRent: number;
    amenities: string;
    notes: string;
  }>({
    roomNumber: '',
    floor: 1,
    roomType: 'Double',
    totalBeds: 2,
    monthlyRent: 400,
    amenities: 'Air Conditioning, Wi-Fi, Attached Bathroom',
    notes: '',
  });

  // Transfer state
  const [transferData, setTransferData] = useState({
    residentId: '',
    targetRoomId: '',
    targetBedId: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [roomsData, resData] = await Promise.all([
        api.getRooms(),
        api.getResidents({ status: 'active' }),
      ]);
      setRooms(roomsData);
      setResidents(resData);
    } catch (err: any) {
      setError(err.message || 'Failed to load rooms.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setFormData({
      roomNumber: '',
      floor: 1,
      roomType: 'Double',
      totalBeds: 2,
      monthlyRent: 400,
      amenities: 'Air Conditioning, Wi-Fi, Attached Bathroom',
      notes: '',
    });
    setIsAddOpen(true);
  };

  const handleOpenEdit = (room: any) => {
    setSelectedRoom(room);
    setFormData({
      roomNumber: room.roomNumber,
      floor: room.floor,
      roomType: room.roomType,
      totalBeds: room.totalBeds,
      monthlyRent: room.monthlyRent,
      amenities: Array.isArray(room.amenities) ? room.amenities.join(', ') : '',
      notes: room.notes || '',
    });
    setIsEditOpen(true);
  };

  const handleOpenTransfer = (defaultResidentId?: string) => {
    setTransferData({
      residentId: defaultResidentId || (residents?.[0]?.id || ''),
      targetRoomId: rooms?.[0]?.id || '',
      targetBedId: '',
    });
    setIsTransferOpen(true);
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createRoom({
        ...formData,
        amenities: formData.amenities.split(',').map(s => s.trim()).filter(Boolean),
      });
      setIsAddOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Error creating room');
    }
  };

  const handleUpdateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoom) return;
    try {
      await api.updateRoom(selectedRoom.id, {
        ...formData,
        amenities: formData.amenities.split(',').map(s => s.trim()).filter(Boolean),
      });
      setIsEditOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Error updating room');
    }
  };

  const handleDeleteRoom = async (room: any) => {
    if (room.occupiedBeds > 0) {
      alert(`Cannot delete Room ${room.roomNumber} while ${room.occupiedBeds} bed(s) are occupied! Please transfer or vacate the residents first.`);
      return;
    }
    if (window.confirm(`Are you sure you want to delete Room ${room.roomNumber}?`)) {
      try {
        await api.deleteRoom(room.id);
        fetchData();
      } catch (err: any) {
        alert(err.message || 'Error deleting room');
      }
    }
  };

  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferData.residentId || !transferData.targetRoomId || !transferData.targetBedId) {
      alert('Please select resident, target room, and target bed.');
      return;
    }
    try {
      await api.transferResident(transferData);
      setIsTransferOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Transfer failed');
    }
  };

  // Filtered rooms
  const filteredRooms = rooms.filter(r => {
    if (floorFilter !== 'all' && String(r.floor) !== floorFilter) return false;
    if (typeFilter !== 'all' && r.roomType.toLowerCase() !== typeFilter.toLowerCase()) return false;
    return true;
  });

  // Get available beds for selected target room in transfer modal
  const targetRoomObj = rooms.find(r => r.id === transferData.targetRoomId);
  const availableTargetBeds = targetRoomObj?.beds?.filter((b: any) => b.status === 'available') || [];

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-xl border border-stone-200 shadow-2xs">
        <div>
          <h2 className="text-xl font-bold text-stone-900 tracking-tight">Room & Bed Management</h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Configure room inventory, track bed occupancy, and transfer residents
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            id="transfer-resident-btn"
            onClick={() => handleOpenTransfer()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors"
          >
            <ArrowRightLeft className="w-3.5 h-3.5 text-stone-600" />
            Transfer Resident
          </button>
          <button
            id="add-room-btn"
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-2xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add New Room
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white px-4 py-3 rounded-lg border border-stone-200 text-xs">
        <div className="flex items-center gap-2 text-stone-600">
          <Filter className="w-4 h-4 text-stone-400" />
          <span className="font-semibold">Filter Inventory:</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <label className="text-stone-500 font-medium">Floor:</label>
            <select
              id="room-floor-filter"
              value={floorFilter}
              onChange={e => setFloorFilter(e.target.value)}
              className="px-2.5 py-1 border border-stone-300 rounded-md bg-stone-50 text-stone-800 font-medium"
            >
              <option value="all">All Floors</option>
              <option value="1">Floor 1</option>
              <option value="2">Floor 2</option>
              <option value="3">Floor 3</option>
              <option value="4">Floor 4</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <label className="text-stone-500 font-medium">Type:</label>
            <select
              id="room-type-filter"
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className="px-2.5 py-1 border border-stone-300 rounded-md bg-stone-50 text-stone-800 font-medium"
            >
              <option value="all">All Types</option>
              <option value="single">Single</option>
              <option value="double">Double</option>
              <option value="triple">Triple</option>
              <option value="deluxe">Deluxe</option>
            </select>
          </div>
        </div>
      </div>

      {/* Rooms Grid */}
      {loading ? (
        <div className="p-12 text-center text-xs text-stone-500">Loading room inventory...</div>
      ) : filteredRooms.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-xl border border-stone-200 text-xs text-stone-500">
          No rooms match the selected filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredRooms.map(room => {
            const isFull = room.availableBeds === 0;
            return (
              <div
                key={room.id}
                id={`room-card-${room.roomNumber}`}
                className="bg-white rounded-xl border border-stone-200 shadow-2xs overflow-hidden flex flex-col justify-between"
              >
                {/* Room Card Header */}
                <div className="p-5 border-b border-stone-100">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-stone-100 text-stone-700">
                          Floor {room.floor}
                        </span>
                        <StatusBadge status={room.roomType} />
                        {isFull ? (
                          <span className="text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                            Full
                          </span>
                        ) : (
                          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            {room.availableBeds} Available
                          </span>
                        )}
                      </div>
                      <h3 className="text-xl font-bold text-stone-900 mt-2">Room {room.roomNumber}</h3>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-medium text-stone-400">Monthly Rent</div>
                      <div className="text-lg font-bold font-mono text-emerald-700">${room.monthlyRent}</div>
                    </div>
                  </div>

                  {/* Amenities Tags */}
                  <div className="mt-3 flex flex-wrap gap-1">
                    {room.amenities?.map((amenity: string, idx: number) => (
                      <span
                        key={idx}
                        className="text-[11px] px-2 py-0.5 bg-stone-50 border border-stone-200 text-stone-600 rounded"
                      >
                        {amenity}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Bed Layout Visualizer */}
                <div className="p-5 bg-stone-50/60 flex-1">
                  <div className="text-xs font-semibold text-stone-600 mb-3 flex items-center justify-between">
                    <span>Bed Occupancy ({room.occupiedBeds}/{room.totalBeds})</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    {room.beds?.map((bed: any) => {
                      const isOccupied = bed.status === 'occupied';
                      return (
                        <div
                          key={bed.id}
                          className={`p-2.5 rounded-lg border text-xs flex flex-col justify-between transition-colors ${
                            isOccupied
                              ? 'bg-white border-amber-200 shadow-2xs'
                              : 'bg-emerald-50/50 border-emerald-200 text-emerald-900'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold flex items-center gap-1">
                              <BedIcon className="w-3.5 h-3.5 text-stone-500" />
                              Bed #{bed.bedNumber}
                            </span>
                            {isOccupied ? (
                              <span className="w-2 h-2 rounded-full bg-amber-500" title="Occupied" />
                            ) : (
                              <span className="w-2 h-2 rounded-full bg-emerald-500" title="Available" />
                            )}
                          </div>

                          <div className="mt-2 text-[11px]">
                            {isOccupied && bed.resident ? (
                              <div className="flex items-center gap-1.5 text-stone-800 font-medium">
                                <User className="w-3 h-3 text-stone-400" />
                                <span className="truncate">{bed.resident.fullName}</span>
                              </div>
                            ) : (
                              <span className="text-emerald-700 font-medium">Available</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="px-5 py-3 border-t border-stone-100 flex items-center justify-end gap-2 bg-white">
                  <button
                    onClick={() => handleOpenEdit(room)}
                    className="p-1.5 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-md transition-colors"
                    title="Edit Room"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteRoom(room)}
                    className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                    title="Delete Room"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Add Room */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Add New Room" subtitle="Configure room details and beds">
        <form onSubmit={handleCreateRoom} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700">Room Number *</label>
              <input
                type="text"
                value={formData.roomNumber}
                onChange={e => setFormData({ ...formData, roomNumber: e.target.value })}
                placeholder="e.g. 105"
                className="mt-1 block w-full px-3 py-2 text-sm border border-stone-300 rounded-lg text-stone-900"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700">Floor *</label>
              <input
                type="number"
                min="0"
                max="20"
                value={formData.floor}
                onChange={e => setFormData({ ...formData, floor: Number(e.target.value) })}
                className="mt-1 block w-full px-3 py-2 text-sm border border-stone-300 rounded-lg text-stone-900"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700">Room Type *</label>
              <select
                value={formData.roomType}
                onChange={e => setFormData({ ...formData, roomType: e.target.value as RoomType })}
                className="mt-1 block w-full px-3 py-2 text-sm border border-stone-300 rounded-lg text-stone-900 bg-white"
              >
                <option value="Single">Single</option>
                <option value="Double">Double</option>
                <option value="Triple">Triple</option>
                <option value="Dormitory">Dormitory</option>
                <option value="Deluxe">Deluxe</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700">Total Beds *</label>
              <input
                type="number"
                min="1"
                max="10"
                value={formData.totalBeds}
                onChange={e => setFormData({ ...formData, totalBeds: Number(e.target.value) })}
                className="mt-1 block w-full px-3 py-2 text-sm border border-stone-300 rounded-lg text-stone-900"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700">Monthly Rent ($) *</label>
              <input
                type="number"
                min="0"
                value={formData.monthlyRent}
                onChange={e => setFormData({ ...formData, monthlyRent: Number(e.target.value) })}
                className="mt-1 block w-full px-3 py-2 text-sm border border-stone-300 rounded-lg text-stone-900"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700">Amenities (comma-separated)</label>
            <input
              type="text"
              value={formData.amenities}
              onChange={e => setFormData({ ...formData, amenities: e.target.value })}
              placeholder="Air Conditioning, Attached Bath, Wi-Fi, Balcony"
              className="mt-1 block w-full px-3 py-2 text-sm border border-stone-300 rounded-lg text-stone-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700">Notes / Orientation</label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              placeholder="e.g. Garden facing, study desk included"
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
              Save Room
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Edit Room */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title={`Edit Room ${selectedRoom?.roomNumber}`}>
        <form onSubmit={handleUpdateRoom} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700">Room Number *</label>
              <input
                type="text"
                value={formData.roomNumber}
                onChange={e => setFormData({ ...formData, roomNumber: e.target.value })}
                className="mt-1 block w-full px-3 py-2 text-sm border border-stone-300 rounded-lg text-stone-900"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700">Floor *</label>
              <input
                type="number"
                value={formData.floor}
                onChange={e => setFormData({ ...formData, floor: Number(e.target.value) })}
                className="mt-1 block w-full px-3 py-2 text-sm border border-stone-300 rounded-lg text-stone-900"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700">Room Type *</label>
              <select
                value={formData.roomType}
                onChange={e => setFormData({ ...formData, roomType: e.target.value as RoomType })}
                className="mt-1 block w-full px-3 py-2 text-sm border border-stone-300 rounded-lg text-stone-900 bg-white"
              >
                <option value="Single">Single</option>
                <option value="Double">Double</option>
                <option value="Triple">Triple</option>
                <option value="Dormitory">Dormitory</option>
                <option value="Deluxe">Deluxe</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700">Total Beds *</label>
              <input
                type="number"
                min={selectedRoom?.occupiedBeds || 1}
                value={formData.totalBeds}
                onChange={e => setFormData({ ...formData, totalBeds: Number(e.target.value) })}
                className="mt-1 block w-full px-3 py-2 text-sm border border-stone-300 rounded-lg text-stone-900"
                required
              />
            </div>
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
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700">Amenities</label>
            <input
              type="text"
              value={formData.amenities}
              onChange={e => setFormData({ ...formData, amenities: e.target.value })}
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
              Update Room
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Transfer Resident */}
      <Modal isOpen={isTransferOpen} onClose={() => setIsTransferOpen(false)} title="Transfer Resident to Another Room">
        <form onSubmit={handleTransferSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700">Select Resident *</label>
            <select
              value={transferData.residentId}
              onChange={e => setTransferData({ ...transferData, residentId: e.target.value })}
              className="mt-1 block w-full px-3 py-2 text-sm border border-stone-300 rounded-lg text-stone-900 bg-white"
              required
            >
              {residents.map(res => (
                <option key={res.id} value={res.id}>
                  {res.fullName} (Currently Room {res.roomNumber}, Bed #{res.bedNumber})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700">Select Target Room *</label>
            <select
              value={transferData.targetRoomId}
              onChange={e => setTransferData({ ...transferData, targetRoomId: e.target.value, targetBedId: '' })}
              className="mt-1 block w-full px-3 py-2 text-sm border border-stone-300 rounded-lg text-stone-900 bg-white"
              required
            >
              {rooms.map(room => (
                <option key={room.id} value={room.id}>
                  Room {room.roomNumber} - Floor {room.floor} ({room.availableBeds} beds available) - ${room.monthlyRent}/mo
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700">Select Available Bed *</label>
            {availableTargetBeds.length === 0 ? (
              <p className="mt-1 text-xs text-rose-600 font-medium">No available beds in this room! Please select another room.</p>
            ) : (
              <select
                value={transferData.targetBedId}
                onChange={e => setTransferData({ ...transferData, targetBedId: e.target.value })}
                className="mt-1 block w-full px-3 py-2 text-sm border border-stone-300 rounded-lg text-stone-900 bg-white"
                required
              >
                <option value="">-- Choose Bed --</option>
                {availableTargetBeds.map((b: any) => (
                  <option key={b.id} value={b.id}>
                    Bed #{b.bedNumber} (Available)
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setIsTransferOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={availableTargetBeds.length === 0 || !transferData.targetBedId}
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg disabled:opacity-50"
            >
              Confirm Transfer
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
