import { useCallback, useEffect, useRef } from "react";
import { AuthView } from "../components/chat/AuthView";
import { ChatShell } from "../components/chat/ChatShell";
import {
  addContact,
  clearStoredAuthState,
  createSingleConversation,
  fetchCurrentUser,
  listContacts,
  listConversations,
  listRecentContacts,
  listMessageHistory,
  loginByEmailCode,
  loginByPassword,
  logout,
  registerByEmail,
  resetPassword,
  searchUsers,
  sendEmailCode,
  sendMessage,
  uploadFile
} from "../api/client";
import { useAuthBootstrap } from "../hooks/useAuthBootstrap";
import { useChatRealtime } from "../hooks/useChatRealtime";
import { useChatState, type ChatView, type MobilePage } from "../hooks/useChatState";
import { useViewport } from "../hooks/useViewport";
import { DisguiseEntryPage } from "../pages/disguise/DisguiseEntryPage";
import { clearCachedConversations } from "../storage";
import type { ChatMessage, ConversationItem, HiddenSession, LocalUser } from "../types";
import {
  buildFilePayload,
  buildMessagePreview,
  createMessage,
  extractTextPayload,
  formatConversationDivider,
  formatFileSubtitle,
  formatMessageTime,
  formatRecentAdded,
  getAvatarLabel,
  getConversationTitle,
  getMaskedConversationPreview,
  normalizeIncomingMessage,
  parseFilePayload,
  removeMessage,
  resolveFileMessageType,
  resolvePeerUid,
  sortContacts,
  sortConversations,
  sortRecentContacts
} from "../utils";
import "./app.css";

const MOBILE_VIEWPORT_QUERY = "(max-width: 900px)";

function getDefaultChatView(hasConversation: boolean): ChatView {
  return hasConversation ? "conversation" : "list";
}

function resolvePostUnlockMobilePage(): MobilePage {
  return { name: "chat_list" };
}

