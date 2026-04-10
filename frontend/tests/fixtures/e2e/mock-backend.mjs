import http from "node:http";
import { randomUUID } from "node:crypto";
import { WebSocketServer } from "ws";

const port = Number(process.env.PLAYWRIGHT_MOCK_PORT ?? 4174);
const host = "127.0.0.1";

let state = createInitialState();

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", `http://${request.headers.host}`);

  if (request.method === "OPTIONS") {
    writeCorsHeaders(response);
    response.writeHead(204);
    response.end();
    return;
  }

  if (url.pathname === "/__test/reset" && request.method === "POST") {
    const previousState = state;
    broadcastClose(previousState, "mock-reset");
    state = createInitialState();
    writeJson(response, 200, { ok: true });
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/system/fortune/today") {
    writeEnvelope(response, {
      title: "今日运势",
      summary: "今天适合整理情绪与节奏。",
      luckyColor: "蓝色",
      luckyDirection: "东南",
      advice: "在重要对话中保持耐心。"
    });
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/system/disguise-config") {
    writeEnvelope(response, {
      siteTitle: "今日运势",
      showFortuneInput: true,
      theme: "default"
    });
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/system/disguise/verify-lucky-number") {
    const body = await readJsonBody(request);
    if (body.luckyNumber === state.luckyNumber) {
      writeEnvelope(response, { matched: true });
      return;
    }
    writeEnvelope(response, { matched: false });
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/auth/email/send-code") {
    const body = await readJsonBody(request);
    state.emailCodes.set(`${body.email}:${body.bizType}`, "123456");
    writeEnvelope(response, null);
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/auth/email/register") {
    const body = await readJsonBody(request);
    if (state.usersByEmail.has(body.email)) {
      writeError(response, 200, 410001, "邮箱已注册");
      return;
    }
    const expectedCode = state.emailCodes.get(`${body.email}:register`) ?? "123456";
    if (body.emailCode !== expectedCode) {
      writeError(response, 200, 410103, "验证码错误");
      return;
    }
    const userUid = `u_${state.nextUserId++}`;
    const user = {
      userUid,
      displayUserId: `hide_${userUid.slice(2)}`,
      email: body.email,
      nickname: body.nickname,
      password: body.password,
      avatarUrl: null
    };
    state.usersByEmail.set(body.email, user);
    state.usersByUid.set(userUid, user);
    writeEnvelope(response, null);
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/auth/email/password-login") {
    const body = await readJsonBody(request);
    const user = state.usersByEmail.get(body.email);
    if (!user || user.password !== body.password) {
      writeError(response, 200, 410101, "邮箱或密码错误");
      return;
    }
    writeEnvelope(response, createAuthPayload(user));
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/auth/email/code-login") {
    const body = await readJsonBody(request);
    const user = state.usersByEmail.get(body.email);
    const expectedCode = state.emailCodes.get(`${body.email}:login`) ?? "123456";
    if (!user || body.emailCode !== expectedCode) {
      writeError(response, 200, 410103, "验证码错误");
      return;
    }
    writeEnvelope(response, createAuthPayload(user));
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/auth/email/reset-password") {
    const body = await readJsonBody(request);
    const user = state.usersByEmail.get(body.email);
    const expectedCode = state.emailCodes.get(`${body.email}:reset_password`) ?? "123456";
    if (!user || body.emailCode !== expectedCode) {
      writeError(response, 200, 410104, "验证码已失效");
      return;
    }
    user.password = body.newPassword;
    writeEnvelope(response, null);
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/auth/refresh-token") {
    const body = await readJsonBody(request);
    const refreshToken = state.refreshTokens.get(body.refreshToken);
    if (!refreshToken) {
      writeError(response, 401, 401001, "登录状态已失效，请重新登录");
      return;
    }
    const user = state.usersByUid.get(refreshToken.userUid);
    writeEnvelope(response, createAuthPayload(user, body.refreshToken));
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/auth/logout") {
    const authUser = requireAuth(request, response);
    if (!authUser) {
      return;
    }
    const body = await readJsonBody(request);
    if (body.refreshToken) {
      state.refreshTokens.delete(body.refreshToken);
    }
    writeEnvelope(response, null);
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/user/me") {
    const authUser = requireAuth(request, response);
    if (!authUser) {
      return;
    }
    writeEnvelope(response, {
      userUid: authUser.userUid,
      displayUserId: authUser.displayUserId,
      nickname: authUser.nickname,
      avatarUrl: authUser.avatarUrl
    });
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/user/search") {
    const authUser = requireAuth(request, response);
    if (!authUser) {
      return;
    }
    const keyword = (url.searchParams.get("keyword") ?? "").toLowerCase();
    const contacts = state.contactsByUser.get(authUser.userUid) ?? new Map();
    const results = [...state.usersByUid.values()]
      .filter((user) => user.userUid !== authUser.userUid)
      .filter((user) => {
        const values = [user.nickname, user.displayUserId, user.userUid].map((value) => value.toLowerCase());
        return values.some((value) => value.includes(keyword));
      })
      .map((user) => ({
        userUid: user.userUid,
        displayUserId: user.displayUserId,
        nickname: user.nickname,
        avatarUrl: user.avatarUrl,
        matchType: user.nickname.toLowerCase().includes(keyword) ? "nickname" : "display_user_id",
        alreadyAdded: contacts.has(user.userUid)
      }));
    writeEnvelope(response, results);
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/contact/list") {
    const authUser = requireAuth(request, response);
    if (!authUser) {
      return;
    }
    const contacts = [...(state.contactsByUser.get(authUser.userUid) ?? new Map()).values()];
    writeEnvelope(response, contacts.sort((left, right) => right.lastMessageAt - left.lastMessageAt));
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/contact/recent") {
    const authUser = requireAuth(request, response);
    if (!authUser) {
      return;
    }
    const limit = Number(url.searchParams.get("limit") ?? "4");
    const recentContacts = [...(state.recentContactsByUser.get(authUser.userUid) ?? [])]
      .sort((left, right) => right.createdAt - left.createdAt)
      .slice(0, limit);
    writeEnvelope(response, recentContacts);
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/contact/add") {
    const authUser = requireAuth(request, response);
    if (!authUser) {
      return;
    }
    const body = await readJsonBody(request);
    const peer = state.usersByUid.get(body.peerUid);
    if (!peer) {
      writeError(response, 200, 404001, "联系人不存在");
      return;
    }
    const now = Date.now();
    upsertContact(authUser.userUid, peer, body.remarkName ?? "", now);
    addRecentContact(authUser.userUid, peer, now);
    writeEnvelope(response, null);
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/conversation/list") {
    const authUser = requireAuth(request, response);
    if (!authUser) {
      return;
    }
    const conversations = getUserConversations(authUser.userUid);
    writeEnvelope(response, conversations);
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/conversation/single") {
    const authUser = requireAuth(request, response);
    if (!authUser) {
      return;
    }
    const body = await readJsonBody(request);
    const peer = state.usersByUid.get(body.peerUid);
    if (!peer) {
      writeError(response, 200, 404001, "联系人不存在");
      return;
    }
    const conversation = ensureConversation(authUser.userUid, peer.userUid);
    writeEnvelope(response, toConversationItem(authUser.userUid, conversation));
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/conversation/clear-unread") {
    const authUser = requireAuth(request, response);
    if (!authUser) {
      return;
    }
    const body = await readJsonBody(request);
    const conversation = state.conversationsById.get(body.conversationId);
    if (conversation) {
      conversation.unreadCountByUser.set(authUser.userUid, 0);
    }
    writeEnvelope(response, null);
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/message/history") {
    const authUser = requireAuth(request, response);
    if (!authUser) {
      return;
    }
    const conversationId = url.searchParams.get("conversationId");
    const conversation = conversationId ? state.conversationsById.get(conversationId) : null;
    if (!conversation || !conversation.participants.includes(authUser.userUid)) {
      writeError(response, 200, 404002, "会话不存在");
      return;
    }
    writeEnvelope(response, {
      list: [...(state.messagesByConversation.get(conversationId) ?? [])],
      nextCursor: null,
      hasMore: false
    });
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/message/send") {
    const authUser = requireAuth(request, response);
    if (!authUser) {
      return;
    }
    const body = await readJsonBody(request);
    const message = createStoredMessage(authUser.userUid, body);
    writeEnvelope(response, message);
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/message/read") {
    const authUser = requireAuth(request, response);
    if (!authUser) {
      return;
    }
    const body = await readJsonBody(request);
    const conversation = state.conversationsById.get(body.conversationId);
    if (conversation) {
      conversation.unreadCountByUser.set(authUser.userUid, 0);
    }
    const messages = state.messagesByConversation.get(body.conversationId) ?? [];
    for (const message of messages) {
      if (body.messageIds?.includes(message.messageId)) {
        message.serverStatus = "read";
      }
    }
    writeEnvelope(response, null);
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/file/upload-sign") {
    const authUser = requireAuth(request, response);
    if (!authUser) {
      return;
    }
    const body = await readJsonBody(request);
    const fileId = `f_${state.nextFileId++}`;
    state.pendingUploads.set(fileId, {
      fileName: body.fileName,
      mimeType: body.mimeType || "application/octet-stream",
      fileSize: body.fileSize || 0
    });
    writeEnvelope(response, {
      fileId,
      uploadUrl: `${hostedBaseUrl()}/api/file/upload/${fileId}`,
      storageKey: `chat/e2e/${fileId}/${body.fileName}`,
      headers: {
        "Content-Type": body.mimeType || "application/octet-stream"
      }
    });
    return;
  }

  if (request.method === "PUT" && url.pathname.startsWith("/api/file/upload/")) {
    const fileId = url.pathname.split("/").pop();
    const pending = fileId ? state.pendingUploads.get(fileId) : null;
    if (!pending) {
      writeError(response, 404, 404003, "上传签名不存在");
      return;
    }
    const buffer = await readRawBody(request);
    state.filesById.set(fileId, {
      ...pending,
      buffer
    });
    writeCorsHeaders(response);
    response.writeHead(200);
    response.end();
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/file/complete") {
    const authUser = requireAuth(request, response);
    if (!authUser) {
      return;
    }
    const body = await readJsonBody(request);
    const uploaded = state.filesById.get(body.fileId);
    if (!uploaded) {
      writeError(response, 404, 404004, "文件不存在");
      return;
    }
    writeEnvelope(response, {
      fileId: body.fileId,
      fileName: uploaded.fileName,
      mimeType: uploaded.mimeType,
      fileSize: uploaded.fileSize,
      accessUrl: `${hostedBaseUrl()}/api/file/content/${body.fileId}`,
      downloadUrl: `${hostedBaseUrl()}/api/file/content/${body.fileId}?download=true`,
      encryptFlag: false
    });
    return;
  }

  if (request.method === "GET" && url.pathname.startsWith("/api/file/content/")) {
    const fileId = url.pathname.split("/").pop();
    const file = fileId ? state.filesById.get(fileId) : null;
    if (!file) {
      writeError(response, 404, 404004, "文件不存在");
      return;
    }
    writeCorsHeaders(response);
    response.writeHead(200, {
      "Content-Type": file.mimeType,
      "Content-Length": String(file.buffer.length),
      "Content-Disposition": url.searchParams.get("download") === "true" ? `attachment; filename="${encodeURIComponent(file.fileName)}"` : "inline"
    });
    response.end(file.buffer);
    return;
  }

  writeError(response, 404, 404000, `Unhandled route: ${request.method} ${url.pathname}`);
});

