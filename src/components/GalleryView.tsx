import { useState, useEffect } from 'react';
import type { Post, User } from '@/types';
import { LikeType, ROLE_COLORS, ROLE_LABELS_AR } from '@/types';
import { postAPI, likeAPI, commentAPI, authAPI, uploadImageToImgbb } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Heart, 
  ThumbsDown, 
  MessageCircle, 
  Send, 
  Image as ImageIcon, 
  X,
  Trash2
} from 'lucide-react';

interface GalleryViewProps {
  onViewProfile: (user: User) => void;
}

export function GalleryView({ onViewProfile }: GalleryViewProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [newComment, setNewComment] = useState('');
  const currentUser = authAPI.getCurrentUser();

  const [newPost, setNewPost] = useState({
    content: '',
    image: '',
  });

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async (pageNum = 1) => {
    if (isLoading) return;
    setIsLoading(true);

    const result = await postAPI.getAll(pageNum, 10);
    
    if (pageNum === 1) {
      setPosts(result.posts);
    } else {
      setPosts(prev => [...prev, ...result.posts]);
    }
    
    setHasMore(result.hasMore);
    setPage(pageNum);
    setIsLoading(false);
  };

  const handleCreatePost = async () => {
    if (!newPost.content.trim() && !newPost.image) return;
    if (!currentUser) return;

    await postAPI.create({
      content: newPost.content,
      image: newPost.image || undefined,
      authorId: currentUser.id,
    });

    setNewPost({ content: '', image: '' });
    setShowCreateModal(false);
    loadPosts(1);
  };

  const handleLike = (postId: string, type: 'LIKE' | 'DISLIKE') => {
    if (!currentUser) return;
    likeAPI.toggle(postId, currentUser.id, type);
    loadPosts(1);
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !selectedPost || !currentUser) return;

    await commentAPI.create({
      content: newComment,
      postId: selectedPost.id,
      userId: currentUser.id,
    });

    setNewComment('');
    const updatedComments = await commentAPI.getByPost(selectedPost.id);
    setSelectedPost({
      ...selectedPost,
      comments: updatedComments,
    });
    loadPosts(1);
  };

  const handleDeletePost = async (postId: string) => {
    if (!currentUser) return;
    if (confirm('هل أنت متأكد من حذف هذا المنشور؟')) {
      await postAPI.delete(postId);
      loadPosts(1);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const url = await uploadImageToImgbb(file);
        setNewPost(prev => ({ ...prev, image: url }));
      } catch {
        const reader = new FileReader();
        reader.onloadend = () => {
          setNewPost(prev => ({ ...prev, image: reader.result as string }));
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const getFrameClass = (frameStyle: string) => {
    switch (frameStyle) {
      case 'FIRE': return 'frame-fire';
      case 'GOLD': return 'frame-gold';
      case 'NEON': return 'frame-neon';
      default: return '';
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">المعرض</h2>
          <p className="text-[#a0a0a0]">استكشف المنشورات والصور</p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="bg-red-600 hover:bg-red-500 text-white"
        >
          <ImageIcon className="w-4 h-4 ml-2" />
          منشور جديد
        </Button>
      </div>

      {/* Create Post Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="bg-[#141414] border-[#242424] text-white max-w-lg">
          <DialogHeader>
            <DialogTitle>منشور جديد</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="ماذا تريد أن تشارك؟"
              value={newPost.content}
              onChange={(e) => setNewPost(prev => ({ ...prev, content: e.target.value }))}
              className="bg-[#1a1a1a] border-[#242424] text-white placeholder:text-[#666666] min-h-[120px]"
            />
            
            {newPost.image && (
              <div className="relative">
                <img src={newPost.image} alt="Preview" className="w-full h-48 object-cover rounded-lg" />
                <button
                  onClick={() => setNewPost(prev => ({ ...prev, image: '' }))}
                  className="absolute top-2 right-2 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            
            <div className="flex justify-between items-center">
              <label className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] rounded-lg cursor-pointer hover:bg-[#242424] transition-colors">
                <ImageIcon className="w-5 h-5 text-[#a0a0a0]" />
                <span className="text-[#a0a0a0]">إضافة صورة</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowCreateModal(false)}
                  className="border-[#242424] text-[#a0a0a0]"
                >
                  إلغاء
                </Button>
                <Button
                  onClick={handleCreatePost}
                  disabled={!newPost.content.trim() && !newPost.image}
                  className="bg-red-600 hover:bg-red-500 text-white"
                >
                  نشر
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Posts Feed */}
      <div className="space-y-4">
        {posts.map((post) => {
          const author = post.author;
          const likes = post.likes || [];
          const comments = post.comments || [];
          const userLike = likes.find(l => l.userId === currentUser?.id);
          
          if (!author) return null;
          
          return (
            <Card key={post.id} className="social-card">
              <CardContent className="p-4">
                {/* Post Header */}
                <div className="flex items-center justify-between mb-4">
                  <div 
                    className="flex items-center gap-3 cursor-pointer"
                    onClick={() => onViewProfile(author)}
                  >
                    <div className={`relative ${getFrameClass(author.frameStyle)}`}>
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={author.avatar} />
                        <AvatarFallback className="bg-[#242424] text-white">
                          {author.displayName?.[0] || author.username[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className={`online-status w-3 h-3 ${author.isOnline ? '' : 'offline'}`} />
                    </div>
                    <div>
                      <p className={`font-semibold ${author.isShiny ? 'shiny-name' : 'text-white'}`}>
                        {author.displayName || author.username}
                      </p>
                      <p 
                        className="text-xs"
                        style={{ color: ROLE_COLORS[author.role] }}
                      >
                        {ROLE_LABELS_AR[author.role]}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#666666]">{formatDate(post.createdAt)}</span>
                    {currentUser?.id === post.authorId && (
                      <button
                        onClick={() => handleDeletePost(post.id)}
                        className="p-2 text-[#666666] hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Post Content */}
                <p className="text-white mb-4 whitespace-pre-wrap">{post.content}</p>
                
                {post.image && (
                  <img 
                    src={post.image} 
                    alt="Post" 
                    className="w-full max-h-96 object-cover rounded-lg mb-4"
                  />
                )}

                {/* Post Stats */}
                <div className="flex items-center gap-4 text-sm text-[#a0a0a0] mb-4">
                  <span>{likes.filter(l => l.type === LikeType.LIKE).length} إعجاب</span>
                  <span>{comments.length} تعليق</span>
                </div>

                {/* Post Actions */}
                <div className="flex items-center gap-2 pt-4 border-t border-[#242424]">
                  <button
                    onClick={() => handleLike(post.id, LikeType.LIKE)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition-colors ${
                      userLike?.type === LikeType.LIKE
                        ? 'bg-red-500/20 text-red-400'
                        : 'hover:bg-[#242424] text-[#a0a0a0]'
                    }`}
                  >
                    <Heart className={`w-5 h-5 ${userLike?.type === LikeType.LIKE ? 'fill-current' : ''}`} />
                    <span>أعجبني</span>
                  </button>
                  
                  <button
                    onClick={() => handleLike(post.id, LikeType.DISLIKE)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition-colors ${
                      userLike?.type === LikeType.DISLIKE
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'hover:bg-[#242424] text-[#a0a0a0]'
                    }`}
                  >
                    <ThumbsDown className={`w-5 h-5 ${userLike?.type === LikeType.DISLIKE ? 'fill-current' : ''}`} />
                    <span>لم يعجبني</span>
                  </button>
                  
                  <button
                    onClick={() => setSelectedPost(post)}
                    className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg hover:bg-[#242424] text-[#a0a0a0] transition-colors"
                  >
                    <MessageCircle className="w-5 h-5" />
                    <span>تعليق</span>
                  </button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Load More */}
      {hasMore && (
        <div className="text-center">
          <Button
            onClick={() => loadPosts(page + 1)}
            disabled={isLoading}
            variant="outline"
            className="border-[#242424] text-[#a0a0a0] hover:text-white"
          >
            {isLoading ? <div className="spinner w-5 h-5" /> : 'تحميل المزيد'}
          </Button>
        </div>
      )}

      {/* Comments Modal */}
      <Dialog open={!!selectedPost} onOpenChange={() => setSelectedPost(null)}>
        <DialogContent className="bg-[#141414] border-[#242424] text-white max-w-lg max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>التعليقات</DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="h-96 mb-4">
            <div className="space-y-4">
              {selectedPost?.comments?.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={comment.user?.avatar} />
                    <AvatarFallback className="bg-[#242424] text-white text-xs">
                      {comment.user?.displayName?.[0] || comment.user?.username[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-white">
                      {comment.user?.displayName || comment.user?.username}
                    </p>
                    <p className="text-[#a0a0a0] text-sm">{comment.content}</p>
                    <p className="text-xs text-[#666666] mt-1">
                      {formatDate(comment.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
              
              {(!selectedPost?.comments || selectedPost.comments.length === 0) && (
                <p className="text-center text-[#666666]">لا توجد تعليقات</p>
              )}
            </div>
          </ScrollArea>
          
          <div className="flex gap-2">
            <Textarea
              placeholder="أضف تعليق..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="flex-1 bg-[#1a1a1a] border-[#242424] text-white placeholder:text-[#666666]"
            />
            <Button
              onClick={handleAddComment}
              disabled={!newComment.trim()}
              className="bg-red-600 hover:bg-red-500 text-white"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
