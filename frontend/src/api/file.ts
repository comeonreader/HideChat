import type { FileInfo } from "../types";
import { getStoredAuthState } from "./auth-storage";
import { requestJson, requestWithoutEnvelope, resolveUrl } from "./http";

interface FileUploadSignResponse {
  fileId: string;
  uploadUrl: string;
  storageKey: string;
  headers?: Record<string, string>;
}

export async function uploadFile(file: File, encryptFlag = false): Promise<FileInfo> {
  const uploadSign = await requestJson<FileUploadSignResponse>(
    "/file/upload-sign",
    {
      method: "POST",
      body: JSON.stringify({
        fileName: file.name,
        mimeType: file.type || "application/octet-stream",
        fileSize: file.size,
        encryptFlag
      })
    },
    true
  );

  const uploadHeaders = new Headers(uploadSign.headers);
  if (!uploadHeaders.has("Content-Type")) {
    uploadHeaders.set("Content-Type", file.type || "application/octet-stream");
  }
  const authState = getStoredAuthState();
  if (authState?.accessToken) {
    uploadHeaders.set("Authorization", `Bearer ${authState.accessToken}`);
  }

  await requestWithoutEnvelope(resolveUrl(uploadSign.uploadUrl), {
    method: "PUT",
    headers: uploadHeaders,
    body: file
  });

  return requestJson<FileInfo>(
    "/file/complete",
    {
      method: "POST",
      body: JSON.stringify({
        fileId: uploadSign.fileId,
        storageKey: uploadSign.storageKey,
        mimeType: file.type || "application/octet-stream",
        fileSize: file.size,
        encryptFlag
      })
    },
    true
  );
}
