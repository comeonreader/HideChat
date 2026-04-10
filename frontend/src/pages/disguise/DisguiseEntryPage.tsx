import { useState, useEffect } from "react";
import { getTodayFortune, getDisguiseConfig, verifyLuckyNumber } from "../../api/client";
import type { FortuneToday, DisguiseConfig } from "../../types";
import "./DisguiseEntryPage.css";

interface DisguiseEntryPageProps {
  onLuckyNumberVerified: () => void;
  onSwitchToFortune: () => void;
  initialView?: "lucky" | "fortune";
}

export function DisguiseEntryPage({
  onLuckyNumberVerified,
  onSwitchToFortune,
  initialView = "lucky"
}: DisguiseEntryPageProps) {
  const [view, setView] = useState<"lucky" | "fortune">(initialView);
  const [fortune, setFortune] = useState<FortuneToday | null>(null);
  const [config, setConfig] = useState<DisguiseConfig | null>(null);
  const [luckyCodeInput, setLuckyCodeInput] = useState("");
  const [lastLuckyNumber, setLastLuckyNumber] = useState("--");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusText, setStatusText] = useState("运势页已加载，输入幸运数字查看今日彩蛋。");

  // 加载运势和配置
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [fortuneData, disguiseData] = await Promise.all([
          getTodayFortune(),
          getDisguiseConfig()
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
    if (!luckyCodeInput.trim()) {
      setError("请输入幸运数字");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const result = await verifyLuckyNumber(luckyCodeInput.trim());
      
      if (result.matched) {
        setLastLuckyNumber(luckyCodeInput.trim());
        setStatusText("幸运数字已匹配，正在打开今日彩蛋...");
        
        // 清空输入
        setLuckyCodeInput("");
        
        // 延迟一小段时间后触发验证成功回调
        setTimeout(() => {
          onLuckyNumberVerified();
        }, 500);
      } else {
        setError("这个幸运数字暂未触发彩蛋，请再试一次");
        setStatusText("未匹配到今日彩蛋，请检查后重试。");
      }
    } catch (err: any) {
      const errorMessage = err.code === 420201 
        ? "这个幸运数字暂未触发彩蛋，请再试一次"
        : err.code === 420202
        ? "今日彩蛋暂时不可用，请稍后再试"
        : "校验失败，请稍后重试";
      
      setError(errorMessage);
      setStatusText("未匹配到今日彩蛋，请检查后重试。");
      console.error("Failed to verify lucky number:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // 切换到运势视图
  const handleSwitchToFortune = () => {
    setView("fortune");
    onSwitchToFortune();
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
    <div className="disguise-container">
      <header className="disguise-header">
        <h1>{config?.siteTitle || "今日运势"}</h1>
        <div className="view-switcher">
          <button
            className={`view-button ${view === "lucky" ? "active" : ""}`}
            onClick={handleSwitchToLucky}
            disabled={view === "lucky"}
          >
            幸运数字
          </button>
          <button
            className={`view-button ${view === "fortune" ? "active" : ""}`}
            onClick={handleSwitchToFortune}
            disabled={view === "fortune"}
          >
            今日运势
          </button>
        </div>
      </header>

      <main className="disguise-main">
        {view === "lucky" ? (
          <div className="lucky-number-view">
            <div className="last-lucky-number">
              <span className="label">上次验证数字：</span>
              <span className="value">{lastLuckyNumber}</span>
            </div>
            
            <div className="input-section">
              <label htmlFor="luckyCode">请输入今日幸运数字</label>
              <input
                id="luckyCode"
                type="text"
                value={luckyCodeInput}
                onChange={(e) => setLuckyCodeInput(e.target.value)}
                placeholder="请输入幸运数字"
                disabled={isLoading}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !isLoading) {
                    handleVerifyLuckyNumber();
                  }
                }}
              />
              {error && <div className="input-error">{error}</div>}
            </div>

            <button
              className="verify-button"
              onClick={handleVerifyLuckyNumber}
              disabled={isLoading || !luckyCodeInput.trim()}
            >
              {isLoading ? "校验中..." : "查看彩蛋"}
            </button>

            <div className="hint">
              <p>提示：输入正确的幸运数字可开启今日彩蛋</p>
              <p>忘记幸运数字？可以先看看今日建议再试试</p>
            </div>
          </div>
        ) : (
          <div className="fortune-view">
            {fortune && (
              <>
                <div className="fortune-card">
                  <h2>{fortune.title}</h2>
                  <div className="fortune-summary">
                    <p>{fortune.summary}</p>
                  </div>
                  
                  <div className="fortune-details">
                    <div className="detail-item">
                      <span className="detail-label">幸运颜色：</span>
                      <span className="detail-value">{fortune.luckyColor}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">幸运方向：</span>
                      <span className="detail-value">{fortune.luckyDirection}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">今日建议：</span>
                      <span className="detail-value">{fortune.advice}</span>
                    </div>
                  </div>
                </div>

                <div className="fortune-actions">
                  <button
                    className="back-button"
                    onClick={handleSwitchToLucky}
                  >
                    返回幸运数字
                  </button>
                  <div className="fortune-note">
                    <p>运势仅供参考，祝您有美好的一天！</p>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </main>

      <footer className="disguise-footer">
        <p className="status-text">{statusText}</p>
        <div className="security-notice">
          <small>今日内容仅供参考，祝你收获一份好心情</small>
        </div>
      </footer>
    </div>
  );
}
