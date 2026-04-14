# WebSocket 使用分析

## 1. 分析目标

本文档基于以下材料，梳理 HideChat 项目中 WebSocket 的设计定位、实际实现方式、前后端调用路径、消息协议、测试覆盖与当前差异：

- 设计文档：`docs/tech-design/HideChat技术方案文档 v1.0.md`
- 接口文档：`docs/api/后端接口定义文档 v1.0.md`
- 测试文档：`docs/test/接口测试清单 Postman Apifox.md`
- 高保真 UI：`mockup/chat-list.html`、`mockup/chat.html`
- 后端实现：`backend/src/main/java/com/hidechat/websocket/*`
- 前端实现：`frontend/src/api/client.ts`、`frontend/src/app/App.tsx`
- 自动化测试：`backend/src/test/java/com/hidechat/websocket/ChatWebSocketHandlerTest.java`、`frontend/tests/e2e/backend-realtime.test.tsx`、`frontend/tests/browser/real-gateway.spec.ts`

结论先行：

- 项目当前使用的是原生 WebSocket，不是 STOMP、SockJS 或 socket.io。
- WebSocket 当前只承载聊天实时能力，具体为消息发送、服务端 ACK、对端消息推送、已读回执通知。
- 设计文档中提到的“在线状态实时订阅”目前没有独立 WebSocket 事件落地。
- 前端对发送消息和已读同步采用“WebSocket 优先，HTTP 回退”的策略。

## 2. 设计文档中的 WebSocket 定位

`docs/tech-design/HideChat技术方案文档 v1.0.md` 明确给出以下设计：

- 前端技术选型为原生 WebSocket。
- 后端模块中单独存在 `websocket`，职责包括在线状态、消息推送、ACK 处理。
- 聊天主链路要求支持实时消息。
- WebSocket 失败时，消息发送允许回退 HTTP。

`docs/api/后端接口定义文档 v1.0.md` 定义的接口边界是：

- 建连地址：`GET /ws/chat`
- 客户端上行事件：
  - `CHAT_SEND`
  - `CHAT_READ`
- 服务端下行事件：
  - `CHAT_RECEIVE`
  - `CHAT_ACK`
  - `CHAT_READ`

从高保真 UI 看，`mockup/chat-list.html` 和 `mockup/chat.html` 对 WebSocket 的产品预期主要有三类：

- 会话列表里的未读数应及时变化。
- 聊天页里的消息应实时到达。
- 聊天头部展示“手机在线/活跃时间”等在线状态摘要。

其中前两类已经有代码支撑，第三类仍停留在设计或静态展示层。

## 3. 后端 WebSocket 实现方式

### 3.1 注册方式

后端在 `backend/src/main/java/com/hidechat/websocket/config/WebSocketConfig.java` 中通过 Spring 原生 `WebSocketConfigurer` 注册处理器：

- 开启方式：`@EnableWebSocket`
- 路径：`/ws/chat`
- Handler：`ChatWebSocketHandler`
- Interceptor：`JwtHandshakeInterceptor`
- 跨域：使用 `SecurityWebProperties.allowedOrigins`

这说明当前架构是“单端点 + 自定义 JSON 协议”的轻量实现，而不是消息代理模型。

### 3.2 握手鉴权

`JwtHandshakeInterceptor` 在握手阶段完成鉴权：

- 优先读取 `Authorization: Bearer <token>`
- 如果 Header 不存在，则回退读取查询参数 `token`
- 仅允许 `access token`
- 鉴权成功后将 `userUid` 写入 session attributes
- 失败直接返回 `401`

当前前端采用的是查询参数传 token 的方式，因此实际建连形式是：

```text
ws://host/ws/chat?token=<accessToken>
```

### 3.3 会话管理

`WebSocketSessionRegistry` 负责维护在线用户与 session 的映射：

- `put(userUid, session)`
- `get(userUid)`
- `remove(userUid)`

当前实现是 `Map<String, WebSocketSession>`，意味着：

- 一个用户只保留一个活动 session
- 新连接会覆盖旧连接
- 这与前端 mock 网关里支持“一用户多连接”的实现并不一致

