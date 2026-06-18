'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { useToast } from '@/components/ui/Toast';

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  folder?: string;
  label?: string;
  placeholder?: string;
}

export default function ImageUpload({
  value,
  onChange,
  folder = 'tour-booking',
  label = 'Gambar',
  placeholder = 'https://example.com/image.jpg',
}: ImageUploadProps) {
  const { showToast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(value);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show local preview
    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl);

    // Upload to Cloudinary
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', folder);

      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();

      if (data.success) {
        onChange(data.url);
        setPreview(data.url);
        showToast('Gambar berhasil diupload!', 'success');
      } else {
        showToast(data.error || 'Gagal upload', 'error');
        setPreview(value); // revert
      }
    } catch {
      showToast('Gagal mengupload gambar', 'error');
      setPreview(value); // revert
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleUrlChange = (url: string) => {
    onChange(url);
    setPreview(url);
  };

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      )}
      <div className="flex gap-3">
        {/* File Upload Button */}
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="px-4 py-2.5 border border-dashed border-gray-300 rounded-xl text-sm text-gray-600 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 disabled:opacity-50 transition-all flex items-center gap-2 flex-shrink-0"
        >
          {uploading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent" />
              Uploading...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Upload
            </>
          )}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* URL Input (fallback) */}
        <input
          type="text"
          value={value}
          onChange={(e) => handleUrlChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 min-w-0 px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow text-sm"
        />
      </div>

      {/* Image Preview */}
      {preview && (
        <div className="mt-2 w-40 h-28 rounded-lg overflow-hidden bg-gray-200 relative border">
          <Image
            src={preview}
            alt="Preview"
            fill
            className="object-cover"
            sizes="160px"
            onError={() => setPreview('')}
          />
        </div>
      )}
    </div>
  );
}
