import { useState, useEffect, useRef } from 'react';
import type { User, Message, Conversation } from '@/types';
import { messageAPI, authAPI, uploadImageToImgbb } from '@/lib/supabase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Image, Send, ArrowLeft, MoreVertical, Phone, Video } from 'lucide-react';

interface ChatViewProps {
  initialUser?: User | null;
}

export function ChatView({ initialUser }: ChatViewProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(initialUser || null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentUser = authAPI.getCurrentUser();

  useEffect(() => {
    loadConversations();
    const interval = setInterval(loadConversations, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedUser && currentUser) {
      loadMessages();
      const interval = setInterval(loadMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [selectedUser]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadConversations = async () => {
    if (!currentUser) return;
    const convs = await messageAPI.getConversations(currentUser.id);
    setConversations(convs);
  };

  const loadMessages = async () => {
    if (!currentUser || !selectedUser) return;
    const msgs = await messageAPI.getMessages(currentUser.id, selectedUser.id);
    setMessages(msgs);
  };

  const handleSelectUser = (user: User) => {
    setSelectedUser(user);
    setIsMobileChatOpen(true);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !currentUser || !selectedUser) return;

    await messageAPI.send({
      content: newMessage,
      senderId: currentUser.id,
      receiverId: selectedUser.id,
    });

    setNewMessage('');
    loadMessages();
    loadConversations();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && currentUser && selectedUser) {
      try {
        const url = await uploadImageToImgbb(file);
        await messageAPI.send({
          content: '',
          image: url,
          senderId: currentUser.id,
          receiverId: selectedUser.id,
        });
        loadMessages();
        loadConversations();
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

  const formatDate = (date: string) => {
    const now = new Date();
    const msgDate = new Date(date);
    const diff = now.getTime() - msgDate.getTime();
    const days = Math.floor(diff / 86400000);

    if (days === 0) return formatTime(date);
    if (days === 1) return 'أمس';
    return msgDate.toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' });
  };

  if (!currentUser) return null;

  return (
    <div className="h-[calc(100vh-120px)] flex gap-4">
      {/* Conversations List */}
      <div className={`${isMobileChatOpen ? 'hidden' : 'flex'} lg:flex w-full lg:w-80 flex-col bg-[#141414] rounded-xl border border-[#242424] overflow-hidden`}>
        <div className="p-4 border-b border-[#242424]">
          <h2 className="text-xl font-bold text-white">المحادثات</h2>
        </div>
        
        <ScrollArea className="flex-1">
          {conversations.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-[#666666]">لا توجد محادثات</p>
              <p className="text-sm text-[#a0a0a0] mt-2">ابدأ محادثة جديدة من الرادار</p>
            </div>
          ) : (
            <div className="divide-y divide-[#242424]">
              {conversations.map((conv) => (
                <button
                  key={conv.user.id}
                  onClick={() => handleSelectUser(conv.user)}
                  className={`w-full p-4 flex items-center gap-3 hover:bg-[#1a1a1a] transition-colors ${
                    selectedUser?.id === conv.user.id ? 'bg-[#1a1a1a]' : ''
                  }`}
                >
                  <div className="relative">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={conv.user.avatar} />
                      <AvatarFallback className="bg-[#242424] text-white">
                        {conv.user.displayName?.[0] || conv.user.username[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`online-status ${conv.user.isOnline ? '' : 'offline'}`} />
                  </div>
                  
                  <div className="flex-1 text-right">
                    <p className={`font-semibold ${conv.user.isShiny ? 'shiny-name' : 'text-white'}`}>
                      {conv.user.displayName || conv.user.username}
                    </p>
                    <p className="text-sm text-[#a0a0a0] truncate">
                      {conv.lastMessage?.image ? 'صورة' : conv.lastMessage?.content || 'لا توجد رسائل'}
                    </p>
                  </div>
                  
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-xs text-[#666666]">
                      {conv.lastMessage && formatDate(conv.lastMessage.createdAt)}
                    </span>
                    {conv.unreadCount > 0 && (
                      <span className="w-5 h-5 bg-red-600 rounded-full flex items-center justify-center text-xs text-white">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Chat Window */}
      {selectedUser ? (
        <div className={`${!isMobileChatOpen ? 'hidden' : 'flex'} lg:flex flex-1 flex-col bg-[#141414] rounded-xl border border-[#242424] overflow-hidden`}>
          {/* Chat Header */}
          <div className="p-4 border-b border-[#242424] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsMobileChatOpen(false)}
                className="lg:hidden p-2 text-[#a0a0a0] hover:text-white"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              
              <div className="relative">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={selectedUser.avatar} />
                  <AvatarFallback className="bg-[#242424] text-white">
                    {selectedUser.displayName?.[0] || selectedUser.username[0]}
                  </AvatarFallback>
                </Avatar>
                <div className={`online-status w-3 h-3 ${selectedUser.isOnline ? '' : 'offline'}`} />
              </div>
              
              <div>
                <p className={`font-semibold ${selectedUser.isShiny ? 'shiny-name' : 'text-white'}`}>
                  {selectedUser.displayName || selectedUser.username}
                </p>
                <p className="text-xs text-[#a0a0a0]">
                  {selectedUser.isOnline ? 'متصل الآن' : 'غير متصل'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button className="p-2 text-[#a0a0a0] hover:text-white transition-colors">
                <Phone className="w-5 h-5" />
              </button>
              <button className="p-2 text-[#a0a0a0] hover:text-white transition-colors">
                <Video className="w-5 h-5" />
              </button>
              <button className="p-2 text-[#a0a0a0] hover:text-white transition-colors">
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((msg, index) => {
                const isSent = msg.senderId === currentUser.id;
                const showDate = index === 0 || 
                  new Date(msg.createdAt).toDateString() !== new Date(messages[index - 1].createdAt).toDateString();

                return (
                  <div key={msg.id}>
                    {showDate && (
                      <div className="flex justify-center my-4">
                        <span className="px-3 py-1 bg-[#242424] rounded-full text-xs text-[#a0a0a0]">
                          {new Date(msg.createdAt).toLocaleDateString('ar-SA')}
                        </span>
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
                          {isSent && (
                            <span className="text-xs">
                              {msg.isRead ? '✓✓' : '✓'}
                            </span>
                          )}
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
                placeholder="اكتب رسالة..."
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
      ) : (
        <div className="hidden lg:flex flex-1 items-center justify-center bg-[#141414] rounded-xl border border-[#242424]">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-[#1a1a1a] flex items-center justify-center">
              <Send className="w-10 h-10 text-[#666666]" />
            </div>
            <p className="text-[#a0a0a0] text-lg">اختر محادثة لبدء الدردشة</p>
          </div>
        </div>
      )}
    </div>
  );
}
