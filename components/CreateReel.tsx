import React, { useState, useRef } from 'react';
import { X, Loader2, CheckCircle, AlertCircle, Play } from 'lucide-react';

interface CreateReelProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateReel: React.FC<CreateReelProps> = ({ onClose, onSuccess }) => {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [caption, setCaption] = useState('');

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      setError('Vui lòng chọn file video');
      return;
    }

    const maxSize = 100 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('File video quá lớn. Tối đa 100MB');
      return;
    }

    setVideoFile(file);
    setError('');
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleSubmit = async () => {
    if (!videoFile) {
      setError('Vui lòng chọn video');
      return;
    }

    setIsUploading(true);
    setError('');
    setUploadProgress(0);

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) throw new Error('Chưa đăng nhập');

      setUploadProgress(10);
      const initResponse = await fetch(`${API_URL}/videos/upload-request`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filename: videoFile.name,
          content_type: videoFile.type,
        }),
      });

      if (!initResponse.ok) throw new Error('Không thể khởi tạo upload');

      const initData = await initResponse.json();
      const { video_id, upload_url } = initData;

      setUploadProgress(30);
      const uploadResponse = await fetch(upload_url, {
        method: 'PUT',
        body: videoFile,
        headers: { 'Content-Type': videoFile.type },
      });

      if (!uploadResponse.ok) throw new Error('Không thể upload video');

      setUploadProgress(60);
      await fetch(`${API_URL}/videos/${video_id}/complete`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      setUploadProgress(80);
      const reelResponse = await fetch(`${API_URL}/reels`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          video_id: video_id,
          caption: caption || undefined,
        }),
      });

      if (!reelResponse.ok) {
        const errorData = await reelResponse.json();
        throw new Error(errorData.detail || 'Không thể tạo reel');
      }

      setUploadProgress(100);
      setSuccess(true);

      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);

    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-bg-secondary rounded-[20px] max-w-xl w-full max-h-[90vh] overflow-y-auto border border-white/5 shadow-2xl shadow-black/50 animate-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <h2 className="font-montserrat font-bold text-white text-[16px] flex items-center gap-2">
            <Play className="w-5 h-5 text-primary" />
            Tạo Reel mới
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-[10px] bg-bg-main hover:bg-bg-main/70 transition-colors"
            disabled={isUploading}
          >
            <X className="w-4 h-4 text-[#7f7f7f]" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5">
          {/* Video Upload Area */}
          <div>
            <label className="block text-white/80 text-[12px] font-semibold mb-2">
              Video <span className="text-red-400">*</span>
            </label>

            {!videoFile ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-white/10 rounded-[16px] p-10 text-center cursor-pointer hover:border-primary/50 transition bg-bg-main/50 group"
              >
                <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-[16px] flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <svg className="w-8 h-8 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                </div>
                <p className="text-white font-medium text-[13px] mb-1">
                  Click để chọn video
                </p>
                <p className="text-[#7f7f7f] text-[11px]">
                  MP4, MOV, AVI • Tối đa 100MB • Tỷ lệ 9:16 tốt nhất
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="relative border border-white/10 rounded-[16px] overflow-hidden bg-black">
                <video
                  src={previewUrl}
                  controls
                  className="w-full max-h-80 object-contain"
                />
                <button
                  onClick={() => {
                    setVideoFile(null);
                    setPreviewUrl('');
                  }}
                  className="absolute top-3 right-3 w-8 h-8 bg-red-500/80 hover:bg-red-500 text-white rounded-[10px] flex items-center justify-center transition-colors"
                  disabled={isUploading}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Caption */}
          <div>
            <label className="block text-white/80 text-[12px] font-semibold mb-2">
              Mô tả
            </label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Viết mô tả cho reel của bạn..."
              className="w-full bg-bg-main border border-white/10 rounded-[12px] px-4 py-3 text-white text-[13px] placeholder-[#7f7f7f] focus:outline-none focus:ring-1 focus:ring-primary/50 transition resize-none"
              rows={3}
              maxLength={500}
              disabled={isUploading}
            />
            <p className="text-[#7f7f7f] text-[10px] mt-1.5">
              {caption.length}/500 ký tự
            </p>
          </div>

          {/* Progress Bar */}
          {isUploading && (
            <div className="bg-bg-main border border-white/10 rounded-[12px] p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white/80 text-[12px] font-medium">Đang upload...</span>
                <span className="text-primary text-[12px] font-bold">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-bg-secondary rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-primary h-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-[12px] p-4 flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
              <p className="text-green-400 text-[12px] font-medium">
                Upload thành công! Reel của bạn đang được xử lý...
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-[12px] p-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <p className="text-red-400 text-[12px]">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-white/5 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-bg-main text-white/80 rounded-[10px] text-[13px] font-medium hover:bg-bg-main/70 transition-colors"
            disabled={isUploading}
          >
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            disabled={!videoFile || isUploading || success}
            className="px-6 py-2.5 bg-primary text-white rounded-[10px] text-[13px] font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Đang upload...
              </>
            ) : success ? (
              <>
                <CheckCircle className="w-4 h-4" />
                Hoàn thành!
              </>
            ) : (
              <>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                Đăng Reel
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
