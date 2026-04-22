import type { ReactNode } from "react";
import type { ChatMessage, ConversationItem } from "../../types";

interface DesktopConversationPageProps {
  sessionUserUid: string;
  activeConversation: ConversationItem | null;
  currentMessages: ChatMessage[];
  visibleDesktopMessages: ChatMessage[];
  composer: string;
  uploadingFile: boolean;
  onComposerChange: (value: string) => void;
  onFileSelected: (file: File | null) => void;
  onSendMessage: () => void;
  onReturnToDisguise: () => void;
  onLogout: () => void;
  renderMessageBody: (message: ChatMessage, isSelf: boolean) => ReactNode;
  getAvatarLabel: (value: string) => string;
  getConversationTitle: (conversation: ConversationItem) => string;
  formatConversationDivider: (timestamp: number) => string;
}

export function DesktopConversationPage({
  sessionUserUid,
  activeConversation,
  currentMessages,
  visibleDesktopMessages,
  composer,
  uploadingFile,
  onComposerChange,
  onFileSelected,
  onSendMessage,
  onReturnToDisguise,
  onLogout,
  renderMessageBody,
  getAvatarLabel,
  getConversationTitle,
  formatConversationDivider
}: DesktopConversationPageProps) {
  return (
    <main className="conv-area">
      <div className="panel-header">
        <div>
          <div className="name header-name">{activeConversation ? getConversationTitle(activeConversation) : "选择一个会话"}</div>
          <div className="muted">工作日 09:00 - 22:00 活跃 · 本地缓存已启用</div>
        </div>
        <div className="panel-header-actions">
          <span className="tag">支持发送文件</span>
          <button className="btn ghost" type="button" onClick={onReturnToDisguise}>
            返回伪装页
          </button>
          <button className="btn ghost" type="button" onClick={onLogout}>
            退出账号
          </button>
        </div>
      </div>

      <div className="messages">
        {visibleDesktopMessages.length > 0 && <div className="day-divider">{formatConversationDivider(visibleDesktopMessages[0].serverMsgTime)}</div>}
        {visibleDesktopMessages.map((message) => {
          const isSelf = message.senderUid === sessionUserUid;
          const avatarName = activeConversation ? getConversationTitle(activeConversation) : "对方";
          return (
            <div key={message.messageId} className={isSelf ? "msg self" : "msg other"}>
              {!isSelf && <div className="avatar small">{getAvatarLabel(avatarName)}</div>}
              {renderMessageBody(message, isSelf)}
            </div>
          );
        })}
        {activeConversation && currentMessages.length === 0 && (
          <div className="msg other">
            <div className="bubble">暂无消息</div>
          </div>
        )}
        {activeConversation && currentMessages.length > 0 && visibleDesktopMessages.length === 0 && (
          <div className="msg other">
            <div className="bubble">没有匹配的聊天记录</div>
          </div>
        )}
      </div>

      <div className="input-bar">
        <div className="toolbar">
          <button className="icon-btn" type="button" title="表情">
            😊
          </button>
          <label className="icon-btn icon-upload" title="发送图片">
            🖼️
            <input
              type="file"
              aria-label="发送图片"
              accept="image/*"
              disabled={!activeConversation || uploadingFile}
              onChange={(event) => {
                const selected = event.target.files?.[0] ?? null;
                event.currentTarget.value = "";
                onFileSelected(selected);
              }}
            />
          </label>
          <label className="icon-btn icon-upload" title="发送文件">
            📎
            <input
              type="file"
              aria-label="发送文件"
              disabled={!activeConversation || uploadingFile}
              onChange={(event) => {
                const selected = event.target.files?.[0] ?? null;
                event.currentTarget.value = "";
                onFileSelected(selected);
              }}
            />
          </label>
          <button className="icon-btn" type="button" title="更多">
            ＋
          </button>
        </div>
        <div className="composer composer-bar">
          <textarea
            aria-label="消息输入框"
            value={composer}
            onChange={(event) => onComposerChange(event.target.value)}
            placeholder="输入消息..."
            disabled={!activeConversation}
          />
          <button className="btn btn-brand send-btn" type="button" onClick={onSendMessage} disabled={!activeConversation}>
            发送
          </button>
        </div>
      </div>
    </main>
  );
}
