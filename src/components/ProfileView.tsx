import { useState, useEffect } from 'react';
import type { User, Post } from '@/types';
import { ROLE_COLORS, ROLE_LABELS_AR, FRAME_LABELS } from '@/types';
import { userAPI, postAPI } from '@/lib/supabase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MessageSquare, 
  Calendar, 
  Heart, 
  FileText,
  Edit,
  Check,
  Shield
} from 'lucide-react';

interface ProfileViewProps {
  userId?: string;
  onMessageUser?: (user: User) => void;
  onEditProfile?: () => void;
}

export function ProfileView({ userId, onMessageUser, onEditProfile }: ProfileViewProps) {
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [stats, setStats] = useState({ postsCount: 0, likesCount: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    setIsLoading(true);
    
    const targetUserId = userId;
    if (!targetUserId) {
      setIsLoading(false);
      return;
    }

    const userData = await userAPI.getById(targetUserId);
    if (userData) {
      setUser(userData);
      const userStats = await userAPI.getStats(targetUserId);
      setStats(userStats);
      
      // Load user's posts
      const allPosts = await postAPI.getAll(1, 100);
      const userPosts = allPosts.posts.filter((p: Post) => p.authorId === targetUserId);
      setPosts(userPosts);
    }
    
    setIsLoading(false);
  };

  const getFrameClass = () => {
    switch (user?.frameStyle) {
      case 'FIRE': return 'frame-fire';
      case 'GOLD': return 'frame-gold';
      case 'NEON': return 'frame-neon';
      default: return '';
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-16">
        <p className="text-[#a0a0a0]">المستخدم غير موجود</p>
      </div>
    );
  }

  const isOwnProfile = !userId;

  return (
    <div className="space-y-6">
      {/* Cover & Profile */}
      <div className="relative">
        {/* Cover Image */}
        <div className="h-48 bg-gradient-to-r from-red-900 via-red-700 to-amber-700 rounded-xl" />
        
        {/* Profile Info */}
        <div className="px-6 pb-6">
          <div className="flex flex-col md:flex-row md:items-end -mt-16 mb-4">
            {/* Avatar */}
            <div className={`relative ${getFrameClass()}`}>
              <Avatar className="w-32 h-32 border-4 border-[#141414]">
                <AvatarImage src={user.avatar} />
                <AvatarFallback className="bg-[#242424] text-white text-3xl">
                  {user.displayName?.[0] || user.username[0]}
                </AvatarFallback>
              </Avatar>
              <div className={`online-status w-4 h-4 ${user.isOnline ? '' : 'offline'}`} />
            </div>
            
            {/* Name & Actions */}
            <div className="mt-4 md:mt-0 md:mr-4 flex-1">
              <div className="flex items-center gap-2">
                <h1 className={`text-2xl font-bold ${user.isShiny ? 'shiny-name' : 'text-white'}`}>
                  {user.displayName || user.username}
                </h1>
                {user.isVerified && (
                  <Badge className="bg-blue-500/20 text-blue-400">
                    <Check className="w-3 h-3 ml-1" />
                    موثق
                  </Badge>
                )}
              </div>
              <p className="text-[#a0a0a0]">@{user.username}</p>
              
              <div className="flex items-center gap-2 mt-2">
                <Badge 
                  className="text-sm"
                  style={{ 
                    backgroundColor: `${ROLE_COLORS[user.role]}20`,
                    color: ROLE_COLORS[user.role],
                    borderColor: ROLE_COLORS[user.role],
                  }}
                  variant="outline"
                >
                  {ROLE_LABELS_AR[user.role]}
                </Badge>
                
                {user.frameStyle !== 'NONE' && (
                  <Badge className="bg-[#1a1a1a] text-[#a0a0a0]">
                    {FRAME_LABELS[user.frameStyle]}
                  </Badge>
                )}

                {user.role === 'ADMIN' && (
                  <Badge className="bg-amber-500/20 text-amber-400">
                    <Shield className="w-3 h-3 ml-1" />
                    مسؤول
                  </Badge>
                )}
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="mt-4 md:mt-0 flex gap-2">
              {isOwnProfile ? (
                <Button
                  onClick={onEditProfile}
                  variant="outline"
                  className="border-[#242424] text-[#a0a0a0] hover:text-white"
                >
                  <Edit className="w-4 h-4 ml-2" />
                  تعديل الملف
                </Button>
              ) : (
                <Button
                  onClick={() => onMessageUser?.(user)}
                  className="bg-red-600 hover:bg-red-500 text-white"
                >
                  <MessageSquare className="w-4 h-4 ml-2" />
                  رسالة
                </Button>
              )}
            </div>
          </div>
          
          {/* Bio */}
          {user.bio && (
            <p className="text-[#a0a0a0] mb-4">{user.bio}</p>
          )}
          
          {/* Stats */}
          <div className="flex flex-wrap gap-4 text-sm text-[#a0a0a0]">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>انضم {formatDate(user.createdAt)}</span>
            </div>
            <div className="flex items-center gap-1">
              <FileText className="w-4 h-4" />
              <span>{stats.postsCount} منشور</span>
            </div>
            <div className="flex items-center gap-1">
              <Heart className="w-4 h-4" />
              <span>{stats.likesCount} إعجاب</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content Tabs */}
      <Tabs defaultValue="posts" className="w-full">
        <TabsList className="bg-[#1a1a1a] w-full justify-start">
          <TabsTrigger value="posts" className="data-[state=active]:bg-[#242424]">المنشورات</TabsTrigger>
          <TabsTrigger value="about" className="data-[state=active]:bg-[#242424]">حول</TabsTrigger>
        </TabsList>
        
        <TabsContent value="posts" className="mt-6">
          {posts.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-[#1a1a1a] flex items-center justify-center">
                <FileText className="w-10 h-10 text-[#666666]" />
              </div>
              <p className="text-[#a0a0a0]">لا توجد منشورات</p>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <Card key={post.id} className="social-card">
                  <CardContent className="p-4">
                    <p className="text-white mb-4 whitespace-pre-wrap">{post.content}</p>
                    
                    {post.image && (
                      <img 
                        src={post.image} 
                        alt="Post" 
                        className="w-full max-h-96 object-cover rounded-lg mb-4"
                      />
                    )}
                    
                    <div className="flex items-center gap-4 text-sm text-[#a0a0a0]">
                      <span>{(post.likes || []).length} إعجاب</span>
                      <span>{(post.comments || []).length} تعليق</span>
                      <span>{formatDate(post.createdAt)}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="about" className="mt-6">
          <Card className="social-card">
            <CardContent className="p-6 space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">معلومات المستخدم</h3>
                <div className="space-y-2 text-[#a0a0a0]">
                  <p><span className="text-[#666666]">اسم المستخدم:</span> @{user.username}</p>
                  <p><span className="text-[#666666]">البريد الإلكتروني:</span> {user.email}</p>
                  <p><span className="text-[#666666]">الدور:</span> {ROLE_LABELS_AR[user.role]}</p>
                  <p><span className="text-[#666666]">تاريخ الانضمام:</span> {formatDate(user.createdAt)}</p>
                  <p><span className="text-[#666666]">آخر ظهور:</span> {user.lastSeen ? formatDate(user.lastSeen) : 'غير معروف'}</p>
                </div>
              </div>
              
              {user.bio && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">النبذة الشخصية</h3>
                  <p className="text-[#a0a0a0]">{user.bio}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
