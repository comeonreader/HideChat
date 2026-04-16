import type { ConversationItem } from "../../types";

interface MobileConversationListPageProps {
  conversations: ConversationItem[];
  activeConversationId: string;
  chatSearchQuery: string;
  onChatSearchQueryChange: (value: string) => void;
  onOpenConversation: (conversationId: string) => void;
  onShowFriendsPage: () => void;
  getAvatarLabel: (value: string) => string;
  getConversationTitle: (conversation: ConversationItem) => string;
  getConversationPreview: (conversation: ConversationItem) => string;
  formatMessageTime: (timestamp: number) => string;
}

export function MobileConversationListPage({
  conversations,
  activeConversationId,
  chatSearchQuery,
  onChatSearchQueryChange,
  onOpenConversation,
  onShowFriendsPage,
  getAvatarLabel,
  getConversationTitle,
  getConversationPreview,
  formatMessageTime
}: MobileConversationListPageProps) {
  return (
    <main className="main-panel main-panel--mobile-page main-panel--mobile-list">
      <div className="mobile-page-header mobile-chat-list-header">
        <div className="panel-header">
          <div>
            <div className="name header-name">最近会话</div>
            <div className="muted">点击最近会话后进入聊天详情页</div>
          </div>
          <button className="tag tag-button" type="button" onClick={onShowFriendsPage}>
            搜索 / 添加好友
          </button>
        </div>
        <div className="wechat-header wechat-header--mobile-page">
          <div className="search-box">
            <span>🔍</span>
            <input
              value={chatSearchQuery}
              onChange={(event) => onChatSearchQueryChange(event.target.value)}
              placeholder="搜索最近会话"
            />
          </div>
        </div>
      </div>

      <ul className="list list--mobile list--mobile-page" aria-label="最近会话列表">
        {conversations.length === 0 && (
          <li className="chat-item">
            <div className="chat-main chat-main--empty">
              <div className="preview">没有匹配的会话</div>
            </div>
          </li>
        )}
        {conversations.map((conversation) => {
          const title = getConversationTitle(conversation);
          return (
            <li
              key={conversation.conversationId}
              className={conversation.conversationId === activeConversationId ? "chat-item active" : "chat-item"}
            >
              <button className="chat-item-button" type="button" onClick={() => onOpenConversation(conversation.conversationId)}>
                <div className="avatar">{getAvatarLabel(title)}</div>
                <div className="chat-main">
                  <div className="chat-row">
                    <div className="name">{title}</div>
                    <div className="time">{formatMessageTime(conversation.lastMessageAt)}</div>
                  </div>
                  <div className="preview">{getConversationPreview(conversation)}</div>
                </div>
                {(conversation.unreadCount ?? 0) > 0 && <span className="count">{conversation.unreadCount}</span>}
              </button>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
