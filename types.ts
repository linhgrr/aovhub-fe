export enum Rank {
  BRONZE = 'Đồng',
  SILVER = 'Bạc',
  GOLD = 'Vàng',
  PLATINUM = 'Bạch Kim',
  DIAMOND = 'Kim Cương',
  VETERAN = 'Tinh Anh',
  MASTER = 'Cao Thủ',
  CONQUEROR = 'Thách Đấu'
}

// Game position/role (renamed for clarity)
export enum GameRole {
  TOP = 'Đường Caesar',
  JUNGLE = 'Rừng',
  MID = 'Đường Giữa',
  AD = 'Xạ Thủ',
  SUPPORT = 'Trợ Thủ',
  FILL = 'Mọi vị trí'
}

// Backward compatibility alias
export const Role = GameRole;

// User permission roles for RBAC
export enum UserRole {
  GUEST = 'GUEST',
  USER = 'USER',
  MODERATOR = 'MODERATOR',
  ADMIN = 'ADMIN'
}

export interface User {
  id: string;
  name: string;
  avatar: string;
  rank: Rank;
  mainRole: GameRole;
  winRate: number;
  role?: UserRole;
}

export interface Post {
  id: string;
  userId: string;
  user: User;
  content: string;
  image?: string;
  likes: number;
  comments: number;
  timestamp: string;
  type: 'LFG' | 'HIGHLIGHT' | 'DISCUSSION';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

// ============== CHATBOT TYPES ==============

export interface ChampionSuggestion {
  ten_tuong: string;
  ly_do: string;
  cach_choi_tom_tat?: string;
}

export interface ChatbotMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  suggestions?: ChampionSuggestion[];
}

// ============== FORUM TYPES ==============

export enum ThreadStatus {
  ACTIVE = 'ACTIVE',
  LOCKED = 'LOCKED',
  HIDDEN = 'HIDDEN'
}

export enum ForumCommentStatus {
  ACTIVE = 'ACTIVE',
  HIDDEN = 'HIDDEN',
  DELETED = 'DELETED'
}

export interface ForumCategory {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  threadCount: number;
  displayOrder: number;
  createdAt: string;
}

export interface ForumThreadAuthor {
  id: string;
  username: string;
  avatarUrl?: string;
  rank?: string;
  level?: number;
}

export interface ForumThreadListItem {
  id: string;
  title: string;
  contentPreview: string;
  author: ForumThreadAuthor;
  categoryId: string;
  status: ThreadStatus;
  viewCount: number;
  commentCount: number;
  likeCount: number;
  createdAt: string;
  lastActivityAt: string;
}

export interface ForumThread {
  id: string;
  title: string;
  content: string;
  authorId: string;
  author: ForumThreadAuthor;
  categoryId: string;
  categoryName?: string;
  status: ThreadStatus;
  mediaUrls: string[];
  viewCount: number;
  commentCount: number;
  likeCount: number;
  isLiked: boolean;
  createdAt: string;
  updatedAt: string;
  lastActivityAt: string;
}

export interface ForumCommentAuthor {
  id: string;
  username: string;
  avatarUrl?: string;
  rank?: string;
}

export interface ForumComment {
  id: string;
  threadId: string;
  authorId: string;
  author: ForumCommentAuthor;
  content: string;
  parentId?: string;
  depth: number;
  replyToUserId?: string;
  replyToUsername?: string;
  mediaUrls: string[];
  likeCount: number;
  replyCount: number;
  isLiked: boolean;
  status: ForumCommentStatus;
  createdAt: string;
  replies: ForumComment[];
}

// API Response types
export interface ForumCategoriesResponse {
  data: ForumCategory[];
  count: number;
}

export interface ForumThreadsResponse {
  data: ForumThreadListItem[];
  nextCursor?: string;
  hasMore: boolean;
}

export interface ForumCommentsResponse {
  data: ForumComment[];
  nextCursor?: string;
  hasMore: boolean;
}

// Create/Update types
export interface CreateThreadInput {
  title: string;
  content: string;
  mediaUrls?: string[];
}

export interface CreateCommentInput {
  content: string;
  mediaUrls?: string[];
}

export interface ReplyCommentInput {
  content: string;
  mediaUrls?: string[];
}

// ============== TEAM/LFG TYPES ==============

export enum GameMode {
  RANKED = 'RANKED',
  CASUAL = 'CASUAL',
  CUSTOM = 'CUSTOM'
}

export enum TeamJoinRequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export interface TeamOwner {
  id: string;
  username: string;
  avatar_url?: string;
  rank?: string;
  win_rate?: number;
}

export interface TeamMemberInfo {
  id: string;
  user_id: string;
  username: string;
  avatar_url?: string;
  rank?: string;
  main_role?: string;
  win_rate?: number;
  joined_at: string;
}

export interface TeamListItem {
  id: string;
  name: string;
  description: string;
  owner: TeamOwner;
  rank: string;
  game_mode: string;
  max_members: number;
  current_members: number;
  created_at: string;
  expires_at: string;
}

export interface TeamDetail extends TeamListItem {
  members: TeamMemberInfo[];
  is_owner: boolean;
  is_member: boolean;
  has_requested: boolean;
  conversation_id?: string;  // Group chat conversation ID for team members
}

export interface TeamJoinRequest {
  id: string;
  team_id: string;
  user: TeamOwner;
  message?: string;
  status: string;
  created_at: string;
}

export interface TeamsResponse {
  data: TeamListItem[];
  total: number;
  page: number;
  page_size: number;
  has_more: boolean;
}

export interface TeamJoinRequestsResponse {
  data: TeamJoinRequest[];
  count: number;
}

export interface CreateTeamInput {
  name: string;
  description: string;
  game_mode: GameMode;
  max_members: number;
}

export interface JoinTeamInput {
  message?: string;
}

// ============== ADMIN TYPES ==============

export enum ReportStatus {
  PENDING = 'PENDING',
  RESOLVED = 'RESOLVED',
  DISMISSED = 'DISMISSED'
}

export enum ReportTargetType {
  THREAD = 'THREAD',
  COMMENT = 'COMMENT',
  USER = 'USER',
  POST = 'POST'
}

export enum ReportAction {
  IGNORE = 'IGNORE',
  HIDE_CONTENT = 'HIDE_CONTENT',
  DELETE_CONTENT = 'DELETE_CONTENT',
  WARN_USER = 'WARN_USER'
}

export interface AdminUserPublic {
  id: string;
  email: string;
  username: string;
  is_active: boolean;
  is_superuser: boolean;
  full_name?: string;
  role: UserRole;
  rank?: string;
  main_role?: string;
  level?: number;
  avatar_url?: string;
  profile_verified: boolean;
  win_rate?: number;
  total_matches?: number;
  credibility_score?: number;
  last_active_at?: string;
}

export interface AdminUsersResponse {
  data: AdminUserPublic[];
  count: number;
}

export interface AdminReport {
  id: string;
  reporter_id: string;
  reporter_username?: string;
  target_type: ReportTargetType;
  target_id: string;
  target_preview?: string;
  reason: string;
  status: ReportStatus;
  moderator_id?: string;
  moderator_note?: string;
  resolved_at?: string;
  created_at: string;
}

export interface AdminReportsResponse {
  data: AdminReport[];
  count: number;
  pending_count: number;
}
