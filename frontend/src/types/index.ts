export interface LocalUser {
  userUid: string;
  nickname: string;
  email?: string;
  avatarUrl?: string | null;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface HiddenSession {
  user: LocalUser;
  tokens?: AuthTokens;
}

export interface ContactItem {
  peerUid: string;
  displayUserId?: string;
  peerNickname: string;
  peerAvatar?: string | null;
  remarkName: string;
  pinned?: boolean;
  lastMessageAt: number;
}

export interface RecentContactItem {
  peerUid: string;
  displayUserId?: string;
  peerNickname: string;
  peerAvatar?: string | null;
  createdAt: number;
}

export interface ConversationItem {
  conversationId: string;
  peerUid: string;
  peerNickname?: string;
  peerAvatar?: string | null;
  remarkName: string;
  previewStrategy: string;
  // 会话列表预览保持脱敏占位，不返回真实消息文本或真实文件名。
  lastMessagePreview: string;
  lastMessageType?: string;
  lastMessageAt: number;
  unreadCount?: number;
  pinned?: boolean;
}

export interface ChatMessage {
  messageId: string;
  conversationId: string;
  senderUid: string;
  receiverUid: string;
  payload: string;
  messageType: string;
  payloadType?: string;
  fileId?: string | null;
  clientMsgTime?: number | null;
  serverMsgTime: number;
  serverStatus?: string;
}

export interface FileInfo {
  fileId: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  accessUrl: string;
  downloadUrl?: string;
  encryptFlag: boolean;
}

export interface FortuneToday {
  title: string;
  summary: string;
  luckyColor: string;
  luckyDirection: string;
  advice: string;
}

export interface DisguiseConfig {
  siteTitle: string;
  showFortuneInput: boolean;
  theme: string;
}

export interface LuckyNumberVerifyResult {
  matched: boolean;
}

export interface ApiErrorPayload {
  code?: number;
  message?: string;
}

export interface UserSearchItem {
  userUid: string;
  displayUserId: string;
  nickname: string;
  avatarUrl?: string | null;
  matchType: "display_user_id" | "nickname";
  alreadyAdded: boolean;
}
