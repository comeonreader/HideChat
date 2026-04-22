import type { ConversationItem } from "../../types";

interface DesktopSidebarProps {
  inConversationLayout: boolean;
  chatSearchQuery: string;
  filteredConversations: ConversationItem[];
  activeConversationId: string;
  onChatSearchQueryChange: (value: string) => void;
  onShowFriendsPage: () => void;
  onOpenConversation: (conversationId: string) => void;
  getAvatarLabel: (value: string) => string;
  getConversationTitle: (conversation: ConversationItem) => string;
  getConversationPreview: (conversation: ConversationItem) => string;
  formatMessageTime: (timestamp: number) => string;
}

export function DesktopSidebar({
  inConversationLayout,
  chatSearchQuery,
  filteredConversations,
  activeConversationId,
  onChatSearchQueryChange,
  onShowFriendsPage,
  onOpenConversation,
  getAvatarLabel,
  getConversationTitle,
  getConversationPreview,
  formatMessageTime
}: DesktopSidebarProps) {
  return (
    <aside className="sidebar">
      <div className="sidebar-inner">
        <div className="wechat-header">
          <div className="topbar topbar-tight">
            <div className="title title-chat">聊天</div>
            <button className="tag tag-button" type="button" onClick={onShowFriendsPage}>
              {inConversationLayout ? "添加好友" : "搜索 / 添加好友"}
            </button>
          </div>
          <div className="search-box">
            <span>🔍</span>
            <input
              value={chatSearchQuery}
              onChange={(event) => onChatSearchQueryChange(event.target.value)}
              placeholder={inConversationLayout ? "搜索聊天记录" : "搜索"}
            />
          </div>
          <div className="muted">最近会话</div>
        </div>

        <ul className="list" aria-label="会话列表">
          {filteredConversations.length === 0 && (
            <li className="chat-item">
              <div className="chat-main">
                <div className="preview">没有匹配的会话</div>
              </div>
            </li>
          )}
          {filteredConversations.map((conversation) => (
            <li
              key={conversation.conversationId}
              className={conversation.conversationId === activeConversationId ? "chat-item active" : "chat-item"}
            >
              <button className="chat-item-button" type="button" onClick={() => onOpenConversation(conversation.conversationId)}>
                <div className="avatar">{getAvatarLabel(getConversationTitle(conversation))}</div>
                <div className="chat-main">
                  <div className="chat-row">
                    <div className="name">{getConversationTitle(conversation)}</div>
                    <div className="time">{formatMessageTime(conversation.lastMessageAt)}</div>
                  </div>
                  <div className="preview">{getConversationPreview(conversation)}</div>
                </div>
                {(conversation.unreadCount ?? 0) > 0 && <span className="count">{conversation.unreadCount}</span>}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
