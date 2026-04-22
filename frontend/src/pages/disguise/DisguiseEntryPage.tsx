import { useEffect, useState } from "react";
import {
  ApiError,
  getDisguiseConfig,
  getTodayFortune,
  verifyLuckyNumber,
} from "../../api/client";
import type { DisguiseConfig, FortuneToday } from "../../types";
import "./DisguiseEntryPage.css";

interface DisguiseEntryPageProps {
  onLuckyNumberVerified: () => void;
  initialView?: "lucky" | "fortune";
  compactMode?: boolean;
}

function normalizeLuckyNumberInput(value: string): string {
  return value
    // 伪装入口面向移动端输入，先兼容全角数字，减少因为输入法差异导致的误判。
    .replace(/[０-９]/g, (digit) =>
      String.fromCharCode(digit.charCodeAt(0) - 0xfee0),
    )
    // 去掉零宽字符和不易察觉的空白，避免“看起来一样”的输入绕过或误伤校验结果。
    .replace(/[\u200B-\u200D\u2060\uFEFF\u00A0\u202F]/g, "")
    .trim();
}

export function DisguiseEntryPage({
  onLuckyNumberVerified,
  initialView = "lucky",
  compactMode = false,
}: DisguiseEntryPageProps) {
  const [view, setView] = useState<"lucky" | "fortune">(initialView);
  const [fortune, setFortune] = useState<FortuneToday | null>(null);
  const [config, setConfig] = useState<DisguiseConfig | null>(null);
  const [luckyCodeInput, setLuckyCodeInput] = useState("");
  const [lastLuckyNumber, setLastLuckyNumber] = useState("--");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusNote, setStatusNote] = useState<string | null>(null);

  // 加载运势和配置
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [fortuneData, disguiseData] = await Promise.all([
          getTodayFortune(),
          getDisguiseConfig(),
        ]);
        setFortune(fortuneData);
        setConfig(disguiseData);
        setError(null);
      } catch (err) {
        setError("加载今日内容失败，请检查网络连接");
        console.error("Failed to load disguise data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // 处理幸运数字验证
  const handleVerifyLuckyNumber = async () => {
    const normalizedLuckyNumber = normalizeLuckyNumberInput(luckyCodeInput);

    if (!normalizedLuckyNumber) {
      setError("请输入幸运数字");
      setStatusNote("请输入今日幸运数字后继续。");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setStatusNote(null);

      const result = await verifyLuckyNumber(normalizedLuckyNumber);

      if (result.matched) {
        setLastLuckyNumber(normalizedLuckyNumber);
        setStatusNote("幸运数字已匹配，正在打开今日彩蛋...");

        // 清空输入
        setLuckyCodeInput("");

        // 延迟一小段时间后触发验证成功回调
        setTimeout(() => {
          onLuckyNumberVerified();
        }, 500);
      } else {
        setError("这个幸运数字暂未触发彩蛋，请再试一次");
        setStatusNote("未匹配到今日彩蛋，请检查后重试。");
      }
    } catch (err) {
      const apiError = err instanceof ApiError ? err : null;
      const errorMessage =
        apiError?.code === 420201
          ? "这个幸运数字暂未触发彩蛋，请再试一次"
          : apiError?.code === 420202
            ? "今日彩蛋暂时不可用，请稍后再试"
            : "校验失败，请稍后重试";

      setError(errorMessage);
      setStatusNote(
        apiError?.code === 420201 ? "未匹配到今日彩蛋，请检查后重试。" : "校验服务暂时不可用，请稍后重试。"
      );
      console.error("Failed to verify lucky number:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // 切换到幸运数字视图
  const handleSwitchToLucky = () => {
    setView("lucky");
  };

  if (isLoading && !fortune) {
    return (
      <div className="disguise-container loading">
        <div className="loading-spinner"></div>
        <p>加载今日内容中...</p>
      </div>
    );
  }

  if (error && !fortune) {
    return (
      <div className="disguise-container error">
        <div className="error-icon">⚠️</div>
        <p>{error}</p>
        <button
          className="retry-button"
          onClick={() => window.location.reload()}
        >
          重试
        </button>
      </div>
    );
  }

  return (
    <div className={compactMode ? "disguise-container disguise-container--compact" : "disguise-container"}>
      <div className="disguise-shell">
        <header className="disguise-hero">
          <div className="disguise-eyebrow">今日只有一次命运触发机会</div>
          <h1>{config?.siteTitle || "命运入口"}</h1>
          <p className="disguise-subtitle">
            输入一个你直觉正确的幸运数字，页面会给你一条今日回应。
          </p>
        </header>

        <main className="disguise-panel">
          {view === "lucky" ? (
            <div className="disguise-grid">
              <section className="disguise-card disguise-card--primary">
                <h2 className="unlock-title">输入幸运数字</h2>
                <p className="unlock-desc">
                  不需要知道答案，只需要相信直觉。
                  <br />
                  页面会根据你的选择，给出今天的回应。
                </p>

                <div className="badge-row" aria-label="入口提示">
                  <span className="badge">上次验证：{lastLuckyNumber}</span>
                  <span className="badge">建议输入 4 位数字</span>
                  <span className="badge">按回车可直接提交</span>
                </div>

                <div className="input-shell">
                  <div className="input-label-row">
                    <label htmlFor="luckyCode">请输入今日幸运数字</label>
                    <span>仅接受当前输入内容</span>
                  </div>
                  <input
                    id="luckyCode"
                    type="text"
                    value={luckyCodeInput}
                    onChange={(e) => setLuckyCodeInput(e.target.value)}
                    placeholder="例如：2468"
                    disabled={isLoading}
                    inputMode="numeric"
                    autoComplete="off"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !isLoading) {
                        handleVerifyLuckyNumber();
                      }
                    }}
                  />
                  {error && <div className="input-error">{error}</div>}
                </div>

                <div className="action-row">
                  <button
                    className="action-button action-button--primary"
                    onClick={handleVerifyLuckyNumber}
                    disabled={isLoading || !normalizeLuckyNumberInput(luckyCodeInput)}
                  >
                    {isLoading ? "校验中..." : "查看彩蛋"}
                  </button>
                  <button
                    className="action-button action-button--ghost"
                    type="button"
                    onClick={() => setView("fortune")}
                    disabled={isLoading}
                  >
                    看看今日建议
                  </button>
                </div>

                <div className={`status-card${error ? " status-card--error" : ""}`}>
                  {statusNote ?? "提示：正确的数字不会主动出现，但整齐的组合更值得试试。"}
                </div>
              </section>

              <aside className="side-stack">
                <section className="disguise-card teaser-card">
                  <div>
                    <h2>今天会发生什么？</h2>
                    <p>
                      大多数数字会带来一条今日建议，提醒你慢一点、稳一点。
                      <br />
                      也许某个组合，会让页面出现完全不同的走向。
                    </p>
                  </div>

                  <div className="hint-card">
                    <div className="hint-title">轻提示</div>
                    <p>数字通常很整齐，看起来像一步一步靠近终点。</p>
                    <p>越平衡、越顺的组合，越容易被记住。</p>
                  </div>
                </section>

                {fortune && (
                  <section className="disguise-card mini-card">
                    <div className="mini-label">今日建议</div>
                    <div className="mini-value">{fortune.summary}</div>
                    <div className="mini-meta">
                      <span>幸运颜色：{fortune.luckyColor}</span>
                      <span>幸运方向：{fortune.luckyDirection}</span>
                    </div>
                  </section>
                )}
              </aside>
            </div>
          ) : (
            <section className="fortune-view">
              {fortune && (
                <div className="disguise-card fortune-card">
                  <div className="fortune-header">
                    <div>
                      <div className="fortune-kicker">今日建议</div>
                      <h2>{fortune.title}</h2>
                    </div>
                    <button className="action-button action-button--ghost" onClick={handleSwitchToLucky}>
                      返回幸运数字
                    </button>
                  </div>

                  <div className="fortune-summary">
                    <p>{fortune.summary}</p>
                  </div>

                  <div className="fortune-details">
                    <div className="detail-item">
                      <span className="detail-label">幸运颜色</span>
                      <span className="detail-value">{fortune.luckyColor}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">幸运方向</span>
                      <span className="detail-value">{fortune.luckyDirection}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">今日建议</span>
                      <span className="detail-value">{fortune.advice}</span>
                    </div>
                  </div>

                  <div className="fortune-note">运势仅供参考，保持轻松会更容易收到好消息。</div>
                </div>
              )}
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
