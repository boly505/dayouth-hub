import { useState, useEffect } from 'react';
import type { User } from '@/types';
import { UserRole, ROLE_COLORS, ROLE_LABELS_AR } from '@/types';
import { userAPI } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { MessageSquare, Search, Filter } from 'lucide-react';

interface RadarViewProps {
  onMessageUser: (user: User) => void;
  onViewProfile: (user: User) => void;
}

// 3 خيارات + الكل
const roleFilters = [
  { value: 'ALL', label: 'الكل' },
  { value: UserRole.TYPE_1, label: ROLE_LABELS_AR[UserRole.TYPE_1] },
  { value: UserRole.TYPE_2, label: ROLE_LABELS_AR[UserRole.TYPE_2] },
  { value: UserRole.TYPE_3, label: ROLE_LABELS_AR[UserRole.TYPE_3] },
];

export function RadarView({ onMessageUser, onViewProfile }: RadarViewProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, selectedRole, searchQuery]);

  const loadUsers = async () => {
    setIsLoading(true);
    const allUsers = await userAPI.getAll();
    setUsers(allUsers);
    setIsLoading(false);
  };

  const filterUsers = () => {
    let filtered = users;

    if (selectedRole !== 'ALL') {
      filtered = filtered.filter(u => u.role === selectedRole);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(u => 
        u.username.toLowerCase().includes(query) ||
        u.displayName?.toLowerCase().includes(query) ||
        u.bio?.toLowerCase().includes(query)
      );
    }

    setFilteredUsers(filtered);
  };

  const getFrameClass = (frameStyle: string) => {
    switch (frameStyle) {
      case 'FIRE': return 'frame-fire';
      case 'GOLD': return 'frame-gold';
      case 'NEON': return 'frame-neon';
      default: return '';
    }
  };

  const formatLastSeen = (date?: string) => {
    if (!date) return 'غير معروف';
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'الآن';
    if (minutes < 60) return `منذ ${minutes} دقيقة`;
    if (hours < 24) return `منذ ${hours} ساعة`;
    return `منذ ${days} يوم`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">الرادار</h2>
          <p className="text-[#a0a0a0]">اكتشف الأعضاء في المنصة</p>
        </div>
        
        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#666666]" />
          <Input
            placeholder="البحث عن أعضاء..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10 bg-[#1a1a1a] border-[#242424] text-white placeholder:text-[#666666]"
          />
        </div>
      </div>

      {/* Role Filters - 3 خيارات فقط */}
      <div className="flex flex-wrap gap-2">
        {roleFilters.map((filter) => (
          <button
            key={filter.value}
            onClick={() => setSelectedRole(filter.value)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              selectedRole === filter.value
                ? 'bg-red-600 text-white'
                : 'bg-[#1a1a1a] text-[#a0a0a0] hover:bg-[#242424] hover:text-white'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Users Grid */}
      {filteredUsers.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-[#1a1a1a] flex items-center justify-center">
            <Filter className="w-10 h-10 text-[#666666]" />
          </div>
          <p className="text-[#a0a0a0] text-lg">لا يوجد أعضاء مطابقين للبحث</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredUsers.map((user) => (
            <Card 
              key={user.id} 
              className="social-card hover-lift cursor-pointer group"
              onClick={() => onViewProfile(user)}
            >
              <CardContent className="p-4">
                <div className="flex flex-col items-center text-center">
                  {/* Avatar */}
                  <div className={`relative mb-3 ${getFrameClass(user.frameStyle)}`}>
                    <Avatar className="w-20 h-20">
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback className="bg-[#242424] text-white text-xl">
                        {user.displayName?.[0] || user.username[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`online-status ${user.isOnline ? '' : 'offline'}`} />
                  </div>

                  {/* Name */}
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className={`font-semibold text-lg ${user.isShiny ? 'shiny-name' : 'text-white'}`}>
                      {user.displayName || user.username}
                    </h3>
                    {user.isVerified && (
                      <span className="text-blue-400 text-sm">
                        <i className="fas fa-check-circle"></i>
                      </span>
                    )}
                  </div>

                  {/* Role Badge */}
                  <Badge 
                    className="mb-2"
                    style={{ 
                      backgroundColor: `${ROLE_COLORS[user.role]}20`,
                      color: ROLE_COLORS[user.role],
                      borderColor: ROLE_COLORS[user.role],
                    }}
                    variant="outline"
                  >
                    {ROLE_LABELS_AR[user.role]}
                  </Badge>

                  {/* Bio */}
                  {user.bio && (
                    <p className="text-[#a0a0a0] text-sm mb-3 line-clamp-2">
                      {user.bio}
                    </p>
                  )}

                  {/* Status */}
                  <p className="text-xs text-[#666666] mb-4">
                    {user.isOnline ? (
                      <span className="text-green-500">متصل الآن</span>
                    ) : (
                      formatLastSeen(user.lastSeen)
                    )}
                  </p>

                  {/* Actions */}
                  <div className="flex gap-2 w-full">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 border-[#242424] text-[#a0a0a0] hover:text-white hover:bg-[#242424]"
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewProfile(user);
                      }}
                    >
                      الملف الشخصي
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 bg-red-600 hover:bg-red-500 text-white"
                      onClick={(e) => {
                        e.stopPropagation();
                        onMessageUser(user);
                      }}
                    >
                      <MessageSquare className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
