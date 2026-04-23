import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import type { ChatMessage, ConversationItem } from "../../types";

interface MobileConversationDetailPageProps {
  conversation: ConversationItem | null;
  messages: ChatMessage[];
  sessionUserUid: string;
  composer: string;
  uploadingFile: boolean;
  onComposerChange: (value: string) => void;
  onSendMessage: () => void;
  onFileSelected: (file: File | null) => void;
  onBack: () => void;
  onLogout: () => void;
  renderMessageBody: (message: ChatMessage, isSelf: boolean) => ReactNode;
  getAvatarLabel: (value: string) => string;
  getConversationTitle: (conversation: ConversationItem) => string;
  formatConversationDivider: (timestamp: number) => string;
}

export function MobileConversationDetailPage({
  conversation,
  messages,
  sessionUserUid,
  composer,
  uploadingFile,
  onComposerChange,
  onSendMessage,
  onFileSelected,
  onBack,
  onLogout,
  renderMessageBody,
  getAvatarLabel,
  getConversationTitle,
  formatConversationDivider
}: MobileConversationDetailPageProps) {
  const composerRef = useRef<HTMLElement | null>(null);
  const [composerOffset, setComposerOffset] = useState(0);

  useLayoutEffect(() => {
    const composerElement = composerRef.current;
    if (!composerElement) {
      return;
    }

    const syncComposerOffset = () => {
      setComposerOffset(composerElement.getBoundingClientRect().height);
    };

    syncComposerOffset();

    if (typeof ResizeObserver !== "undefined") {
      const resizeObserver = new ResizeObserver(() => {
        syncComposerOffset();
      });
      resizeObserver.observe(composerElement);
      return () => resizeObserver.disconnect();
    }

    window.addEventListener("resize", syncComposerOffset);
    return () => window.removeEventListener("resize", syncComposerOffset);
  }, []);

  if (!conversation) {
    return (
      <main className="conv-area conv-area--mobile">
        <div className="panel-header panel-header--mobile-detail">
          <button className="btn ghost mobile-back-button" type="button" onClick={onBack}>
            返回列表
          </button>
          <div className="mobile-detail-title">
            <div className="name header-name">聊天详情</div>
          </div>
          <div className="mobile-logout-button" aria-hidden="true" />
        </div>
        <div className="empty-panel">
          <div className="empty-card">
            <div className="empty-illustration" />
            <div className="section-title">未找到会话</div>
            <div className="section-text">请返回最近会话页重新选择联系人。</div>
          </div>
        </div>
      </main>
    );
  }

  const title = getConversationTitle(conversation);

  return (
    <main className="conv-area conv-area--mobile mobile-conversation-layout">
      <header className="panel-header panel-header--mobile-detail">
        <button className="btn ghost mobile-back-button" type="button" onClick={onBack}>
          返回列表
        </button>
        <div className="mobile-detail-title">
          <div className="name header-name">{title}</div>
        </div>
        <button className="btn ghost mobile-logout-button" type="button" onClick={onLogout}>
          退出账号
        </button>
      </header>

      <section
        className="messages messages--mobile"
        aria-label="消息列表"
        style={{ paddingBottom: `calc(20px + ${composerOffset}px)` }}
      >
        {messages.length > 0 && <div className="day-divider">{formatConversationDivider(messages[0].serverMsgTime)}</div>}
        {messages.map((message) => {
          const isSelf = message.senderUid === sessionUserUid;
          return (
            <div key={message.messageId} className={isSelf ? "msg self" : "msg other"}>
              {!isSelf && <div className="avatar small">{getAvatarLabel(title)}</div>}
              {renderMessageBody(message, isSelf)}
            </div>
          );
        })}
        {messages.length === 0 && (
          <div className="msg other">
            <div className="bubble">暂无消息</div>
          </div>
        )}
      </section>

      <footer ref={composerRef} className="input-bar input-bar--mobile">
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
              disabled={uploadingFile}
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
              disabled={uploadingFile}
              onChange={(event) => {
                const selected = event.target.files?.[0] ?? null;
                event.currentTarget.value = "";
                onFileSelected(selected);
              }}
            />
          </label>
        </div>
        <div className="composer composer-bar">
          <textarea
            aria-label="消息输入框"
            value={composer}
            onChange={(event) => onComposerChange(event.target.value)}
            placeholder="输入消息..."
          />
          <button className="btn btn-brand send-btn" type="button" onClick={onSendMessage}>
            发送
          </button>
        </div>
      </footer>
    </main>
  );
}
