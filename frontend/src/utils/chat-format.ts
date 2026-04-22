export function formatFileSize(fileSize?: number): string {
  if (!fileSize || fileSize <= 0) {
    return "";
  }
  if (fileSize < 1024) {
    return `${fileSize} B`;
  }
  if (fileSize < 1024 * 1024) {
    return `${(fileSize / 1024).toFixed(1)} KB`;
  }
  return `${(fileSize / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatFileSubtitle(payload: { fileSize?: number } | null, previewableImage: boolean): string {
  const size = formatFileSize(payload?.fileSize);
  if (previewableImage) {
    return size ? `${size} · 点击图片可预览或下载` : "点击图片可预览或下载";
  }
  return size ? `${size} · 点击可下载` : "点击可下载";
}

export function getAvatarLabel(value: string): string {
  return value.trim().slice(0, 1).toUpperCase() || "匿";
}

function formatWeekdayShort(date: Date): string {
  return `周${"日一二三四五六"[date.getDay()]}`;
}

export function formatMessageTime(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  if (sameDay) {
    return new Intl.DateTimeFormat("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    }).format(date);
  }
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return "昨天";
  }
  return formatWeekdayShort(date);
}

export function formatConversationDivider(timestamp: number): string {
  return `今天 ${new Intl.DateTimeFormat("zh-CN", { hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(timestamp))}`;
}

export function formatRecentAdded(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return `今天 ${new Intl.DateTimeFormat("zh-CN", { hour: "2-digit", minute: "2-digit", hour12: false }).format(date)}`;
  }
  return `昨天 ${new Intl.DateTimeFormat("zh-CN", { hour: "2-digit", minute: "2-digit", hour12: false }).format(date)}`;
}
