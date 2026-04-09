export interface LocalUser {
  userUid: string;
  nickname: string;
  email: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface HiddenSession {
  user: LocalUser;
  pin?: string;
  pinHash: string;
  tokens?: AuthTokens;
  mode?: "demo" | "backend";
}

export interface ContactItem {
  peerUid: string;
  peerNickname: string;
  remarkName: string;
  lastMessageAt: number;
}

export interface ConversationItem {
  conversationId: string;
  peerUid: string;
  peerNickname?: string;
  remarkName: string;
  lastMessagePreview: string;
  lastMessageAt: number;
  unreadCount?: number;
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

export interface ApiErrorPayload {
  code?: number;
  message?: string;
}
