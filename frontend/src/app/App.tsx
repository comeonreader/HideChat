import { useEffect, useRef, useState } from "react";
import {
  ApiError,
  addContact,
  clearConversationUnread,
  clearStoredAuthState,
  createChatWebSocket,
  createSingleConversation,
  fetchCurrentUser,
  fetchDisguiseConfig,
  fetchTodayFortune,
  listContacts,
  listConversations,
  listMessageHistory,
  loginByPassword,
  markMessagesRead,
  registerByEmail,
  sendEmailCode,
  sendMessage,
  uploadFile
} from "../api/client";
import { decryptString, encryptString, sha256Hex } from "../crypto";
import { loadCachedConversation, saveCachedConversation } from "../storage";
import type {
  ChatMessage,
  ContactItem,
  ConversationItem,
  FileInfo,
  HiddenSession,
  LocalUser
} from "../types";
import {
  buildMessagePreview,
  createDemoContacts,
  createDemoConversations,
  createDemoMessages,
  createMessage
} from "../utils";
import "./app.css";

const DEMO_LUCKY_CODE = "2468";

type Screen = "disguise" | "auth" | "chat";
type AuthMode = "login" | "register";

interface WsEnvelope {
  type: string;
  data: unknown;
}

interface AuthFormState {
  email: string;
  nickname: string;
  password: string;
  emailCode: string;
}

