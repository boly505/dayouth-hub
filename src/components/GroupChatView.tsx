import { useState, useEffect, useRef } from 'react';
import type { GroupMessage } from '@/types';
import { ROLE_COLORS, ROLE_LABELS_AR } from '@/types';
import { groupChatAPI, authAPI, uploadImageToImgbb } from '@/lib/supabase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Image, Send, Users } from 'lucide-react';

export function GroupChatView() {
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentUser = authAPI.getCurrentUser();

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async (pageNum = 1) => {
    const result = await groupChatAPI.getMessages(pageNum, 50);
    
    if (pageNum === 1) {
      setMessages(result.messages);
    } else {
      setMessages(prev => [...result.messages, ...prev]);
    }
    
    setHasMore(result.hasMore);
    setPage(pageNum);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !currentUser) return;

    await groupChatAPI.send({
      content: newMessage,
      senderId: currentUser.id,
    });

    setNewMessage('');
    loadMessages();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && currentUser) {
      try {
        const url = await uploadImageToImgbb(file);
        await groupChatAPI.send({
          content: '',
          image: url,
          senderId: currentUser.id,
        });
        loadMessages();
      } catch {
        // Handle error
      }
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('ar-SA', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getFrameClass = (frameStyle: string) => {
    switch (frameStyle) {
      case 'FIRE': return 'frame-fire';
      case 'GOLD': return 'frame-gold';
      case 'NEON': return 'frame-neon';
      default: return '';
    }
  };

  if (!currentUser) return null;

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col bg-[#141414] rounded-xl border border-[#242424] overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-[#242424] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-600 to-amber-600 flex items-center justify-center">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">الدردشة الجماعية</h2>
            <p className="text-xs text-[#a0a0a0]">تحدث مع جميع الأعضاء</p>
          </div>
        </div>
        
        <Badge className="bg-[#1a1a1a] text-[#a0a0a0]">
          <Users className="w-3 h-3 ml-1" />
          غرفة عامة
        </Badge>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {hasMore && page === 1 && (
            <div className="text-center">
              <button
                onClick={() => loadMessages(page + 1)}
                className="text-sm text-[#a0a0a0] hover:text-white"
              >
                تحميل المزيد
              </button>
            </div>
          )}
          
          {messages.map((msg, index) => {
            const isSent = msg.senderId === currentUser.id;
            const showSender = index === 0 || messages[index - 1].senderId !== msg.senderId;

            return (
              <div key={msg.id}>
                {showSender && !isSent && msg.sender && (
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`relative ${getFrameClass(msg.sender.frameStyle)}`}>
                      <Avatar className="w-6 h-6">
                        <AvatarImage src={msg.sender.avatar} />
                        <AvatarFallback className="bg-[#242424] text-white text-xs">
                          {msg.sender.displayName?.[0] || msg.sender.username[0]}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <span className={`text-sm font-medium ${msg.sender.isShiny ? 'shiny-name' : 'text-white'}`}>
                      {msg.sender.displayName || msg.sender.username}
                    </span>
                    <Badge 
                      className="text-xs"
                      style={{ 
                        backgroundColor: `${ROLE_COLORS[msg.sender.role]}20`,
                        color: ROLE_COLORS[msg.sender.role],
                      }}
                    >
                      {ROLE_LABELS_AR[msg.sender.role]}
                    </Badge>
                  </div>
                )}
                
                <div className={`flex ${isSent ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[70%] ${isSent ? 'chat-bubble-sent' : 'chat-bubble-received'} p-3`}>
                    {msg.image && (
                      <img 
                        src={msg.image} 
                        alt="Message" 
                        className="max-w-full rounded-lg mb-2"
                      />
                    )}
                    {msg.content && (
                      <p className="text-sm">{msg.content}</p>
                    )}
                    <div className={`flex items-center gap-1 mt-1 ${isSent ? 'text-white/70' : 'text-[#666666]'}`}>
                      <span className="text-xs">{formatTime(msg.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="p-4 border-t border-[#242424]">
        <div className="flex items-center gap-2">
          <label className="p-2 text-[#a0a0a0] hover:text-white cursor-pointer transition-colors">
            <Image className="w-5 h-5" />
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </label>
          
          <Input
            placeholder="اكتب رسالة للجميع..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            className="flex-1 bg-[#1a1a1a] border-[#242424] text-white placeholder:text-[#666666]"
          />
          
          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            className="bg-red-600 hover:bg-red-500 text-white"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
