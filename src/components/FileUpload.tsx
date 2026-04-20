'use client';

import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

interface FileUploadProps {
  value?: string[];
  onChange?: (urls: string[]) => void;
  maxFiles?: number;
  folder?: string;
  className?: string;
}

export default function FileUpload({ 
  value = [], 
  onChange, 
  maxFiles = 6, 
  folder = 'customers',
  className = '' 
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    // Check file limit
    if (value.length + files.length > maxFiles) {
      setError(`Maximum ${maxFiles} files allowed`);
      return;
    }

    // Check file types
    const invalidFiles = files.filter(file => 
      !file.type.match(/^image\/(jpeg|jpg|png|gif|webp)$/)
    );
    if (invalidFiles.length > 0) {
      setError('Only image files (JPG, PNG, GIF, WebP) are allowed');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('folder', folder);
      
      files.forEach(file => {
        formData.append('files', file);
      });

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      const result = await response.json();
      const newUrls = result.files.map((file: any) => file.url);
      const updatedUrls = [...value, ...newUrls];
      
      onChange?.(updatedUrls);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      // Clear input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeFile = async (index: number) => {
    const urlToRemove = value[index];
    const updatedUrls = value.filter((_, i) => i !== index);
    
    // Try to delete from server
    try {
      await fetch(`/api/upload?path=${urlToRemove}`, {
        method: 'DELETE',
      });
    } catch (err) {
      console.warn('Failed to delete file from server:', err);
    }
    
    onChange?.(updatedUrls);
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Upload button */}
      <div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploading || value.length >= maxFiles}
        />
        
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || value.length >= maxFiles}
          className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Upload size={16} />
          {uploading ? 'Uploading...' : `Upload Images (${value.length}/${maxFiles})`}
        </button>
        
        {error && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}
      </div>

      {/* Preview grid */}
      {value.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {value.map((url, index) => (
            <div key={index} className="relative group">
              <div className="aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                <img
                  src={url}
                  alt={`Upload ${index + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = '/placeholder-image.png';
                  }}
                />
              </div>
              
              {/* Remove button */}
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={12} />
              </button>
              
              {/* Position label */}
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 text-center">
                {['Front', 'Back', 'Side Left', 'Side Right', 'Detail 1', 'Detail 2'][index] || `Photo ${index + 1}`}
              </div>
            </div>
          ))}
          
          {/* Empty slots */}
          {Array.from({ length: maxFiles - value.length }).map((_, index) => (
            <div
              key={`empty-${index}`}
              className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50"
            >
              <ImageIcon size={24} className="text-gray-400" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
