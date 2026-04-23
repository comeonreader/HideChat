import { useEffect, useMemo, useRef, useState } from "react";
import { listCachedConversations, saveCachedConversation } from "../storage";
import type {
  ChatMessage,
  ContactItem,
  ConversationItem,
  HiddenSession,
  LocalUser,
  RecentContactItem,
  UserSearchItem
} from "../types";
import { matchesMessageSearch } from "../utils";

type Screen = "disguise" | "auth" | "chat";
type PublicView = "lucky" | "fortune";
type AuthMode = "login" | "register" | "reset";
type LoginMethod = "password" | "code";
type ChatView = "list" | "conversation" | "add-friend";
type MobilePage =
  | { name: "chat_list" }
  | { name: "chat_detail"; conversationId: string }
  | { name: "friends" }
  | { name: "fortune" };

interface AuthFormState {
  email: string;
  nickname: string;
  password: string;
  newPassword: string;
  emailCode: string;
}

interface UseChatStateOptions {
  isMobileViewport: boolean;
  getDefaultChatView: (hasConversation: boolean) => ChatView;
  resolvePostUnlockMobilePage: () => MobilePage;
}

export function useChatState({ isMobileViewport, getDefaultChatView, resolvePostUnlockMobilePage }: UseChatStateOptions) {
  const [screen, setScreen] = useState<Screen>("disguise");
  const [publicView, setPublicView] = useState<PublicView>("lucky");
  const [chatView, setChatView] = useState<ChatView>("list");
  const [mobilePage, setMobilePage] = useState<MobilePage>(resolvePostUnlockMobilePage);
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [loginMethod, setLoginMethod] = useState<LoginMethod>("password");
  const [session, setSession] = useState<HiddenSession | null>(null);
  const [contacts, setContacts] = useState<ContactItem[]>([]);
  const [recentContacts, setRecentContacts] = useState<RecentContactItem[]>([]);
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({});
  const [activeConversationId, setActiveConversationId] = useState("");
  const [composer, setComposer] = useState("");
  const [statusText, setStatusText] = useState("");
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

  const previousViewportRef = useRef(isMobileViewport);

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
    if (screen !== "chat" || previousViewportRef.current === isMobileViewport) {
      return;
    }

    previousViewportRef.current = isMobileViewport;
    if (isMobileViewport) {
      if (chatView === "add-friend") {
        setMobilePage({ name: "friends" });
        return;
      }
      setMobilePage(resolvePostUnlockMobilePage());
      return;
    }

    if (mobilePage.name === "friends") {
      setChatView("add-friend");
      return;
    }
    if (mobilePage.name === "chat_detail" && activeConversationId) {
      setChatView("conversation");
      return;
    }
    setChatView("list");
  }, [activeConversationId, chatView, isMobileViewport, mobilePage, resolvePostUnlockMobilePage, screen]);

  useEffect(() => {
    if (!activeConversationId) {
      return;
    }
    const exists = conversations.some((item) => item.conversationId === activeConversationId);
    if (exists) {
      return;
    }
    setActiveConversationId("");
    if (isMobileViewport && mobilePage.name === "chat_detail") {
      setMobilePage(resolvePostUnlockMobilePage());
    }
    if (!isMobileViewport && chatView === "conversation") {
      setChatView("list");
    }
  }, [activeConversationId, chatView, conversations, isMobileViewport, mobilePage, resolvePostUnlockMobilePage]);

  const activeConversation = useMemo(
    () => conversations.find((item) => item.conversationId === activeConversationId) ?? null,
    [activeConversationId, conversations]
  );
  const currentMessages = activeConversationId ? messages[activeConversationId] ?? [] : [];
  const isDesktopConversationView = !isMobileViewport && chatView !== "add-friend" && Boolean(activeConversation);
  const isMobileConversationView =
    isMobileViewport &&
    mobilePage.name === "chat_detail" &&
    activeConversationId === mobilePage.conversationId &&
    Boolean(activeConversation);
  const filteredConversations = useMemo(
    () =>
      conversations.filter((conversation) => {
        if (!isMobileViewport && chatView === "conversation") {
          return true;
        }
        if (!chatSearchQuery.trim()) {
          return true;
        }
        const keyword = chatSearchQuery.trim().toLowerCase();
        return [conversation.remarkName, conversation.peerNickname, conversation.peerUid].some((value) =>
          (value ?? "").toLowerCase().includes(keyword)
        );
      }),
    [chatSearchQuery, chatView, conversations, isMobileViewport]
  );
  const selectedContact = useMemo(
    () =>
      contacts.find((contact) => contact.peerUid === activeConversation?.peerUid) ??
      (activeConversation
        ? {
            peerUid: activeConversation.peerUid,
            peerNickname: activeConversation.peerNickname ?? activeConversation.remarkName,
            remarkName: activeConversation.remarkName,
            lastMessageAt: activeConversation.lastMessageAt
          }
        : null),
    [activeConversation, contacts]
  );
  const visibleDesktopMessages = useMemo(
    () =>
      isDesktopConversationView && chatSearchQuery.trim()
        ? currentMessages.filter((message) => matchesMessageSearch(message, chatSearchQuery))
        : currentMessages,
    [chatSearchQuery, currentMessages, isDesktopConversationView]
  );

  async function hydrateMessages(nextConversations: ConversationItem[], listMessageHistory: (conversationId: string) => Promise<ChatMessage[]>) {
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

  return {
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
  };
}

export type { AuthFormState, AuthMode, ChatView, LoginMethod, MobilePage, PublicView, Screen };