const wsServer = new WebSocketServer({ noServer: true });

server.on("upgrade", (request, socket, head) => {
  const url = new URL(request.url ?? "/", `http://${request.headers.host}`);
  if (url.pathname !== "/ws/chat") {
    socket.destroy();
    return;
  }
  const accessToken = url.searchParams.get("token");
  const tokenRecord = accessToken ? state.accessTokens.get(accessToken) : null;
  if (!tokenRecord) {
    socket.destroy();
    return;
  }

  wsServer.handleUpgrade(request, socket, head, (ws) => {
    ws.userUid = tokenRecord.userUid;
    const sockets = state.socketsByUser.get(tokenRecord.userUid) ?? new Set();
    sockets.add(ws);
    state.socketsByUser.set(tokenRecord.userUid, sockets);

    ws.on("message", (raw) => {
      handleSocketMessage(ws, raw.toString());
    });

    ws.on("close", () => {
      sockets.delete(ws);
      if (sockets.size === 0) {
        state.socketsByUser.delete(tokenRecord.userUid);
      }
    });
  });
});

server.listen(port, host, () => {
  process.stdout.write(`mock backend listening on http://${host}:${port}\n`);
});

function createInitialState() {
  const usersByEmail = new Map();
  const usersByUid = new Map();
  const reader = {
    userUid: "u_1001",
    displayUserId: "hide_1001",
    email: "reader@example.com",
    nickname: "Reader",
    password: "Pass1234",
    avatarUrl: null
  };
  const anna = {
    userUid: "u_2001",
    displayUserId: "hide_2001",
    email: "anna@example.com",
    nickname: "Anna",
    password: "Pass1234",
    avatarUrl: null
  };
  usersByEmail.set(reader.email, reader);
  usersByEmail.set(anna.email, anna);
  usersByUid.set(reader.userUid, reader);
  usersByUid.set(anna.userUid, anna);

  return {
    luckyNumber: "2468",
    nextUserId: 3001,
    nextConversationId: 4001,
    nextFileId: 5001,
    usersByEmail,
    usersByUid,
    emailCodes: new Map(),
    accessTokens: new Map(),
    refreshTokens: new Map(),
    contactsByUser: new Map(),
    recentContactsByUser: new Map(),
    conversationsById: new Map(),
    conversationIdsByPair: new Map(),
    messagesByConversation: new Map(),
    pendingUploads: new Map(),
    filesById: new Map(),
    socketsByUser: new Map()
  };
}

