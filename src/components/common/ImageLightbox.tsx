import React from 'react';
import { X } from 'lucide-react';

interface ImageLightboxProps {
  imageUrl: string | null;
  onClose: () => void;
  title?: string;
}

export const ImageLightbox: React.FC<ImageLightboxProps> = ({ imageUrl, onClose, title }) => {
  if (!imageUrl) return null;

  return (
    <div
      id="image-lightbox-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center">
        <button
          id="lightbox-close-btn"
          onClick={onClose}
          className="absolute -top-10 right-0 p-1.5 text-white hover:text-stone-300 bg-stone-800/80 rounded-full"
          aria-label="Close"
        >
          <X className="w-6 h-6" />
        </button>
        <img
          src={imageUrl}
          alt={title || 'Attachment view'}
          className="max-w-full max-h-[82vh] object-contain rounded-lg shadow-2xl border border-stone-700"
        />
        {title && <p className="text-stone-200 text-sm mt-3 font-medium text-center">{title}</p>}
      </div>
    </div>
  );
};
