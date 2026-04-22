import type { RecentContactItem, UserSearchItem } from "../../types";

interface DesktopAddFriendPageProps {
  friendSearchQuery: string;
  remarkName: string;
  searchingUsers: boolean;
  userSearchResults: UserSearchItem[];
  recentContacts: RecentContactItem[];
  onBackToChat: () => void;
  onFriendSearchQueryChange: (value: string) => void;
  onRemarkNameChange: (value: string) => void;
  onFriendSearch: () => void;
  onAddContact: (peerUid: string) => void;
  getAvatarLabel: (value: string) => string;
  formatRecentAdded: (timestamp: number) => string;
}

export function DesktopAddFriendPage({
  friendSearchQuery,
  remarkName,
  searchingUsers,
  userSearchResults,
  recentContacts,
  onBackToChat,
  onFriendSearchQueryChange,
  onRemarkNameChange,
  onFriendSearch,
  onAddContact,
  getAvatarLabel,
  formatRecentAdded
}: DesktopAddFriendPageProps) {
  return (
    <main className="main-panel search-page-wrap">
      <div className="page search-page">
        <div className="topbar">
          <div>
            <div className="title">搜索 / 添加好友</div>
            <div className="muted">支持昵称、用户 ID 搜索</div>
          </div>
          <button className="btn ghost" type="button" onClick={onBackToChat}>
            返回聊天
          </button>
        </div>

        <div className="search-layout">
          <section className="card result-card">
            <div className="search-box search-box-action">
              <span>🔎</span>
              <input value={friendSearchQuery} onChange={(event) => onFriendSearchQueryChange(event.target.value)} placeholder="输入昵称或用户 ID" />
              <button className="btn btn-brand" type="button" onClick={onFriendSearch} disabled={searchingUsers}>
                {searchingUsers ? "搜索中..." : "搜索"}
              </button>
            </div>

            <div className="inline-fields">
              <input value={remarkName} onChange={(event) => onRemarkNameChange(event.target.value)} placeholder="备注名（可选）" />
            </div>

            <div className="section-title">搜索结果</div>

            {userSearchResults.length > 0 ? (
              userSearchResults.map((result) => (
                <div key={result.userUid} className="user-row">
                  <div className="avatar">{getAvatarLabel(result.nickname || result.displayUserId)}</div>
                  <div className="user-meta">
                    <div className="name">{remarkName || result.nickname || result.displayUserId}</div>
                    <div className="preview">ID: {result.displayUserId}</div>
                  </div>
                  <button
                    className={result.alreadyAdded ? "btn ghost" : "btn btn-brand"}
                    type="button"
                    disabled={result.alreadyAdded}
                    onClick={() => onAddContact(result.userUid)}
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
