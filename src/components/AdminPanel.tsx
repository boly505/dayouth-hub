import { useState, useEffect } from 'react';
import type { User, SiteStats } from '@/types';
import { UserRole, FrameStyle, ROLE_LABELS_AR, FRAME_LABELS, ROLE_COLORS } from '@/types';
import { adminAPI } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Users, 
  FileText, 
  MessageSquare, 
  TrendingUp,
  Search,
  Shield,
  Crown,
  Check,
  Trash2,
  Edit,
  RefreshCw
} from 'lucide-react';

interface AdminPanelProps {
  onClose: () => void;
}

export function AdminPanel({ onClose }: AdminPanelProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<SiteStats | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('users');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    const [usersData, statsData] = await Promise.all([
      adminAPI.getAllUsers(),
      adminAPI.getStats(),
    ]);
    setUsers(usersData);
    setStats(statsData);
    setIsLoading(false);
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    const result = await adminAPI.updateUser(selectedUser.id, {
      role: selectedUser.role,
      frameStyle: selectedUser.frameStyle,
      isShiny: selectedUser.isShiny,
      isVerified: selectedUser.isVerified,
    });

    if (result.success) {
      setSelectedUser(null);
      loadData();
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المستخدم؟')) return;
    
    const success = await adminAPI.deleteUser(userId);
    if (success) {
      loadData();
    }
  };

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.displayName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getFrameClass = (frameStyle: string) => {
    switch (frameStyle) {
      case 'FIRE': return 'frame-fire';
      case 'GOLD': return 'frame-gold';
      case 'NEON': return 'frame-neon';
      default: return '';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 overflow-auto">
      <div className="min-h-screen p-4 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">لوحة التحكم</h1>
                <p className="text-[#a0a0a0]">إدارة الموقع والمستخدمين</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={loadData}
                className="border-[#242424] text-[#a0a0a0]"
              >
                <RefreshCw className="w-4 h-4 ml-2" />
                تحديث
              </Button>
              <Button
                variant="outline"
                onClick={onClose}
                className="border-[#242424] text-[#a0a0a0]"
              >
                إغلاق
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card className="social-card">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                    <Users className="w-6 h-6 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-[#a0a0a0] text-sm">المستخدمين</p>
                    <p className="text-2xl font-bold text-white">{stats.users}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="social-card">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                    <FileText className="w-6 h-6 text-green-500" />
                  </div>
                  <div>
                    <p className="text-[#a0a0a0] text-sm">المنشورات</p>
                    <p className="text-2xl font-bold text-white">{stats.posts}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="social-card">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                    <MessageSquare className="w-6 h-6 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-[#a0a0a0] text-sm">الرسائل</p>
                    <p className="text-2xl font-bold text-white">{stats.messages}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="social-card">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-[#a0a0a0] text-sm">الدردشة الجماعية</p>
                    <p className="text-2xl font-bold text-white">{stats.groupMessages}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-[#1a1a1a] mb-6">
              <TabsTrigger value="users" className="data-[state=active]:bg-[#242424]">
                <Users className="w-4 h-4 ml-2" />
                المستخدمين
              </TabsTrigger>
              <TabsTrigger value="settings" className="data-[state=active]:bg-[#242424]">
                <Crown className="w-4 h-4 ml-2" />
                الإعدادات
              </TabsTrigger>
            </TabsList>

            <TabsContent value="users">
              <Card className="social-card">
                <CardHeader>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <CardTitle className="text-white">إدارة المستخدمين</CardTitle>
                    <div className="relative w-full md:w-72">
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#666666]" />
                      <Input
                        placeholder="البحث عن مستخدم..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pr-10 bg-[#1a1a1a] border-[#242424] text-white"
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-3">
                      {filteredUsers.map((user) => (
                        <div
                          key={user.id}
                          className="flex items-center gap-4 p-4 bg-[#1a1a1a] rounded-xl hover:bg-[#242424] transition-colors"
                        >
                          <div className={`relative ${getFrameClass(user.frameStyle)}`}>
                            <Avatar className="w-12 h-12">
                              <AvatarImage src={user.avatar} />
                              <AvatarFallback className="bg-[#242424] text-white">
                                {user.displayName?.[0] || user.username[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div className={`online-status w-3 h-3 ${user.isOnline ? '' : 'offline'}`} />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className={`font-semibold ${user.isShiny ? 'shiny-name' : 'text-white'}`}>
                                {user.displayName || user.username}
                              </p>
                              {user.isVerified && (
                                <Badge className="bg-blue-500/20 text-blue-400">
                                  <Check className="w-3 h-3 ml-1" />
                                  موثق
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-[#666666]">{user.email}</p>
                          </div>

                          <Badge
                            style={{
                              backgroundColor: `${ROLE_COLORS[user.role]}20`,
                              color: ROLE_COLORS[user.role],
                            }}
                          >
                            {ROLE_LABELS_AR[user.role]}
                          </Badge>

                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedUser(user)}
                              className="border-[#242424]"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            {user.role !== 'ADMIN' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteUser(user.id)}
                                className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings">
              <Card className="social-card">
                <CardHeader>
                  <CardTitle className="text-white">إعدادات الموقع</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="p-4 bg-[#1a1a1a] rounded-xl">
                    <h3 className="text-white font-semibold mb-2">معلومات المسؤول</h3>
                    <div className="space-y-2 text-[#a0a0a0]">
                      <p>يمكنك إدارة الموقع من هذه اللوحة</p>
                      <ul className="list-disc list-inside space-y-1 mr-4">
                        <li>إضافة/حذف المستخدمين</li>
                        <li>منح الإطارات الملونة للمستخدمين</li>
                        <li>إضافة علامة التوثيق للمستخدمين</li>
                        <li>تفعيل الأسماء اللامعة</li>
                        <li>تغيير أدوار المستخدمين</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Edit User Dialog */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="bg-[#141414] border-[#242424] text-white max-w-md">
          <DialogHeader>
            <DialogTitle>تعديل المستخدم</DialogTitle>
          </DialogHeader>
          
          {selectedUser && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 mb-6">
                <div className={`relative ${getFrameClass(selectedUser.frameStyle)}`}>
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={selectedUser.avatar} />
                    <AvatarFallback className="bg-[#242424] text-white">
                      {selectedUser.displayName?.[0] || selectedUser.username[0]}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div>
                  <p className="font-semibold text-white">{selectedUser.displayName || selectedUser.username}</p>
                  <p className="text-sm text-[#666666]">{selectedUser.email}</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[#a0a0a0] text-sm">الدور</label>
                <Select
                  value={selectedUser.role}
                  onValueChange={(value) => setSelectedUser({ ...selectedUser, role: value as any })}
                >
                  <SelectTrigger className="bg-[#1a1a1a] border-[#242424] text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1a] border-[#242424]">
                    <SelectItem value={UserRole.TYPE_1}>{ROLE_LABELS_AR[UserRole.TYPE_1]}</SelectItem>
                    <SelectItem value={UserRole.TYPE_2}>{ROLE_LABELS_AR[UserRole.TYPE_2]}</SelectItem>
                    <SelectItem value={UserRole.TYPE_3}>{ROLE_LABELS_AR[UserRole.TYPE_3]}</SelectItem>
                    <SelectItem value={UserRole.ADMIN}>{ROLE_LABELS_AR[UserRole.ADMIN]}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-[#a0a0a0] text-sm">الإطار</label>
                <Select
                  value={selectedUser.frameStyle}
                  onValueChange={(value) => setSelectedUser({ ...selectedUser, frameStyle: value as any })}
                >
                  <SelectTrigger className="bg-[#1a1a1a] border-[#242424] text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1a] border-[#242424]">
                    {Object.values(FrameStyle).map((style) => (
                      <SelectItem key={style} value={style}>
                        {FRAME_LABELS[style]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-white">اسم لامع</label>
                  <p className="text-sm text-[#666666]">جعل الاسم يتألق بتأثير ذهبي</p>
                </div>
                <Switch
                  checked={selectedUser.isShiny}
                  onCheckedChange={(checked) => setSelectedUser({ ...selectedUser, isShiny: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-white">علامة التوثيق</label>
                  <p className="text-sm text-[#666666]">إضافة علامة التوثيق الزرقاء</p>
                </div>
                <Switch
                  checked={selectedUser.isVerified}
                  onCheckedChange={(checked) => setSelectedUser({ ...selectedUser, isVerified: checked })}
                />
              </div>

              <Button
                onClick={handleUpdateUser}
                className="w-full bg-red-600 hover:bg-red-500 text-white"
              >
                حفظ التغييرات
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
