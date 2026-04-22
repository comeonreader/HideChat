import { useEffect, useRef } from "react";
import { clearConversationUnread, createChatWebSocket, markMessagesRead } from "../api/client";
import type { ChatMessage, ConversationItem, HiddenSession } from "../types";

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
  normalizeIncomingMessage: (data: unknown) => ChatMessage;
}

interface WsEnvelope {
  type: string;
  data: unknown;
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
  normalizeIncomingMessage
}: UseChatRealtimeOptions) {
  const socketRef = useRef<WebSocket | null>(null);
  const onStatusChangeRef = useRef(onStatusChange);
  const onReceiveMessageRef = useRef(onReceiveMessage);
  const onAckRef = useRef(onAck);
  const onReadReceiptRef = useRef(onReadReceipt);
  const normalizeIncomingMessageRef = useRef(normalizeIncomingMessage);

  useEffect(() => {
    onStatusChangeRef.current = onStatusChange;
    onReceiveMessageRef.current = onReceiveMessage;
    onAckRef.current = onAck;
    onReadReceiptRef.current = onReadReceipt;
    normalizeIncomingMessageRef.current = normalizeIncomingMessage;
  }, [normalizeIncomingMessage, onAck, onReadReceipt, onReceiveMessage, onStatusChange]);

  const closeWebSocket = () => {
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
  };

  const sendRealtimePayload = (payload: unknown): boolean => {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      return false;
    }
    socket.send(JSON.stringify(payload));
    return true;
  };

  useEffect(() => {
    if (!session?.tokens?.accessToken || screen !== "chat") {
      closeWebSocket();
      return;
    }

    const socket = createChatWebSocket(session.tokens.accessToken);
    socketRef.current = socket;

    socket.onopen = () => {
      onStatusChangeRef.current("已连接后端聊天通道，实时消息已启用。");
    };

    socket.onmessage = (event) => {
      void (async () => {
        try {
          const envelope = JSON.parse(event.data) as WsEnvelope;
          if (envelope.type === "CHAT_RECEIVE") {
            await onReceiveMessageRef.current(normalizeIncomingMessageRef.current(envelope.data));
            return;
          }
          if (envelope.type === "CHAT_ACK") {
            onAckRef.current(envelope.data);
            return;
          }
          if (envelope.type === "CHAT_READ") {
            onReadReceiptRef.current(envelope.data);
          }
        } catch {
          onStatusChangeRef.current("收到无法解析的实时消息，已忽略。");
        }
      })();
    };

    socket.onclose = () => {
      if (socketRef.current === socket) {
        socketRef.current = null;
      }
    };

    return () => {
      if (socketRef.current === socket) {
        socketRef.current = null;
      }
      socket.close();
    };
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
          type: "CHAT_READ",
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