function createAuthPayload(user, existingRefreshToken) {
  const accessToken = `access-${randomUUID()}`;
  const refreshToken = existingRefreshToken ?? `refresh-${randomUUID()}`;
  state.accessTokens.set(accessToken, { userUid: user.userUid });
  state.refreshTokens.set(refreshToken, { userUid: user.userUid });
  return {
    accessToken,
    refreshToken,
    expiresIn: 7200,
    userInfo: {
      userUid: user.userUid,
      nickname: user.nickname,
      avatarUrl: user.avatarUrl
    }
  };
}

function requireAuth(request, response) {
  const authorization = request.headers.authorization ?? "";
  const accessToken = authorization.startsWith("Bearer ") ? authorization.slice("Bearer ".length) : "";
  const tokenRecord = state.accessTokens.get(accessToken);
  if (!tokenRecord) {
    writeError(response, 401, 401001, "登录状态已失效，请重新登录");
    return null;
  }
  return state.usersByUid.get(tokenRecord.userUid) ?? null;
}

function ensureConversation(leftUserUid, rightUserUid) {
  const pairKey = [leftUserUid, rightUserUid].sort().join(":");
  const existingId = state.conversationIdsByPair.get(pairKey);
  if (existingId) {
    return state.conversationsById.get(existingId);
  }

  const conversation = {
    conversationId: `c_${state.nextConversationId++}`,
    participants: [leftUserUid, rightUserUid],
    lastMessagePreview: "",
    lastMessageType: "text",
    lastMessageAt: Date.now(),
    unreadCountByUser: new Map([
      [leftUserUid, 0],
      [rightUserUid, 0]
    ])
  };

  state.conversationsById.set(conversation.conversationId, conversation);
  state.conversationIdsByPair.set(pairKey, conversation.conversationId);
  state.messagesByConversation.set(conversation.conversationId, []);
  return conversation;
}