export function App() {
  const isMobileViewport = useViewport(MOBILE_VIEWPORT_QUERY);
  const {
    screen,
    setScreen,
    publicView,
    setPublicView,
    chatView,
    setChatView,
    mobilePage,
    setMobilePage,
    authMode,
    setAuthMode,
    loginMethod,
    setLoginMethod,
    session,
    setSession,
    contacts,
    setContacts,
    recentContacts,
    setRecentContacts,
    conversations,
    setConversations,
    messages,
    setMessages,
    activeConversationId,
    setActiveConversationId,
    composer,
    setComposer,
    statusText,
    setStatusText,
    authLoading,
    setAuthLoading,
    sendCodeLoading,
    setSendCodeLoading,
    searchingUsers,
    setSearchingUsers,
    uploadingFile,
    setUploadingFile,
    contactForm,
    setContactForm,
    chatSearchQuery,
    setChatSearchQuery,
    friendSearchQuery,
    setFriendSearchQuery,
    userSearchResults,
    setUserSearchResults,
    authForm,
    setAuthForm,
    activeConversation,
    currentMessages,
    isDesktopConversationView,
    isMobileConversationView,
    filteredConversations,
    selectedContact,
    visibleDesktopMessages,
    hydrateMessages
  } = useChatState({
    isMobileViewport,
    getDefaultChatView,
    resolvePostUnlockMobilePage
  });

  const conversationsRef = useRef(conversations);

  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

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
      if (isMobileViewport) {
        setMobilePage({ name: "chat_detail", conversationId: conversation.conversationId });
      } else {
        setChatView("conversation");
      }
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
    if (
      sendRealtimePayload({
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
    ) {
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
          item.peerUid === resolvePeerUid(message, session?.user.userUid)
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

  async function refreshConversationList(): Promise<ConversationItem[]> {
    try {
      const latestConversations = sortConversations(await listConversations());
      setConversations(latestConversations);
      return latestConversations;
    } catch {
      return conversationsRef.current;
    }
  }

  function handleReturnToDisguise() {
    closeRealtimeConnection();
    setComposer("");
    setScreen("disguise");
    setPublicView("lucky");
    setChatView("list");
    setMobilePage(resolvePostUnlockMobilePage());
    setStatusText("已返回伪装入口。");
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

    closeRealtimeConnection();
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
    setMobilePage(resolvePostUnlockMobilePage());
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
    const nextMessages = await hydrateMessages(nextConversations, listMessageHistory);
    const defaultConversationId = nextConversations[0]?.conversationId ?? "";

    setContacts(sortContacts(nextContacts));
    setRecentContacts(sortRecentContacts(nextRecentContacts));
    setConversations(nextConversations);
    setMessages(nextMessages);
    setActiveConversationId(isMobileViewport ? "" : defaultConversationId);
    if (enterChat) {
      setScreen("chat");
      if (isMobileViewport) {
        setMobilePage(resolvePostUnlockMobilePage());
        setChatView("list");
      } else {
        setChatView(getDefaultChatView(Boolean(defaultConversationId)));
      }
    }
  }

  const hydrateStoredSession = useCallback(
    async (user: LocalUser, tokens: NonNullable<HiddenSession["tokens"]>) => {
      await hydrateAuthenticatedState(user, tokens, false);
    },
    [isMobileViewport]
  );

  useAuthBootstrap({
    onAuthenticated: hydrateStoredSession,
    onStatusChange: setStatusText
  });

  const { closeWebSocket: closeRealtimeConnection, sendRealtimePayload } = useChatRealtime({
    screen,
    session,
    activeConversationId,
    activeConversation,
    currentMessages,
    isDesktopConversationView,
    isMobileConversationView,
    onStatusChange: setStatusText,
    onReceiveMessage: handleIncomingRealtimeMessage,
    onAck: reconcileAck,
    onReadReceipt: applyReadReceipt,
    normalizeIncomingMessage
  });

  function openConversation(conversationId: string) {
    setActiveConversationId(conversationId);
    if (isMobileViewport) {
      setMobilePage({ name: "chat_detail", conversationId });
    } else {
      setChatView("conversation");
    }
  }

  function showMobileChatList() {
    setMobilePage({ name: "chat_list" });
    if (!isMobileViewport) {
      setChatView("list");
    }
  }

  function showFriendsPage() {
    if (isMobileViewport) {
      setMobilePage({ name: "friends" });
      return;
    }
    setChatView("add-friend");
  }

  function showFortunePage() {
    if (isMobileViewport && screen === "chat") {
      setMobilePage({ name: "fortune" });
      return;
    }
    setPublicView("fortune");
    setScreen("disguise");
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

  function handleMobileFortuneVerified() {
    setMobilePage(resolvePostUnlockMobilePage());
    setStatusText("幸运数字校验通过，已返回最近会话页。");
  }

  function getMobileNavSection(): "chat" | "friends" | "fortune" {
    if (mobilePage.name === "friends") {
      return "friends";
    }
    if (mobilePage.name === "fortune") {
      return "fortune";
    }
    return "chat";
  }

  return (
    <main className={screen === "chat" ? "app-root app-root--chat" : "app-root"}>
      {screen === "disguise" && renderPublicView()}
      {screen === "auth" && renderAuthView()}
      {screen === "chat" && session && renderChatShell()}
      <div className="status-strip" role="status" aria-live="polite">
        {statusText}
      </div>
    </main>
  );

  function renderPublicView() {
    return (
      <DisguiseEntryPage
        onLuckyNumberVerified={() => {
          if (session?.tokens?.accessToken) {
            setScreen("chat");
            if (isMobileViewport) {
              setMobilePage(resolvePostUnlockMobilePage());
              setChatView("list");
            } else {
              const nextConversationId = activeConversationId || conversations[0]?.conversationId || "";
              setActiveConversationId(nextConversationId);
              setChatView(getDefaultChatView(Boolean(nextConversationId)));
            }
          } else {
            setScreen("auth");
          }
        }}
        initialView={publicView}
      />
    );
  }

  function renderAuthView() {
    return (
      <AuthView
        authMode={authMode}
        loginMethod={loginMethod}
        authForm={authForm}
        authLoading={authLoading}
        sendCodeLoading={sendCodeLoading}
        onBackToDisguise={() => setScreen("disguise")}
        onAuthModeChange={setAuthMode}
        onLoginMethodChange={setLoginMethod}
        onAuthFormChange={setAuthForm}
        onSendCode={() => void handleSendCode()}
        onSubmit={() => void handleAuthSubmit()}
      />
    );
  }

  function renderChatShell() {
    if (!session) {
      return null;
    }

    return (
      <ChatShell
        isMobileViewport={isMobileViewport}
        session={session}
        chatView={chatView}
        mobilePage={mobilePage}
        conversations={conversations}
        filteredConversations={filteredConversations}
        messages={messages}
        currentMessages={currentMessages}
        visibleDesktopMessages={visibleDesktopMessages}
        activeConversation={activeConversation}
        activeConversationId={activeConversationId}
        selectedContact={selectedContact}
        composer={composer}
        uploadingFile={uploadingFile}
        chatSearchQuery={chatSearchQuery}
        friendSearchQuery={friendSearchQuery}
        remarkName={contactForm.remarkName}
        searchingUsers={searchingUsers}
        userSearchResults={userSearchResults}
        recentContacts={recentContacts}
        getMobileNavSection={getMobileNavSection}
        onShowChatList={showMobileChatList}
        onShowFriendsPage={showFriendsPage}
        onShowFortunePage={showFortunePage}
        onOpenConversation={openConversation}
        onChatSearchQueryChange={setChatSearchQuery}
        onFriendSearchQueryChange={setFriendSearchQuery}
        onRemarkNameChange={(value) => setContactForm((prev) => ({ ...prev, remarkName: value }))}
        onFriendSearch={() => void handleFriendSearch()}
        onAddContact={(peerUid) => void handleAddContact(peerUid)}
        onComposerChange={setComposer}
        onSendMessage={() => void handleSendMessage()}
        onFileSelected={(file) => void handleFileSelected(file)}
        onReturnToDisguise={handleReturnToDisguise}
        onLogout={() => void handleLogout()}
        onEnterConversation={() => {
          if (activeConversation) {
            setChatView("conversation");
          }
        }}
        onBackToChat={() => setChatView("list")}
        onFortuneVerified={handleMobileFortuneVerified}
        renderMessageBody={renderMessageBody}
        getAvatarLabel={getAvatarLabel}
        getConversationTitle={getConversationTitle}
        getConversationPreview={(conversation) => getMaskedConversationPreview(conversation, messages)}
        formatMessageTime={formatMessageTime}
        formatConversationDivider={formatConversationDivider}
        formatRecentAdded={formatRecentAdded}
      />
    );
  }

  function renderMessageRow(message: ChatMessage) {
    if (!session) {
      return null;
    }
    const isSelf = message.senderUid === session.user.userUid;
    const avatarName = activeConversation ? getConversationTitle(activeConversation) : "对方";
    return (
      <div key={message.messageId} className={isSelf ? "msg self" : "msg other"}>
        {!isSelf && <div className="avatar small">{getAvatarLabel(avatarName)}</div>}
        {renderMessageBody(message, isSelf)}
      </div>
    );
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

}
