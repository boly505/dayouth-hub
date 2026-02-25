// User Roles - 3 خيارات فقط للمستخدم
export const UserRole = {
  TYPE_1: 'TYPE_1',  // النوع 1
  TYPE_2: 'TYPE_2',  // النوع 2
  TYPE_3: 'TYPE_3',  // النوع 3
  ADMIN: 'ADMIN',    // مسؤول (لا يظهر للاختيار)
} as const;

export type UserRoleType = typeof UserRole[keyof typeof UserRole];

// Role Labels (Arabic) - للمستخدم العادي
export const ROLE_LABELS_AR: Record<UserRoleType, string> = {
  [UserRole.TYPE_1]: 'النوع 1',
  [UserRole.TYPE_2]: 'النوع 2',
  [UserRole.TYPE_3]: 'النوع 3',
  [UserRole.ADMIN]: 'مسؤول',
};

// Role Colors
export const ROLE_COLORS: Record<UserRoleType, string> = {
  [UserRole.TYPE_1]: '#3b82f6',    // أزرق
  [UserRole.TYPE_2]: '#22c55e',    // أخضر
  [UserRole.TYPE_3]: '#a855f7',    // بنفسجي
  [UserRole.ADMIN]: '#fbbf24',     // ذهبي
};

// Frame Styles - يضيفها المسؤول فقط
export const FrameStyle = {
  NONE: 'NONE',
  FIRE: 'FIRE',
  GOLD: 'GOLD',
  NEON: 'NEON',
} as const;

export type FrameStyleType = typeof FrameStyle[keyof typeof FrameStyle];

// Frame Labels
export const FRAME_LABELS: Record<FrameStyleType, string> = {
  [FrameStyle.NONE]: 'بدون إطار',
  [FrameStyle.FIRE]: 'ناري 🔥',
  [FrameStyle.GOLD]: 'ذهبي 👑',
  [FrameStyle.NEON]: 'نيون 💜',
};

// Like Types
export const LikeType = {
  LIKE: 'LIKE',
  DISLIKE: 'DISLIKE',
} as const;

export type LikeTypeType = typeof LikeType[keyof typeof LikeType];

// Notification Types
export const NotificationType = {
  NEW_MESSAGE: 'NEW_MESSAGE',
  NEW_LIKE: 'NEW_LIKE',
  NEW_COMMENT: 'NEW_COMMENT',
  SYSTEM: 'SYSTEM',
} as const;

export type NotificationTypeType = typeof NotificationType[keyof typeof NotificationType];

// User Interface
export interface User {
  id: string;
  email: string;
  username: string;
  password_hash?: string;
  displayName?: string;
  avatar?: string;
  bio?: string;
  role: UserRoleType;
  frameStyle: FrameStyleType;
  isShiny: boolean;
  isOnline: boolean;
  isVerified: boolean;  // علامة التوثيق - يضيفها المسؤول فقط
  lastSeen?: string;
  createdAt: string;
  updatedAt: string;
}

// Post Interface
export interface Post {
  id: string;
  content: string;
  image?: string;
  authorId: string;
  author?: User;
  likes?: Like[];
  comments?: Comment[];
  createdAt: string;
  updatedAt: string;
}

// Message Interface
export interface Message {
  id: string;
  content: string;
  image?: string;
  senderId: string;
  receiverId: string;
  sender?: User;
  receiver?: User;
  isRead: boolean;
  createdAt: string;
}

// Group Message Interface
export interface GroupMessage {
  id: string;
  content: string;
  image?: string;
  senderId: string;
  sender?: User;
  createdAt: string;
}

// Like Interface
export interface Like {
  id: string;
  userId: string;
  postId: string;
  type: LikeTypeType;
  user?: User;
  createdAt: string;
}

// Comment Interface
export interface Comment {
  id: string;
  content: string;
  userId: string;
  postId: string;
  user?: User;
  createdAt: string;
}

// Conversation Interface
export interface Conversation {
  user: User;
  lastMessage?: Message;
  unreadCount: number;
}

// Register Data
export interface RegisterData {
  email: string;
  username: string;
  password: string;
  displayName?: string;
  role: UserRoleType;
  avatar?: string;
}

// Site Stats for Admin
export interface SiteStats {
  users: number;
  posts: number;
  messages: number;
  groupMessages: number;
  onlineUsers?: number;
}
