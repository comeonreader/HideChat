import { useEffect, useRef, useState } from "react";
import { DisguiseEntryPage } from "../pages/disguise/DisguiseEntryPage";
import {
  addContact,
  clearConversationUnread,
  clearStoredAuthState,
  createChatWebSocket,
  createSingleConversation,
  fetchCurrentUser,
  getPersistedAuthTokens,
  listContacts,
  listConversations,
  listRecentContacts,
  listMessageHistory,
  loginByEmailCode,
  loginByPassword,
  logout,
  markMessagesRead,
  registerByEmail,
  resetPassword,
  searchUsers,
  sendEmailCode,
  sendMessage,
  uploadFile
} from "../api/client";
import {
  clearCachedConversations,
  listCachedConversations,
  saveCachedConversation
} from "../storage";
import type {
  ChatMessage,
  ContactItem,
  ConversationItem,
  FileInfo,
  HiddenSession,
  LocalUser,
  RecentContactItem,
  UserSearchItem
} from "../types";
import { buildMessagePreview, createMessage } from "../utils";
import "./app.css";

type Screen = "disguise" | "auth" | "chat";
type PublicView = "lucky" | "fortune";
type AuthMode = "login" | "register" | "reset";
type LoginMethod = "password" | "code";
type ChatView = "list" | "conversation" | "add-friend";

interface WsEnvelope {
  type: string;
  data: unknown;
}

interface AuthFormState {
  email: string;
  nickname: string;
  password: string;
  newPassword: string;
  emailCode: string;
}

