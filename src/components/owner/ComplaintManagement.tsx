import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Modal } from '../common/Modal';
import { StatusBadge } from '../common/Badge';
import { ImageLightbox } from '../common/ImageLightbox';
import {
  AlertCircle,
  Search,
  Filter,
  MessageSquare,
  Clock,
  CheckCircle2,
  Image as ImageIcon,
  Send,
  Calendar,
  User,
  DoorClosed,
} from 'lucide-react';
import type { Complaint, ComplaintStatus, ComplaintPriority } from '../../types';

export const ComplaintManagement: React.FC = () => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Response Modal & Lightbox
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [isResponseOpen, setIsResponseOpen] = useState(false);
  const [statusInput, setStatusInput] = useState<ComplaintStatus>('In Progress');
  const [priorityInput, setPriorityInput] = useState<ComplaintPriority>('Medium');
  const [responseText, setResponseText] = useState('');
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  useEffect(() => {
    fetchComplaints();
  }, [statusFilter, categoryFilter]);

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const data = await api.getComplaints({
        status: statusFilter,
        category: categoryFilter,
        search,
      });
      setComplaints(data);
    } catch (err: any) {
      console.error('Failed to fetch complaints:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchComplaints();
  };

  const handleOpenResponse = (c: Complaint) => {
    setSelectedComplaint(c);
    setStatusInput(c.status);
    setPriorityInput(c.priority);
    setResponseText(c.ownerResponse || '');
    setIsResponseOpen(true);
  };

  const handleSaveResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaint) return;
    try {
      await api.updateComplaint(selectedComplaint.id, {
        status: statusInput,
        priority: priorityInput,
        ownerResponse: responseText,
      });
      setIsResponseOpen(false);
      fetchComplaints();
    } catch (err: any) {
      alert(err.message || 'Failed to update complaint');
    }
  };

  const pendingCount = complaints.filter(c => c.status === 'Pending').length;
  const inProgressCount = complaints.filter(c => c.status === 'In Progress').length;
  const resolvedCount = complaints.filter(c => c.status === 'Resolved').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-xl border border-stone-200 shadow-2xs">
        <div>
          <h2 className="text-xl font-bold text-stone-900 tracking-tight">Hostel Complaints & Maintenance</h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Track resident issues, inspect uploaded images, assign priority, and provide resolution updates
          </p>
        </div>

        {/* Counter Pills */}
        <div className="flex items-center gap-2 text-xs font-semibold">
          <span className="px-3 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg">
            {pendingCount} Pending
          </span>
          <span className="px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg">
            {inProgressCount} In Progress
          </span>
          <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg">
            {resolvedCount} Resolved
          </span>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs flex flex-col sm:flex-row gap-3 items-center justify-between text-xs">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
          <input
            id="complaint-search-input"
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by title, resident, room, issue..."
            className="w-full pl-9 pr-3 py-1.5 border border-stone-300 rounded-lg text-stone-900 bg-stone-50/50"
          />
        </form>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <div className="flex items-center gap-1.5">
            <span className="text-stone-500 font-medium">Status:</span>
            <select
              id="complaint-status-filter"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 border border-stone-300 rounded-md bg-stone-50 text-stone-800 font-medium"
            >
              <option value="all">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-stone-500 font-medium">Category:</span>
            <select
              id="complaint-category-filter"
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="px-2.5 py-1.5 border border-stone-300 rounded-md bg-stone-50 text-stone-800 font-medium"
            >
              <option value="all">All Categories</option>
              <option value="plumbing">Plumbing</option>
              <option value="electrical">Electrical</option>
              <option value="wi-fi">Wi-Fi</option>
              <option value="cleanliness">Cleanliness</option>
              <option value="furniture">Furniture</option>
              <option value="food">Food / Mess</option>
              <option value="noise">Noise</option>
            </select>
          </div>
        </div>
      </div>

      {/* Complaints List Cards */}
      {loading ? (
        <div className="p-12 text-center text-xs text-stone-500">Loading complaints...</div>
      ) : complaints.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-xl border border-stone-200 text-xs text-stone-500">
          No complaints match current filters.
        </div>
      ) : (
        <div className="space-y-4">
          {complaints.map(c => (
            <div
              key={c.id}
              className="bg-white rounded-xl border border-stone-200 shadow-2xs overflow-hidden transition-all hover:border-stone-300"
            >
              <div className="p-5">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={c.status} />
                    <span className="text-xs font-semibold px-2.5 py-0.5 bg-stone-100 text-stone-700 rounded-md">
                      {c.category}
                    </span>
                    <span className="text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded">
                      Priority: {c.priority}
                    </span>
                  </div>

                  <span className="text-xs text-stone-400 flex items-center gap-1 font-mono">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(c.createdAt).toLocaleString()}
                  </span>
                </div>

                <h3 className="text-base font-bold text-stone-900 mt-2.5">{c.title}</h3>
                <p className="text-xs text-stone-600 mt-1.5 leading-relaxed">{c.description}</p>

                {/* Resident & Room Meta */}
                <div className="mt-4 pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between gap-3 text-xs text-stone-500">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5 font-semibold text-stone-800">
                      <User className="w-3.5 h-3.5 text-stone-400" />
                      {c.residentName} ({c.residentPhone || 'No Phone'})
                    </span>
                    <span className="flex items-center gap-1.5 font-semibold text-stone-800">
                      <DoorClosed className="w-3.5 h-3.5 text-stone-400" />
                      Room {c.roomNumber} (Floor {c.floor})
                    </span>
                  </div>

                  <button
                    onClick={() => handleOpenResponse(c)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-2xs transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    Update Status & Reply
                  </button>
                </div>

                {/* Inspection Images Thumbnail Gallery */}
                {c.images && c.images.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-stone-100">
                    <span className="text-xs font-semibold text-stone-600 block mb-2 flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-stone-400" />
                      Attached Photos ({c.images.length}):
                    </span>
                    <div className="flex flex-wrap gap-2.5">
                      {c.images.map((img, idx) => (
                        <button
                          key={img.id || idx}
                          type="button"
                          onClick={() => setLightboxImage(img.imageUrl)}
                          className="group relative w-20 h-20 rounded-lg overflow-hidden border border-stone-300 hover:border-emerald-500 transition-all focus:outline-hidden"
                        >
                          <img
                            src={img.imageUrl}
                            alt={img.fileName || `Attachment ${idx + 1}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <span className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-medium transition-opacity">
                            Enlarge
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Owner Response Display */}
                {c.ownerResponse && (
                  <div className="mt-4 p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-lg text-xs">
                    <div className="flex items-center justify-between text-emerald-900 font-bold mb-1">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Hostel Administration Response:
                      </span>
                      {c.responseDate && (
                        <span className="text-[11px] text-emerald-700 font-mono font-normal">
                          {new Date(c.responseDate).toLocaleString()}
                        </span>
                      )}
                    </div>
                    <p className="text-emerald-800 leading-relaxed">{c.ownerResponse}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Update Status & Write Response */}
      <Modal
        isOpen={isResponseOpen}
        onClose={() => setIsResponseOpen(false)}
        title="Respond to Complaint"
        subtitle={`Case: ${selectedComplaint?.title}`}
      >
        <form onSubmit={handleSaveResponse} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700">Update Status *</label>
              <select
                value={statusInput}
                onChange={e => setStatusInput(e.target.value as ComplaintStatus)}
                className="mt-1 block w-full px-3 py-2 text-xs border border-stone-300 rounded-lg text-stone-900 bg-white"
                required
              >
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700">Priority Level</label>
              <select
                value={priorityInput}
                onChange={e => setPriorityInput(e.target.value as ComplaintPriority)}
                className="mt-1 block w-full px-3 py-2 text-xs border border-stone-300 rounded-lg text-stone-900 bg-white"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700">
              Hostel Response / Resolution Note (Visible to Resident) *
            </label>
            <textarea
              rows={4}
              value={responseText}
              onChange={e => setResponseText(e.target.value)}
              placeholder="e.g. Electrician has been notified and scheduled for 10 AM tomorrow. Thank you for your patience."
              className="mt-1 block w-full px-3 py-2 text-xs border border-stone-300 rounded-lg text-stone-900 leading-relaxed"
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setIsResponseOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              Save & Notify Resident
            </button>
          </div>
        </form>
      </Modal>

      {/* Lightbox */}
      <ImageLightbox
        imageUrl={lightboxImage}
        onClose={() => setLightboxImage(null)}
        title="Resident Inspection Attachment"
      />
    </div>
  );
};
