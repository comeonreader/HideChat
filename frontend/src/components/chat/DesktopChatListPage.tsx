import type { ContactItem, ConversationItem } from "../../types";

interface DesktopChatListPageProps {
  activeConversation: ConversationItem | null;
  selectedContact: ContactItem | null;
  onEnterConversation: () => void;
}

export function DesktopChatListPage({ activeConversation, selectedContact, onEnterConversation }: DesktopChatListPageProps) {
  return (
    <main className="main-panel">
      <div className="panel-header">
        <div>
          <div className="name header-name">{activeConversation ? activeConversation.remarkName || activeConversation.peerNickname || activeConversation.peerUid : "最近会话"}</div>
          <div className="muted">
            {activeConversation ? `${selectedContact?.peerNickname ?? "联系人"} 在线状态受保护 · ${(activeConversation.unreadCount ?? 0)} 条未读` : "选择左侧会话进入聊天"}
          </div>
        </div>
        <button className="btn ghost" type="button" onClick={onEnterConversation} disabled={!activeConversation}>
          进入聊天
        </button>
      </div>
      <div className="empty-panel">
        <div className="empty-card">
          <div className="empty-illustration" />
          <div className="section-title">像微信一样熟悉的聊天列表</div>
          <div className="section-text">
            左侧展示最近会话与未读消息，手机端会自动切换为单列布局。会话列表基于当前 filteredConversations 数据渲染，所有预览继续保持脱敏占位。
          </div>
        </div>
      </div>
    </main>
  );
}
