export interface AutoLockOptions {
  persistVisibilityState?: boolean;
}

const DEFAULT_OPTIONS: Required<AutoLockOptions> = {
  persistVisibilityState: true
};

export type VisibilityHandler = () => void | Promise<void>;

export class AutoLockService {
  private options: Required<AutoLockOptions>;
  private hiddenHandlers: Set<VisibilityHandler>;
  private visibleHandlers: Set<VisibilityHandler>;
  private isHidden: boolean;

  constructor(options: AutoLockOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.hiddenHandlers = new Set();
    this.visibleHandlers = new Set();
    this.isHidden = false;
  }

  initialize(): void {
    document.addEventListener("visibilitychange", this.handleVisibilityChange);
  }

  destroy(): void {
    document.removeEventListener("visibilitychange", this.handleVisibilityChange);
    this.hiddenHandlers.clear();
    this.visibleHandlers.clear();
  }

  addHiddenHandler(handler: VisibilityHandler): void {
    this.hiddenHandlers.add(handler);
  }

  removeHiddenHandler(handler: VisibilityHandler): void {
    this.hiddenHandlers.delete(handler);
  }

  addVisibleHandler(handler: VisibilityHandler): void {
    this.visibleHandlers.add(handler);
  }

  removeVisibleHandler(handler: VisibilityHandler): void {
    this.visibleHandlers.delete(handler);
  }

  isPageHidden(): boolean {
    return this.isHidden;
  }

  private handleVisibilityChange = (): void => {
    this.isHidden = document.visibilityState === "hidden";
    if (this.options.persistVisibilityState) {
      localStorage.setItem("hidechat_visibility", this.isHidden ? "hidden" : "visible");
    }
    const handlers = Array.from(this.isHidden ? this.hiddenHandlers : this.visibleHandlers);
    for (const handler of handlers) {
      Promise.resolve(handler()).catch(() => undefined);
    }
  };
}

export const autoLockService = new AutoLockService();
