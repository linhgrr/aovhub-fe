import React, { useState, useEffect } from 'react';
import { Navigation } from './components/Navigation';
import { Header } from './components/Header';
import { Feed } from './components/Feed';
import { LFG } from './components/LFG';
import { Friends } from './components/Friends';
import { Profile } from './components/Profile';
import { Settings } from './components/Settings';
import { Register } from './components/Register';
import { Login } from './components/Login';
import { Forum } from './components/Forum';
import { ForumCategoryPage } from './components/ForumCategory';
import { ForumThreadPage } from './components/ForumThread';
import { AdminDashboard } from './components/AdminDashboard';
import { Reels } from './components/Reels';
import { SearchResults } from './components/SearchResults';
import { RightSidebar } from './components/RightSidebar';
import { AuthProvider, useAuth } from './contexts/authContext';

type Route = 'feed' | 'reels' | 'lfg' | 'friends' | 'profile' | 'settings' | 'register' | 'login' | 'forum' | 'forum-category' | 'forum-thread' | 'admin' | 'search';

const AppContent: React.FC = () => {
  const [currentRoute, setCurrentRoute] = useState<Route>('feed');
  const [profileUserId, setProfileUserId] = useState<string | undefined>(undefined);
  const [forumCategoryId, setForumCategoryId] = useState<string | undefined>(undefined);
  const [forumThreadId, setForumThreadId] = useState<string | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const { isLoading, isAuthenticated } = useAuth();

  // Simple hash-based routing
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1) || 'feed';

      // Check for profile/:userId pattern
      if (hash.startsWith('profile/')) {
        const userId = hash.split('/')[1];
        setProfileUserId(userId);
        setCurrentRoute('profile');
      }
      // Check for forum/category/:categoryId pattern
      else if (hash.startsWith('forum/category/')) {
        const categoryId = hash.split('/')[2];
        setForumCategoryId(categoryId);
        setCurrentRoute('forum-category');
      }
      // Check for forum/thread/:threadId pattern
      else if (hash.startsWith('forum/thread/')) {
        const threadId = hash.split('/')[2];
        setForumThreadId(threadId);
        setCurrentRoute('forum-thread');
      }
      // Check for search?q= pattern
      else if (hash.startsWith('search?q=') || hash.startsWith('search?')) {
        const params = new URLSearchParams(hash.replace('search?', ''));
        const q = params.get('q') || '';
        setSearchQuery(q);
        setCurrentRoute('search');
      }
      else {
        setProfileUserId(undefined);
        setForumCategoryId(undefined);
        setForumThreadId(undefined);
        setSearchQuery('');
        setCurrentRoute(hash as Route);
      }
    };

    // Set initial route
    handleHashChange();

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  // Redirect to login if not authenticated (except for public routes)
  useEffect(() => {
    const publicRoutes: Route[] = ['login', 'register', 'forum', 'forum-category', 'forum-thread'];
    if (!isLoading && !isAuthenticated && !publicRoutes.includes(currentRoute)) {
      window.location.hash = 'login';
    }
  }, [isLoading, isAuthenticated, currentRoute]);

  const handleTabChange = (tab: string) => {
    window.location.hash = tab;
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-screen">
          <div className="w-8 h-8 border-4 border-gold-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      );
    }

    switch (currentRoute) {
      case 'register': return <Register />;
      case 'login': return <Login />;
      case 'feed': return <Feed />;
      case 'reels': return <Reels />;
      case 'lfg': return <LFG />;
      case 'friends': return <Friends />;
      case 'profile': return <Profile userId={profileUserId} />;
      case 'settings': return <Settings />;
      case 'forum': return <Forum />;
      case 'forum-category': return <ForumCategoryPage categoryId={forumCategoryId || ''} />;
      case 'forum-thread': return <ForumThreadPage threadId={forumThreadId || ''} />;
      case 'admin': return <AdminDashboard />;
      case 'search': return <SearchResults query={searchQuery} onNavigate={handleTabChange} />;
      default: return <Feed />;
    }
  };

  // Hide navigation only on auth pages
  const showNavigation = currentRoute !== 'register' && currentRoute !== 'login';
  // Hide header on reels page
  const showHeader = showNavigation && currentRoute !== 'reels';

  return (
    <div className="min-h-screen bg-bg-main text-white font-montserrat selection:bg-primary/30 overflow-x-hidden">
      <div className="flex">
        {/* Sidebar Navigation - Fixed width, not floating */}
        {showNavigation && <Navigation activeTab={currentRoute} setActiveTab={handleTabChange} />}

        {/* Main Area */}
        <div className="flex-1 flex flex-col min-h-screen">
          {/* Top Header */}
          {showHeader && <Header onNavigate={handleTabChange} />}

          {/* Main Content */}
          <main className={`flex-1 ${showHeader ? 'mt-[110px]' : ''} relative`}>
            {renderContent()}
          </main>
        </div>

        {/* Right Sidebar - only on feed for now to match Figma design */}
        {showNavigation && currentRoute === 'feed' && <RightSidebar />}
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