因此，如果未来需要多端同时在线，后端这里需要扩展为 `Map<String, Set<WebSocketSession>>`。

### 3.4 消息限流

`WebSocketRateLimiter` 以“用户 + 分钟窗口”维度做限流：

- 配置项：`hidechat.security.web.websocket-messages-per-minute`
- 默认值：`120`
- 超限时服务端返回 `CHAT_ERROR`

当前限流只作用于 `CHAT_SEND`，未看到对 `CHAT_READ` 的单独限流。

## 4. 后端消息处理路径

### 4.1 建连后注册在线会话

`ChatWebSocketHandler.afterConnectionEstablished` 在连接建立后：

- 从 session attributes 读取 `userUid`
- 写入 `WebSocketSessionRegistry`

连接关闭时，`afterConnectionClosed` 会把该用户移除。

### 4.2 `CHAT_SEND` 处理

客户端发送：

```json
{
  "type": "CHAT_SEND",
  "data": {
    "messageId": "m_xxx",
    "conversationId": "c_xxx",
    "receiverUid": "u_xxx",
    "messageType": "text|image|file",
    "payloadType": "plain|ref",
    "payload": "...",
    "fileId": "f_xxx",
    "clientMsgTime": 1712300000000
  }
}
```

服务端处理流程如下：

1. `ChatWebSocketHandler.handleTextMessage` 解析 JSON 为 `WebSocketMessageDTO`
2. 根据 `type=CHAT_SEND` 进入 `handleChatSend`
3. 先做 WebSocket 频控校验
4. 将 `data` 转成 `SendMessageRequest`
5. 调用 `MessageService.sendMessage(senderUid, request)`
6. `MessageServiceImpl` 完成真实业务落库与校验：
   - 校验当前用户属于会话
   - 校验 `receiverUid` 确实是会话对端
   - 校验 `messageType` / `payloadType`
   - 写入 `im_message`
   - 更新 `im_conversation`
   - 更新联系人最近消息时间
   - 增加接收方未读数
7. 服务端向发送方返回 `CHAT_ACK`
8. 如果接收方当前在线，则向接收方推送 `CHAT_RECEIVE`

这里可以看出，WebSocket 只承担实时入口与推送，真正的业务规则仍然在 Service 层，分层是正确的，没有绕过 `MessageService`。

### 4.3 `CHAT_ACK` 的语义

服务端返回给发送方的 ACK 包结构是：

```json
{
  "type": "CHAT_ACK",
  "data": {
    "messageId": "m_xxx",
    "status": "server_received",
    "message": {
      "...": "服务端持久化后的 MessageItemVO"
    }
  }
}
```

它的实际作用有两个：

- 告诉发送方该消息已被服务端接收并入库
- 返回规范化后的消息对象，用于前端把乐观消息替换成服务端消息

需要注意的是，`status` 写的是 `server_received`，而 `message.serverStatus` 通常是 `delivered`。这两个字段语义并不完全一致，前端当前优先使用 `message` 对象本身。

### 4.4 `CHAT_RECEIVE` 的语义

接收方在线时，服务端会推送：

```json
{
  "type": "CHAT_RECEIVE",
  "data": {
    "...": "MessageItemVO"
  }
}
```

该消息代表“对端新消息到达”，前端收到后直接追加到消息流，并刷新会话列表预览与未读数。

### 4.5 `CHAT_READ` 处理

客户端上行：

```json
{
  "type": "CHAT_READ",
  "data": {
    "conversationId": "c_xxx",
    "messageIds": ["m_1", "m_2"]
  }
}
```

服务端处理流程：

1. `handleChatRead` 将 `data` 转为 `MarkMessageReadRequest`
2. 调用 `MessageService.markMessagesRead(readerUid, request)`
3. Service 层校验会话成员身份
4. 校验这些消息确实属于该会话且接收者是当前用户
5. 写入已读回执表并更新消息状态为 `read`
6. 刷新当前用户在该会话的未读计数
7. 解析会话对端 `peerUid`
8. 若对端在线，向对端推送 `CHAT_READ`

服务端下行给消息发送者的包结构为：

