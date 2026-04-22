type AuthMode = "login" | "register" | "reset";
type LoginMethod = "password" | "code";

interface AuthFormState {
  email: string;
  nickname: string;
  password: string;
  newPassword: string;
  emailCode: string;
}

interface AuthViewProps {
  authMode: AuthMode;
  loginMethod: LoginMethod;
  authForm: AuthFormState;
  authLoading: boolean;
  sendCodeLoading: boolean;
  onBackToDisguise: () => void;
  onAuthModeChange: (mode: AuthMode) => void;
  onLoginMethodChange: (method: LoginMethod) => void;
  onAuthFormChange: (updater: (prev: AuthFormState) => AuthFormState) => void;
  onSendCode: () => void;
  onSubmit: () => void;
}

export function AuthView({
  authMode,
  loginMethod,
  authForm,
  authLoading,
  sendCodeLoading,
  onBackToDisguise,
  onAuthModeChange,
  onLoginMethodChange,
  onAuthFormChange,
  onSendCode,
  onSubmit
}: AuthViewProps) {
  return (
    <div className="page auth-page">
      <div className="topbar">
        <div>
          <div className="title">隐藏入口验证</div>
          <div className="muted">完成账号登录后直接进入聊天。</div>
        </div>
        <button className="btn ghost" type="button" onClick={onBackToDisguise}>
          返回运势页
        </button>
      </div>

      <div className="auth-layout auth-layout--single">
        <section className="card result-card auth-card-panel">
          <div className="tabs">
            <button className={authMode === "login" ? "is-active" : ""} type="button" onClick={() => onAuthModeChange("login")}>
              登录
            </button>
            <button className={authMode === "register" ? "is-active" : ""} type="button" onClick={() => onAuthModeChange("register")}>
              注册
            </button>
            <button className={authMode === "reset" ? "is-active" : ""} type="button" onClick={() => onAuthModeChange("reset")}>
              找回密码
            </button>
          </div>

          {authMode === "login" && (
            <div className="tabs">
              <button
                className={loginMethod === "password" ? "is-active" : ""}
                type="button"
                onClick={() => onLoginMethodChange("password")}
              >
                密码登录
              </button>
              <button className={loginMethod === "code" ? "is-active" : ""} type="button" onClick={() => onLoginMethodChange("code")}>
                验证码登录
              </button>
            </div>
          )}

          <div className="fields">
            <input
              value={authForm.email}
              onChange={(event) => onAuthFormChange((prev) => ({ ...prev, email: event.target.value }))}
              placeholder="邮箱"
            />
            {authMode === "register" && (
              <input
                value={authForm.nickname}
                onChange={(event) => onAuthFormChange((prev) => ({ ...prev, nickname: event.target.value }))}
                placeholder="昵称"
              />
            )}
            {(authMode === "register" || (authMode === "login" && loginMethod === "password")) && (
              <input
                type="password"
                value={authForm.password}
                onChange={(event) => onAuthFormChange((prev) => ({ ...prev, password: event.target.value }))}
                placeholder="密码"
              />
            )}
            {authMode === "reset" && (
              <input
                type="password"
                value={authForm.newPassword}
                onChange={(event) => onAuthFormChange((prev) => ({ ...prev, newPassword: event.target.value }))}
                placeholder="新密码"
              />
            )}
            {(authMode === "register" || authMode === "reset" || (authMode === "login" && loginMethod === "code")) && (
              <input
                value={authForm.emailCode}
                onChange={(event) => onAuthFormChange((prev) => ({ ...prev, emailCode: event.target.value }))}
                placeholder="邮箱验证码"
              />
            )}
          </div>

          <div className="section-text">认证成功后直接进入聊天。历史消息会从本地缓存或后端历史接口恢复。</div>

          <div className="auth-actions">
            {(authMode === "register" || authMode === "reset" || (authMode === "login" && loginMethod === "code")) && (
              <button className="btn ghost" type="button" onClick={onSendCode} disabled={sendCodeLoading}>
                {sendCodeLoading ? "发送中..." : "发送验证码"}
              </button>
            )}
            <button className="btn btn-brand" type="button" onClick={onSubmit} disabled={authLoading}>
              {authLoading ? "处理中..." : authMode === "register" ? "注册并进入" : authMode === "reset" ? "重置密码" : "使用当前信息进入"}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
