import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Modal } from '../common/Modal';
import { StatusBadge } from '../common/Badge';
import { ImageLightbox } from '../common/ImageLightbox';
import {
  AlertCircle,
  Plus,
  Image as ImageIcon,
  CheckCircle2,
  Calendar,
  Upload,
  X,
  Send,
  MessageSquare,
  Clock,
  Sparkles,
} from 'lucide-react';
import type { Complaint, ComplaintCategory, ComplaintPriority } from '../../types';

export const ResidentComplaints: React.FC = () => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    category: 'plumbing' as ComplaintCategory,
    priority: 'Medium' as ComplaintPriority,
    description: '',
  });

  // Attached images list
  const [images, setImages] = useState<Array<{ imageUrl: string; fileName: string }>>([]);
  const [customImageUrl, setCustomImageUrl] = useState('');

  // Sample quick presets for realistic hostel testing
  const samplePresets = [
    {
      label: 'Water Leak',
      url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400&auto=format&fit=crop&q=80',
    },
    {
      label: 'AC / Fan Repair',
      url: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&auto=format&fit=crop&q=80',
    },
    {
      label: 'Wi-Fi / Router',
      url: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=400&auto=format&fit=crop&q=80',
    },
    {
      label: 'Door Lock / Key',
      url: 'https://images.unsplash.com/photo-1558002038-1055907df827?w=400&auto=format&fit=crop&q=80',
    },
  ];

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const data = await api.getComplaints();
      setComplaints(data);
    } catch (err: any) {
      console.error('Failed to load complaints:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setFormData({
      title: '',
      category: 'plumbing',
      priority: 'Medium',
      description: '',
    });
    setImages([]);
    setCustomImageUrl('');
    setIsAddOpen(true);
  };

  const handleAddPresetImage = (url: string, name: string) => {
    setImages([...images, { imageUrl: url, fileName: name }]);
  };

  const handleAddCustomImageUrl = () => {
    if (customImageUrl.trim()) {
      setImages([...images, { imageUrl: customImageUrl.trim(), fileName: 'custom_image.jpg' }]);
      setCustomImageUrl('');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setImages(prev => [...prev, { imageUrl: reader.result as string, fileName: file.name }]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.description.trim()) {
      alert('Please fill in both title and description.');
      return;
    }

    try {
      await api.createComplaint({
        ...formData,
        images,
      });
      setIsAddOpen(false);
      fetchComplaints();
    } catch (err: any) {
      alert(err.message || 'Failed to file complaint');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-xl border border-stone-200 shadow-2xs">
        <div>
          <h2 className="text-xl font-bold text-stone-900 tracking-tight">Hostel Complaints & Maintenance</h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Submit repair requests or grievances directly to the hostel owner and track resolution updates
          </p>
        </div>
        <button
          id="new-complaint-btn"
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-2xs transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Report New Issue
        </button>
      </div>

      {/* Complaints List */}
      {loading ? (
        <div className="p-12 text-center text-xs text-stone-500">Loading your complaints...</div>
      ) : complaints.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-xl border border-stone-200 shadow-2xs">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-stone-900">No active complaints!</h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto mt-1">
            Everything is in good order. If you encounter any maintenance or room issues, click 'Report New Issue' above.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {complaints.map(c => (
            <div
              key={c.id}
              className="bg-white rounded-xl border border-stone-200 shadow-2xs p-5 space-y-4 transition-all"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={c.status} />
                  <span className="text-xs font-semibold px-2.5 py-0.5 bg-stone-100 text-stone-700 rounded">
                    {c.category}
                  </span>
                  <span className="text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded">
                    Priority: {c.priority}
                  </span>
                </div>
                <span className="text-xs text-stone-400 font-mono flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(c.createdAt).toLocaleString()}
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold text-stone-900">{c.title}</h3>
                <p className="text-xs text-stone-600 mt-1.5 leading-relaxed whitespace-pre-line">
                  {c.description}
                </p>
              </div>

              {/* Photos Gallery */}
              {c.images && c.images.length > 0 && (
                <div className="pt-3 border-t border-stone-100">
                  <span className="text-xs font-semibold text-stone-600 block mb-2">Attached Photos:</span>
                  <div className="flex flex-wrap gap-2">
                    {c.images.map((img, idx) => (
                      <button
                        key={img.id || idx}
                        type="button"
                        onClick={() => setLightboxImage(img.imageUrl)}
                        className="group relative w-16 h-16 rounded-lg overflow-hidden border border-stone-200 hover:border-emerald-500 transition-all"
                      >
                        <img
                          src={img.imageUrl}
                          alt="Complaint photo"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Owner Resolution Note */}
              {c.ownerResponse ? (
                <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-lg text-xs space-y-1">
                  <div className="flex items-center justify-between text-emerald-900 font-bold">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Hostel Administration Response:
                    </span>
                    {c.responseDate && (
                      <span className="text-[11px] font-mono text-emerald-700 font-normal">
                        {new Date(c.responseDate).toLocaleString()}
                      </span>
                    )}
                  </div>
                  <p className="text-emerald-800 leading-relaxed pl-5">{c.ownerResponse}</p>
                </div>
              ) : (
                <div className="p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-[11px] text-stone-500 flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-stone-400" />
                  Waiting for hostel administration review and response.
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal: New Complaint */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Report Hostel Issue / Complaint" maxWidth="xl">
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-stone-700">Complaint Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Bathroom tap leaking, Wi-Fi unstable"
              className="mt-1 block w-full px-3 py-2 border border-stone-300 rounded-lg text-stone-900 text-sm"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-stone-700">Category *</label>
              <select
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value as ComplaintCategory })}
                className="mt-1 block w-full px-3 py-2 border border-stone-300 rounded-lg text-stone-900 bg-white"
              >
                <option value="plumbing">Plumbing / Water</option>
                <option value="electrical">Electrical / Appliances</option>
                <option value="wi-fi">Wi-Fi / Internet</option>
                <option value="cleanliness">Cleanliness & Hygiene</option>
                <option value="furniture">Furniture / Bed</option>
                <option value="food">Food / Mess</option>
                <option value="noise">Noise / Disturbance</option>
                <option value="other">Other Issue</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-stone-700">Priority Level</label>
              <select
                value={formData.priority}
                onChange={e => setFormData({ ...formData, priority: e.target.value as ComplaintPriority })}
                className="mt-1 block w-full px-3 py-2 border border-stone-300 rounded-lg text-stone-900 bg-white"
              >
                <option value="Low">Low (General)</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent (Immediate)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-stone-700">Detailed Description *</label>
            <textarea
              rows={4}
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the exact location in the room, when it started, and any relevant details..."
              className="mt-1 block w-full px-3 py-2 border border-stone-300 rounded-lg text-stone-900 leading-relaxed text-sm"
              required
            />
          </div>

          {/* Photo Attachments */}
          <div>
            <label className="block font-semibold text-stone-700 mb-1.5">Attach Photo Evidence</label>
            
            {/* Quick Demo Issue Presets */}
            <div className="mb-2.5">
              <span className="text-[11px] text-stone-500 mb-1 block font-medium">Quick Preset Photos:</span>
              <div className="flex flex-wrap gap-1.5">
                {samplePresets.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleAddPresetImage(preset.url, preset.label)}
                    className="px-2 py-1 bg-stone-100 hover:bg-emerald-50 hover:text-emerald-700 border border-stone-200 rounded text-[11px] font-medium transition-colors"
                  >
                    + {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom URL or File Upload */}
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={customImageUrl}
                onChange={e => setCustomImageUrl(e.target.value)}
                placeholder="Or paste an image URL here..."
                className="flex-1 px-2.5 py-1.5 border border-stone-300 rounded-lg text-stone-900 text-xs"
              />
              <button
                type="button"
                onClick={handleAddCustomImageUrl}
                className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold rounded-lg text-xs"
              >
                Add URL
              </button>
            </div>

            {/* Local File input */}
            <label className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-stone-200 hover:border-emerald-500 rounded-lg cursor-pointer bg-stone-50/50 transition-colors">
              <Upload className="w-4 h-4 text-stone-400" />
              <span className="text-xs text-stone-600 font-medium">Choose image file to upload</span>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            {/* Selected Images List */}
            {images.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {images.map((img, idx) => (
                  <div key={idx} className="relative w-16 h-16 rounded-lg overflow-hidden border border-stone-300">
                    <img src={img.imageUrl} alt={img.fileName} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="absolute top-0.5 right-0.5 w-4 h-4 bg-rose-600 text-white rounded-full flex items-center justify-center text-[10px]"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            )}
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
              className="px-4 py-2 font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              Submit to Owner
            </button>
          </div>
        </form>
      </Modal>

      {/* Lightbox */}
      <ImageLightbox
        imageUrl={lightboxImage}
        onClose={() => setLightboxImage(null)}
        title="Complaint Attachment"
      />
    </div>
  );
};
