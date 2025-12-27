import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/authContext';

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab }) => {
  const { logout } = useAuth();
  const [indicatorTop, setIndicatorTop] = useState(0);

  const navItems = [
    { id: 'feed', icon: '/assets/images/home.svg', label: 'Trang chủ' },
    { id: 'reels', icon: '/assets/images/game.svg', label: 'Reels' },
    { id: 'lfg', icon: '/assets/images/chart.svg', label: 'LFG' },
    { id: 'forum', icon: '/assets/images/activity.svg', label: 'Diễn đàn' },
    { id: 'friends', icon: '/assets/images/friends.svg', label: 'Bạn bè' },
    { id: 'chatbot', icon: 'https://i.ibb.co/20KhSst0/image.png', label: 'Trợ lý thông minh' },
  ];

  // Calculate indicator position based on active tab
  useEffect(() => {
    let activeIndex = navItems.findIndex(item => {
      if (item.id === 'forum') {
        return activeTab === 'forum' || activeTab === 'forum-category' || activeTab === 'forum-thread';
      }
      return activeTab === item.id;
    });

    if (activeIndex === -1) activeIndex = 0;

    // Icon container is 44px, gap between items is 40px (gap-10)
    // Indicator height is 60px, so we need offset to center it
    const iconHeight = 44;
    const gap = 40;
    const indicatorHeight = 60;
    const centerOffset = (indicatorHeight - iconHeight) / 2; // 8px

    const topPosition = activeIndex * (iconHeight + gap) - centerOffset;

    setIndicatorTop(topPosition);
  }, [activeTab]);

  return (
    <>
      {/* Desktop Sidebar - Fixed position with spacer */}
      <aside className="fixed left-0 top-0 h-screen w-[126px] z-30 hidden md:block">
        <div className="relative h-full w-full flex flex-col">
          {/* Sidebar Background */}
          <div className="absolute inset-0 bg-bg-secondary border-r border-white/5"></div>

          {/* Content */}
          <div className="relative z-10 flex flex-col items-center h-full py-12">
            {/* Logo */}
            <div className="mb-24">
              <button onClick={() => setActiveTab('feed')} className="flex items-center justify-center">
                <img src="https://i.ibb.co/84t6d1dq/image-removebg-preview-1-1.png" alt="Logo" className="w-[80px] h-auto object-contain" />
              </button>
            </div>

            {/* Nav Items */}
            <div className="flex flex-col gap-10 items-center w-full relative">
              {/* Single sliding indicator that moves between items */}
              <div
                className="nav-item-active-bg"
                style={{
                  top: `${indicatorTop}px`,
                  transition: 'top 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              />

              {navItems.map((item) => {
                const isActive = activeTab === item.id ||
                  (item.id === 'forum' && (activeTab === 'forum-category' || activeTab === 'forum-thread'));

                return (
                  <div key={item.id} className="nav-item-wrapper">
                    <button
                      onClick={() => setActiveTab(item.id)}
                      className={`nav-icon-container ${isActive ? 'active' : 'opacity-50 hover:opacity-100 hover:bg-white/5'}`}
                      title={item.label}
                    >
                      <img
                        src={item.icon}
                        alt={item.label}
                        className={`w-6 h-6 transition-all ${item.id === 'chatbot' ? 'rounded-full object-cover' : (isActive ? 'filter-primary brightness-125' : 'filter-white')}`}
                      />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Bottom Section */}
            <div className="mt-auto flex flex-col items-center gap-10 pb-10">
              <div className="w-[59px] h-[1px] bg-white/10"></div>
              <button
                onClick={() => logout()}
                className="group opacity-40 hover:opacity-100 transition-all hover:scale-110"
                title="Đăng xuất"
              >
                <img
                  src="/assets/images/logout.svg"
                  alt="Logout"
                  className="w-6 h-6 filter-white"
                />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Spacer to push content - Desktop only */}
      <div className="hidden md:block w-[126px] flex-shrink-0"></div>

      {/* Mobile Navigation */}
      <nav className="fixed bottom-0 left-0 w-full bg-bg-main/95 backdrop-blur-md border-t border-white/5 md:hidden z-50 px-4 py-2 safe-area-inset-bottom">
        <div className="flex justify-around items-center max-w-md mx-auto">
          {navItems.map((item) => {
            const isActive = activeTab === item.id ||
              (item.id === 'forum' && (activeTab === 'forum-category' || activeTab === 'forum-thread'));
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`p-1.5 transition-all duration-200 ${isActive ? 'scale-110' : 'opacity-50 hover:opacity-100'}`}
                title={item.label}
              >
                {isActive && (
                  <div className="absolute inset-0 bg-primary/20 blur-md rounded-full"></div>
                )}
                <img
                  src={item.icon}
                  alt={item.label}
                  className={`w-5 h-5 relative z-10 ${item.id === 'chatbot' ? 'rounded-full object-cover' : (isActive ? 'filter-primary brightness-150' : 'filter-white')}`}
                />
              </button>
            );
          })}

        </div>
      </nav>
    </>
  );
};
