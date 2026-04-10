import { describe, expect, it } from "vitest";
import {
  createLocalVaultState,
  syncLocalVaultPinState,
  unlockLocalVault,
  touchLocalVault,
  lockLocalVault,
  isLocalVaultExpired,
  type VaultLockReason
} from "../../src/store";

describe("store", () => {
  describe("createLocalVaultState", () => {
    it("should create initial state without PIN verifier", () => {
      const state = createLocalVaultState(false);
      
      expect(state).toEqual({
        hasPinVerifier: false,
        isUnlocked: false,
        lastUnlockAt: null,
        expiresAt: null,
        lastLockReason: null
      });
    });

    it("should create initial state with PIN verifier", () => {
      const state = createLocalVaultState(true);
      
      expect(state).toEqual({
        hasPinVerifier: true,
        isUnlocked: false,
        lastUnlockAt: null,
        expiresAt: null,
        lastLockReason: null
      });
    });
  });

  describe("syncLocalVaultPinState", () => {
    it("should update hasPinVerifier when different", () => {
      const initialState = createLocalVaultState(false);
      const updatedState = syncLocalVaultPinState(initialState, true);
      
      expect(updatedState.hasPinVerifier).toBe(true);
      expect(updatedState.isUnlocked).toBe(false);
      expect(updatedState.lastUnlockAt).toBe(null);
      expect(updatedState.expiresAt).toBe(null);
      expect(updatedState.lastLockReason).toBe(null);
    });

    it("should not change state when hasPinVerifier is same", () => {
      const initialState = createLocalVaultState(true);
      const updatedState = syncLocalVaultPinState(initialState, true);
      
      expect(updatedState).toBe(initialState);
    });

    it("should reset unlock state when removing PIN verifier", () => {
      const initialState = unlockLocalVault(createLocalVaultState(true), 30000);
      const updatedState = syncLocalVaultPinState(initialState, false);
      
      expect(updatedState.hasPinVerifier).toBe(false);
      expect(updatedState.isUnlocked).toBe(false);
      expect(updatedState.lastUnlockAt).toBe(null);
      expect(updatedState.expiresAt).toBe(null);
      expect(updatedState.lastLockReason).toBe(null);
    });
  });

  describe("unlockLocalVault", () => {
    it("should unlock vault with timeout", () => {
      const now = 1000000;
      const timeoutMs = 30000;
      const initialState = createLocalVaultState(true);
      const unlockedState = unlockLocalVault(initialState, timeoutMs, now);
      
      expect(unlockedState.isUnlocked).toBe(true);
      expect(unlockedState.lastUnlockAt).toBe(now);
      expect(unlockedState.expiresAt).toBe(now + timeoutMs);
      expect(unlockedState.lastLockReason).toBe(null);
    });

    it("should unlock vault even if already unlocked", () => {
      const now1 = 1000000;
      const now2 = 1005000;
      const timeoutMs = 30000;
      const initialState = unlockLocalVault(createLocalVaultState(true), timeoutMs, now1);
      const unlockedState = unlockLocalVault(initialState, timeoutMs, now2);
      
      expect(unlockedState.isUnlocked).toBe(true);
      expect(unlockedState.lastUnlockAt).toBe(now2);
      expect(unlockedState.expiresAt).toBe(now2 + timeoutMs);
      expect(unlockedState.lastLockReason).toBe(null);
    });
  });

  describe("touchLocalVault", () => {
    it("should extend expiration time when unlocked", () => {
      const now1 = 1000000;
      const now2 = 1005000;
      const timeoutMs = 30000;
      const initialState = unlockLocalVault(createLocalVaultState(true), timeoutMs, now1);
      const touchedState = touchLocalVault(initialState, timeoutMs, now2);
      
      expect(touchedState.isUnlocked).toBe(true);
      expect(touchedState.lastUnlockAt).toBe(now1);
      expect(touchedState.expiresAt).toBe(now2 + timeoutMs);
      expect(touchedState.lastLockReason).toBe(null);
    });

    it("should not change state when locked", () => {
      const now = 1000000;
      const timeoutMs = 30000;
      const initialState = createLocalVaultState(true);
      const touchedState = touchLocalVault(initialState, timeoutMs, now);
      
      expect(touchedState).toBe(initialState);
    });
  });

  describe("lockLocalVault", () => {
    it("should lock vault with reason", () => {
      const reasons: VaultLockReason[] = ["manual", "idle", "hidden", "logout"];
      
      for (const reason of reasons) {
        const initialState = unlockLocalVault(createLocalVaultState(true), 30000);
        const lockedState = lockLocalVault(initialState, reason);
        
        expect(lockedState.isUnlocked).toBe(false);
        expect(lockedState.lastUnlockAt).toBe(initialState.lastUnlockAt);
        expect(lockedState.expiresAt).toBe(null);
        expect(lockedState.lastLockReason).toBe(reason);
      }
    });

    it("should preserve lastUnlockAt when locking", () => {
      const now = 1000000;
      const initialState = unlockLocalVault(createLocalVaultState(true), 30000, now);
      const lockedState = lockLocalVault(initialState, "manual");
      
      expect(lockedState.lastUnlockAt).toBe(now);
    });
  });

  describe("isLocalVaultExpired", () => {
    it("should return false when locked", () => {
      const state = createLocalVaultState(true);
      expect(isLocalVaultExpired(state)).toBe(false);
    });

    it("should return false when not expired", () => {
      const now = 1000000;
      const timeoutMs = 30000;
      const state = unlockLocalVault(createLocalVaultState(true), timeoutMs, now);
      
      expect(isLocalVaultExpired(state, now + 15000)).toBe(false);
    });

    it("should return true when expired", () => {
      const now = 1000000;
      const timeoutMs = 30000;
      const state = unlockLocalVault(createLocalVaultState(true), timeoutMs, now);
      
      expect(isLocalVaultExpired(state, now + 30001)).toBe(true);
    });

    it("should return true when exactly at expiration time", () => {
      const now = 1000000;
      const timeoutMs = 30000;
      const state = unlockLocalVault(createLocalVaultState(true), timeoutMs, now);
      
      expect(isLocalVaultExpired(state, now + timeoutMs)).toBe(true);
    });

    it("should return false when expiresAt is null", () => {
      const state = {
        hasPinVerifier: true,
        isUnlocked: true,
        lastUnlockAt: 1000000,
        expiresAt: null,
        lastLockReason: null
      };
      
      expect(isLocalVaultExpired(state)).toBe(false);
    });
  });

  describe("state transitions", () => {
    it("should handle full unlock/lock cycle", () => {
      const now = 1000000;
      const timeoutMs = 30000;
      
      // Start locked
      let state = createLocalVaultState(true);
      expect(state.isUnlocked).toBe(false);
      
      // Unlock
      state = unlockLocalVault(state, timeoutMs, now);
      expect(state.isUnlocked).toBe(true);
      expect(state.expiresAt).toBe(now + timeoutMs);
      
      // Touch (extend)
      state = touchLocalVault(state, timeoutMs, now + 1000);
      expect(state.isUnlocked).toBe(true);
      expect(state.expiresAt).toBe(now + 1000 + timeoutMs);
      
      // Lock
      state = lockLocalVault(state, "manual");
      expect(state.isUnlocked).toBe(false);
      expect(state.expiresAt).toBe(null);
      expect(state.lastLockReason).toBe("manual");
    });

    it("should handle PIN verifier changes", () => {
      const now = 1000000;
      const timeoutMs = 30000;
      
      // Start without PIN
      let state = createLocalVaultState(false);
      expect(state.hasPinVerifier).toBe(false);
      
      // Add PIN verifier
      state = syncLocalVaultPinState(state, true);
      expect(state.hasPinVerifier).toBe(true);
      
      // Unlock
      state = unlockLocalVault(state, timeoutMs, now);
      expect(state.isUnlocked).toBe(true);
      
      // Remove PIN verifier (should lock)
      state = syncLocalVaultPinState(state, false);
      expect(state.hasPinVerifier).toBe(false);
      expect(state.isUnlocked).toBe(false);
      expect(state.expiresAt).toBe(null);
    });
  });
});