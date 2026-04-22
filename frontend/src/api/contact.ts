import type { ContactItem, RecentContactItem, UserSearchItem } from "../types";
import { requestJson } from "./http";

export async function listContacts(): Promise<ContactItem[]> {
  return requestJson<ContactItem[]>("/contact/list", { method: "GET" }, true);
}

export async function addContact(peerUid: string, remarkName: string): Promise<void> {
  await requestJson<void>(
    "/contact/add",
    {
      method: "POST",
      body: JSON.stringify({ peerUid, remarkName })
    },
    true
  );
}

export async function listRecentContacts(limit = 4): Promise<RecentContactItem[]> {
  const params = new URLSearchParams({ limit: String(limit) });
  return requestJson<RecentContactItem[]>(`/contact/recent?${params.toString()}`, { method: "GET" }, true);
}

export async function searchContacts(keyword: string): Promise<UserSearchItem[]> {
  const params = new URLSearchParams({ keyword });
  return requestJson<UserSearchItem[]>(`/user/search?${params.toString()}`, { method: "GET" }, true);
}

export const searchUsers = searchContacts;
