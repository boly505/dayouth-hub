import { createClient } from '@supabase/supabase-js';
import type { User } from '@/types';

// Supabase configuration - Replace with your own credentials
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://skgagjptlhgzbiqkchev.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNrZ2FnanB0bGhnemJpcWtjaGV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1OTA5MDgsImV4cCI6MjA4NzE2NjkwOH0.jA_V6FHwnDuGri1Uqjeiq-GVmlcQhnQvMJT5MqkBD1M';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// imgbb API configuration
const IMGBB_API_KEY = import.meta.env.VITE_IMGBB_API_KEY || '02516a4bf342d3f6023f3b822bd19462';

// Upload image to imgbb
export async function uploadImageToImgbb(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('image', file);
  formData.append('key', IMGBB_API_KEY);

  const response = await fetch('https://api.imgbb.com/1/upload', {
    method: 'POST',
    body: formData,
  });

  const data = await response.json();
  
  if (data.success) {
    return data.data.url;
  }
  
  throw new Error('Failed to upload image');
}

// Auth Functions
export const authAPI = {
  async register(data: {
    email: string;
    username: string;
    password: string;
    displayName?: string;
    role: string;
    avatar?: string;
  }) {
    // Check if email exists
    const { data: existingEmail } = await supabase
      .from('users')
      .select('email')
      .eq('email', data.email)
      .single();

    if (existingEmail) {
      return { success: false, error: 'البريد الإلكتروني مستخدم بالفعل' };
    }

    // Check if username exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('username')
      .eq('username', data.username)
      .single();

    if (existingUser) {
      return { success: false, error: 'اسم المستخدم مستخدم بالفعل' };
    }

    // Create user
    const { data: newUser, error } = await supabase
      .from('users')
      .insert({
        email: data.email,
        username: data.username,
        password_hash: data.password, // In production, hash this on server
        display_name: data.displayName || data.username,
        avatar: data.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.username}`,
        bio: '',
        role: data.role,
        frame_style: 'NONE',
        is_shiny: false,
        is_online: true,
        is_verified: false,
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    // Store session
    localStorage.setItem('socialhub_user', JSON.stringify(newUser));

    return { success: true, user: newUser };
  },

  async login(email: string, password: string) {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('password_hash', password) // In production, verify hash
      .single();

    if (error || !user) {
      return { success: false, error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' };
    }

    // Update online status
    await supabase
      .from('users')
      .update({ is_online: true, last_seen: new Date().toISOString() })
      .eq('id', user.id);

    localStorage.setItem('socialhub_user', JSON.stringify(user));

    return { success: true, user };
  },

  logout() {
    const user = this.getCurrentUser();
    if (user) {
      supabase
        .from('users')
        .update({ is_online: false, last_seen: new Date().toISOString() })
        .eq('id', user.id);
    }
    localStorage.removeItem('socialhub_user');
  },

  getCurrentUser(): User | null {
    const data = localStorage.getItem('socialhub_user');
    return data ? JSON.parse(data) : null;
  },

  async updateProfile(userId: string, data: Partial<User>) {
    const { data: updatedUser, error } = await supabase
      .from('users')
      .update({
        display_name: data.displayName,
        bio: data.bio,
        avatar: data.avatar,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    localStorage.setItem('socialhub_user', JSON.stringify(updatedUser));
    return { success: true, user: updatedUser };
  },
};

// User Functions
export const userAPI = {
  async getAll(role?: string) {
    let query = supabase.from('users').select('*');
    
    if (role && role !== 'ALL') {
      query = query.eq('role', role);
    }

    const { data: users, error } = await query;

    if (error) return [];
    return users || [];
  },

  async getById(id: string) {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return user;
  },

  async getStats(userId: string) {
    const { data: posts } = await supabase
      .from('posts')
      .select('id')
      .eq('author_id', userId);

    const { data: likes } = await supabase
      .from('likes')
      .select('id')
      .in('post_id', posts?.map(p => p.id) || []);

    return {
      postsCount: posts?.length || 0,
      likesCount: likes?.length || 0,
    };
  },
};

// Post Functions
export const postAPI = {
  async getAll(page = 1, limit = 10) {
    const { data: posts, error } = await supabase
      .from('posts')
      .select(`
        *,
        author:users(*),
        likes(*),
        comments(*, user:users(*))
      `)
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (error) return { posts: [], total: 0, hasMore: false };

    const { count } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true });

    return {
      posts: posts || [],
      total: count || 0,
      hasMore: (page * limit) < (count || 0),
    };
  },

  async create(data: { content: string; image?: string; authorId: string }) {
    const { data: post, error } = await supabase
      .from('posts')
      .insert({
        content: data.content,
        image: data.image,
        author_id: data.authorId,
      })
      .select('*, author:users(*)')
      .single();

    if (error) return null;
    return post;
  },

  async delete(postId: string) {
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId);

    return !error;
  },
};

// Like Functions
export const likeAPI = {
  async toggle(postId: string, userId: string, type: 'LIKE' | 'DISLIKE') {
    // Check if like exists
    const { data: existing } = await supabase
      .from('likes')
      .select('*')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .single();

    if (existing) {
      if (existing.type === type) {
        // Remove like
        await supabase
          .from('likes')
          .delete()
          .eq('id', existing.id);
        return null;
      } else {
        // Update type
        const { data: updated } = await supabase
          .from('likes')
          .update({ type })
          .eq('id', existing.id)
          .select()
          .single();
        return updated;
      }
    }

    // Create new like
    const { data: newLike } = await supabase
      .from('likes')
      .insert({
        post_id: postId,
        user_id: userId,
        type,
      })
      .select()
      .single();

    return newLike;
  },
};

// Comment Functions
export const commentAPI = {
  async getByPost(postId: string) {
    const { data: comments } = await supabase
      .from('comments')
      .select('*, user:users(*)')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    return comments || [];
  },

  async create(data: { content: string; postId: string; userId: string }) {
    const { data: comment } = await supabase
      .from('comments')
      .insert({
        content: data.content,
        post_id: data.postId,
        user_id: data.userId,
      })
      .select('*, user:users(*)')
      .single();

    return comment;
  },
};

// Message Functions
export const messageAPI = {
  async getConversations(userId: string) {
    const { data: messages } = await supabase
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    const conversationsMap = new Map();

    messages?.forEach((m: any) => {
      const otherId = m.sender_id === userId ? m.receiver_id : m.sender_id;
      if (!conversationsMap.has(otherId)) {
        conversationsMap.set(otherId, []);
      }
      conversationsMap.get(otherId).push(m);
    });

    const conversations = [];
    for (const [otherId, msgs] of conversationsMap) {
      const { data: user } = await supabase
        .from('users')
        .select('*')
        .eq('id', otherId)
        .single();

      if (user) {
        const unreadCount = msgs.filter((m: any) => m.receiver_id === userId && !m.is_read).length;
        conversations.push({
          user,
          lastMessage: msgs[0],
          unreadCount,
        });
      }
    }

    return conversations;
  },

  async getMessages(userId: string, otherId: string) {
    const { data: messages } = await supabase
      .from('messages')
      .select('*, sender:users(*), receiver:users(*)')
      .or(`and(sender_id.eq.${userId},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${userId})`)
      .order('created_at', { ascending: true });

    // Mark as read
    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('receiver_id', userId)
      .eq('sender_id', otherId);

    return messages || [];
  },

  async send(data: { content: string; image?: string; senderId: string; receiverId: string }) {
    const { data: message } = await supabase
      .from('messages')
      .insert({
        content: data.content,
        image: data.image,
        sender_id: data.senderId,
        receiver_id: data.receiverId,
      })
      .select('*, sender:users(*), receiver:users(*)')
      .single();

    return message;
  },
};

// Group Chat Functions
export const groupChatAPI = {
  async getMessages(page = 1, limit = 50) {
    const { data: messages } = await supabase
      .from('group_messages')
      .select('*, sender:users(*)')
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    return {
      messages: (messages || []).reverse(),
      hasMore: (messages || []).length === limit,
    };
  },

  async send(data: { content: string; image?: string }) {
    const userStr = localStorage.getItem('socialhub_user');
    const user = userStr ? JSON.parse(userStr) : null;
    
    if (!user) {
      throw new Error('User not logged in');
    }

    const { data: message, error } = await supabase
      .from('group_messages')
      .insert({
        content: data.content,
        image: data.image,
        sender_id: user.id,
      })
      .select('*, sender:users(*)')
      .single();

    if (error) {
      console.error('Error sending message:', error);
      throw error;
    }

    return message;
  },
};

// Admin Functions
export const adminAPI = {
  // Get all users for admin
  async getAllUsers() {
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) return [];
    return users || [];
  },

  // Update user (admin only)
  async updateUser(userId: string, data: Partial<User>) {
    const { data: updated, error } = await supabase
      .from('users')
      .update({
        role: data.role,
        frame_style: data.frameStyle,
        is_shiny: data.isShiny,
        is_verified: data.isVerified,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) return { success: false, error: error.message };
    return { success: true, user: updated };
  },

  // Delete user (admin only)
  async deleteUser(userId: string) {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    return !error;
  },

  // Get site statistics
  async getStats() {
    const { count: usersCount } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    const { count: postsCount } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true });

    const { count: messagesCount } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true });

    const { count: groupMessagesCount } = await supabase
      .from('group_messages')
      .select('*', { count: 'exact', head: true });

    return {
      users: usersCount || 0,
      posts: postsCount || 0,
      messages: messagesCount || 0,
      groupMessages: groupMessagesCount || 0,
    };
  },

  // Delete post (admin only)
  async deletePost(postId: string) {
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId);

    return !error;
  },
};
