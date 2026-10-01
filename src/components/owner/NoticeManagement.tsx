import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Modal } from '../common/Modal';
import { StatusBadge } from '../common/Badge';
import {
  Bell,
  Plus,
  Pin,
  Edit2,
  Trash2,
  Calendar,
  AlertTriangle,
  User,
} from 'lucide-react';
import type { Notice, NoticePriority } from '../../types';

export const NoticeManagement: React.FC = () => {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    targetAudience: 'all',
    priority: 'normal' as NoticePriority,
    isPinned: false,
  });

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    setLoading(true);
    try {
      const data = await api.getNotices();
      setNotices(data);
    } catch (err: any) {
      console.error('Failed to load notices:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setFormData({
      title: '',
      content: '',
      targetAudience: 'all',
      priority: 'normal',
      isPinned: false,
    });
    setIsAddOpen(true);
  };

  const handleOpenEdit = (n: Notice) => {
    setSelectedNotice(n);
    setFormData({
      title: n.title,
      content: n.content,
      targetAudience: n.targetAudience,
      priority: n.priority,
      isPinned: n.isPinned,
    });
    setIsEditOpen(true);
  };

  const handleCreateNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createNotice(formData);
      setIsAddOpen(false);
      fetchNotices();
    } catch (err: any) {
      alert(err.message || 'Failed to post notice');
    }
  };

  const handleUpdateNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNotice) return;
    try {
      await api.updateNotice(selectedNotice.id, formData);
      setIsEditOpen(false);
      fetchNotices();
    } catch (err: any) {
      alert(err.message || 'Failed to update notice');
    }
  };

  const handleDeleteNotice = async (n: Notice) => {
    if (window.confirm(`Delete notice "${n.title}"?`)) {
      try {
        await api.deleteNotice(n.id);
        fetchNotices();
      } catch (err: any) {
        alert(err.message || 'Failed to delete notice');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-xl border border-stone-200 shadow-2xs">
        <div>
          <h2 className="text-xl font-bold text-stone-900 tracking-tight">Hostel Notice Board</h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Broadcast official circulars, maintenance schedules, and security alerts to residents
          </p>
        </div>
        <button
          id="post-notice-btn"
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-2xs transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Create New Notice
        </button>
      </div>

      {/* Notices Grid */}
      {loading ? (
        <div className="p-12 text-center text-xs text-stone-500">Loading notices...</div>
      ) : notices.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-xl border border-stone-200 text-xs text-stone-500">
          No notices currently posted.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {notices.map(notice => (
            <div
              key={notice.id}
              className={`bg-white rounded-xl border p-5 shadow-2xs flex flex-col justify-between transition-all ${
                notice.isPinned ? 'border-amber-300 ring-1 ring-amber-200' : 'border-stone-200'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {notice.isPinned && (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                        <Pin className="w-3 h-3 fill-current" /> Pinned
                      </span>
                    )}
                    <StatusBadge status={notice.priority} />
                  </div>
                  <span className="text-[11px] text-stone-400 font-mono flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(notice.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <h3 className="text-base font-bold text-stone-900 mt-2.5">{notice.title}</h3>
                <p className="text-xs text-stone-600 mt-2 leading-relaxed whitespace-pre-line">{notice.content}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-400">
                <span className="truncate">Author: {notice.authorName}</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEdit(notice)}
                    className="p-1 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded"
                    title="Edit Notice"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteNotice(notice)}
                    className="p-1 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                    title="Delete Notice"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Add Notice */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Publish Hostel Notice">
        <form onSubmit={handleCreateNotice} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-stone-700">Notice Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Wi-Fi Maintenance on Saturday"
              className="mt-1 block w-full px-3 py-2 border border-stone-300 rounded-lg text-stone-900 text-sm"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-stone-700">Priority Level</label>
              <select
                value={formData.priority}
                onChange={e => setFormData({ ...formData, priority: e.target.value as NoticePriority })}
                className="mt-1 block w-full px-3 py-2 border border-stone-300 rounded-lg text-stone-900 bg-white"
              >
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-stone-700">Target Audience</label>
              <select
                value={formData.targetAudience}
                onChange={e => setFormData({ ...formData, targetAudience: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-stone-300 rounded-lg text-stone-900 bg-white"
              >
                <option value="all">All Residents</option>
                <option value="floor_1">Floor 1 Only</option>
                <option value="floor_2">Floor 2 Only</option>
                <option value="floor_3">Floor 3 Only</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="pin-checkbox"
              checked={formData.isPinned}
              onChange={e => setFormData({ ...formData, isPinned: e.target.checked })}
              className="w-4 h-4 text-emerald-600 rounded border-stone-300 focus:ring-emerald-500"
            />
            <label htmlFor="pin-checkbox" className="font-semibold text-stone-700 cursor-pointer">
              Pin to top of notice board
            </label>
          </div>

          <div>
            <label className="block font-semibold text-stone-700">Notice Content *</label>
            <textarea
              rows={5}
              value={formData.content}
              onChange={e => setFormData({ ...formData, content: e.target.value })}
              placeholder="Write the full announcement details here..."
              className="mt-1 block w-full px-3 py-2 border border-stone-300 rounded-lg text-stone-900 leading-relaxed text-sm"
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="px-4 py-2 font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg"
            >
              Publish Announcement
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Edit Notice */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Notice">
        <form onSubmit={handleUpdateNotice} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-stone-700">Notice Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              className="mt-1 block w-full px-3 py-2 border border-stone-300 rounded-lg text-stone-900 text-sm"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-stone-700">Priority Level</label>
              <select
                value={formData.priority}
                onChange={e => setFormData({ ...formData, priority: e.target.value as NoticePriority })}
                className="mt-1 block w-full px-3 py-2 border border-stone-300 rounded-lg text-stone-900 bg-white"
              >
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="pin-edit-checkbox"
                checked={formData.isPinned}
                onChange={e => setFormData({ ...formData, isPinned: e.target.checked })}
                className="w-4 h-4 text-emerald-600 rounded border-stone-300 focus:ring-emerald-500"
              />
              <label htmlFor="pin-edit-checkbox" className="font-semibold text-stone-700 cursor-pointer">
                Pin to top
              </label>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-stone-700">Notice Content *</label>
            <textarea
              rows={5}
              value={formData.content}
              onChange={e => setFormData({ ...formData, content: e.target.value })}
              className="mt-1 block w-full px-3 py-2 border border-stone-300 rounded-lg text-stone-900 leading-relaxed text-sm"
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setIsEditOpen(false)}
              className="px-4 py-2 font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg"
            >
              Update Notice
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