export function App() {
  const [screen, setScreen] = useState<Screen>("disguise");
  const [publicView, setPublicView] = useState<PublicView>("lucky");
  const [chatView, setChatView] = useState<ChatView>("list");
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [loginMethod, setLoginMethod] = useState<LoginMethod>("password");
  const [session, setSession] = useState<HiddenSession | null>(null);
  const [contacts, setContacts] = useState<ContactItem[]>([]);
  const [recentContacts, setRecentContacts] = useState<RecentContactItem[]>([]);
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({});
  const [activeConversationId, setActiveConversationId] = useState<string>("");
  const [composer, setComposer] = useState("");
  const [statusText, setStatusText] = useState("运势页已加载，输入幸运数字查看今日彩蛋。");
  const [authLoading, setAuthLoading] = useState(false);
  const [sendCodeLoading, setSendCodeLoading] = useState(false);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [contactForm, setContactForm] = useState({ peerUid: "", remarkName: "" });
  const [chatSearchQuery, setChatSearchQuery] = useState("");
  const [friendSearchQuery, setFriendSearchQuery] = useState("");
  const [userSearchResults, setUserSearchResults] = useState<UserSearchItem[]>([]);
  const [authForm, setAuthForm] = useState<AuthFormState>({
    email: "",
    nickname: "",
    password: "",
    newPassword: "",
    emailCode: ""
  });

  const wsRef = useRef<WebSocket | null>(null);
  const conversationsRef = useRef<ConversationItem[]>([]);
  const activeConversationIdRef = useRef("");

  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  useEffect(() => {
    activeConversationIdRef.current = activeConversationId;
  }, [activeConversationId]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const persistedTokens = getPersistedAuthTokens();
      if (!persistedTokens) {
        return;
      }

      try {
        const currentUser = await fetchCurrentUser();
        if (cancelled) {
          return;
        }
        await hydrateAuthenticatedState(currentUser, persistedTokens, false);
        if (!cancelled) {
          setStatusText("检测到本地登录态，输入幸运数字后可直接进入聊天。");
        }
      } catch {
        // Ignore bootstrap errors so the disguise flow remains primary.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!session?.user.userUid) {
      return;
    }

    void (async () => {
      const entries = Object.entries(messages);
      for (const [conversationId, items] of entries) {
        await saveCachedConversation({
          conversationId,
          messages: items,
          updatedAt: Date.now()
        });
      }
    })();
  }, [messages, session]);

  useEffect(() => {
    if (!session?.tokens?.accessToken || screen !== "chat") {
      closeWebSocket();
      return;
    }

    const socket = createChatWebSocket(session.tokens.accessToken);
    wsRef.current = socket;

    socket.onopen = () => {
      setStatusText("已连接后端聊天通道，实时消息已启用。");
    };

    socket.onmessage = (event) => {
      void handleSocketMessage(event.data);
    };

    socket.onclose = () => {
      if (wsRef.current === socket) {
        wsRef.current = null;
      }
    };

    return () => {
      if (wsRef.current === socket) {
        wsRef.current = null;
      }
      socket.close();
    };
  }, [screen, session]);

  async function handleSocketMessage(rawData: string) {
    try {
      const envelope = JSON.parse(rawData) as WsEnvelope;
      if (envelope.type === "CHAT_RECEIVE") {
        await handleIncomingRealtimeMessage(normalizeIncomingMessage(envelope.data));
        return;
      }
      if (envelope.type === "CHAT_ACK") {
        reconcileAck(envelope.data);
        return;
      }
      if (envelope.type === "CHAT_READ") {
        applyReadReceipt(envelope.data);
      }
    } catch {
      setStatusText("收到无法解析的实时消息，已忽略。");
    }
  }

  useEffect(() => {
    if (!session || screen !== "chat" || !activeConversationId) {
      return;
    }
    void clearConversationUnread(activeConversationId).catch(() => undefined);
  }, [activeConversationId, screen, session]);

  const activeConversation = conversations.find((item) => item.conversationId === activeConversationId) ?? conversations[0];
  const currentMessages = activeConversation ? messages[activeConversation.conversationId] ?? [] : [];
  const filteredConversations = conversations.filter((conversation) => {
    if (chatView === "conversation") {
      return true;
    }
    if (!chatSearchQuery.trim()) {
      return true;
    }
    const keyword = chatSearchQuery.trim().toLowerCase();
    return [conversation.remarkName, conversation.peerNickname, conversation.peerUid].some((value) =>
      (value ?? "").toLowerCase().includes(keyword)
    );
  });
  const selectedContact =
    contacts.find((contact) => contact.peerUid === activeConversation?.peerUid) ??
    (activeConversation
      ? {
          peerUid: activeConversation.peerUid,
          peerNickname: activeConversation.peerNickname ?? activeConversation.remarkName,
          remarkName: activeConversation.remarkName,
          lastMessageAt: activeConversation.lastMessageAt
        }
      : null);
  const visibleMessages =
    chatView === "conversation" && chatSearchQuery.trim()
      ? currentMessages.filter((message) => matchesMessageSearch(message, chatSearchQuery))
      : currentMessages;

  useEffect(() => {
    if (!session || screen !== "chat" || !activeConversation) {
      return;
    }
    const unreadMessageIds = currentMessages
      .filter((message) => message.receiverUid === session.user.userUid && message.serverStatus !== "read")
      .map((message) => message.messageId);
    if (unreadMessageIds.length === 0) {
      return;
    }
    void syncReadState(activeConversation.conversationId, unreadMessageIds);
  }, [activeConversation, currentMessages, screen, session]);

  async function handleAuthSubmit() {
    setAuthLoading(true);
    try {
      if (authMode === "register") {
        await registerByEmail({
          email: authForm.email.trim(),
          nickname: authForm.nickname.trim(),
          password: authForm.password,
          emailCode: authForm.emailCode.trim()
        });
      }
      if (authMode === "reset") {
        await resetPassword({
          email: authForm.email.trim(),
          emailCode: authForm.emailCode.trim(),
          newPassword: authForm.newPassword
        });
        setAuthMode("login");
        setLoginMethod("password");
        setAuthForm((prev) => ({
          ...prev,
          password: prev.newPassword,
          newPassword: "",
          emailCode: ""
        }));
        setStatusText("密码已重置，请使用新密码重新登录。");
        return;
      }

      const loginResult =
        loginMethod === "code"
          ? await loginByEmailCode({
              email: authForm.email.trim(),
              emailCode: authForm.emailCode.trim()
            })
          : await loginByPassword({
              email: authForm.email.trim(),
              password: authForm.password
            });
      await finishAuthentication({
        ...loginResult,
        user: await fetchCurrentUser(loginResult.user.email).catch(() => loginResult.user)
      });
      setStatusText("认证成功，已进入聊天。");
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : "登录失败");
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleSendCode() {
    setSendCodeLoading(true);
    try {
      const bizType = authMode === "register" ? "register" : authMode === "reset" ? "reset_password" : "login";
      await sendEmailCode(authForm.email.trim(), bizType);
      setStatusText("验证码已发送，请查收邮箱；如使用本地 MailPit，可在 http://localhost:8025 查看。");
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : "发送验证码失败");
    } finally {
      setSendCodeLoading(false);
    }
  }

  async function handleAddContact(peerUid?: string) {
    if (!session) {
      setStatusText("请先登录。");
      return;
    }
    const targetPeerUid = (peerUid ?? contactForm.peerUid).trim();
    if (!targetPeerUid) {
      setStatusText("请输入联系人 UID。");
      return;
    }
    try {
      await addContact(targetPeerUid, contactForm.remarkName.trim());
      const conversation = await createSingleConversation(targetPeerUid);
      const [nextContacts, nextConversations, nextRecentContacts] = await Promise.all([
        listContacts(),
        listConversations(),
        listRecentContacts(4).catch(() => [])
      ]);
      setContacts(sortContacts(nextContacts));
      setRecentContacts(sortRecentContacts(nextRecentContacts));
      setConversations(sortConversations(nextConversations));
      setActiveConversationId(conversation.conversationId);
      setContactForm({ peerUid: "", remarkName: "" });
      setFriendSearchQuery("");
      setUserSearchResults([]);
      setChatView("conversation");
      if (!messages[conversation.conversationId]) {
        const history = await listMessageHistory(conversation.conversationId).catch(() => []);
        setMessages((prev) => ({ ...prev, [conversation.conversationId]: history }));
      }
      setStatusText("联系人已添加，并创建了单聊会话。");
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : "添加联系人失败");
    }
  }

  async function handleSendMessage() {
    if (!composer.trim() || !activeConversation || !session) {
      return;
    }

    const rawPayload = composer.trim();
    setComposer("");
    await dispatchOutgoingMessage({
      conversationId: activeConversation.conversationId,
      receiverUid: activeConversation.peerUid,
      messageType: "text",
      payloadType: "plain",
      payload: rawPayload
    });
  }

  async function handleFileSelected(file: File | null) {
    if (!file || !activeConversation || !session) {
      return;
    }
    setUploadingFile(true);
    try {
      const uploaded = await uploadFile(file);
      const messageType = resolveFileMessageType(uploaded.mimeType);
      await dispatchOutgoingMessage({
        conversationId: activeConversation.conversationId,
        receiverUid: activeConversation.peerUid,
        messageType,
        payloadType: "ref",
        payload: buildFilePayload(uploaded),
        fileId: uploaded.fileId
      });
      setStatusText(`文件 ${file.name} 已上传，并作为${messageType === "image" ? "图片" : "文件"}消息发送。`);
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : "文件上传失败");
    } finally {
      setUploadingFile(false);
    }
  }

  async function dispatchOutgoingMessage(input: {
    conversationId: string;
    receiverUid: string;
    payload: string;
    messageType: "text" | "image" | "file";
    payloadType: "plain" | "ref";
    fileId?: string;
  }) {
    if (!session) {
      return;
    }

    const optimisticMessage = createMessage({
      conversationId: input.conversationId,
      senderUid: session.user.userUid,
      receiverUid: input.receiverUid,
      payload: input.payload,
      messageType: input.messageType,
      payloadType: input.payloadType,
      fileId: input.fileId
    });

    applyIncomingMessage(optimisticMessage);
    const socket = wsRef.current;

    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(
        JSON.stringify({
          type: "CHAT_SEND",
          data: {
            messageId: optimisticMessage.messageId,
            conversationId: input.conversationId,
            receiverUid: input.receiverUid,
            messageType: input.messageType,
            payloadType: input.payloadType,
            payload: input.payload,
            fileId: input.fileId,
            clientMsgTime: optimisticMessage.clientMsgTime
          }
        })
      );
      setStatusText(
        input.messageType === "image"
          ? "图片消息已通过 WebSocket 发出。"
          : input.messageType === "file"
            ? "文件消息已通过 WebSocket 发出。"
            : "消息已通过 WebSocket 发出。"
      );
      return;
    }

    try {
      const sent = await sendMessage({
        messageId: optimisticMessage.messageId,
        conversationId: input.conversationId,
        receiverUid: input.receiverUid,
        messageType: input.messageType,
        payloadType: input.payloadType,
        payload: input.payload,
        fileId: input.fileId,
        clientMsgTime: optimisticMessage.clientMsgTime ?? Date.now()
      });
      applyIncomingMessage(sent);
      setStatusText("实时通道未连接，已通过 HTTP 发送消息。");
    } catch (error) {
      setMessages((prev) => removeMessage(prev, optimisticMessage));
      if (input.messageType === "text") {
        setComposer(extractTextPayload(input.payload));
      }
      setStatusText(error instanceof Error ? error.message : "发送消息失败");
    }
  }

  function applyIncomingMessage(message: ChatMessage) {
    setMessages((prev) => {
      const current = prev[message.conversationId] ?? [];
      const existingIndex = current.findIndex((item) => item.messageId === message.messageId);
      const nextMessages =
        existingIndex >= 0
          ? current.map((item, index) => (index === existingIndex ? { ...item, ...message } : item))
          : [...current, message];
      return {
        ...prev,
        [message.conversationId]: nextMessages.sort((left, right) => left.serverMsgTime - right.serverMsgTime)
      };
    });

    setConversations((prev) =>
      sortConversations(
        prev.map((item) =>
          item.conversationId === message.conversationId
            ? {
                ...item,
                lastMessagePreview: buildMessagePreview(message),
                lastMessageAt: message.serverMsgTime,
                unreadCount:
                  message.senderUid === session?.user.userUid
                    ? item.unreadCount ?? 0
                    : (item.unreadCount ?? 0) + 1
              }
            : item
        )
      )
    );

    setContacts((prev) =>
      sortContacts(
        prev.map((item) =>
          item.peerUid === resolvePeerUid(message)
            ? {
                ...item,
                lastMessageAt: message.serverMsgTime
              }
            : item
        )
      )
    );
  }

  async function handleIncomingRealtimeMessage(message: ChatMessage) {
    const hasConversation = conversationsRef.current.some((item) => item.conversationId === message.conversationId);
    if (!hasConversation) {
      const refreshedConversations = await refreshConversationList();
      if (refreshedConversations.some((item) => item.conversationId === message.conversationId)) {
        setStatusText("收到新会话消息，已同步会话列表。");
      }
    }
    applyIncomingMessage(message);
  }

  function reconcileAck(data: unknown) {
    const raw = data as Record<string, unknown>;
    const ackMessage = raw.message ? normalizeIncomingMessage(raw.message) : null;
    if (ackMessage) {
      applyIncomingMessage(ackMessage);
      return;
    }
    const messageId = String(raw.messageId ?? "");
    if (!messageId) {
      return;
    }
    setMessages((prev) =>
      Object.fromEntries(
        Object.entries(prev).map(([conversationId, items]) => [
          conversationId,
          items.map((item) => (item.messageId === messageId ? { ...item, serverStatus: "delivered" } : item))
        ])
      )
    );
  }

  function applyReadReceipt(data: unknown) {
    const raw = data as Record<string, unknown>;
    const messageIds = Array.isArray(raw.messageIds) ? raw.messageIds.map(String) : [];
    const conversationId = String(raw.conversationId ?? "");
    if (!conversationId || messageIds.length === 0) {
      return;
    }
    setMessages((prev) => ({
      ...prev,
      [conversationId]: (prev[conversationId] ?? []).map((item) =>
        messageIds.includes(item.messageId) ? { ...item, serverStatus: "read" } : item
      )
    }));
  }

  async function syncReadState(conversationId: string, messageIds: string[]) {
    try {
      const socket = wsRef.current;
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: "CHAT_READ", data: { conversationId, messageIds } }));
      } else {
        await markMessagesRead(conversationId, messageIds);
      }
      applyReadReceipt({ conversationId, messageIds });
    } catch {
      // Ignore read-sync failures so the chat view remains usable.
    }
  }

  async function refreshConversationList(): Promise<ConversationItem[]> {
    try {
      const latestConversations = sortConversations(await listConversations());
      setConversations(latestConversations);
      if (!activeConversationIdRef.current && latestConversations.length > 0) {
        setActiveConversationId(latestConversations[0].conversationId);
      }
      return latestConversations;
    } catch {
      return conversationsRef.current;
    }
  }

  function handleReturnToDisguise() {
    closeWebSocket();
    setComposer("");
    setScreen("disguise");
    setPublicView("lucky");
    setChatView("list");
    setStatusText("已返回伪装入口。");
  }

  function closeWebSocket() {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }

  async function handleLogout() {
    const refreshToken = session?.tokens?.refreshToken;
    let nextStatus = "已退出当前账号。";

    if (refreshToken) {
      try {
        await logout(refreshToken);
      } catch (error) {
        clearStoredAuthState();
        nextStatus = error instanceof Error ? `${error.message}，当前设备已完成本地退出。` : "服务端退出失败，当前设备已完成本地退出。";
      }
    } else {
      clearStoredAuthState();
    }

    closeWebSocket();
    await clearCachedConversations();
    setSession(null);
    setContacts([]);
    setRecentContacts([]);
    setConversations([]);
    setMessages({});
    setActiveConversationId("");
    setComposer("");
    setScreen("disguise");
    setPublicView("lucky");
    setChatView("list");
    setAuthMode("login");
    setLoginMethod("password");
    setStatusText(nextStatus);
  }

  async function finishAuthentication(input: { user: LocalUser; tokens: HiddenSession["tokens"] }) {
    await hydrateAuthenticatedState(input.user, input.tokens, true);
  }

  async function hydrateAuthenticatedState(user: LocalUser, tokens: HiddenSession["tokens"], enterChat: boolean) {
    setSession({
      user,
      tokens
    });

    const nextConversationsPromise = listConversations().then(sortConversations);
    const [nextContacts, nextConversations, nextRecentContacts] = await Promise.all([
      listContacts(),
      nextConversationsPromise,
      listRecentContacts(4).catch(() => [])
    ]);
    const nextMessages = await hydrateMessages(nextConversations);

    setContacts(sortContacts(nextContacts));
    setRecentContacts(sortRecentContacts(nextRecentContacts));
    setConversations(sortConversations(nextConversations));
    setMessages(nextMessages);
    setActiveConversationId(nextConversations[0]?.conversationId ?? "");
    if (enterChat) {
      setScreen("chat");
      setChatView(nextConversations[0]?.conversationId ? "conversation" : "list");
    }
  }

  async function hydrateMessages(nextConversations: ConversationItem[]): Promise<Record<string, ChatMessage[]>> {
    const cachedRecords = await listCachedConversations().catch(() => []);
    const cacheMap = new Map(cachedRecords.map((record) => [record.conversationId, record.messages]));
    const entries = await Promise.all(
      nextConversations.map(async (conversation) => {
        const cachedMessages = cacheMap.get(conversation.conversationId);
        if (cachedMessages && cachedMessages.length > 0) {
          return [conversation.conversationId, cachedMessages] as const;
        }
        try {
          return [conversation.conversationId, await listMessageHistory(conversation.conversationId)] as const;
        } catch {
          return [conversation.conversationId, []] as const;
        }
      })
    );
    return Object.fromEntries(entries);
  }

  function openConversation(conversationId: string) {
    setActiveConversationId(conversationId);
    setChatView("conversation");
  }

  async function handleFriendSearch() {
    const keyword = friendSearchQuery.trim();
    if (!session) {
      setStatusText("请先登录后再搜索用户。");
      return;
    }
    if (!keyword) {
      setUserSearchResults([]);
      setStatusText("请输入昵称或用户 ID。");
      return;
    }
    setSearchingUsers(true);
    try {
      const results = await searchUsers(keyword);
      setUserSearchResults(results);
      setStatusText(results.length > 0 ? `已找到 ${results.length} 个匹配用户。` : "未找到匹配的用户。");
    } catch (error) {
      setUserSearchResults([]);
      setStatusText(error instanceof Error ? error.message : "搜索用户失败");
    } finally {
      setSearchingUsers(false);
    }
  }

  return (
    <main className={screen === "chat" ? "app-root app-root--chat" : "app-root"}>
      {screen === "disguise" && renderPublicView()}
      {screen === "auth" && renderAuthView()}
      {screen === "chat" && session && renderChatShell()}
      <section className="status-strip">
        <strong>状态</strong>
        <span>{statusText}</span>
      </section>
    </main>
  );

  function renderPublicView() {
    return (
      <DisguiseEntryPage
        onLuckyNumberVerified={() => {
          if (session?.tokens?.accessToken) {
            setScreen("chat");
            setChatView(activeConversationId ? "conversation" : "list");
            setStatusText("幸运数字校验通过，已进入聊天。");
          } else {
            setScreen("auth");
          }
        }}
        onSwitchToFortune={() => setPublicView("fortune")}
        initialView={publicView}
      />
    );
  }

  function renderAuthView() {
    return (
      <div className="page auth-page">
        <div className="topbar">
          <div>
            <div className="title">隐藏入口验证</div>
            <div className="muted">完成账号登录后直接进入聊天。</div>
          </div>
          <button className="btn ghost" type="button" onClick={() => setScreen("disguise")}>
            返回运势页
          </button>
        </div>

        <div className="auth-layout auth-layout--single">
          <section className="card result-card auth-card-panel">
            <div className="tabs">
              <button
                className={authMode === "login" ? "is-active" : ""}
                type="button"
                onClick={() => setAuthMode("login")}
              >
                登录
              </button>
              <button
                className={authMode === "register" ? "is-active" : ""}
                type="button"
                onClick={() => setAuthMode("register")}
              >
                注册
              </button>
              <button
                className={authMode === "reset" ? "is-active" : ""}
                type="button"
                onClick={() => setAuthMode("reset")}
              >
                找回密码
              </button>
            </div>

            {authMode === "login" && (
              <div className="tabs">
                <button
                  className={loginMethod === "password" ? "is-active" : ""}
                  type="button"
                  onClick={() => setLoginMethod("password")}
                >
                  密码登录
                </button>
                <button
                  className={loginMethod === "code" ? "is-active" : ""}
                  type="button"
                  onClick={() => setLoginMethod("code")}
                >
                  验证码登录
                </button>
              </div>
            )}

            <div className="fields">
              <input
                value={authForm.email}
                onChange={(event) => setAuthForm((prev) => ({ ...prev, email: event.target.value }))}
                placeholder="邮箱"
              />
              {authMode === "register" && (
                <input
                  value={authForm.nickname}
                  onChange={(event) => setAuthForm((prev) => ({ ...prev, nickname: event.target.value }))}
                  placeholder="昵称"
                />
              )}
              {(authMode === "register" || (authMode === "login" && loginMethod === "password")) && (
                <input
                  type="password"
                  value={authForm.password}
                  onChange={(event) => setAuthForm((prev) => ({ ...prev, password: event.target.value }))}
                  placeholder="密码"
                />
              )}
              {authMode === "reset" && (
                <input
                  type="password"
                  value={authForm.newPassword}
                  onChange={(event) => setAuthForm((prev) => ({ ...prev, newPassword: event.target.value }))}
                  placeholder="新密码"
                />
              )}
              {(authMode === "register" || authMode === "reset" || (authMode === "login" && loginMethod === "code")) && (
                <input
                  value={authForm.emailCode}
                  onChange={(event) => setAuthForm((prev) => ({ ...prev, emailCode: event.target.value }))}
                  placeholder="邮箱验证码"
                />
              )}
            </div>

            <div className="section-text">认证成功后直接进入聊天。历史消息会从本地缓存或后端历史接口恢复。</div>

            <div className="auth-actions">
              {(authMode === "register" || authMode === "reset" || (authMode === "login" && loginMethod === "code")) && (
                <button className="btn ghost" type="button" onClick={() => void handleSendCode()} disabled={sendCodeLoading}>
                  {sendCodeLoading ? "发送中..." : "发送验证码"}
                </button>
              )}
              <button className="btn btn-brand" type="button" onClick={() => void handleAuthSubmit()} disabled={authLoading}>
                {authLoading ? "处理中..." : authMode === "register" ? "注册并进入" : authMode === "reset" ? "重置密码" : "使用当前信息进入"}
              </button>
            </div>
          </section>
        </div>
      </div>
    );
  }

  function renderChatShell() {
    const isConversationView = chatView === "conversation" && Boolean(activeConversation);
    return (
      <div className={isConversationView ? "chat-page" : ""}>
        <div className={isConversationView ? "chat-shell" : "wechat-layout"}>
          {renderSidebar(isConversationView)}
          {chatView === "add-friend" ? renderAddFriendPage() : isConversationView ? renderConversationPage() : renderChatListPage()}
        </div>
      </div>
    );
  }

  function renderSidebar(inConversationLayout: boolean) {
    return (
      <aside className="sidebar">
        <div className="sidebar-inner">
          <div className="wechat-header">
            <div className="topbar topbar-tight">
              <div className="title title-chat">聊天</div>
              <button className="tag tag-button" type="button" onClick={() => setChatView("add-friend")}>
                {inConversationLayout ? "添加好友" : "搜索 / 添加好友"}
              </button>
            </div>
            <div className="search-box">
              <span>🔍</span>
              <input
                value={chatSearchQuery}
                onChange={(event) => setChatSearchQuery(event.target.value)}
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
                className={conversation.conversationId === activeConversation?.conversationId ? "chat-item active" : "chat-item"}
              >
                <button className="chat-item-button" type="button" onClick={() => openConversation(conversation.conversationId)}>
                  <div className="avatar">{getAvatarLabel(conversation.remarkName || conversation.peerNickname || conversation.peerUid)}</div>
                  <div className="chat-main">
                    <div className="chat-row">
                      <div className="name">{conversation.remarkName || conversation.peerNickname || conversation.peerUid}</div>
                      <div className="time">{formatMessageTime(conversation.lastMessageAt)}</div>
                    </div>
                    <div className="preview">{getMaskedConversationPreview(conversation)}</div>
                  </div>
                  {(conversation.unreadCount ?? 0) > 0 && <span className="count">{conversation.unreadCount}</span>}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <nav className="mobile-nav">
          <button type="button" className={chatView === "list" ? "is-active" : ""} onClick={() => setChatView("list")}>
            💬
            <span>聊天</span>
          </button>
          <button type="button" className={chatView === "add-friend" ? "is-active" : ""} onClick={() => setChatView("add-friend")}>
            👤
            <span>好友</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setScreen("disguise");
              setPublicView("fortune");
            }}
          >
            ✨
            <span>运势</span>
          </button>
        </nav>
      </aside>
    );
  }

  function renderChatListPage() {
    return (
      <main className="main-panel">
        <div className="panel-header">
          <div>
            <div className="name header-name">{activeConversation?.remarkName || activeConversation?.peerNickname || "最近会话"}</div>
            <div className="muted">
              {activeConversation ? `${selectedContact?.peerNickname ?? "联系人"} 在线状态受保护 · ${(activeConversation.unreadCount ?? 0)} 条未读` : "选择左侧会话进入聊天"}
            </div>
          </div>
          <button
            className="btn ghost"
            type="button"
            onClick={() => {
              if (activeConversation) {
                setChatView("conversation");
              }
            }}
            disabled={!activeConversation}
          >
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

  function renderConversationPage() {
    const currentSession = session;
    if (!currentSession) {
      return null;
    }
    return (
      <main className="conv-area">
        <div className="panel-header">
          <div>
            <div className="name header-name">{activeConversation?.remarkName || activeConversation?.peerNickname || "选择一个会话"}</div>
            <div className="muted">工作日 09:00 - 22:00 活跃 · 本地缓存已启用</div>
          </div>
          <div className="panel-header-actions">
            <span className="tag">支持发送文件</span>
            <button className="btn ghost" type="button" onClick={() => setChatView("list")}>
              返回列表
            </button>
            <button className="btn ghost" type="button" onClick={handleReturnToDisguise}>
              返回伪装页
            </button>
            <button className="btn ghost" type="button" onClick={() => void handleLogout()}>
              退出账号
            </button>
          </div>
        </div>

        <div className="messages">
          {visibleMessages.length > 0 && <div className="day-divider">{formatConversationDivider(visibleMessages[0].serverMsgTime)}</div>}
          {visibleMessages.map((message) => renderMessageRow(message))}
          {activeConversation && currentMessages.length === 0 && (
            <div className="msg other">
              <div className="bubble">暂无消息</div>
            </div>
          )}
          {activeConversation && currentMessages.length > 0 && visibleMessages.length === 0 && (
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
                  void handleFileSelected(selected);
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
                  void handleFileSelected(selected);
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
              onChange={(event) => setComposer(event.target.value)}
              placeholder="输入消息..."
              disabled={!activeConversation}
            />
            <button className="btn btn-brand send-btn" type="button" onClick={() => void handleSendMessage()} disabled={!activeConversation}>
              发送
            </button>
          </div>
        </div>
      </main>
    );
  }

  function renderAddFriendPage() {
    return (
      <main className="main-panel search-page-wrap">
        <div className="page search-page">
          <div className="topbar">
            <div>
              <div className="title">搜索 / 添加好友</div>
              <div className="muted">支持昵称、用户 ID 搜索</div>
            </div>
            <button className="btn ghost" type="button" onClick={() => setChatView("list")}>
              返回聊天
            </button>
          </div>

          <div className="search-layout">
            <section className="card result-card">
              <div className="search-box search-box-action">
                <span>🔎</span>
                <input
                  value={friendSearchQuery}
                  onChange={(event) => setFriendSearchQuery(event.target.value)}
                  placeholder="输入昵称或用户 ID"
                />
                <button className="btn btn-brand" type="button" onClick={() => void handleFriendSearch()} disabled={searchingUsers}>
                  {searchingUsers ? "搜索中..." : "搜索"}
                </button>
              </div>

              <div className="inline-fields">
                <input
                  value={contactForm.remarkName}
                  onChange={(event) => setContactForm((prev) => ({ ...prev, remarkName: event.target.value }))}
                  placeholder="备注名（可选）"
                />
              </div>

              <div className="section-title">搜索结果</div>

              {userSearchResults.length > 0 ? (
                userSearchResults.map((result) => (
                  <div key={result.userUid} className="user-row">
                    <div className="avatar">{getAvatarLabel(result.nickname || result.displayUserId)}</div>
                    <div className="user-meta">
                      <div className="name">{contactForm.remarkName || result.nickname || result.displayUserId}</div>
                      <div className="preview">ID: {result.displayUserId}</div>
                    </div>
                    <button
                      className={result.alreadyAdded ? "btn ghost" : "btn btn-brand"}
                      type="button"
                      disabled={result.alreadyAdded}
                      onClick={() => {
                        setContactForm((prev) => ({ ...prev, peerUid: result.userUid }));
                        void handleAddContact(result.userUid);
                      }}
                    >
                      {result.alreadyAdded ? "已添加" : "添加"}
                    </button>
                  </div>
                ))
              ) : (
                <div className="empty-search">输入昵称或用户 ID 后即可获取真实搜索结果。</div>
              )}
            </section>

            <aside className="card result-card">
              <div className="section-title">最近添加</div>
              <div className="advice-list">
                {recentContacts.length === 0 && <div className="empty-search">暂无联系人记录</div>}
                {recentContacts.map((contact) => (
                  <div key={contact.peerUid} className="advice-item contact-advice">
                    <div className="avatar small">{getAvatarLabel(contact.peerNickname || contact.displayUserId || contact.peerUid)}</div>
                    <div>
                      <div className="name">{contact.peerNickname || contact.displayUserId || contact.peerUid}</div>
                      <div className="preview">{formatRecentAdded(contact.createdAt)} 已添加</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="section-title section-title-gap">提示</div>
              <div className="section-text">
                页面风格保持简洁，桌面端采用双栏布局，手机端自动折叠为单列。联系人搜索页不展示历史消息正文，避免公开泄露聊天内容。
              </div>
            </aside>
          </div>
        </div>
      </main>
    );
  }

  function renderMessageRow(message: ChatMessage) {
    const currentSession = session;
    if (!currentSession) {
      return null;
    }
    const isSelf = message.senderUid === currentSession.user.userUid;
    const avatarName = activeConversation?.remarkName || activeConversation?.peerNickname || "对方";
    return (
      <div key={message.messageId} className={isSelf ? "msg self" : "msg other"}>
        {!isSelf && <div className="avatar small">{getAvatarLabel(avatarName)}</div>}
        {renderMessageBody(message, isSelf)}
      </div>
    );
  }

  function resolvePeerUid(message: ChatMessage): string {
    return message.senderUid === session?.user.userUid ? message.receiverUid : message.senderUid;
  }

  function renderMessageBody(message: ChatMessage, isSelf: boolean) {
    if (!["image", "file"].includes(message.messageType)) {
      return <div className="bubble">{extractTextPayload(message.payload)}</div>;
    }

    const filePayload = parseFilePayload(message.payload);
    const previewableImage = message.messageType === "image" && !!filePayload?.accessUrl;
    return (
      <div className={isSelf ? "file-card file-card--self" : "file-card"}>
        <div className="file-card__title">{filePayload?.fileName || (message.messageType === "image" ? "图片消息" : "文件消息")}</div>
        <div className="preview">{formatFileSubtitle(filePayload, previewableImage)}</div>
        {previewableImage && filePayload?.accessUrl && (
          <a className="file-card__link" href={filePayload.accessUrl} target="_blank" rel="noreferrer">
            <img src={filePayload.accessUrl} alt={filePayload.fileName || "图片消息"} loading="lazy" />
          </a>
        )}
        {!previewableImage && (filePayload?.downloadUrl || filePayload?.accessUrl) && (
          <a
            className="file-card__link"
            href={filePayload.downloadUrl || filePayload.accessUrl}
            target="_blank"
            rel="noreferrer"
            download={filePayload.fileName || true}
          >
            下载文件
          </a>
        )}
      </div>
    );
  }

  function getMaskedConversationPreview(conversation: ConversationItem) {
    const conversationMessages = messages[conversation.conversationId] ?? [];
    const lastMessage = conversationMessages[conversationMessages.length - 1];
    if (lastMessage?.messageType === "image") {
      return "[图片消息]";
    }
    if (lastMessage?.messageType === "file") {
      return "[文件消息]";
    }
    if (lastMessage?.messageType === "text") {
      return "[文本消息]";
    }
    return conversation.lastMessagePreview.startsWith("[") ? conversation.lastMessagePreview : "[文本消息]";
  }
}

function normalizeIncomingMessage(data: unknown): ChatMessage {
  const raw = data as Record<string, unknown>;
  return {
    messageId: String(raw.messageId ?? `m_${Date.now()}`),
    conversationId: String(raw.conversationId ?? ""),
    senderUid: String(raw.senderUid ?? ""),
    receiverUid: String(raw.receiverUid ?? ""),
    payload: String(raw.payload ?? ""),
    messageType: String(raw.messageType ?? "text"),
    payloadType: raw.payloadType ? String(raw.payloadType) : undefined,
    fileId: raw.fileId ? String(raw.fileId) : null,
    clientMsgTime: raw.clientMsgTime == null ? null : Number(raw.clientMsgTime),
    serverMsgTime: Number(raw.serverMsgTime ?? Date.now()),
    serverStatus: raw.serverStatus ? String(raw.serverStatus) : undefined
  };
}

function sortContacts(items: ContactItem[]): ContactItem[] {
  return [...items].sort((left, right) => (right.lastMessageAt ?? 0) - (left.lastMessageAt ?? 0));
}

function sortRecentContacts(items: RecentContactItem[]): RecentContactItem[] {
  return [...items].sort((left, right) => (right.createdAt ?? 0) - (left.createdAt ?? 0));
}

function sortConversations(items: ConversationItem[]): ConversationItem[] {
  return [...items].sort((left, right) => (right.lastMessageAt ?? 0) - (left.lastMessageAt ?? 0));
}

function buildFilePayload(file: FileInfo): string {
  return JSON.stringify({
    fileId: file.fileId,
    fileName: file.fileName,
    mimeType: file.mimeType,
    fileSize: file.fileSize,
    accessUrl: file.accessUrl,
    downloadUrl: file.downloadUrl
  });
}

function parseFilePayload(payload: string): {
  fileName?: string;
  accessUrl?: string;
  downloadUrl?: string;
  fileSize?: number;
  mimeType?: string;
} | null {
  try {
    const parsed = JSON.parse(payload) as {
      fileName?: string;
      accessUrl?: string;
      downloadUrl?: string;
      fileSize?: number;
      mimeType?: string;
    };
    return parsed;
  } catch {
    return null;
  }
}

function resolveFileMessageType(mimeType?: string): "image" | "file" {
  return mimeType?.startsWith("image/") ? "image" : "file";
}

function formatFileSubtitle(payload: { fileSize?: number } | null, previewableImage: boolean): string {
  const size = formatFileSize(payload?.fileSize);
  if (previewableImage) {
    return size ? `${size} · 点击图片可预览或下载` : "点击图片可预览或下载";
  }
  return size ? `${size} · 点击可下载` : "点击可下载";
}

function formatFileSize(fileSize?: number): string {
  if (!fileSize || fileSize <= 0) {
    return "";
  }
  if (fileSize < 1024) {
    return `${fileSize} B`;
  }
  if (fileSize < 1024 * 1024) {
    return `${(fileSize / 1024).toFixed(1)} KB`;
  }
  return `${(fileSize / (1024 * 1024)).toFixed(1)} MB`;
}

function extractTextPayload(payload: string): string {
  return payload;
}

function removeMessage(messages: Record<string, ChatMessage[]>, target: ChatMessage): Record<string, ChatMessage[]> {
  return {
    ...messages,
    [target.conversationId]: (messages[target.conversationId] ?? []).filter((item) => item.messageId !== target.messageId)
  };
}

function getAvatarLabel(value: string): string {
  return value.trim().slice(0, 1).toUpperCase() || "匿";
}

function formatWeekdayShort(date: Date): string {
  return `周${"日一二三四五六"[date.getDay()]}`;
}

function formatMessageTime(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  if (sameDay) {
    return new Intl.DateTimeFormat("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    }).format(date);
  }
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return "昨天";
  }
  return formatWeekdayShort(date);
}

function formatConversationDivider(timestamp: number): string {
  return `今天 ${new Intl.DateTimeFormat("zh-CN", { hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(timestamp))}`;
}

function formatRecentAdded(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return `今天 ${new Intl.DateTimeFormat("zh-CN", { hour: "2-digit", minute: "2-digit", hour12: false }).format(date)}`;
  }
  return `昨天 ${new Intl.DateTimeFormat("zh-CN", { hour: "2-digit", minute: "2-digit", hour12: false }).format(date)}`;
}

function matchesMessageSearch(message: ChatMessage, keyword: string): boolean {
  const normalizedKeyword = keyword.trim().toLowerCase();
  if (!normalizedKeyword) {
    return true;
  }
  if (message.messageType === "text") {
    return extractTextPayload(message.payload).toLowerCase().includes(normalizedKeyword);
  }
  const filePayload = parseFilePayload(message.payload);
  return [filePayload?.fileName, filePayload?.mimeType, filePayload?.downloadUrl, filePayload?.accessUrl]
    .filter((value): value is string => Boolean(value))
    .some((value) => value.toLowerCase().includes(normalizedKeyword));
}
