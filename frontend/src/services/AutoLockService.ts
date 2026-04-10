export interface AutoLockOptions {
  lockAfterInactivity?: number; // 毫秒
  lockOnWindowBlur?: boolean;
  lockOnBrowserClose?: boolean;
  lockOnTabSwitch?: boolean;
  requireReauthOnLock?: boolean;
}

const DEFAULT_OPTIONS: Required<AutoLockOptions> = {
  lockAfterInactivity: 5 * 60 * 1000, // 5分钟
  lockOnWindowBlur: true,
  lockOnBrowserClose: true,
  lockOnTabSwitch: false,
  requireReauthOnLock: false
};

export type LockHandler = () => void | Promise<void>;

export class AutoLockService {
  private options: Required<AutoLockOptions>;
  private inactivityTimer?: NodeJS.Timeout;
  private lastActivityTime: number;
  private isLocked: boolean;
  private lockHandlers: Set<LockHandler>;
  private unlockHandlers: Set<LockHandler>;
  private visibilityChangeHandler?: () => void;
  private blurHandler?: () => void;
  private beforeUnloadHandler?: (event: BeforeUnloadEvent) => void;

  constructor(options: AutoLockOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.lastActivityTime = Date.now();
    this.isLocked = false;
    this.lockHandlers = new Set();
    this.unlockHandlers = new Set();
  }

  /**
   * 初始化自动锁定服务
   */
  initialize(): void {
    this.setupEventListeners();
    this.startInactivityTimer();
  }

  /**
   * 设置事件监听器
   */
  private setupEventListeners(): void {
    // 用户活动监听
    const activityEvents = ['mousedown', 'mousemove', 'keydown', 'touchstart', 'scroll'];
    activityEvents.forEach(event => {
      document.addEventListener(event, () => this.resetInactivityTimer(), { passive: true });
    });

    // 页面可见性变化
    if (this.options.lockOnTabSwitch) {
      this.visibilityChangeHandler = () => {
        if (document.hidden) {
          this.lock().catch(console.error);
        }
      };
      document.addEventListener('visibilitychange', this.visibilityChangeHandler);
    }

    // 窗口失去焦点
    if (this.options.lockOnWindowBlur) {
      this.blurHandler = () => {
        this.lock().catch(console.error);
      };
      window.addEventListener('blur', this.blurHandler);
    }

    // 浏览器关闭/刷新
    if (this.options.lockOnBrowserClose) {
      this.beforeUnloadHandler = (event: BeforeUnloadEvent) => {
        // 在页面卸载前锁定
        this.lock().catch(console.error);
        
        // 如果是需要重新认证的锁定，显示确认对话框
        if (this.options.requireReauthOnLock) {
          event.preventDefault();
          event.returnValue = '您的会话将被锁定，需要重新输入 PIN 才能继续使用。';
        }
      };
      window.addEventListener('beforeunload', this.beforeUnloadHandler);
    }
  }

  /**
   * 重置不活动计时器
   */
  resetInactivityTimer(): void {
    this.lastActivityTime = Date.now();
    
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
    }
    
    this.startInactivityTimer();
  }

  /**
   * 启动不活动计时器
   */
  private startInactivityTimer(): void {
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
    }

    this.inactivityTimer = setTimeout(() => {
      this.lock().catch(console.error);
    }, this.options.lockAfterInactivity);
  }

  /**
   * 锁定会话
   */
  async lock(): Promise<void> {
    if (this.isLocked) return;

    this.isLocked = true;
    
    // 停止不活动计时器
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
      this.inactivityTimer = undefined;
    }

    // 执行锁定处理器
    const handlers = Array.from(this.lockHandlers);
    for (const handler of handlers) {
      try {
        await handler();
      } catch (error) {
        console.error('Lock handler error:', error);
      }
    }

    // 保存锁定状态到 localStorage
    localStorage.setItem('hidechat_locked', 'true');
    localStorage.setItem('hidechat_locked_at', Date.now().toString());
  }

  /**
   * 解锁会话
   */
  async unlock(): Promise<void> {
    if (!this.isLocked) return;

    this.isLocked = false;
    
    // 重置活动时间
    this.lastActivityTime = Date.now();
    
    // 启动不活动计时器
    this.startInactivityTimer();

    // 执行解锁处理器
    const handlers = Array.from(this.unlockHandlers);
    for (const handler of handlers) {
      try {
        await handler();
      } catch (error) {
        console.error('Unlock handler error:', error);
      }
    }

    // 清除锁定状态
    localStorage.removeItem('hidechat_locked');
    localStorage.removeItem('hidechat_locked_at');
  }

  /**
   * 检查是否已锁定
   */
  isSessionLocked(): boolean {
    // 检查内存状态和本地存储状态
    const storedLocked = localStorage.getItem('hidechat_locked') === 'true';
    return this.isLocked || storedLocked;
  }

  /**
   * 获取锁定时间
   */
  getLockTime(): number | null {
    const lockedAt = localStorage.getItem('hidechat_locked_at');
    return lockedAt ? parseInt(lockedAt, 10) : null;
  }

  /**
   * 获取不活动时间（毫秒）
   */
  getInactivityTime(): number {
    return Date.now() - this.lastActivityTime;
  }

  /**
   * 获取剩余不活动时间（毫秒）
   */
  getRemainingInactivityTime(): number {
    const elapsed = this.getInactivityTime();
    return Math.max(0, this.options.lockAfterInactivity - elapsed);
  }

  /**
   * 添加锁定处理器
   */
  addLockHandler(handler: LockHandler): void {
    this.lockHandlers.add(handler);
  }

  /**
   * 移除锁定处理器
   */
  removeLockHandler(handler: LockHandler): void {
    this.lockHandlers.delete(handler);
  }

  /**
   * 添加解锁处理器
   */
  addUnlockHandler(handler: LockHandler): void {
    this.unlockHandlers.add(handler);
  }

  /**
   * 移除解锁处理器
   */
  removeUnlockHandler(handler: LockHandler): void {
    this.unlockHandlers.delete(handler);
  }

  /**
   * 更新选项
   */
  updateOptions(options: Partial<AutoLockOptions>): void {
    this.options = { ...this.options, ...options };
    
    // 如果更改了不活动时间，重置计时器
    if (options.lockAfterInactivity !== undefined) {
      this.resetInactivityTimer();
    }
  }

  /**
   * 获取当前选项
   */
  getOptions(): Required<AutoLockOptions> {
    return { ...this.options };
  }

  /**
   * 清理事件监听器
   */
  private cleanupEventListeners(): void {
    // 移除活动事件监听器
    const activityEvents = ['mousedown', 'mousemove', 'keydown', 'touchstart', 'scroll'];
    activityEvents.forEach(event => {
      document.removeEventListener(event, () => this.resetInactivityTimer());
    });

    // 移除页面可见性变化监听器
    if (this.visibilityChangeHandler) {
      document.removeEventListener('visibilitychange', this.visibilityChangeHandler);
    }

    // 移除窗口失去焦点监听器
    if (this.blurHandler) {
      window.removeEventListener('blur', this.blurHandler);
    }

    // 移除 beforeunload 监听器
    if (this.beforeUnloadHandler) {
      window.removeEventListener('beforeunload', this.beforeUnloadHandler);
    }
  }

  /**
   * 销毁服务
   */
  destroy(): void {
    this.cleanupEventListeners();
    
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
      this.inactivityTimer = undefined;
    }
    
    this.lockHandlers.clear();
    this.unlockHandlers.clear();
  }
}

// 创建单例实例
export const autoLockService = new AutoLockService();