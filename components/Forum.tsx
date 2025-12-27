import React, { useState, useEffect } from 'react';
import {
  MessagesSquare,
  TrendingUp,
  ChevronRight,
  MessageCircle,
  Gamepad2,
  Sword,
  Wrench,
  CalendarDays,
  Bug,
  Lightbulb,
  Users,
  Flame,
  FolderOpen,
  Loader2,
  ScrollText,
  AlertCircle,
  Inbox
} from 'lucide-react';
import { ForumCategory, ForumCategoriesResponse } from '../types';
import { API_BASE_URL } from '../constants';

interface ForumProps {
  onNavigate?: (route: string) => void;
}

// Skeleton component for loading state
const CategorySkeleton: React.FC = () => (
  <div className="bg-bg-secondary rounded-[16px] border border-white/5 p-4 md:p-5 animate-pulse">
    <div className="flex items-center gap-4">
      <div className="w-14 h-14 md:w-16 md:h-16 bg-white/5 rounded-[12px]" />
      <div className="flex-1">
        <div className="h-5 bg-white/5 rounded-full w-1/3 mb-2" />
        <div className="h-4 bg-white/5 rounded-full w-2/3" />
      </div>
      <div className="text-right">
        <div className="h-6 bg-white/5 rounded-full w-12 mb-1" />
        <div className="h-3 bg-white/5 rounded-full w-16" />
      </div>
    </div>
  </div>
);