export function App() {
  const [screen, setScreen] = useState<Screen>("disguise");
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [fortune, setFortune] = useState<Awaited<ReturnType<typeof fetchTodayFortune>> | null>(null);
  const [config, setConfig] = useState<Awaited<ReturnType<typeof fetchDisguiseConfig>> | null>(null);
  const [luckyCodeInput, setLuckyCodeInput] = useState("");
  const [pinInput, setPinInput] = useState("");
  const [luckyCodeHash, setLuckyCodeHash] = useState("");
  const [session, setSession] = useState<HiddenSession | null>(null);
  const [contacts, setContacts] = useState<ContactItem[]>(createDemoContacts());
  const [conversations, setConversations] = useState<ConversationItem[]>(createDemoConversations());
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>(createDemoMessages());
  const [activeConversationId, setActiveConversationId] = useState<string>("c_demo_1");
  const [composer, setComposer] = useState("");
  const [statusText, setStatusText] = useState("运势页已加载，输入幸运数字进入隐藏入口。");
  const [authLoading, setAuthLoading] = useState(false);
  const [sendCodeLoading, setSendCodeLoading] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [contactForm, setContactForm] = useState({ peerUid: "", remarkName: "" });
  const [authForm, setAuthForm] = useState<AuthFormState>({
    email: "demo@hide.chat",
    nickname: "Reader",
    password: "reader123",
    emailCode: ""
  });

  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    void (async () => {
      const [fortuneData, disguiseData, hash] = await Promise.all([
        fetchTodayFortune(),
        fetchDisguiseConfig(),
        sha256Hex(DEMO_LUCKY_CODE)
      ]);
      setFortune(fortuneData);
      setConfig(disguiseData);
      setLuckyCodeHash(hash);
    })();
  }, []);

  useEffect(() => {
    if (!session?.pin || screen !== "chat") {
      return;
    }
    const pin = session.pin;
    void (async () => {
      const entries = Object.entries(messages);
      for (const [conversationId, items] of entries) {
        const encryptedPayload = await encryptString(pin, JSON.stringify(items));
        await saveCachedConversation({
          conversationId,
          encryptedPayload,
          updatedAt: Date.now()
        });
      }
    })();
  }, [messages, screen, session]);

  useEffect(() => {
    if (session?.mode !== "backend" || !session.tokens?.accessToken || screen !== "chat") {
      closeWebSocket();
      return;
    }

    const socket = createChatWebSocket(session.tokens.accessToken);
    wsRef.current = socket;

    socket.onopen = () => {
      setStatusText("已连接后端聊天通道，实时消息已启用。");
    };

    socket.onmessage = (event) => {
      try {
        const envelope = JSON.parse(event.data) as WsEnvelope;
        if (envelope.type === "CHAT_RECEIVE") {
          applyIncomingMessage(normalizeIncomingMessage(envelope.data));
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

  useEffect(() => {
    if (!session || screen !== "chat" || session.mode !== "backend" || !activeConversationId) {
      return;
    }
    void clearConversationUnread(activeConversationId).catch(() => undefined);
  }, [activeConversationId, screen, session]);

  const activeConversation = conversations.find((item) => item.conversationId === activeConversationId) ?? conversations[0];
  const currentMessages = activeConversation ? messages[activeConversation.conversationId] ?? [] : [];

  useEffect(() => {
    if (!session || session.mode !== "backend" || screen !== "chat" || !activeConversation) {
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

  async function handleLuckyCodeSubmit() {
    const inputHash = await sha256Hex(luckyCodeInput.trim());
    if (inputHash !== luckyCodeHash) {
      setStatusText("幸运数字不匹配，继续展示正常运势内容。");
      setLuckyCodeInput("");
      return;
    }
    if (!session?.pinHash) {
      setStatusText("幸运数字通过，先登录或注册，再设置 PIN 用于本地加密缓存。");
    } else {
      setStatusText("幸运数字通过，请输入 PIN 解锁本地加密消息。");
    }
    setScreen("auth");
  }

  async function handlePinContinue() {
    const trimmedPin = pinInput.trim();
    if (!trimmedPin) {
      setStatusText("PIN 不能为空。");
      return;
    }
    if (!session?.pinHash) {
      setStatusText("请先完成登录或注册，再设置 PIN。");
      return;
    }

    const candidateHash = await sha256Hex(trimmedPin);
    if (candidateHash !== session.pinHash) {
      setStatusText("PIN 不正确，仍停留在伪装入口。");
      setPinInput("");
      setScreen("disguise");
      return;
    }

    const restored = await loadCachedConversation(activeConversationId);
    if (restored) {
      try {
        const decoded = await decryptString(trimmedPin, restored.encryptedPayload);
        setMessages((prev) => ({
          ...prev,
          [activeConversationId]: JSON.parse(decoded) as ChatMessage[]
        }));
      } catch {
        setStatusText("本地缓存解密失败，已回退到当前内存消息。");
      }
    }

    setSession((prev) => (prev ? { ...prev, pin: trimmedPin } : prev));
    setStatusText("PIN 校验通过，已恢复隐藏聊天界面。");
    setScreen("chat");
  }

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

      const loginResult = await loginByPassword({
        email: authForm.email.trim(),
        password: authForm.password
      });
      await finishAuthentication({
        ...loginResult,
        user: await fetchCurrentUser().catch(() => loginResult.user)
      });
      setStatusText("已连接后端账号，请继续设置或输入 PIN。");
    } catch (error) {
      if (error instanceof ApiError && (error.isNetworkError || error.status === 404 || error.status === 502 || error.status === 503)) {
        const demoUser = buildDemoUser(authForm.nickname, authForm.email);
        setSession((prev) => ({
          user: demoUser,
          pin: prev?.pin,
          pinHash: prev?.pinHash ?? "",
          mode: "demo"
        }));
        setStatusText("后端不可用，已回退到本地演示模式。继续设置 PIN 即可进入聊天。");
        return;
      }
      setStatusText(error instanceof Error ? error.message : "登录失败");
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleSendCode() {
    setSendCodeLoading(true);
    try {
      await sendEmailCode(authForm.email.trim(), authMode === "register" ? "register" : "login");
      setStatusText("验证码已发送，请查看后端日志中的验证码。");
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : "发送验证码失败");
    } finally {
      setSendCodeLoading(false);
    }
  }

  async function handleSetPinAndEnter() {
    const trimmedPin = pinInput.trim();
    if (!session?.user) {
      setStatusText("请先完成登录或注册。");
      return;
    }
    if (!trimmedPin) {
      setStatusText("PIN 不能为空。");
      return;
    }
    const pinHash = await sha256Hex(trimmedPin);
    setSession((prev) => (prev ? { ...prev, pin: trimmedPin, pinHash } : prev));
    setStatusText("PIN 已设置，本地缓存会以加密形式写入 IndexedDB。");
    setScreen("chat");
  }

  async function handleAddContact() {
    if (!session || session.mode !== "backend") {
      setStatusText("演示模式不支持真实联系人写入。");
      return;
    }
    if (!contactForm.peerUid.trim()) {
      setStatusText("请输入联系人 UID。");
      return;
    }
    try {
      await addContact(contactForm.peerUid.trim(), contactForm.remarkName.trim());
      const conversation = await createSingleConversation(contactForm.peerUid.trim());
      const [nextContacts, nextConversations] = await Promise.all([listContacts(), listConversations()]);
      setContacts(sortContacts(nextContacts));
      setConversations(sortConversations(nextConversations));
      setActiveConversationId(conversation.conversationId);
      setContactForm({ peerUid: "", remarkName: "" });
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
      payloadType: "text",
      payload: rawPayload
    });
  }

  async function handleFileSelected(file: File | null) {
    if (!file || !activeConversation || !session) {
      return;
    }
    if (session.mode !== "backend") {
      setStatusText("演示模式不支持真实文件上传。");
      return;
    }

    setUploadingFile(true);
    try {
      const uploaded = await uploadFile(file);
      await dispatchOutgoingMessage({
        conversationId: activeConversation.conversationId,
        receiverUid: activeConversation.peerUid,
        messageType: "image",
        payloadType: "ref",
        payload: buildImagePayload(uploaded),
        fileId: uploaded.fileId
      });
      setStatusText(`文件 ${file.name} 已上传，并作为图片消息发送。`);
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
    messageType: "text" | "image";
    payloadType: "text" | "ref";
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

    if (session.mode !== "backend") {
      applyIncomingMessage(optimisticMessage);
      setStatusText("消息已发送，并写入本地加密缓存。");
      return;
    }

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
      setStatusText(input.messageType === "image" ? "图片消息已通过 WebSocket 发出。" : "消息已通过 WebSocket 发出。");
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

  function handleLock() {
    closeWebSocket();
    setScreen("disguise");
    setPinInput("");
    setStatusText("已返回伪装入口。");
  }

  function closeWebSocket() {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }

  async function finishAuthentication(input: { user: LocalUser; tokens: HiddenSession["tokens"] }) {
    setSession((prev) => ({
      user: input.user,
      tokens: input.tokens,
      pin: prev?.pin,
      pinHash: prev?.pinHash ?? "",
      mode: "backend"
    }));

    const nextContacts = await listContacts();
    const nextConversations = await listConversations();
    const historyEntries = await Promise.all(
      nextConversations.map(async (conversation) => [conversation.conversationId, await listMessageHistory(conversation.conversationId)] as const)
    );

    setContacts(sortContacts(nextContacts));
    setConversations(sortConversations(nextConversations));
    setMessages(Object.fromEntries(historyEntries));
    setActiveConversationId(nextConversations[0]?.conversationId ?? "");
  }

  return (
    <main className="shell">
      <section className="hero">
        <div className="hero__badge">HideChat Privacy Workspace</div>
        <h1>{config?.siteTitle ?? "今日运势"}</h1>
        <p>
          伪装入口、PIN 解锁、联系人、会话、文本消息和 WebSocket 实时收消息都在这一页闭合。
          后端不可用时会自动回退到本地演示模式。
        </p>
      </section>

      {screen === "disguise" && (
        <section className="panel panel--fortune">
          <div className="fortune-card">
            <span className="fortune-card__tag">伪装入口</span>
            <h2>{fortune?.title ?? "今日运势"}</h2>
            <p className="fortune-card__summary">{fortune?.summary ?? "正在整理今日运势..."}</p>
            <div className="fortune-grid">
              <div>
                <span>幸运色</span>
                <strong>{fortune?.luckyColor ?? "蓝色"}</strong>
              </div>
              <div>
                <span>幸运方位</span>
                <strong>{fortune?.luckyDirection ?? "东南"}</strong>
              </div>
              <div className="fortune-grid__wide">
                <span>建议</span>
                <strong>{fortune?.advice ?? "在重要对话中保持耐心。"}</strong>
              </div>
            </div>
          </div>

          <div className="entry-card">
            <label htmlFor="lucky-code">幸运数字</label>
            <input
              id="lucky-code"
              value={luckyCodeInput}
              onChange={(event) => setLuckyCodeInput(event.target.value)}
              placeholder="输入幸运数字"
            />
            <button type="button" onClick={() => void handleLuckyCodeSubmit()}>
              进入隐藏入口
            </button>
          </div>
        </section>
      )}

      {screen === "auth" && (
        <section className="panel panel--auth">
          <div className="auth-card">
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
            </div>

            <div className="fields">
              <input
                value={authForm.email}
                onChange={(event) => setAuthForm((prev) => ({ ...prev, email: event.target.value }))}
                placeholder="邮箱"
              />
              <input
                value={authForm.nickname}
                onChange={(event) => setAuthForm((prev) => ({ ...prev, nickname: event.target.value }))}
                placeholder="昵称"
              />
              <input
                type="password"
                value={authForm.password}
                onChange={(event) => setAuthForm((prev) => ({ ...prev, password: event.target.value }))}
                placeholder="密码"
              />
              {authMode === "register" && (
                <input
                  value={authForm.emailCode}
                  onChange={(event) => setAuthForm((prev) => ({ ...prev, emailCode: event.target.value }))}
                  placeholder="邮箱验证码"
                />
              )}
            </div>

            {authMode === "register" && (
              <button type="button" onClick={() => void handleSendCode()} disabled={sendCodeLoading}>
                {sendCodeLoading ? "发送中..." : "发送验证码"}
              </button>
            )}

            <button type="button" onClick={() => void handleAuthSubmit()} disabled={authLoading}>
              {authLoading ? "处理中..." : authMode === "login" ? "使用当前信息进入" : "注册并进入"}
            </button>
          </div>

          <div className="pin-card">
            <label htmlFor="pin-input">PIN 解锁</label>
            <input
              id="pin-input"
              type="password"
              value={pinInput}
              onChange={(event) => setPinInput(event.target.value)}
              placeholder={session?.pinHash ? "输入已有 PIN" : "设置一个新的 PIN"}
            />
            <button
              type="button"
              onClick={() => void (session?.pinHash ? handlePinContinue() : handleSetPinAndEnter())}
            >
              {session?.pinHash ? "解锁消息缓存" : "设置 PIN 并继续"}
            </button>
          </div>
        </section>
      )}

      {screen === "chat" && session && (
        <section className="workspace">
          <aside className="sidebar">
            {session.mode === "backend" && (
              <div className="sidebar__section">
                <span className="sidebar__title">新增联系人</span>
                <input
                  value={contactForm.peerUid}
                  onChange={(event) => setContactForm((prev) => ({ ...prev, peerUid: event.target.value }))}
                  placeholder="联系人 UID"
                />
                <input
                  value={contactForm.remarkName}
                  onChange={(event) => setContactForm((prev) => ({ ...prev, remarkName: event.target.value }))}
                  placeholder="备注名（可选）"
                />
                <button type="button" onClick={() => void handleAddContact()}>
                  添加联系人
                </button>
              </div>
            )}

            <div className="sidebar__section">
              <span className="sidebar__title">联系人</span>
              {contacts.length === 0 && <span className="list-empty">暂无联系人</span>}
              {contacts.map((contact) => (
                <button
                  key={contact.peerUid}
                  className={contact.peerUid === activeConversation?.peerUid ? "list-item is-active" : "list-item"}
                  type="button"
                  onClick={() => {
                    const nextConversation = conversations.find((item) => item.peerUid === contact.peerUid);
                    if (nextConversation) {
                      setActiveConversationId(nextConversation.conversationId);
                    }
                  }}
                >
                  <strong>{contact.remarkName || contact.peerNickname}</strong>
                  <span>{contact.peerUid}</span>
                </button>
              ))}
            </div>

            <div className="sidebar__section">
              <span className="sidebar__title">会话</span>
              {conversations.length === 0 && <span className="list-empty">暂无会话</span>}
              {conversations.map((conversation) => (
                <button
                  key={conversation.conversationId}
                  className={conversation.conversationId === activeConversation?.conversationId ? "list-item is-active" : "list-item"}
                  type="button"
                  onClick={() => setActiveConversationId(conversation.conversationId)}
                >
                  <strong>{conversation.remarkName || conversation.peerNickname}</strong>
                  <span>{conversation.lastMessagePreview || "暂无消息"}</span>
                </button>
              ))}
            </div>
          </aside>

          <section className="chat-panel">
            <header className="chat-panel__header">
              <div>
                <span className="chat-panel__eyebrow">{session.mode === "backend" ? "真实会话" : "隐藏会话"}</span>
                <h2>{activeConversation?.remarkName || activeConversation?.peerNickname || "选择一个会话"}</h2>
              </div>
              <div>
                <button type="button" onClick={handleLock}>
                  返回伪装页
                </button>
                {session.mode === "backend" && (
                  <button
                    type="button"
                    onClick={() => {
                      clearStoredAuthState();
                      setSession(null);
                      setScreen("disguise");
                      setStatusText("已退出当前账号。");
                    }}
                  >
                    退出账号
                  </button>
                )}
              </div>
            </header>

            <div className="message-list">
              {currentMessages.map((message) => (
                <article
                  key={message.messageId}
                  className={message.senderUid === session.user.userUid ? "message message--self" : "message"}
                >
                  <span>{message.senderUid === session.user.userUid ? "我" : activeConversation?.remarkName || "对方"}</span>
                  {renderMessageBody(message)}
                </article>
              ))}
              {activeConversation && currentMessages.length === 0 && <article className="message">暂无消息</article>}
            </div>

            <footer className="composer">
              <textarea
                value={composer}
                onChange={(event) => setComposer(event.target.value)}
                placeholder="输入加密前的原始消息文本"
                disabled={!activeConversation}
              />
              <label className="composer__file">
                <input
                  type="file"
                  accept="image/*"
                  disabled={!activeConversation || uploadingFile}
                  onChange={(event) => {
                    const selected = event.target.files?.[0] ?? null;
                    event.currentTarget.value = "";
                    void handleFileSelected(selected);
                  }}
                />
                {uploadingFile ? "上传中..." : "发送图片"}
              </label>
              <button type="button" onClick={() => void handleSendMessage()} disabled={!activeConversation}>
                发送
              </button>
            </footer>
          </section>
        </section>
      )}

      <section className="status-bar">
        <strong>状态</strong>
        <span>{statusText}</span>
      </section>
    </main>
  );

  function resolvePeerUid(message: ChatMessage): string {
    return message.senderUid === session?.user.userUid ? message.receiverUid : message.senderUid;
  }

  function renderMessageBody(message: ChatMessage) {
    if (message.messageType !== "image") {
      return <p>{extractTextPayload(message.payload)}</p>;
    }

    const imagePayload = parseImagePayload(message.payload);
    if (!imagePayload?.accessUrl) {
      return <p>[图片消息]</p>;
    }

    return (
      <figure className="message__image">
        <img src={imagePayload.accessUrl} alt={imagePayload.fileName || "图片消息"} loading="lazy" />
        <figcaption>{imagePayload.fileName || "图片消息"}</figcaption>
      </figure>
    );
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

function sortConversations(items: ConversationItem[]): ConversationItem[] {
  return [...items].sort((left, right) => (right.lastMessageAt ?? 0) - (left.lastMessageAt ?? 0));
}

function buildDemoUser(nickname: string, email: string): LocalUser {
  return {
    userUid: "u_frontend_demo",
    nickname: nickname || "Reader",
    email: email || "demo@hide.chat"
  };
}

function buildImagePayload(file: FileInfo): string {
  return JSON.stringify({
    fileId: file.fileId,
    fileName: file.fileName,
    mimeType: file.mimeType,
    fileSize: file.fileSize,
    accessUrl: file.accessUrl
  });
}

function parseImagePayload(payload: string): { fileName?: string; accessUrl?: string } | null {
  try {
    const parsed = JSON.parse(payload) as { fileName?: string; accessUrl?: string };
    return parsed;
  } catch {
    return null;
  }
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
