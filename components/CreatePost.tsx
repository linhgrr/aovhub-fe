import React, { useState, useRef } from 'react';
import { Image, Smile, Send, X, Loader2, Plus, Film } from 'lucide-react';
import { useAuth } from '../contexts/authContext';
import { MediaItem } from './PostCard';
import { Firework } from './Firework';
import { hasSpecialHashtag } from './HashtagText';

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
  const [showFirework, setShowFirework] = useState(false);
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

    // Check for special hashtags before posting
    const shouldShowFirework = hasSpecialHashtag(content);

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

        // Trigger firework effect if post contains special hashtags
        if (shouldShowFirework) {
          setShowFirework(true);
        }
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
    <>
      {/* Firework effect for special hashtags */}
      <Firework
        isActive={showFirework}
        onComplete={() => setShowFirework(false)}
        duration={3500}
      />

      <div className="bg-bg-secondary rounded-[16px] border border-white/5 transition-all duration-300 overflow-hidden shadow-lg">
        {/* Header Section */}
        <div className="p-4 md:p-6 pb-3">
          <span className="text-primary text-[13px] font-medium tracking-wide">Bảng Tin Chiến Trường</span>
          <h2 className="text-white text-[22px] md:text-[26px] font-bold mt-1 tracking-tight">
            Đoán xem bạn bè đang làm gì!
          </h2>
          <p className="text-white/40 text-[13px] md:text-[14px] mt-1 leading-relaxed">
            Cập nhật khoảnh khắc huyền thoại, thành tích leo rank và highlight mãn nhãn từ chiến hữu của bạn!
          </p>
        </div>

        {/* Input Row - with distinct background */}
        <div className="flex items-center gap-2 mx-4 md:mx-6 mb-4 md:mb-6 p-2 bg-black/50 rounded-full">
          <img
            src={user?.avatar_url || '/assets/images/home.svg'}
            alt="Avatar"
            className="w-8 h-8 rounded-full object-cover ring-2 ring-primary/20 flex-shrink-0"
          />

          <div
            onClick={() => setIsExpanded(true)}
            className="flex-1 rounded-full px-3 py-1.5 cursor-text"
          >
            <span className="text-white/40 text-[13px]">
              {user?.username ? `Có gì hot không, ${user.username}?` : "Có gì hot không?"}
            </span>
          </div>

          <div className="flex items-center gap-0.5">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 hover:bg-white/5 rounded-full text-white/50 hover:text-primary transition-all"
              title="Thêm ảnh"
            >
              <Image size={18} />
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 hover:bg-white/5 rounded-full text-white/50 hover:text-blue-400 transition-all"
              title="Thêm video"
            >
              <Film size={18} />
            </button>
          </div>

          <button
            onClick={() => setIsExpanded(true)}
            className="bg-primary hover:bg-primary/90 text-white px-4 py-1.5 rounded-full text-[13px] font-semibold shadow-lg shadow-primary/20 transition-all active:scale-95"
          >
            Tạo
          </button>
        </div>

        {/* Modal Popup - Full Editor */}
        {isExpanded && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
              onClick={() => {
                if (!content && mediaItems.length === 0) {
                  setIsExpanded(false);
                }
              }}
            />

            {/* Modal Content */}
            <div className="relative w-full max-w-[600px] bg-bg-secondary rounded-[20px] border border-white/10 shadow-2xl animate-in fade-in zoom-in-95 duration-300">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/5">
                <h3 className="text-white text-[18px] font-semibold">Tạo bài viết</h3>
                <button
                  onClick={() => {
                    setIsExpanded(false);
                    setContent('');
                    setMediaItems([]);
                  }}
                  className="p-2 hover:bg-white/5 rounded-full text-white/60 hover:text-white transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-4">
                {/* User Info */}
                <div className="flex items-center gap-3 mb-4">
                  <img
                    src={user?.avatar_url || '/assets/images/home.svg'}
                    alt="Avatar"
                    className="w-12 h-12 rounded-full object-cover ring-2 ring-primary/20"
                  />
                  <div>
                    <p className="text-white font-semibold">{user?.username || 'User'}</p>
                    <p className="text-white/40 text-[13px]">Đăng công khai</p>
                  </div>
                </div>

                {/* Textarea */}
                <textarea
                  ref={textareaRef}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  autoFocus
                  placeholder="Bạn đang nghĩ gì?"
                  className="w-full bg-transparent border-none focus:outline-none text-white placeholder-white/40 text-[16px] resize-none min-h-[120px]"
                  rows={4}
                />

                {/* Media Preview */}
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

                        {item.isUploading && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/20 z-10">
                            <Loader2 size={24} className="text-primary animate-spin mb-1" />
                            <span className="text-[10px] text-white font-medium">Đang tải lên...</span>
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
              </div>

              {/* Modal Footer */}
              {/* Chân hộp thoại */}
              <div className="flex items-center justify-between p-4 border-t border-white/5">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2.5 hover:bg-white/5 rounded-full text-white/60 hover:text-primary transition-all"
                    title="Thêm ảnh"
                  >
                    <Image size={22} />
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2.5 hover:bg-white/5 rounded-full text-white/60 hover:text-blue-400 transition-all"
                    title="Thêm video"
                  >
                    <Film size={22} />
                  </button>
                </div>

                <button
                  onClick={handlePost}
                  disabled={(!content.trim() && mediaItems.length === 0) || isPosting || isUploading}
                  className="bg-primary hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed text-white px-8 py-2.5 rounded-full text-[15px] font-semibold shadow-lg shadow-primary/20 transition-all active:scale-95"
                >
                  {isPosting ? <Loader2 size={18} className="animate-spin" /> : 'Đăng'}
                </button>
              </div>
            </div>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          accept="image/*,video/*"
        />
      </div>
    </>
  );
};

