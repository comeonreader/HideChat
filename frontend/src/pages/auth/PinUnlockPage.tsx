import { useState, useEffect } from "react";
import { verifySecret } from "../../crypto";
import { loadLocalSecret } from "../../storage";
import type { HiddenSession } from "../../types";
import "./PinUnlockPage.css";

interface PinUnlockPageProps {
  onUnlock: (session: HiddenSession) => void;
  onSetupPin: () => void;
  onForgotPin: () => void;
  email: string;
  userUid: string;
  nickname: string;
  avatarUrl?: string | null;
}

export function PinUnlockPage({
  onUnlock,
  onSetupPin,
  onForgotPin,
  email,
  userUid,
  nickname,
  avatarUrl
}: PinUnlockPageProps) {
  const [pinInput, setPinInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockUntil, setLockUntil] = useState<number | null>(null);
  const [hasPin, setHasPin] = useState(false);

  // 检查是否有已保存的 PIN
  useEffect(() => {
    const checkExistingPin = async () => {
      try {
        const secretRecord = await loadLocalSecret("pin");
        setHasPin(!!secretRecord);
      } catch (err) {
        console.error("Failed to check existing PIN:", err);
      }
    };

    checkExistingPin();
  }, []);

  // 检查锁定状态
  useEffect(() => {
    const checkLockStatus = () => {
      const storedLockUntil = localStorage.getItem("pin_lock_until");
      if (storedLockUntil) {
        const lockTime = parseInt(storedLockUntil, 10);
        if (Date.now() < lockTime) {
          setIsLocked(true);
          setLockUntil(lockTime);
        } else {
          // 锁定已过期
          localStorage.removeItem("pin_lock_until");
          localStorage.removeItem("pin_attempts");
          setIsLocked(false);
          setLockUntil(null);
          setAttempts(0);
        }
      }
    };

    checkLockStatus();
    const interval = setInterval(checkLockStatus, 1000);
    return () => clearInterval(interval);
  }, []);

  // 处理 PIN 验证
  const handleVerifyPin = async () => {
    if (!pinInput.trim() || pinInput.length < 4) {
      setError("PIN 必须至少 4 位数字");
      return;
    }

    if (isLocked && lockUntil) {
      const remaining = Math.ceil((lockUntil - Date.now()) / 1000 / 60);
      setError(`账户已锁定，请 ${remaining} 分钟后再试`);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const secretRecord = await loadLocalSecret("pin");
      if (!secretRecord) {
        setError("未找到 PIN 配置，请重新设置");
        return;
      }

      const isValid = await verifySecret(pinInput, {
        verifierHash: secretRecord.verifierHash,
        kdfParams: secretRecord.kdfParams
      });

      if (isValid) {
        // 验证成功，重置尝试次数
        localStorage.removeItem("pin_attempts");
        localStorage.removeItem("pin_lock_until");
        setAttempts(0);
        setIsLocked(false);
        setLockUntil(null);

        // 创建会话对象
        const session: HiddenSession = {
          user: {
            userUid,
            nickname,
            email,
            avatarUrl
          },
          pin: pinInput,
          pinVerifierHash: secretRecord.verifierHash,
          pinSalt: secretRecord.salt,
          pinKdfParams: secretRecord.kdfParams
        };

        // 清空 PIN 输入
        setPinInput("");

        // 触发解锁回调
        onUnlock(session);
      } else {
        // 验证失败
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        localStorage.setItem("pin_attempts", newAttempts.toString());

        if (newAttempts >= 5) {
          // 锁定 30 分钟
          const lockTime = Date.now() + 30 * 60 * 1000;
          localStorage.setItem("pin_lock_until", lockTime.toString());
          setIsLocked(true);
          setLockUntil(lockTime);
          setError("尝试次数过多，账户已锁定 30 分钟");
        } else {
          setError(`PIN 不正确，还剩 ${5 - newAttempts} 次尝试机会`);
        }
      }
    } catch (err) {
      console.error("Failed to verify PIN:", err);
      setError("验证失败，请重试");
    } finally {
      setIsLoading(false);
    }
  };

  // 处理键盘输入
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isLoading) {
      handleVerifyPin();
    }
  };

  // 格式化剩余时间
  const formatRemainingTime = () => {
    if (!lockUntil) return "";
    const remainingSeconds = Math.ceil((lockUntil - Date.now()) / 1000);
    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="pin-unlock-container">
      <header className="pin-header">
        <div className="user-info">
          {avatarUrl ? (
            <img src={avatarUrl} alt={nickname} className="user-avatar" />
          ) : (
            <div className="user-avatar-placeholder">
              {nickname.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="user-details">
            <h2>{nickname}</h2>
            <p className="user-email">{email}</p>
          </div>
        </div>
        <div className="security-badge">
          <span className="badge-icon">🔒</span>
          <span>安全模式</span>
        </div>
      </header>

      <main className="pin-main">
        <div className="pin-card">
          <h3 className="pin-title">
            {hasPin ? "输入 PIN 解锁" : "设置 PIN"}
          </h3>
          <p className="pin-description">
            {hasPin 
              ? "请输入 4-6 位数字 PIN 以解锁聊天" 
              : "为了保护您的隐私，请设置一个 4-6 位数字 PIN"}
          </p>

          {isLocked ? (
            <div className="lock-status">
              <div className="lock-icon">🔒</div>
              <p className="lock-message">账户已锁定</p>
              <p className="lock-timer">
                剩余时间: <span>{formatRemainingTime()}</span>
              </p>
              <p className="lock-hint">
                出于安全考虑，连续 5 次错误尝试将锁定账户 30 分钟
              </p>
            </div>
          ) : (
            <>
              <div className="pin-input-section">
                <input
                  type="password"
                  value={pinInput}
                  onChange={(e) => {
                    // 只允许数字
                    const value = e.target.value.replace(/\D/g, "");
                    if (value.length <= 6) {
                      setPinInput(value);
                      setError(null);
                    }
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="输入 4-6 位数字 PIN"
                  disabled={isLoading}
                  className="pin-input"
                  inputMode="numeric"
                  maxLength={6}
                />
                {error && <div className="pin-error">{error}</div>}
                
                {attempts > 0 && !isLocked && (
                  <div className="attempts-counter">
                    尝试次数: {attempts}/5
                  </div>
                )}
              </div>

              <div className="pin-actions">
                <button
                  className="unlock-button"
                  onClick={handleVerifyPin}
                  disabled={isLoading || pinInput.length < 4}
                >
                  {isLoading ? (
                    <>
                      <span className="spinner"></span>
                      验证中...
                    </>
                  ) : hasPin ? (
                    "解锁"
                  ) : (
                    "设置并继续"
                  )}
                </button>

                <div className="pin-help">
                  {hasPin ? (
                    <button
                      className="help-link"
                      onClick={onForgotPin}
                      disabled={isLoading}
                    >
                      忘记 PIN？
                    </button>
                  ) : (
                    <button
                      className="help-link"
                      onClick={onSetupPin}
                      disabled={isLoading}
                    >
                      稍后设置
                    </button>
                  )}
                </div>
              </div>
            </>
          )}

          <div className="security-features">
            <h4>安全特性</h4>
            <ul>
              <li>PIN 本地加密存储，不上传服务器</li>
              <li>连续 5 次错误尝试将锁定账户</li>
              <li>所有聊天内容本地加密存储</li>
              <li>浏览器关闭后自动锁定</li>
            </ul>
          </div>
        </div>

        <div className="pin-footer">
          <p className="security-notice">
            🔒 您的隐私受到保护。PIN 仅用于本地解锁，不会发送到服务器。
          </p>
          <p className="technical-info">
            使用 Web Crypto API 和 IndexedDB 进行本地加密存储
          </p>
        </div>
      </main>
    </div>
  );
}