function getUserConversations(userUid) {
  return [...state.conversationsById.values()]
    .filter((conversation) => conversation.participants.includes(userUid))
    .map((conversation) => toConversationItem(userUid, conversation))
    .sort((left, right) => right.lastMessageAt - left.lastMessageAt);
}

function toConversationItem(userUid, conversation) {
  const peerUid = conversation.participants.find((participant) => participant !== userUid);
  const peer = state.usersByUid.get(peerUid);
  const contact = state.contactsByUser.get(userUid)?.get(peerUid);

  return {
    conversationId: conversation.conversationId,
    peerUid,
    peerNickname: peer.nickname,
    peerAvatar: peer.avatarUrl,
    remarkName: contact?.remarkName ?? peer.nickname,
    lastMessagePreview: conversation.lastMessagePreview || "",
    lastMessageType: conversation.lastMessageType,
    lastMessageAt: conversation.lastMessageAt,
    unreadCount: conversation.unreadCountByUser.get(userUid) ?? 0
  };
}

function upsertContact(userUid, peer, remarkName, lastMessageAt) {
  const contacts = state.contactsByUser.get(userUid) ?? new Map();
  contacts.set(peer.userUid, {
    peerUid: peer.userUid,
    displayUserId: peer.displayUserId,
    peerNickname: peer.nickname,
    peerAvatar: peer.avatarUrl,
    remarkName: remarkName || peer.nickname,
    lastMessageAt
  });
  state.contactsByUser.set(userUid, contacts);
}

function addRecentContact(userUid, peer, createdAt) {
  const recentContacts = state.recentContactsByUser.get(userUid) ?? [];
  const deduped = recentContacts.filter((item) => item.peerUid !== peer.userUid);
  deduped.push({
    peerUid: peer.userUid,
    displayUserId: peer.displayUserId,
    peerNickname: peer.nickname,
    peerAvatar: peer.avatarUrl,
    createdAt
  });
  state.recentContactsByUser.set(userUid, deduped);
}

