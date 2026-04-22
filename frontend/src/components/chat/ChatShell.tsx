import type { ReactNode } from "react";
import { MobileBottomNav } from "../mobile/MobileBottomNav";
import { MobileConversationDetailPage } from "../../pages/mobile/MobileConversationDetailPage";
import { MobileConversationListPage } from "../../pages/mobile/MobileConversationListPage";
import { MobileFortunePage } from "../../pages/mobile/MobileFortunePage";
import { MobileFriendsPage } from "../../pages/mobile/MobileFriendsPage";
import type { ChatMessage, ContactItem, ConversationItem, HiddenSession, RecentContactItem, UserSearchItem } from "../../types";
import { DesktopAddFriendPage } from "./DesktopAddFriendPage";
import { DesktopChatListPage } from "./DesktopChatListPage";
import { DesktopConversationPage } from "./DesktopConversationPage";
import { DesktopSidebar } from "./DesktopSidebar";

type ChatView = "list" | "conversation" | "add-friend";
type MobilePage =
  | { name: "chat_list" }
  | { name: "chat_detail"; conversationId: string }
  | { name: "friends" }
  | { name: "fortune" };

interface ChatShellProps {
  isMobileViewport: boolean;
  session: HiddenSession;
  chatView: ChatView;
  mobilePage: MobilePage;
  conversations: ConversationItem[];
  filteredConversations: ConversationItem[];
  messages: Record<string, ChatMessage[]>;
  currentMessages: ChatMessage[];
  visibleDesktopMessages: ChatMessage[];
  activeConversation: ConversationItem | null;
  activeConversationId: string;
  selectedContact: ContactItem | null;
  composer: string;
  uploadingFile: boolean;
  chatSearchQuery: string;
  friendSearchQuery: string;
  remarkName: string;
  searchingUsers: boolean;
  userSearchResults: UserSearchItem[];
  recentContacts: RecentContactItem[];
  getMobileNavSection: () => "chat" | "friends" | "fortune";
  onShowChatList: () => void;
  onShowFriendsPage: () => void;
  onShowFortunePage: () => void;
  onOpenConversation: (conversationId: string) => void;
  onChatSearchQueryChange: (value: string) => void;
  onFriendSearchQueryChange: (value: string) => void;
  onRemarkNameChange: (value: string) => void;
  onFriendSearch: () => void;
  onAddContact: (peerUid?: string) => void;
  onComposerChange: (value: string) => void;
  onSendMessage: () => void;
  onFileSelected: (file: File | null) => void;
  onReturnToDisguise: () => void;
  onLogout: () => void;
  onEnterConversation: () => void;
  onBackToChat: () => void;
  onFortuneVerified: () => void;
  renderMessageBody: (message: ChatMessage, isSelf: boolean) => ReactNode;
  getAvatarLabel: (value: string) => string;
  getConversationTitle: (conversation: ConversationItem) => string;
  getConversationPreview: (conversation: ConversationItem) => string;
  formatMessageTime: (timestamp: number) => string;
  formatConversationDivider: (timestamp: number) => string;
  formatRecentAdded: (timestamp: number) => string;
}

