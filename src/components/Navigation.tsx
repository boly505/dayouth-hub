import { useState } from 'react';
import type { User } from '@/types';
import { UserRole, ROLE_COLORS, ROLE_LABELS_AR } from '@/types';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Radar, 
  Image, 
  MessageSquare, 
  Users, 
  UserCircle, 
  Settings, 
  LogOut,
  Menu,
  X,
  Shield
} from 'lucide-react';

interface NavigationProps {
  user: User;
  currentView: string;
  onViewChange: (view: string) => void;
  onLogout: () => void;
  onOpenAdmin: () => void;
}

const navItems = [
  { id: 'radar', label: 'الرادار', icon: Radar },
  { id: 'gallery', label: 'المعرض', icon: Image },
  { id: 'chat', label: 'المحادثات', icon: MessageSquare },
  { id: 'group-chat', label: 'الدردشة الجماعية', icon: Users },
  { id: 'profile', label: 'الملف الشخصي', icon: UserCircle },
  { id: 'settings', label: 'الإعدادات', icon: Settings },
];

export function Navigation({ user, currentView, onViewChange, onLogout, onOpenAdmin }: NavigationProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const getFrameClass = () => {
    switch (user.frameStyle) {
      case 'FIRE': return 'frame-fire';
      case 'GOLD': return 'frame-gold';
      case 'NEON': return 'frame-neon';
      default: return '';
    }
  };

  const NavContent = () => (
    <>
      {/* Logo */}
      <div className="p-6 border-b border-[#242424]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-600 to-amber-600 flex items-center justify-center">
            <span className="text-lg font-bold text-white">S</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">SocialHub</h1>
            <p className="text-xs text-[#666666]">منصة التواصل</p>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-[#242424]">
        <div className="flex items-center gap-3">
          <div className={`relative ${getFrameClass()}`}>
            <Avatar className="w-12 h-12">
              <AvatarImage src={user.avatar} />
              <AvatarFallback className="bg-[#242424] text-white">
                {user.displayName?.[0] || user.username[0]}
              </AvatarFallback>
            </Avatar>
            <div className={`online-status ${user.isOnline ? '' : 'offline'}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className={`font-semibold truncate ${user.isShiny ? 'shiny-name' : 'text-white'}`}>
                {user.displayName || user.username}
              </p>
              {user.isVerified && (
                <span className="text-blue-400 text-xs">
                  <i className="fas fa-check-circle"></i>
                </span>
              )}
            </div>
            <p 
              className="text-xs font-medium"
              style={{ color: ROLE_COLORS[user.role] }}
            >
              {ROLE_LABELS_AR[user.role]}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <ScrollArea className="flex-1 py-4">
        <nav className="px-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => {
                  onViewChange(item.id);
                  setIsMobileOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-red-600/20 to-red-500/10 text-red-400 border-r-2 border-red-500'
                    : 'text-[#a0a0a0] hover:bg-[#242424] hover:text-white'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-red-400' : ''}`} />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}

          {/* Admin Panel Link - فقط للمسؤول */}
          {user.role === UserRole.ADMIN && (
            <button
              onClick={() => {
                onOpenAdmin();
                setIsMobileOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-amber-400 hover:bg-amber-500/10"
            >
              <Shield className="w-5 h-5" />
              <span className="font-medium">لوحة التحكم</span>
            </button>
          )}
        </nav>
      </ScrollArea>

      {/* Logout */}
      <div className="p-4 border-t border-[#242424]">
        <Button
          variant="ghost"
          onClick={onLogout}
          className="w-full flex items-center gap-3 text-[#a0a0a0] hover:text-red-400 hover:bg-red-500/10"
        >
          <LogOut className="w-5 h-5" />
          <span>تسجيل الخروج</span>
        </Button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 right-4 z-50 w-10 h-10 bg-[#1a1a1a] rounded-lg flex items-center justify-center text-white border border-[#242424]"
      >
        {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex flex-col w-72 h-screen bg-[#141414] border-l border-[#242424] fixed right-0 top-0 z-30">
        <NavContent />
      </aside>

      {/* Sidebar - Mobile */}
      <aside
        className={`lg:hidden fixed inset-y-0 right-0 w-72 bg-[#141414] border-l border-[#242424] z-50 transform transition-transform duration-300 ${
          isMobileOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <NavContent />
      </aside>
    </>
  );
}