```json
{
  "type": "CHAT_READ",
  "data": {
    "conversationId": "c_xxx",
    "messageIds": ["m_1", "m_2"],
    "readerUid": "u_xxx",
    "readAt": 1712620800000
  }
}
```

这使得发送方可以把对应消息状态更新为已读。

## 5. 前端 WebSocket 使用方式

### 5.1 建连入口

前端在 `frontend/src/api/client.ts` 中封装 `createChatWebSocket(accessToken)`：

- 优先使用环境变量 `VITE_WS_BASE_URL`
- 否则默认拼接当前站点的 `/ws/chat`
- 自动根据页面协议选择 `ws:` 或 `wss:`
- 最终把 `token` 追加到 query string

`frontend/src/app/App.tsx` 中由 `useEffect` 控制连接生命周期：

- 条件：存在 `session.tokens.accessToken` 且当前 `screen === "chat"`
- 满足条件时建立连接
- 离开聊天页或 session 失效时关闭连接
- 返回伪装页、退出登录时也会主动关闭连接

这与设计文档“进入聊天页开启实时连接，返回伪装页关闭连接”的要求一致。

### 5.2 前端下行事件消费

`App.tsx` 中的 `socket.onmessage` 只处理三类消息：

- `CHAT_RECEIVE`
  - 调用 `applyIncomingMessage`
  - 追加消息
  - 更新会话列表最后消息摘要、最后时间、未读数
- `CHAT_ACK`
  - 调用 `reconcileAck`
  - 用服务端消息替换本地乐观消息，或者至少更新状态
- `CHAT_READ`
  - 调用 `applyReadReceipt`
  - 将指定消息状态标记为 `read`

当前前端没有处理：

- `CHAT_ERROR`
- 在线状态变更事件
- 心跳/重连事件
- 服务端主动断连后的重连策略

因此当前连接是“可用但轻量”的实时实现，不是强韧型长连接实现。

### 5.3 发送消息时的 WebSocket 优先策略

`dispatchOutgoingMessage` 的核心逻辑是：

1. 先创建 optimistic message 并插入本地状态
2. 若 `wsRef.current` 存在且连接已 `OPEN`
   - 通过 WebSocket 发送 `CHAT_SEND`
3. 若 WebSocket 不可用
   - 回退调用 `POST /api/message/send`
4. HTTP 失败时
   - 回滚乐观消息
   - 文本消息恢复到输入框

这正对应设计文档里的“WebSocket 失败：回退 HTTP 消息发送”。

### 5.4 已读同步时的 WebSocket 优先策略

`syncReadState` 的逻辑与发送消息一致：

- WebSocket 可用时发送 `CHAT_READ`
- 否则调用 `POST /api/message/read`
- 成功后本地先行应用已读状态

因此“已读同步”也不是纯 WebSocket 绑定，而是具备 HTTP 降级路径。

## 6. WebSocket 与页面交互关系

结合 mockup 与当前前端实现，可以把 WebSocket 对 UI 的作用总结为：

### 6.1 聊天页

- 发送文本、图片、文件消息时优先走实时通道
- 收到 `CHAT_ACK` 后修正本地消息状态
- 收到 `CHAT_RECEIVE` 后实时展示对端消息
- 打开会话后会对未读消息执行已读同步

### 6.2 会话列表

- 新消息到达后会更新最后一条消息的脱敏预览
- 新消息到达后会更新 `lastMessageAt`
- 接收方未读数会在前端状态中递增

这与 `mockup/chat-list.html` 中“预览 + 未读数”的展示诉求是一致的。

### 6.3 在线状态

设计和 mockup 都把在线状态视为聊天页的重要信息，但当前代码里：

- 没有 `ONLINE_STATUS_CHANGED` 之类的事件
- 没有后端在线状态广播逻辑
- 没有前端在线状态 store 或订阅逻辑

所以目前页面上的“在线状态受保护”更接近占位文案，而不是实时 WebSocket 数据。

## 7. 测试中如何使用 WebSocket

### 7.1 后端单元测试

`backend/src/test/java/com/hidechat/websocket/ChatWebSocketHandlerTest.java` 覆盖了三类核心行为：

- 连接建立与关闭时 session 注册/移除
- `CHAT_SEND` 后对发送者 ACK、对接收者推送
- `CHAT_READ` 后调用已读业务并通知对端

