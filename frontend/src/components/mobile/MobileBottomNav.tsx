interface MobileBottomNavProps {
  activeSection: "chat" | "friends" | "fortune";
  onShowChatList: () => void;
  onShowFriends: () => void;
  onShowFortune: () => void;
}

export function MobileBottomNav({
  activeSection,
  onShowChatList,
  onShowFriends,
  onShowFortune
}: MobileBottomNavProps) {
  return (
    <nav className="mobile-nav mobile-nav--fixed" aria-label="手机端底部导航">
      <button type="button" className={activeSection === "chat" ? "is-active" : ""} onClick={onShowChatList}>
        💬
        <span>聊天</span>
      </button>
      <button type="button" className={activeSection === "friends" ? "is-active" : ""} onClick={onShowFriends}>
        👤
        <span>好友</span>
      </button>
      <button type="button" className={activeSection === "fortune" ? "is-active" : ""} onClick={onShowFortune}>
        ✨
        <span>运势</span>
      </button>
    </nav>
  );
}
