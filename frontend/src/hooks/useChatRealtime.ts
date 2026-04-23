import { useEffect, useRef } from "react";
import { getRealtimeConnectionManager } from "../api/realtime-manager";
import { clearConversationUnread, markMessagesRead } from "../api/client";
import { getRealtimeStore } from "../store/realtime-store";
import type {
  ChatMessage,
  ConversationItem,
  HiddenSession,
  MessageSyncResponse,
  RealtimeEnvelope,
  RealtimeStateSnapshot
} from "../types";

interface UseChatRealtimeOptions {
  screen: "disguise" | "auth" | "chat";
  session: HiddenSession | null;
  activeConversationId: string;
  activeConversation: ConversationItem | null;
  currentMessages: ChatMessage[];
  isDesktopConversationView: boolean;
  isMobileConversationView: boolean;
  onStatusChange: (status: string) => void;
  onReceiveMessage: (message: ChatMessage) => Promise<void>;
  onAck: (data: unknown) => void;
  onReadReceipt: (data: unknown) => void;
  onSyncResponse: (response: MessageSyncResponse) => Promise<void>;
  onSyncFallback: () => Promise<void>;
  normalizeIncomingMessage: (data: unknown) => ChatMessage;
}

export function useChatRealtime({
  screen,
  session,
  activeConversationId,
  activeConversation,
  currentMessages,
  isDesktopConversationView,
  isMobileConversationView,
  onStatusChange,
  onReceiveMessage,
  onAck,
  onReadReceipt,
  onSyncResponse,
  onSyncFallback,
  normalizeIncomingMessage
}: UseChatRealtimeOptions) {
  const managerRef = useRef(getRealtimeConnectionManager());
  const realtimeStoreRef = useRef(getRealtimeStore());
  const onStatusChangeRef = useRef(onStatusChange);
  const onReceiveMessageRef = useRef(onReceiveMessage);
  const onAckRef = useRef(onAck);
  const onReadReceiptRef = useRef(onReadReceipt);
  const onSyncResponseRef = useRef(onSyncResponse);
  const onSyncFallbackRef = useRef(onSyncFallback);
  const normalizeIncomingMessageRef = useRef(normalizeIncomingMessage);
  const lastConnectionStateRef = useRef<RealtimeStateSnapshot["connectionState"]>("idle");
  const syncCursorRef = useRef<string | null>(realtimeStoreRef.current.getSnapshot().syncCursor);

  useEffect(() => {
    onStatusChangeRef.current = onStatusChange;
    onReceiveMessageRef.current = onReceiveMessage;
    onAckRef.current = onAck;
    onReadReceiptRef.current = onReadReceipt;
    onSyncResponseRef.current = onSyncResponse;
    onSyncFallbackRef.current = onSyncFallback;
    normalizeIncomingMessageRef.current = normalizeIncomingMessage;
  }, [normalizeIncomingMessage, onAck, onReadReceipt, onReceiveMessage, onStatusChange, onSyncFallback, onSyncResponse]);

  const closeWebSocket = () => {
    managerRef.current.disconnect();
  };

  const sendRealtimePayload = (payload: unknown): boolean => {
    return managerRef.current.send(payload);
  };

  const requestIncrementalSync = (sinceCursor?: string | null) => {
    const synced = sendRealtimePayload({
      type: "sync_request",
      data: {
        sinceCursor: sinceCursor ?? syncCursorRef.current,
        pageSize: 100
      }
    });
    if (!synced) {
      void onSyncFallbackRef.current().catch(() => undefined);
    }
  };

  useEffect(() => {
    const unsubscribeMessage = managerRef.current.subscribeToMessages((envelope: RealtimeEnvelope) => {
      void (async () => {
        try {
          if (envelope.type === "message_receive" || envelope.type === "CHAT_RECEIVE") {
            await onReceiveMessageRef.current(normalizeIncomingMessageRef.current(envelope.data));
            return;
          }
          if (envelope.type === "message_ack" || envelope.type === "CHAT_ACK") {
            onAckRef.current(envelope.data);
            return;
          }
          if (envelope.type === "message_read" || envelope.type === "CHAT_READ") {
            onReadReceiptRef.current(envelope.data);
            return;
          }
          if (envelope.type === "sync_response") {
            const raw = envelope.data as Record<string, unknown>;
            const previousCursor = syncCursorRef.current;
            const nextCursor = raw.nextCursor == null ? previousCursor : String(raw.nextCursor);
            const response: MessageSyncResponse = {
              messages: Array.isArray(raw.messages)
                ? raw.messages.map((message) => normalizeIncomingMessageRef.current(message))
                : [],
              nextCursor,
              hasMore: Boolean(raw.hasMore)
            };
            syncCursorRef.current = nextCursor;
            realtimeStoreRef.current.setSyncCursor(nextCursor);
            await onSyncResponseRef.current(response);
            if (response.hasMore && nextCursor && nextCursor !== previousCursor) {
              requestIncrementalSync(nextCursor);
            }
            return;
          }
          if (envelope.type === "error" || envelope.type === "CHAT_ERROR") {
            if (typeof envelope.requestId === "string" && envelope.requestId.startsWith("sync_request_")) {
              await onSyncFallbackRef.current();
              return;
            }
            onStatusChangeRef.current("实时消息发送失败，请稍后重试。");
          }
        } catch {
          onStatusChangeRef.current("收到无法解析的实时消息，已忽略。");
        }
      })();
    });
    const unsubscribeState = managerRef.current.subscribeToState((snapshot) => {
      const previousState = lastConnectionStateRef.current;
      lastConnectionStateRef.current = snapshot.connectionState;
      syncCursorRef.current = snapshot.syncCursor;

      if (snapshot.connectionState === previousState) {
        return;
      }
      if (snapshot.connectionState === "connected") {
        onStatusChangeRef.current("已连接后端聊天通道，实时消息已启用。");
        requestIncrementalSync(snapshot.syncCursor);
        return;
      }
      if (snapshot.connectionState === "offline") {
        onStatusChangeRef.current("网络已断开，实时通道已暂停。");
        return;
      }
      if (snapshot.connectionState === "reconnecting") {
        onStatusChangeRef.current("实时通道重连中，消息会继续尝试同步。");
      }
    });

    return () => {
      unsubscribeMessage();
      unsubscribeState();
    };
  }, []);

  useEffect(() => () => {
    managerRef.current.disconnect();
  }, []);

  useEffect(() => {
    if (!session?.tokens?.accessToken || screen !== "chat") {
      managerRef.current.disconnect();
      return;
    }

    managerRef.current.connect(session.tokens.accessToken);

    return undefined;
  }, [screen, session?.tokens?.accessToken]);

  useEffect(() => {
    if (!session || screen !== "chat" || !activeConversationId) {
      return;
    }
    const conversationVisible = isDesktopConversationView || isMobileConversationView;
    if (!conversationVisible) {
      return;
    }
    void clearConversationUnread(activeConversationId).catch(() => undefined);
  }, [activeConversationId, isDesktopConversationView, isMobileConversationView, screen, session]);

  useEffect(() => {
    if (!session || screen !== "chat" || !activeConversation) {
      return;
    }
    const conversationVisible = isDesktopConversationView || isMobileConversationView;
    if (!conversationVisible) {
      return;
    }
    const unreadMessageIds = currentMessages
      .filter((message) => message.receiverUid === session.user.userUid && message.serverStatus !== "read")
      .map((message) => message.messageId);
    if (unreadMessageIds.length === 0) {
      return;
    }

    void (async () => {
      try {
        const synced = sendRealtimePayload({
          type: "message_read",
          data: { conversationId: activeConversation.conversationId, messageIds: unreadMessageIds }
        });
        if (!synced) {
          await markMessagesRead(activeConversation.conversationId, unreadMessageIds);
        }
        onReadReceipt({ conversationId: activeConversation.conversationId, messageIds: unreadMessageIds });
      } catch {
        // Ignore read-sync failures so the chat view remains usable.
      }
    })();
  }, [
    activeConversation,
    currentMessages,
    isDesktopConversationView,
    isMobileConversationView,
    onReadReceipt,
    screen,
    session
  ]);

  return {
    closeWebSocket,
    sendRealtimePayload
  };
}