这说明后端 WebSocket 的最小主链路已经有单元测试保护。

### 7.2 前端伪 E2E

`frontend/tests/e2e/backend-realtime.test.tsx` 通过 `MockWebSocket` 验证：

- 进入聊天后会自动建连
- 发送文本消息会下发 `CHAT_SEND`
- 前端能消费 `CHAT_ACK`
- 前端能消费 `CHAT_RECEIVE`
- 图片和文件消息也会通过同一路径发送

这覆盖了前端 UI 和 WebSocket 的联动逻辑。

### 7.3 浏览器真实网关测试

`frontend/tests/browser/real-gateway.spec.ts` 走真实浏览器，验证：

- 注册、登录、添加联系人、建会话
- 文本消息发送
- 图片消息发送
- 文件消息发送
- 返回伪装页后再恢复聊天

虽然该用例没有直接断言浏览器里的 WebSocket 帧内容，但它验证了真实网关场景下的消息链路结果。

### 7.4 Mock 网关实现

`frontend/tests/fixtures/e2e/mock-backend.mjs` 自己实现了 `/ws/chat`：

- 通过 `token` 查询参数鉴权
- 响应 `CHAT_SEND`
- 生成 `CHAT_ACK`
- 模拟自动回复并下发 `CHAT_RECEIVE`
- 接收 `CHAT_READ`

这个 mock 行为与正式后端协议基本一致，适合作为前端自动化测试桩。

## 8. 当前实现与设计的差异

### 8.1 已实现的部分

- 原生 WebSocket 单通道聊天
- 握手 JWT 鉴权
- 实时消息发送
- 服务端 ACK
- 对端消息推送
- 已读回执通知
- WebSocket 不可用时 HTTP 回退

### 8.2 尚未落地或不完整的部分

- 在线状态实时订阅未落地
- 无心跳机制
- 无自动重连机制
- 无断线重发机制
- 无 `CHAT_ERROR` 前端展示处理
- 后端仅支持单用户单 session

### 8.3 文档与实现不完全一致的点

- 设计文档把 `websocket` 的职责写成“在线状态、消息推送、ACK 处理”，但当前代码只完整覆盖了后两者。
- mock 网关允许一用户多连接，而正式后端 session registry 只保留单连接。
- 高保真 UI 中“手机在线/最近活跃”是明显界面元素，但当前没有对应实时协议。

## 9. 整体时序总结

### 9.1 发送消息时序

```text
前端输入消息
-> 本地先插入 optimistic message
-> WebSocket 发送 CHAT_SEND
-> 后端 ChatWebSocketHandler 收包
-> MessageService 落库并更新会话/未读
-> 服务端返回 CHAT_ACK 给发送方
-> 若接收方在线，推送 CHAT_RECEIVE 给接收方
-> 前端更新消息状态与会话摘要
```

### 9.2 已读时序

```text
前端进入会话并识别未读消息
-> WebSocket 发送 CHAT_READ
-> 后端 markMessagesRead
-> 更新消息已读状态与未读计数
-> 若对端在线，向对端推送 CHAT_READ
-> 发送方前端把对应消息标记为 read
```

### 9.3 降级时序

```text
若 WebSocket 未连接
-> 发送消息回退 POST /api/message/send
-> 已读同步回退 POST /api/message/read
-> 主聊天链路仍可继续
```

## 10. 结论

HideChat 当前的 WebSocket 方案是一个围绕聊天主链路的“轻协议、轻连接”实现：

- 优点是结构简单，前后端边界清晰，核心业务仍然沉在 Service 层，没有把业务写进 WebSocket 层。
- 当前已经满足实时消息、ACK、已读同步和失败回退这几个核心能力。
- 若后续要继续贴近 PRD 和高保真 UI，还需要补齐在线状态事件、连接保活、断线重连、多端在线和更完整的错误处理。

如果后续继续扩展，建议优先级如下：

1. 先补前端对 `CHAT_ERROR` 的处理，避免限流时用户无感知。
2. 再补连接状态管理、心跳与自动重连。
3. 最后再扩展在线状态广播与多端 session 管理。
