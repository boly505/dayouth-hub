import { useState } from 'react';
import type { User } from '@/types';
import { authAPI, uploadImageToImgbb } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  UserCircle, 
  Lock, 
  Upload,
  Save,
  Check,
  Crown,
  Shield
} from 'lucide-react';

interface SettingsViewProps {
  user: User;
  onUpdate: () => void;
}

export function SettingsView({ user, onUpdate }: SettingsViewProps) {
  const [profileData, setProfileData] = useState({
    displayName: user.displayName || '',
    bio: user.bio || '',
    avatar: user.avatar || '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const url = await uploadImageToImgbb(file);
        setProfileData(prev => ({ ...prev, avatar: url }));
      } catch {
        const reader = new FileReader();
        reader.onloadend = () => {
          setProfileData(prev => ({ ...prev, avatar: reader.result as string }));
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    
    const result = await authAPI.updateProfile(user.id, {
      displayName: profileData.displayName,
      bio: profileData.bio,
      avatar: profileData.avatar,
    });

    if (result.success) {
      setMessage('تم حفظ التغييرات بنجاح');
      onUpdate();
    } else {
      setMessage(result.error || 'حدث خطأ');
    }
    
    setIsSaving(false);
    setTimeout(() => setMessage(''), 3000);
  };

  const handleChangePassword = () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage('كلمات المرور غير متطابقة');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setMessage('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }

    setMessage('تم تغيير كلمة المرور بنجاح');
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setTimeout(() => setMessage(''), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white">الإعدادات</h2>
        <p className="text-[#a0a0a0]">تخصيص ملفك الشخصي والتفضيلات</p>
      </div>

      {message && (
        <div className={`p-3 border rounded-lg text-sm text-center ${
          message.includes('خطأ') || message.includes('غير')
            ? 'bg-red-500/10 border-red-500/30 text-red-400'
            : 'bg-green-500/10 border-green-500/30 text-green-400'
        }`}>
          {message}
        </div>
      )}

      {/* Profile Settings */}
      <Card className="social-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <UserCircle className="w-5 h-5 text-red-500" />
            الملف الشخصي
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <Avatar className="w-20 h-20">
              <AvatarImage src={profileData.avatar} />
              <AvatarFallback className="bg-[#242424] text-white text-xl">
                {profileData.displayName[0] || user.username[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <label className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] rounded-lg cursor-pointer hover:bg-[#242424] transition-colors">
                <Upload className="w-4 h-4 text-[#a0a0a0]" />
                <span className="text-[#a0a0a0]">تغيير الصورة</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Display Name */}
          <div className="space-y-2">
            <Label htmlFor="displayName" className="text-[#a0a0a0]">الاسم المعروض</Label>
            <Input
              id="displayName"
              value={profileData.displayName}
              onChange={(e) => setProfileData(prev => ({ ...prev, displayName: e.target.value }))}
              className="bg-[#1a1a1a] border-[#242424] text-white"
            />
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio" className="text-[#a0a0a0]">النبذة الشخصية</Label>
            <Textarea
              id="bio"
              value={profileData.bio}
              onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
              className="bg-[#1a1a1a] border-[#242424] text-white min-h-[100px]"
              placeholder="اكتب نبذة عن yourself..."
            />
          </div>

          <Button
            onClick={handleSaveProfile}
            disabled={isSaving}
            className="w-full bg-red-600 hover:bg-red-500 text-white"
          >
            {isSaving ? (
              <div className="spinner w-5 h-5" />
            ) : (
              <>
                <Save className="w-4 h-4 ml-2" />
                حفظ التغييرات
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Special Features Info - للمعلومة فقط */}
      <Card className="social-card border-amber-500/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-400">
            <Crown className="w-5 h-5" />
            المميزات الخاصة
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-[#1a1a1a] rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                <Crown className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-white font-medium">الإطار الملون</p>
                <p className="text-sm text-[#666666]">إطار ناري، ذهبي، أو نيون</p>
              </div>
            </div>
            {user.frameStyle !== 'NONE' ? (
              <span className="text-green-400 text-sm flex items-center gap-1">
                <Check className="w-4 h-4" />
                مفعل
              </span>
            ) : (
              <span className="text-[#666666] text-sm">غير مفعل</span>
            )}
          </div>

          <div className="flex items-center justify-between p-3 bg-[#1a1a1a] rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                <Shield className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-white font-medium">علامة التوثيق</p>
                <p className="text-sm text-[#666666]">علامة التوثيق الزرقاء</p>
              </div>
            </div>
            {user.isVerified ? (
              <span className="text-green-400 text-sm flex items-center gap-1">
                <Check className="w-4 h-4" />
                موثق
              </span>
            ) : (
              <span className="text-[#666666] text-sm">غير موثق</span>
            )}
          </div>

          <div className="flex items-center justify-between p-3 bg-[#1a1a1a] rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
                <span className="text-yellow-400 font-bold">S</span>
              </div>
              <div>
                <p className="text-white font-medium">الاسم اللامع</p>
                <p className="text-sm text-[#666666]">تأثير ذهبي متحرك على الاسم</p>
              </div>
            </div>
            {user.isShiny ? (
              <span className="text-green-400 text-sm flex items-center gap-1">
                <Check className="w-4 h-4" />
                مفعل
              </span>
            ) : (
              <span className="text-[#666666] text-sm">غير مفعل</span>
            )}
          </div>

          <p className="text-sm text-[#666666] text-center">
            هذه المميزات يضيفها مسؤول الموقع فقط
          </p>
        </CardContent>
      </Card>

      {/* Password Settings */}
      <Card className="social-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Lock className="w-5 h-5 text-red-500" />
            تغيير كلمة المرور
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword" className="text-[#a0a0a0]">كلمة المرور الحالية</Label>
            <Input
              id="currentPassword"
              type="password"
              value={passwordData.currentPassword}
              onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
              className="bg-[#1a1a1a] border-[#242424] text-white"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword" className="text-[#a0a0a0]">كلمة المرور الجديدة</Label>
            <Input
              id="newPassword"
              type="password"
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
              className="bg-[#1a1a1a] border-[#242424] text-white"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-[#a0a0a0]">تأكيد كلمة المرور</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
              className="bg-[#1a1a1a] border-[#242424] text-white"
            />
          </div>

          <Button
            onClick={handleChangePassword}
            variant="outline"
            className="w-full border-[#242424] text-[#a0a0a0] hover:text-white"
          >
            تغيير كلمة المرور
          </Button>
        </CardContent>
      </Card>

      {/* App Info */}
      <Card className="social-card">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-white font-semibold">SocialHub</h3>
              <p className="text-sm text-[#666666]">الإصدار 2.0.0</p>
            </div>
            <div className="text-[#666666] text-sm">
              © 2024 جميع الحقوق محفوظة
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
