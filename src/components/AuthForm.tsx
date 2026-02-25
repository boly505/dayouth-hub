import { useState } from 'react';
import { UserRole } from '@/types';
import { authAPI, uploadImageToImgbb } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Eye, EyeOff, Upload, User, Lock, Mail } from 'lucide-react';

interface AuthFormProps {
  onAuthSuccess: () => void;
}

// 3 خيارات فقط للمستخدم (1, 2, 3)
const USER_ROLE_OPTIONS = [
  { value: UserRole.TYPE_1, label: 'النوع 1' },
  { value: UserRole.TYPE_2, label: 'النوع 2' },
  { value: UserRole.TYPE_3, label: 'النوع 3' },
];

export function AuthForm({ onAuthSuccess }: AuthFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [avatarPreview, setAvatarPreview] = useState('');
  
  // Login form
  const [loginData, setLoginData] = useState({
    email: '',
    password: '',
  });
  
  // Register form
  const [registerData, setRegisterData] = useState({
    email: '',
    username: '',
    password: '',
    displayName: '',
    role: UserRole.TYPE_1, // Default to Type 1
    avatar: '',
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    const result = await authAPI.login(loginData.email, loginData.password);
    
    if (result.success) {
      onAuthSuccess();
    } else {
      setError(result.error || 'حدث خطأ أثناء تسجيل الدخول');
    }
    
    setIsLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    const result = await authAPI.register(registerData);
    
    if (result.success) {
      onAuthSuccess();
    } else {
      setError(result.error || 'حدث خطأ أثناء إنشاء الحساب');
    }
    
    setIsLoading(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const url = await uploadImageToImgbb(file);
        setAvatarPreview(url);
        setRegisterData(prev => ({ ...prev, avatar: url }));
      } catch {
        // Fallback to local preview
        const reader = new FileReader();
        reader.onloadend = () => {
          setAvatarPreview(reader.result as string);
          setRegisterData(prev => ({ ...prev, avatar: reader.result as string }));
        };
        reader.readAsDataURL(file);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#0a0a0a] via-[#141414] to-[#1a1a1a]">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-600/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>
      
      <Card className="w-full max-w-md relative z-10 bg-[#141414]/90 backdrop-blur-xl border-[#242424]">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 mb-4 rounded-full bg-gradient-to-br from-red-600 to-amber-600 flex items-center justify-center">
            <span className="text-2xl font-bold text-white">S</span>
          </div>
          <CardTitle className="text-2xl font-bold text-white">SocialHub</CardTitle>
          <p className="text-[#a0a0a0] mt-2">منصة التواصل الاجتماعي</p>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-[#1a1a1a]">
              <TabsTrigger value="login" className="data-[state=active]:bg-[#242424]">تسجيل الدخول</TabsTrigger>
              <TabsTrigger value="register" className="data-[state=active]:bg-[#242424]">إنشاء حساب</TabsTrigger>
            </TabsList>
            
            {error && (
              <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm text-center">
                {error}
              </div>
            )}
            
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email" className="text-[#a0a0a0]">البريد الإلكتروني</Label>
                  <div className="relative">
                    <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#666666]" />
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="your@email.com"
                      value={loginData.email}
                      onChange={(e) => setLoginData(prev => ({ ...prev, email: e.target.value }))}
                      className="pr-10 bg-[#1a1a1a] border-[#242424] text-white placeholder:text-[#666666]"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="login-password" className="text-[#a0a0a0]">كلمة المرور</Label>
                  <div className="relative">
                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#666666]" />
                    <Input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={loginData.password}
                      onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                      className="pr-10 pl-10 bg-[#1a1a1a] border-[#242424] text-white placeholder:text-[#666666]"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666666] hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white"
                >
                  {isLoading ? (
                    <div className="spinner w-5 h-5" />
                  ) : (
                    'تسجيل الدخول'
                  )}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4 mt-4">
                <div className="flex justify-center mb-4">
                  <div className="relative">
                    <Avatar className="w-20 h-20">
                      <AvatarImage src={avatarPreview} />
                      <AvatarFallback className="bg-[#242424]">
                        <User className="w-8 h-8 text-[#666666]" />
                      </AvatarFallback>
                    </Avatar>
                    <label className="absolute -bottom-1 -right-1 w-8 h-8 bg-red-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-red-500 transition-colors">
                      <Upload className="w-4 h-4 text-white" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="reg-email" className="text-[#a0a0a0]">البريد الإلكتروني</Label>
                  <div className="relative">
                    <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#666666]" />
                    <Input
                      id="reg-email"
                      type="email"
                      placeholder="your@email.com"
                      value={registerData.email}
                      onChange={(e) => setRegisterData(prev => ({ ...prev, email: e.target.value }))}
                      className="pr-10 bg-[#1a1a1a] border-[#242424] text-white placeholder:text-[#666666]"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="reg-username" className="text-[#a0a0a0]">اسم المستخدم</Label>
                  <div className="relative">
                    <User className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#666666]" />
                    <Input
                      id="reg-username"
                      type="text"
                      placeholder="username"
                      value={registerData.username}
                      onChange={(e) => setRegisterData(prev => ({ ...prev, username: e.target.value }))}
                      className="pr-10 bg-[#1a1a1a] border-[#242424] text-white placeholder:text-[#666666]"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="reg-display" className="text-[#a0a0a0]">الاسم المعروض</Label>
                  <Input
                    id="reg-display"
                    type="text"
                    placeholder="اسمك المعروض"
                    value={registerData.displayName}
                    onChange={(e) => setRegisterData(prev => ({ ...prev, displayName: e.target.value }))}
                    className="bg-[#1a1a1a] border-[#242424] text-white placeholder:text-[#666666]"
                  />
                </div>
                
                {/* 3 خيارات فقط للمستخدم */}
                <div className="space-y-2">
                  <Label htmlFor="reg-role" className="text-[#a0a0a0]">نوع العضوية</Label>
                  <Select
                    value={registerData.role}
                    onValueChange={(value) => setRegisterData(prev => ({ ...prev, role: value as any }))}
                  >
                    <SelectTrigger className="bg-[#1a1a1a] border-[#242424] text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1a1a] border-[#242424]">
                      {USER_ROLE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="reg-password" className="text-[#a0a0a0]">كلمة المرور</Label>
                  <div className="relative">
                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#666666]" />
                    <Input
                      id="reg-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={registerData.password}
                      onChange={(e) => setRegisterData(prev => ({ ...prev, password: e.target.value }))}
                      className="pr-10 pl-10 bg-[#1a1a1a] border-[#242424] text-white placeholder:text-[#666666]"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666666] hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white"
                >
                  {isLoading ? (
                    <div className="spinner w-5 h-5" />
                  ) : (
                    'إنشاء حساب'
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