function createStoredMessage(senderUid, body) {
  const conversation = ensureConversation(senderUid, body.receiverUid);
  const message = {
    messageId: body.messageId || `m_${randomUUID()}`,
    conversationId: conversation.conversationId,
    senderUid,
    receiverUid: body.receiverUid,
    messageType: body.messageType || "text",
    payloadType: body.payloadType || "text",
    payload: body.payload,
    fileId: body.fileId ?? null,
    clientMsgTime: body.clientMsgTime ?? Date.now(),
    serverMsgTime: Date.now(),
    serverStatus: "delivered"
  };
  const messages = state.messagesByConversation.get(conversation.conversationId) ?? [];
  const existingIndex = messages.findIndex((item) => item.messageId === message.messageId);
  if (existingIndex >= 0) {
    messages.splice(existingIndex, 1, message);
  } else {
    messages.push(message);
  }
  state.messagesByConversation.set(conversation.conversationId, messages);
  updateConversationAfterMessage(conversation, message);
  upsertContact(senderUid, state.usersByUid.get(body.receiverUid), state.contactsByUser.get(senderUid)?.get(body.receiverUid)?.remarkName ?? "", message.serverMsgTime);
  upsertContact(body.receiverUid, state.usersByUid.get(senderUid), state.contactsByUser.get(body.receiverUid)?.get(senderUid)?.remarkName ?? "", message.serverMsgTime);
  return message;
}

function updateConversationAfterMessage(conversation, message) {
  conversation.lastMessageAt = message.serverMsgTime;
  conversation.lastMessageType = message.messageType;
  conversation.lastMessagePreview = summarizeMessage(message);
  const unreadCount = conversation.unreadCountByUser.get(message.receiverUid) ?? 0;
  conversation.unreadCountByUser.set(message.receiverUid, unreadCount + 1);
}

function summarizeMessage(message) {
  if (message.messageType === "image") {
    return "[图片消息]";
  }
  if (message.messageType === "file") {
    return "[文件消息]";
  }
  return "[文本消息]";
}

function handleSocketMessage(ws, rawMessage) {
  let envelope;
  try {
    envelope = JSON.parse(rawMessage);
  } catch {
    return;
  }

  if (envelope.type === "CHAT_SEND") {
    const message = createStoredMessage(ws.userUid, envelope.data);
    sendSocketMessage(ws.userUid, {
      type: "CHAT_ACK",
      data: {
        messageId: message.messageId,
        message
      }
    });

    if (message.messageType === "text") {
      setTimeout(() => {
        const reply = createStoredMessage(message.receiverUid, {
          conversationId: message.conversationId,
          receiverUid: ws.userUid,
          payload: `自动回复：${message.payload}`,
          messageType: "text",
          payloadType: "text",
          clientMsgTime: Date.now()
        });
        sendSocketMessage(ws.userUid, {
          type: "CHAT_RECEIVE",
          data: reply
        });
      }, 150);
    }
    return;
  }

  if (envelope.type === "CHAT_READ") {
    const conversation = state.conversationsById.get(envelope.data.conversationId);
    if (conversation) {
      conversation.unreadCountByUser.set(ws.userUid, 0);
    }
  }
}

function sendSocketMessage(userUid, payload) {
  const sockets = state.socketsByUser.get(userUid);
  if (!sockets) {
    return;
  }
  for (const socket of sockets) {
    if (socket.readyState === 1) {
      socket.send(JSON.stringify(payload));
    }
  }
}

function broadcastClose(targetState, reason) {
  for (const sockets of targetState.socketsByUser.values()) {
    for (const socket of sockets) {
      socket.close(1000, reason);
    }
  }
}

function writeEnvelope(response, data) {
  writeJson(response, 200, {
    code: 0,
    message: "ok",
    data
  });
}

function writeError(response, status, code, message) {
  writeJson(response, status, {
    code,
    message,
    data: null
  });
}

function writeJson(response, status, body) {
  const payload = JSON.stringify(body);
  writeCorsHeaders(response);
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(payload)
  });
  response.end(payload);
}

function writeCorsHeaders(response) {
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  response.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,OPTIONS");
}

async function readJsonBody(request) {
  const body = await readRawBody(request);
  return body.length > 0 ? JSON.parse(body.toString("utf-8")) : {};
}

async function readRawBody(request) {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

function hostedBaseUrl() {
  return `http://${host}:${port}`;
}
