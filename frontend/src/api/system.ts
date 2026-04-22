import type { DisguiseConfig, FortuneToday, LuckyNumberVerifyResult } from "../types";
import { readJsonWithFallback, requestJson } from "./http";

export function fetchTodayFortune(): Promise<FortuneToday> {
  return readJsonWithFallback("/system/fortune/today", {
    title: "今日运势",
    summary: "今天适合整理情绪与节奏。",
    luckyColor: "蓝色",
    luckyDirection: "东南",
    advice: "在重要对话中保持耐心。"
  });
}

export function fetchDisguiseConfig(): Promise<DisguiseConfig> {
  return readJsonWithFallback("/system/disguise-config", {
    siteTitle: "命运入口",
    showFortuneInput: true,
    theme: "default"
  });
}

export async function verifyLuckyNumber(luckyNumber: string): Promise<LuckyNumberVerifyResult> {
  return requestJson<LuckyNumberVerifyResult>("/system/disguise/verify-lucky-number", {
    method: "POST",
    body: JSON.stringify({ luckyNumber })
  });
}

export const getTodayFortune = fetchTodayFortune;
export const getDisguiseConfig = fetchDisguiseConfig;