export function ChatShell(props: ChatShellProps) {
  if (props.isMobileViewport) {
    return (
      <div className="chat-page chat-page--mobile">
        <div className="mobile-chat-shell">{renderMobilePage(props)}</div>
        <MobileBottomNav
          activeSection={props.getMobileNavSection()}
          onShowChatList={props.onShowChatList}
          onShowFriends={props.onShowFriendsPage}
          onShowFortune={props.onShowFortunePage}
        />
      </div>
    );
  }

  const isConversationView = props.chatView === "conversation" && Boolean(props.activeConversation);
  return (
    <div className={isConversationView ? "chat-page" : ""}>
      <div className={isConversationView ? "chat-shell" : "wechat-layout"}>
        <DesktopSidebar
          inConversationLayout={isConversationView}
          chatSearchQuery={props.chatSearchQuery}
          filteredConversations={props.filteredConversations}
          activeConversationId={props.activeConversationId}
          onChatSearchQueryChange={props.onChatSearchQueryChange}
          onShowFriendsPage={props.onShowFriendsPage}
          onOpenConversation={props.onOpenConversation}
          getAvatarLabel={props.getAvatarLabel}
          getConversationTitle={props.getConversationTitle}
          getConversationPreview={props.getConversationPreview}
          formatMessageTime={props.formatMessageTime}
        />
        {props.chatView === "add-friend" ? (
          <DesktopAddFriendPage
            friendSearchQuery={props.friendSearchQuery}
            remarkName={props.remarkName}
            searchingUsers={props.searchingUsers}
            userSearchResults={props.userSearchResults}
            recentContacts={props.recentContacts}
            onBackToChat={props.onBackToChat}
            onFriendSearchQueryChange={props.onFriendSearchQueryChange}
            onRemarkNameChange={props.onRemarkNameChange}
            onFriendSearch={props.onFriendSearch}
            onAddContact={(peerUid) => props.onAddContact(peerUid)}
            getAvatarLabel={props.getAvatarLabel}
            formatRecentAdded={props.formatRecentAdded}
          />
        ) : isConversationView ? (
          <DesktopConversationPage
            sessionUserUid={props.session.user.userUid}
            activeConversation={props.activeConversation}
            currentMessages={props.currentMessages}
            visibleDesktopMessages={props.visibleDesktopMessages}
            composer={props.composer}
            uploadingFile={props.uploadingFile}
            onComposerChange={props.onComposerChange}
            onFileSelected={props.onFileSelected}
            onSendMessage={props.onSendMessage}
            onReturnToDisguise={props.onReturnToDisguise}
            onLogout={props.onLogout}
            renderMessageBody={props.renderMessageBody}
            getAvatarLabel={props.getAvatarLabel}
            getConversationTitle={props.getConversationTitle}
            formatConversationDivider={props.formatConversationDivider}
          />
        ) : (
          <DesktopChatListPage
            activeConversation={props.activeConversation}
            selectedContact={props.selectedContact}
            onEnterConversation={props.onEnterConversation}
          />
        )}
      </div>
    </div>
  );
}

function renderMobilePage(props: ChatShellProps) {
  const { mobilePage } = props;

  switch (mobilePage.name) {
    case "chat_list":
      return (
        <MobileConversationListPage
          conversations={props.filteredConversations}
          activeConversationId={props.activeConversationId}
          chatSearchQuery={props.chatSearchQuery}
          onChatSearchQueryChange={props.onChatSearchQueryChange}
          onOpenConversation={props.onOpenConversation}
          onShowFriendsPage={props.onShowFriendsPage}
          getAvatarLabel={props.getAvatarLabel}
          getConversationTitle={props.getConversationTitle}
          getConversationPreview={props.getConversationPreview}
          formatMessageTime={props.formatMessageTime}
        />
      );
    case "chat_detail":
      return (
        <MobileConversationDetailPage
          conversation={props.conversations.find((item) => item.conversationId === mobilePage.conversationId) ?? null}
          messages={props.messages[mobilePage.conversationId] ?? []}
          sessionUserUid={props.session.user.userUid}
          composer={props.composer}
          uploadingFile={props.uploadingFile}
          onComposerChange={props.onComposerChange}
          onSendMessage={props.onSendMessage}
          onFileSelected={props.onFileSelected}
          onBack={props.onShowChatList}
          onLogout={props.onLogout}
          renderMessageBody={props.renderMessageBody}
          getAvatarLabel={props.getAvatarLabel}
          getConversationTitle={props.getConversationTitle}
          formatConversationDivider={props.formatConversationDivider}
        />
      );
    case "friends":
      return (
        <MobileFriendsPage
          friendSearchQuery={props.friendSearchQuery}
          remarkName={props.remarkName}
          searchingUsers={props.searchingUsers}
          userSearchResults={props.userSearchResults}
          recentContacts={props.recentContacts}
          onFriendSearchQueryChange={props.onFriendSearchQueryChange}
          onRemarkNameChange={props.onRemarkNameChange}
          onFriendSearch={props.onFriendSearch}
          onAddContact={(peerUid) => props.onAddContact(peerUid)}
          getAvatarLabel={props.getAvatarLabel}
          formatRecentAdded={props.formatRecentAdded}
        />
      );
    case "fortune":
      return <MobileFortunePage onLuckyNumberVerified={props.onFortuneVerified} />;
    default:
      return null;
  }
}