export const Forum: React.FC<ForumProps> = ({ onNavigate }) => {
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/forum/categories`);
      if (!response.ok) throw new Error('Failed to fetch categories');

      const data: ForumCategoriesResponse = await response.json();
      setCategories(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi');
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryClick = (categoryId: string) => {
    window.location.hash = `forum/category/${categoryId}`;
  };

  const getCategoryIcon = (categoryName?: string) => {
    const name = categoryName?.toLowerCase() || '';
    const iconClass = "w-7 h-7 md:w-8 md:h-8 text-white group-hover:text-primary transition-colors";

    if (name.includes('general') || name.includes('chung')) return <MessageCircle className={iconClass} strokeWidth={1.5} />;
    if (name.includes('gameplay') || name.includes('chơi')) return <Gamepad2 className={iconClass} strokeWidth={1.5} />;
    if (name.includes('heroes') || name.includes('tướng')) return <Sword className={iconClass} strokeWidth={1.5} />;
    if (name.includes('builds') || name.includes('build')) return <Wrench className={iconClass} strokeWidth={1.5} />;
    if (name.includes('events') || name.includes('sự kiện')) return <CalendarDays className={iconClass} strokeWidth={1.5} />;
    if (name.includes('bugs') || name.includes('lỗi')) return <Bug className={iconClass} strokeWidth={1.5} />;
    if (name.includes('suggestions') || name.includes('góp ý')) return <Lightbulb className={iconClass} strokeWidth={1.5} />;
    if (name.includes('team') || name.includes('đội')) return <Users className={iconClass} strokeWidth={1.5} />;
    if (name.includes('hot') || name.includes('trending')) return <Flame className={iconClass} strokeWidth={1.5} />;

    return <FolderOpen className={iconClass} strokeWidth={1.5} />;
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto p-4 pb-24 md:pb-8 w-full pt-6">
        {/* Header Skeleton */}
        <div className="bg-bg-secondary rounded-[16px] border border-white/5 p-4 md:p-6 mb-6 animate-pulse">
          <div className="h-4 bg-white/5 rounded-full w-24 mb-2" />
          <div className="h-8 bg-white/5 rounded-full w-64 mb-2" />
          <div className="h-4 bg-white/5 rounded-full w-96" />
        </div>

        {/* Categories Skeleton */}
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <CategorySkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto p-4 pb-24 md:pb-8 w-full pt-6">
        <div className="bg-red-500/10 border border-red-500/30 rounded-[16px] p-6 text-center">
          <div className="flex justify-center mb-3">
            <AlertCircle className="w-12 h-12 text-red-400" strokeWidth={1.5} />
          </div>
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={fetchCategories}
            className="px-6 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 
                       rounded-full transition-all font-medium"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4 pb-24 md:pb-8 w-full pt-6">
      {/* Hero Header */}
      <div className="bg-bg-secondary rounded-[16px] border border-white/5 overflow-hidden mb-6 md:mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
        <div className="p-4 md:p-6 relative">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

          <span className="text-primary text-[13px] font-medium tracking-wide relative z-10">
            Diễn Đàn Chiến Trường
          </span>
          <h1 className="text-white text-[22px] md:text-[28px] font-bold mt-1 tracking-tight relative z-10">
            Cộng đồng AOV Việt Nam
          </h1>
          <p className="text-white/40 text-[13px] md:text-[14px] mt-2 leading-relaxed max-w-xl relative z-10">
            Nơi tụ họp của các chiến binh! Thảo luận chiến thuật, chia sẻ kinh nghiệm leo rank,
            và kết nối với những người chơi đam mê.
          </p>

          {/* Stats */}
          <div className="flex items-center gap-6 mt-4 pt-4 border-t border-white/5 relative z-10">
            <div className="flex items-center gap-2">
              <MessagesSquare className="w-4 h-4 text-primary" strokeWidth={1.5} />
              <span className="text-white/60 text-[12px]">
                <span className="text-white font-semibold">{categories.length}</span> danh mục
              </span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-400" strokeWidth={1.5} />
              <span className="text-white/60 text-[12px]">
                <span className="text-white font-semibold">
                  {categories.reduce((acc, cat) => acc + (cat.threadCount || 0), 0)}
                </span> chủ đề
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Category List */}
      {categories.length === 0 ? (
        <div className="bg-bg-secondary rounded-[16px] border border-white/5 p-8 md:p-12 text-center animate-in fade-in duration-500">
          <div className="flex justify-center mb-4">
            <Inbox className="w-14 h-14 text-white/20" strokeWidth={1.5} />
          </div>
          <h3 className="text-white text-lg font-semibold mb-2">Chưa có danh mục nào</h3>
          <p className="text-white/40 text-[13px]">
            Hãy quay lại sau để xem các chủ đề mới nhất!
          </p>
        </div>
      ) : (
        <div className="space-y-3 md:space-y-4">
          {categories.map((category, index) => (
            <button
              key={category.id}
              onClick={() => handleCategoryClick(category.id)}
              className="w-full bg-bg-secondary rounded-[16px] border border-white/5 
                         hover:border-primary/30 p-4 md:p-5 transition-all duration-300
                         text-left group hover:shadow-lg hover:shadow-primary/5
                         animate-in fade-in slide-in-from-bottom-2"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-center gap-4">
                {/* Icon Container */}
                <div className="w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-primary/10 to-primary/20 
                                rounded-[12px] flex items-center justify-center
                                group-hover:from-primary/20 group-hover:to-primary/30 
                                group-hover:scale-105 transition-all duration-300 flex-shrink-0">
                  {getCategoryIcon(category.name)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-white text-[14px] md:text-[16px] 
                                   group-hover:text-primary transition-colors truncate">
                      {category.name}
                    </h3>
                    {category.threadCount && category.threadCount > 50 && (
                      <span className="px-2 py-0.5 bg-primary/20 text-primary text-[10px] 
                                       font-medium rounded-full flex-shrink-0">
                        Hot
                      </span>
                    )}
                  </div>
                  {category.description && (
                    <p className="text-white/40 text-[12px] md:text-[13px] line-clamp-1">
                      {category.description}
                    </p>
                  )}
                </div>

                {/* Thread Count */}
                <div className="text-right flex-shrink-0 hidden sm:block">
                  <div className="text-xl md:text-2xl font-bold text-primary 
                                  group-hover:scale-110 transition-transform">
                    {category.threadCount || 0}
                  </div>
                  <div className="text-[11px] text-white/40">chủ đề</div>
                </div>

                {/* Arrow */}
                <div className="flex-shrink-0">
                  <ChevronRight
                    className="w-5 h-5 text-white/20 group-hover:text-primary 
                               group-hover:translate-x-1 transition-all"
                    strokeWidth={1.5}
                  />
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Rules Section */}
      <div className="mt-6 md:mt-8 bg-bg-secondary rounded-[16px] border border-white/5 
                      overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="p-4 md:p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-amber-500/10 rounded-[10px] 
                            flex items-center justify-center flex-shrink-0">
              <ScrollText className="w-5 h-5 md:w-6 md:h-6 text-amber-400" strokeWidth={1.5} />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-white text-[14px] md:text-[15px] mb-2">
                Nội quy diễn đàn
              </h4>
              <ul className="text-white/50 text-[12px] md:text-[13px] space-y-1.5">
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Tôn trọng thành viên khác, không spam hoặc quấy rối</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Không đăng nội dung vi phạm pháp luật hoặc tiêu cực</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Đặt tiêu đề rõ ràng và sử dụng đúng danh mục</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Chia sẻ kiến thức và giúp đỡ cộng đồng phát triển!</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Forum;
