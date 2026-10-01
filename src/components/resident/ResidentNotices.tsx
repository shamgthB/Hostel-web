import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { StatusBadge } from '../common/Badge';
import { Bell, Pin, Calendar, User } from 'lucide-react';
import type { Notice } from '../../types';

export const ResidentNotices: React.FC = () => {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-2xs">
        <h2 className="text-xl font-bold text-stone-900 tracking-tight">Hostel Notice Board</h2>
        <p className="text-xs text-stone-500 mt-0.5">
          Official announcements, schedule updates, mess timings, and emergency guidelines from management
        </p>
      </div>

      {/* Notices */}
      {loading ? (
        <div className="p-12 text-center text-xs text-stone-500">Loading notices...</div>
      ) : notices.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-xl border border-stone-200 shadow-2xs text-xs text-stone-500">
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

              <div className="mt-4 pt-3 border-t border-stone-100 text-[11px] text-stone-400 flex items-center justify-between">
                <span>From: {notice.authorName}</span>
                <span>Audience: {notice.targetAudience === 'all' ? 'All Residents' : notice.targetAudience}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
