export interface UserDto {
  id: number
  username: string
  nickname: string
  avatarExt: string | null
  avatarVersion: number
}

export type MsgKind = 1 | 2 | 3 | 4 | 5 // text image video voice system(tip)

export interface MediaMeta { size?: number; width?: number; height?: number; duration?: number; ext?: string }

export interface MediaRef { key: string; meta: MediaMeta | null }

export interface ChatMsg {
  id: number
  conv_id: number
  sender_id: number
  kind: MsgKind
  text?: string
  media?: MediaRef
  recalled?: boolean
  send_at: number
  viewed_at: number | null
  activated_at?: number | null
}

export interface ConvItem {
  id: number
  friend: UserDto
  last_msg: ChatMsg | null
  unread: number
  last_msg_at: number | null
}

export interface FriendRequestItem {
  id: number
  from: UserDto
  message: string
  created_at: string
}

export interface InitData {
  me: UserDto
  friends: UserDto[]
  pending_requests: FriendRequestItem[]
  conversations: ConvItem[]
  ttl_minutes: number
  recall_minutes: number
}

export interface SearchHit { user: UserDto; relation: 'friend' | 'none' | 'requested' | 'incoming' }