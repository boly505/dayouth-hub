import { useState, useEffect } from 'react';
import type { User } from '@/types';
import { authAPI } from '@/lib/supabase';
import { AuthForm } from '@/components/AuthForm';
import { Navigation } from '@/components/Navigation';
import { RadarView } from '@/components/RadarView';
import { GalleryView } from '@/components/GalleryView';
import { ChatView } from '@/components/ChatView';
import { GroupChatView } from '@/components/GroupChatView';
import { ProfileView } from '@/components/ProfileView';
import { SettingsView } from '@/components/SettingsView';
import { AdminPanel } from '@/components/AdminPanel';
import { Toaster } from '@/components/ui/sonner';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState('radar');
  const [chatInitialUser, setChatInitialUser] = useState<User | null>(null);
  const [profileUserId, setProfileUserId] = useState<string | undefined>(undefined);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const user = authAPI.getCurrentUser();
    if (user) {
      setCurrentUser(user);
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  const handleAuthSuccess = () => {
    const user = authAPI.getCurrentUser();
    setCurrentUser(user);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    authAPI.logout();
    setCurrentUser(null);
    setIsAuthenticated(false);
    setCurrentView('radar');
    setShowAdminPanel(false);
  };

  const handleViewChange = (view: string) => {
    setCurrentView(view);
    setChatInitialUser(null);
    setProfileUserId(undefined);
  };

  const handleMessageUser = (user: User) => {
    setChatInitialUser(user);
    setCurrentView('chat');
  };

  const handleViewProfile = (user: User) => {
    setProfileUserId(user.id);
    setCurrentView('profile');
  };

  const handleUpdateProfile = () => {
    const user = authAPI.getCurrentUser();
    setCurrentUser(user);
  };

  const renderView = () => {
    switch (currentView) {
      case 'radar':
        return (
          <RadarView 
            onMessageUser={handleMessageUser} 
            onViewProfile={handleViewProfile} 
          />
        );
      case 'gallery':
        return (
          <GalleryView 
            onViewProfile={handleViewProfile} 
          />
        );
      case 'chat':
        return (
          <ChatView 
            initialUser={chatInitialUser} 
          />
        );
      case 'group-chat':
        return <GroupChatView />;
      case 'profile':
        return (
          <ProfileView 
            userId={profileUserId}
            onMessageUser={handleMessageUser}
            onEditProfile={() => setCurrentView('settings')}
          />
        );
      case 'settings':
        return currentUser ? (
          <SettingsView 
            user={currentUser} 
            onUpdate={handleUpdateProfile}
          />
        ) : null;
      default:
        return (
          <RadarView 
            onMessageUser={handleMessageUser} 
            onViewProfile={handleViewProfile} 
          />
        );
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="spinner w-10 h-10" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <AuthForm onAuthSuccess={handleAuthSuccess} />
        <Toaster />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Navigation 
        user={currentUser!}
        currentView={currentView}
        onViewChange={handleViewChange}
        onLogout={handleLogout}
        onOpenAdmin={() => setShowAdminPanel(true)}
      />
      
      <main className="lg:mr-72 p-4 lg:p-8">
        <div className="max-w-6xl mx-auto">
          {renderView()}
        </div>
      </main>

      {/* Admin Panel */}
      {showAdminPanel && (
        <AdminPanel onClose={() => setShowAdminPanel(false)} />
      )}
      
      <Toaster />
    </div>
  );
}

export default App;
