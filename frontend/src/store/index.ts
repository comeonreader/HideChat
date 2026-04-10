export type VaultLockReason = "manual" | "idle" | "hidden" | "logout";

export interface LocalVaultState {
  hasPinVerifier: boolean;
  isUnlocked: boolean;
  lastUnlockAt: number | null;
  expiresAt: number | null;
  lastLockReason: VaultLockReason | null;
}

export function createLocalVaultState(hasPinVerifier = false): LocalVaultState {
  return {
    hasPinVerifier,
    isUnlocked: false,
    lastUnlockAt: null,
    expiresAt: null,
    lastLockReason: null
  };
}

export function syncLocalVaultPinState(state: LocalVaultState, hasPinVerifier: boolean): LocalVaultState {
  if (state.hasPinVerifier === hasPinVerifier) {
    return state;
  }
  return {
    ...state,
    hasPinVerifier,
    isUnlocked: hasPinVerifier ? state.isUnlocked : false,
    lastUnlockAt: hasPinVerifier ? state.lastUnlockAt : null,
    expiresAt: hasPinVerifier ? state.expiresAt : null,
    lastLockReason: hasPinVerifier ? state.lastLockReason : null
  };
}

export function unlockLocalVault(state: LocalVaultState, timeoutMs: number, now = Date.now()): LocalVaultState {
  return {
    ...state,
    isUnlocked: true,
    lastUnlockAt: now,
    expiresAt: now + timeoutMs,
    lastLockReason: null
  };
}

export function touchLocalVault(state: LocalVaultState, timeoutMs: number, now = Date.now()): LocalVaultState {
  if (!state.isUnlocked) {
    return state;
  }
  return {
    ...state,
    expiresAt: now + timeoutMs
  };
}

export function lockLocalVault(state: LocalVaultState, reason: VaultLockReason): LocalVaultState {
  return {
    ...state,
    isUnlocked: false,
    lastUnlockAt: state.lastUnlockAt,
    expiresAt: null,
    lastLockReason: reason
  };
}

export function isLocalVaultExpired(state: LocalVaultState, now = Date.now()): boolean {
  return state.isUnlocked && typeof state.expiresAt === "number" && state.expiresAt <= now;
}
