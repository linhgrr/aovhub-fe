import React from 'react';
import { useAuth } from '../contexts/authContext';

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab }) => {
  const { logout } = useAuth();

  const navItems = [
    { id: 'feed', icon: '/assets/images/home.svg', label: 'Home' },
    { id: 'reels', icon: '/assets/images/game.svg', label: 'Games' },
    { id: 'lfg', icon: '/assets/images/chart.svg', label: 'Stats' },
    { id: 'forum', icon: '/assets/images/activity.svg', label: 'Activity' },
    { id: 'chatbot', icon: '/assets/images/chatbot.svg', label: 'Chatbot' },
    { id: 'profile', icon: '/assets/images/profile.svg', label: 'Profile' },
    { id: 'settings', icon: '/assets/images/setting.svg', label: 'Settings' },
  ];

  return (
    <>
      {/* Desktop Sidebar - Fixed position with spacer */}
      <aside className="fixed left-0 top-0 h-screen w-[126px] z-40 hidden md:block">
        <div className="relative h-full w-full flex flex-col">
          {/* Sidebar Background */}
          <div className="absolute inset-0 bg-bg-secondary border-r border-white/5"></div>

          {/* Content */}
          <div className="relative z-10 flex flex-col items-center h-full py-12">
            {/* Logo */}
            <div className="mb-24">
              <button onClick={() => setActiveTab('feed')} className="flex items-center justify-center">
                <img src="https://i.ibb.co/JRNVKjvX/logoliqi88-removebg-preview-1.png" alt="Logo" className="w-[80px] h-auto object-contain" />
              </button>
            </div>

            {/* Nav Items */}
            <div className="flex flex-col gap-10 items-center w-full">
              {navItems.map((item) => {
                const isActive = activeTab === item.id ||
                  (item.id === 'forum' && (activeTab === 'forum-category' || activeTab === 'forum-thread'));

                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`group relative p-2 transition-all duration-300 ${isActive ? 'scale-110' : 'opacity-40 hover:opacity-100 hover:scale-105'
                      }`}
                    title={item.label}
                  >
                    {isActive && (
                      <div className="absolute inset-0 bg-primary/30 blur-lg rounded-full animate-pulse"></div>
                    )}
                    <img
                      src={item.icon}
                      alt={item.label}
                      className={`w-6 h-6 relative z-10 transition-all ${isActive ? 'filter-primary brightness-150' : 'filter-white'}`}
                    />
                  </button>
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
      <nav className="fixed bottom-0 left-0 w-full bg-bg-main/95 backdrop-blur-md border-t border-white/5 md:hidden z-50 px-6 py-3">
        <div className="flex justify-between items-center">
          {navItems.slice(0, 4).map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`p-2 transition-all ${isActive ? 'text-primary' : 'text-white/40'}`}
              >
                <img
                  src={item.icon}
                  alt={item.label}
                  className={`w-6 h-6 ${isActive ? 'filter-primary' : 'filter-white'}`}
                />
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
