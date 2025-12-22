import React, { useState, useRef } from 'react';
import { Image, Smile, Send, X, Loader2, Plus, Film } from 'lucide-react';
import { useAuth } from '../contexts/authContext';
import { MediaItem } from './PostCard';

interface CreatePostProps {
  onPostCreated: (post: any) => void;
  apiUrl: string;
}

interface ExtendedMediaItem extends MediaItem {
  id?: string; // Internal ID
  previewUrl?: string; // Local blob URL for immediate preview
  isUploading?: boolean; // Track upload state for each item
}

export const CreatePost: React.FC<CreatePostProps> = ({ onPostCreated, apiUrl }) => {
  const { user, token } = useAuth();
  const [content, setContent] = useState('');
  const [mediaItems, setMediaItems] = useState<ExtendedMediaItem[]>([]);
  const [isPosting, setIsPosting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !token) return;
    setIsUploading(true);
    
    // CDN and Bucket constants matching backend for raw video display
    const CDN_BASE_URL = "https://objectstorageapi.ap-southeast-1.clawcloudrun.com";
    const S3_RAW_BUCKET = "xfwyb01b-raw-videos";

    for (const file of Array.from(files)) {
      const tempId = Math.random().toString(36).substring(7);
      const isVideo = file.type.startsWith('video/');
      const previewUrl = URL.createObjectURL(file);

      // Optimistically add item with loading state
      setMediaItems(prev => [...prev, { 
        url: '', 
        type: isVideo ? 'video' : 'image', 
        previewUrl, 
        isUploading: true,
        id: tempId 
      }]);

      try {
        if (file.type.startsWith('image/')) {
          const formData = new FormData();
          formData.append('image', file);
          const response = await fetch(`${apiUrl}/auth/upload-image`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData,
          });
          if (response.ok) {
            const result = await response.json();
            setMediaItems(prev => prev.map(item => 
              item.id === tempId ? { ...item, url: result.url, isUploading: false } : item
            ));
          } else {
            throw new Error('Upload image failed');
          }
        } else if (isVideo) {
          const initResponse = await fetch(`${apiUrl}/videos/upload-request`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              filename: file.name,
              content_type: file.type,
            }),
          });
          
          if (!initResponse.ok) throw new Error('Không thể khởi tạo upload video');
          const { video_id, upload_url, s3_key } = await initResponse.json();

          // Construct the raw URL for immediate display
          const rawUrl = `${CDN_BASE_URL}/${S3_RAW_BUCKET}/${s3_key}`;

          const uploadResponse = await fetch(upload_url, {
            method: 'PUT',
            body: file,
            headers: { 'Content-Type': file.type },
          });
          
          if (!uploadResponse.ok) throw new Error('Không thể upload video lên storage');

          await fetch(`${apiUrl}/videos/${video_id}/complete`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
          });

          setMediaItems(prev => prev.map(item => 
            item.id === tempId ? { ...item, url: rawUrl, isUploading: false, id: video_id } : item
          ));
        }
      } catch (err) {
        console.error('Upload failed:', err);
        setMediaItems(prev => prev.filter(item => item.id !== tempId));
        alert('Tải lên thất bại: ' + (err instanceof Error ? err.message : 'Có lỗi xảy ra'));
      }
    }
    setIsUploading(false);
  };

  const handlePost = async () => {
    if ((!content.trim() && mediaItems.length === 0) || !token) return;
    setIsPosting(true);
    try {
      // Clean media items for API (remove local-only fields)
      const apiMedia = mediaItems.map(({ url, type, thumbnail_url }) => ({
        url,
        type,
        thumbnail_url
      }));

      const response = await fetch(`${apiUrl}/posts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: content, media: apiMedia }),
      });
      if (response.ok) {
        const result = await response.json();
        onPostCreated(result.data);
        setContent('');
        setMediaItems([]);
        setIsExpanded(false);
      }
    } catch (err) {
      console.error(err);
    }
    setIsPosting(false);
  };

  const removeMedia = (index: number) => {
    setMediaItems(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className={`bg-bg-secondary rounded-[16px] border border-white/5 transition-all duration-300 overflow-hidden shadow-lg ${isExpanded ? 'p-4' : 'p-3 md:p-4'}`}>
      <div className="flex gap-3">
        <img
          src={user?.avatar_url || '/assets/images/home.svg'}
          alt="Avatar"
          className="w-10 h-10 rounded-full object-cover ring-2 ring-primary/20"
        />
        
        <div className="flex-1">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onFocus={() => setIsExpanded(true)}
            placeholder="Bạn đang nghĩ gì?"
            className="w-full bg-transparent border-none focus:outline-none text-white placeholder-white/40 text-[14px] md:text-[15px] resize-none py-2 min-h-[40px] transition-all"
            rows={isExpanded ? 3 : 1}
          />

          {mediaItems.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-3 animate-in fade-in slide-in-from-bottom-2">
              {mediaItems.map((item, i) => (
                <div key={i} className="relative aspect-square rounded-[12px] overflow-hidden group border border-white/10 bg-black/20">
                  {item.type === 'image' ? (
                    <img 
                      src={item.url || item.previewUrl} 
                      className={`w-full h-full object-cover transition-transform group-hover:scale-105 ${item.isUploading ? 'opacity-40 blur-[2px]' : ''}`} 
                      alt="" 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center relative">
                      <video 
                        src={item.previewUrl || item.url} 
                        className={`w-full h-full object-cover ${item.isUploading ? 'opacity-40 blur-[2px]' : ''}`} 
                      />
                      {!item.isUploading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                          <Film size={24} className="text-white opacity-70" />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Loading Overlay */}
                  {item.isUploading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/20 z-10">
                      <Loader2 size={24} className="text-primary animate-spin mb-1" />
                      <span className="text-[10px] text-white font-medium">Đang tải...</span>
                    </div>
                  )}

                  {!item.isUploading && (
                    <button
                      onClick={() => removeMedia(i)}
                      className="absolute top-1.5 right-1.5 z-10 bg-black/60 backdrop-blur-md text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className={`flex items-center justify-between mt-3 transition-all duration-300 ${isExpanded || content || mediaItems.length > 0 ? 'opacity-100' : 'h-0 opacity-0 pointer-events-none'}`}>
            <div className="flex items-center gap-1">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2.5 hover:bg-white/5 rounded-full text-white/60 hover:text-primary transition-all group"
                title="Thêm ảnh"
                aria-label="Thêm ảnh"
              >
                <Image size={18} className="group-hover:scale-110" />
              </button>
              <button
                className="p-2.5 hover:bg-white/5 rounded-full text-white/60 hover:text-[#FFD700] transition-all group"
                title="Cảm xúc"
                aria-label="Thêm cảm xúc"
              >
                <Smile size={18} className="group-hover:scale-110" />
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2.5 hover:bg-white/5 rounded-full text-white/60 hover:text-blue-400 transition-all group"
                title="Video"
                aria-label="Thêm video"
              >
                <Film size={18} className="group-hover:scale-110" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              {isExpanded && !content && mediaItems.length === 0 && (
                <button 
                  onClick={() => setIsExpanded(false)}
                  className="text-white/40 text-[13px] hover:text-white transition-colors px-2"
                >
                  Hủy
                </button>
              )}
              <button
                onClick={handlePost}
                disabled={(!content.trim() && mediaItems.length === 0) || isPosting || isUploading}
                className="bg-primary hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed text-white px-5 py-1.5 rounded-[10px] text-[14px] font-bold flex items-center gap-2 shadow-lg shadow-primary/20 transition-all active:scale-95"
              >
                {isPosting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <>
                    <span>Đăng</span>
                    <Send size={14} />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileSelect}
        className="hidden"
        accept="image/*,video/*"
      />
    </div>
  );
};

