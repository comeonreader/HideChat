# 技术方案文档 v1.0

## 项目名称

HideChat 隐私伪装聊天 Web 应用

## 文档版本

v1.0

## 技术方案负责人视角

技术架构师

---

# 1. 项目背景

本项目目标是构建一个支持**手机浏览器 + PC 浏览器**使用的 Web 聊天应用。产品核心不是“强匿名通信”，而是：

* 通过“今日运势”页面完成**伪装入口**
* 支持用户自定义“今日幸运数字”
* 输入幸运数字后进入聊天系统
* 展示所有聊过天的用户列表
* 进入某个 1V1 聊天界面前，必须输入 **PIN code**
* PIN 用于解密**浏览器本地持久化缓存**中的历史消息
* 历史消息默认不可见，只有输入 PIN 后才能查看
* 支持文字、图片消息
* 核心目标是：**防止他人随手拿到手机/电脑后直接看到聊天记录**

---

# 2. 建设目标

## 2.1 产品目标

实现一个“**轻隐私 + 伪装入口 + 本地加密缓存**”的聊天系统。

## 2.2 技术目标

实现以下关键技术能力：

1. Web 端伪装入口机制
2. 浏览器本地加密缓存
3. 会话级 PIN 解锁
4. 实时聊天能力
5. 服务端仅中转和管理元数据，不持有浏览器本地历史明文
6. 架构可扩展，为未来 E2EE 升级预留空间

---

# 3. 非目标范围

当前版本不做以下能力：

1. 不做原生 App
2. 不做群聊
3. 不做多设备密钥同步
4. 不做 Signal 双棘轮
5. 不做真正意义上的强端到端加密体系
6. 不做通讯录导入
7. 不做复杂社交关系链
8. 不做聊天记录云端可恢复
9. 不做音视频通话
10. 不承诺“绝对防破解”或“绝对防截屏”

---

# 4. 总体架构设计

# 4.1 架构概览

系统采用**前后端分离**架构，前端负责页面展示、本地加解密和 IndexedDB 持久化；后端负责账号、联系人元数据、实时消息路由、消息中转与离线补偿。

整体分层如下：

```text
┌────────────────────────────────────────────┐
│                  Web 前端                  │
│ React/Vue（建议 React）                    │
│                                            │
│ 1. 运势伪装页                              │
│ 2. 幸运数字校验                            │
│ 3. 聊天列表页                              │
│ 4. PIN 解锁层                              │
│ 5. 聊天窗口                                │
│ 6. IndexedDB 本地密文缓存                  │
│ 7. Web Crypto API 加解密                   │
│ 8. WebSocket 客户端                        │
└────────────────────┬───────────────────────┘
                     │ HTTPS / WSS
┌────────────────────▼───────────────────────┐
│              Spring Boot 后端              │
│                                            │
│ 1. API 网关 / REST API                     │
│ 2. 认证与会话服务                          │
│ 3. 联系人/会话索引服务                     │
│ 4. WebSocket 消息网关                      │
│ 5. 消息路由服务                            │
│ 6. 离线消息缓存服务                        │
│ 7. 图片对象存储服务                        │
└───────────────┬───────────────┬────────────┘
                │               │
       ┌────────▼──────┐  ┌────▼─────────┐
       │ PostgreSQL    │  │ Redis         │
       │ 用户/联系人/  │  │ 在线状态/会话 │
       │ 会话元数据    │  │ 映射/短期缓存 │
       └───────────────┘  └───────────────┘

                ┌──────────────────────┐
                │ MinIO / S3（可选）   │
                │ 加密图片对象存储     │
                └──────────────────────┘
```

---

# 4.2 架构设计原则

## 4.2.1 前端负责隐私保护

* 幸运数字只用于入口伪装
* PIN 用于解密本地聊天历史
* 本地历史消息加密后存储在浏览器中
* 服务端不负责解密浏览器历史消息

## 4.2.2 后端负责“中转 + 元数据”

* 负责路由消息
* 负责维护联系人、会话索引
* 负责离线消息短暂存储
* 不参与浏览器本地历史记录解密

## 4.2.3 明确安全边界

本方案目标是：

* 防止**随手查看**
* 提高**隐私门槛**

不是：

* 对抗高级取证
* 对抗浏览器被攻陷
* 对抗设备 root / 越狱 / 远程注入

---

# 5. 核心业务流程

# 5.1 首次使用流程

```text
访问首页
→ 展示今日运势页
→ 用户点击“设置入口”
→ 设置幸运数字
→ 设置幸运数字 hash 并保存本地
→ 进入聊天系统
→ 首次选择一个联系人开始聊天
→ 设置该会话 PIN
→ 生成会话密钥并加密保存到本地
→ 正常聊天
```

---

# 5.2 日常进入流程

```text
访问首页
→ 展示今日运势页
→ 输入幸运数字
→ 前端校验 hash
→ 成功则进入聊天列表
→ 点击某个联系人
→ 弹出 PIN 输入框
→ PIN 校验成功
→ 解密本地会话密钥
→ 解密并展示历史聊天
→ 继续聊天
```

---

# 5.3 收消息流程

```text
对方发送消息
→ 服务端接收密文/消息体
→ 路由到当前在线用户
→ 前端收到消息
→ 如果会话已解锁：直接解密显示并持久化
→ 如果会话未解锁：仅存储加密消息，界面不展示明文
→ 用户后续输入 PIN 后再解密历史记录
```

---

# 5.4 一键隐藏流程

```text
用户点击“紧急隐藏”
→ 前端清空当前页面敏感状态
→ 关闭聊天窗口
→ 清除内存中的会话密钥
→ 跳转回运势页
→ 历史消息仍存在 IndexedDB，但保持加密态
```

---

# 6. 技术选型

# 6.1 前端建议

虽然本次重点是后端，但整体方案建议如下：

* React + TypeScript
* Vite
* Zustand
* Tailwind CSS
* Dexie.js（IndexedDB 封装）
* Web Crypto API
* 原生 WebSocket

---

# 6.2 后端技术栈

## 核心框架

* Spring Boot 3.x

## Web 层

* Spring Web
* Spring Validation

## 实时通信

* Spring WebSocket

## 安全

* Spring Security
* JWT

## ORM / 数据访问

* MyBatis-Plus 或 JPA
  建议：**MyBatis-Plus**
  原因：
* SQL 可控
* 表结构清晰
* 更适合消息类系统

## 数据库

* PostgreSQL

## 缓存 / 会话 / 在线状态

* Redis

## 对象存储

* MinIO / S3 兼容存储

## 构建

* Maven

## 部署

* Docker + Nginx

---

# 7. 模块拆分

后端建议按单体模块化方式构建，便于 MVP 快速交付。

# 7.1 模块划分

## 7.1.1 auth 模块

职责：

* 登录注册
* JWT 鉴权
* 用户基础身份管理

## 7.1.2 user 模块

职责：

* 用户资料
* 用户搜索
* 联系人关系管理

## 7.1.3 disguise 模块

职责：

* 伪装入口相关接口
* 运势内容下发
* 首页策略

说明：

* 幸运数字本身建议**默认仅前端本地校验**
* 后端只负责运势内容展示和伪装页素材

## 7.1.4 conversation 模块

职责：

* 会话索引
* 联系人会话列表
* 最近消息元数据
* 未读计数

## 7.1.5 message 模块

职责：

* 文本/图片消息处理
* 消息发送
* 消息状态更新
* 离线消息补偿

## 7.1.6 websocket 模块

职责：

* WebSocket 建联
* 在线状态
* 消息推送
* ACK 处理

## 7.1.7 storage 模块

职责：

* 图片上传
* 对象存储管理
* 上传签名策略

## 7.1.8 security 模块

职责：

* 请求鉴权
* 参数签名校验
* XSS/频控/限流

---

# 8. 详细架构设计

# 8.1 认证模型

## 8.1.1 登录方式

MVP 建议支持：

* 用户名/邮箱/手机号 + 密码

后续可以扩展匿名 ID。

## 8.1.2 登录结果

登录后后端签发 JWT：

* accessToken：短期有效，例如 2 小时
* refreshToken：长期有效，例如 7 天

## 8.1.3 WebSocket 鉴权

建立 WebSocket 连接时：

* 通过 Header 或 Query 携带 accessToken
* 后端在握手阶段校验 JWT
* 建立 userId -> session 映射

---

# 8.2 幸运数字设计

# 8.2.1 定位

幸运数字是“**伪装入口密码**”，不承担消息加解密职责。

# 8.2.2 存储策略

建议：

* 用户自定义幸运数字
* 前端通过 PBKDF2 派生 hash 后保存到浏览器本地
* 后端不保存幸运数字明文

示意：

```text
luckyCode + salt -> PBKDF2 -> luckyCodeHash
```

浏览器本地存：

* luckyCodeHash
* salt
* kdf 参数

# 8.2.3 校验策略

* 用户输入幸运数字
* 前端本地派生 hash
* 与本地 luckyCodeHash 比较
* 成功后进入聊天系统
* 失败时不提示“错误”，仅展示正常运势内容

# 8.2.4 为什么不放后端

因为它是伪装入口，不是账号级安全认证。
本地校验更符合“伪装”和“轻隐私”定位。

---

# 8.3 PIN 与会话密钥设计

这是本方案的核心。

# 8.3.1 设计目标

* PIN 用于解锁某个 1V1 会话历史
* 历史消息加密存浏览器
* 不输入 PIN 时无法查看明文

# 8.3.2 设计原则

不要让 PIN 直接成为消息加密密钥。
采用“两层密钥”设计：

```text
PIN -> 派生 KEK（Key Encryption Key）
KEK -> 解密 conversationKey
conversationKey -> 解密该会话所有消息
```

这样好处是：

1. 后续可更换 PIN
2. 可演进为更复杂密钥体系
3. 消息层与 PIN 层解耦

# 8.3.3 首次设置会话 PIN

用户进入某个会话首次设置 PIN 时：

1. 用户输入 PIN
2. 前端随机生成 `conversationKey`
3. 使用 `PBKDF2(pin, pinSalt)` 派生 `KEK`
4. 使用 `KEK` 加密 `conversationKey`
5. 将加密后的 `conversationKey` 保存到 IndexedDB
6. 后续消息统一用 `conversationKey` 加密

# 8.3.4 PIN 校验

前端本地保存：

* pinVerifierHash
* pinSalt
* kdf 参数
* encryptedConversationKey

用户输入 PIN 后：

1. 用 pin + salt 派生 KEK
2. 先验证 pinVerifierHash
3. 成功后解出 conversationKey
4. 将 conversationKey 驻留内存
5. 解密历史消息

---

# 8.4 消息加密设计

# 8.4.1 文本消息

加密算法：

* AES-GCM

字段：

* iv
* ciphertext
* tag（AES-GCM 内部可带）
* createdAt
* messageType

# 8.4.2 图片消息

流程：

1. 前端读取图片 Blob
2. 前端进行压缩和格式标准化
3. 用 conversationKey 加密二进制内容
4. 将加密后的 Blob 上传对象存储
5. 消息体仅传：

   * fileId
   * fileUrl
   * 加密元信息

# 8.4.3 服务端职责

服务端不参与 PIN 解密逻辑，只传输消息载荷和元数据。

---

# 9. 数据模型设计

# 9.1 后端数据库表设计

---

## 9.1.1 用户表 `im_user`

| 字段            | 类型           | 说明      |
| ------------- | ------------ | ------- |
| id            | bigint       | 主键      |
| user_uid      | varchar(64)  | 用户唯一标识  |
| username      | varchar(64)  | 登录名     |
| password_hash | varchar(255) | 密码 hash |
| nickname      | varchar(64)  | 昵称      |
| avatar_url    | varchar(255) | 头像地址    |
| status        | smallint     | 状态      |
| created_at    | timestamp    | 创建时间    |
| updated_at    | timestamp    | 更新时间    |

索引：

* uk_username
* uk_user_uid

---

## 9.1.2 联系人关系表 `im_contact`

| 字段              | 类型          | 说明     |
| --------------- | ----------- | ------ |
| id              | bigint      | 主键     |
| owner_uid       | varchar(64) | 用户 A   |
| peer_uid        | varchar(64) | 用户 B   |
| remark_name     | varchar(64) | 备注名    |
| pinned          | boolean     | 是否置顶   |
| last_message_at | timestamp   | 最后互动时间 |
| created_at      | timestamp   | 创建时间   |
| updated_at      | timestamp   | 更新时间   |

索引：

* idx_owner_uid_last_message_at
* uk_owner_peer

---

## 9.1.3 会话表 `im_conversation`

| 字段                   | 类型           | 说明        |
| -------------------- | ------------ | --------- |
| id                   | bigint       | 主键        |
| conversation_id      | varchar(64)  | 会话 ID     |
| user_a_uid           | varchar(64)  | 参与方 A     |
| user_b_uid           | varchar(64)  | 参与方 B     |
| last_message_id      | varchar(64)  | 最后一条消息 ID |
| last_message_type    | varchar(32)  | 最后消息类型    |
| last_message_preview | varchar(255) | 预览摘要      |
| last_message_at      | timestamp    | 最后消息时间    |
| created_at           | timestamp    | 创建时间      |
| updated_at           | timestamp    | 更新时间      |

说明：

* `last_message_preview` 不建议存敏感明文
* 可以只存固定占位，如 `[文本消息]`、`[图片消息]`

---

## 9.1.4 消息表 `im_message`

| 字段              | 类型          | 说明                        |
| --------------- | ----------- | ------------------------- |
| id              | bigint      | 主键                        |
| message_id      | varchar(64) | 消息唯一 ID                   |
| conversation_id | varchar(64) | 会话 ID                     |
| sender_uid      | varchar(64) | 发送者                       |
| receiver_uid    | varchar(64) | 接收者                       |
| message_type    | varchar(16) | text/image/system         |
| payload_type    | varchar(16) | plain/ref                 |
| payload         | text        | 文本内容或文件引用                 |
| server_status   | varchar(16) | server_received/delivered |
| client_msg_time | bigint      | 客户端消息时间戳                  |
| server_msg_time | timestamp   | 服务端接收时间                   |
| deleted         | boolean     | 逻辑删除                      |

说明：

* 当前方案 1 可以允许 payload 为消息内容，但推荐逐步只存“中转密文或引用”
* 若采用前端本地加密再上传，则 payload 为密文或文件引用

索引：

* uk_message_id
* idx_conversation_id_server_msg_time

---

## 9.1.5 未读计数表 `im_unread_counter`

| 字段              | 类型          | 说明    |
| --------------- | ----------- | ----- |
| id              | bigint      | 主键    |
| owner_uid       | varchar(64) | 归属用户  |
| conversation_id | varchar(64) | 会话 ID |
| unread_count    | int         | 未读数   |
| updated_at      | timestamp   | 更新时间  |

---

## 9.1.6 文件表 `im_file`

| 字段           | 类型           | 说明       |
| ------------ | ------------ | -------- |
| id           | bigint       | 主键       |
| file_id      | varchar(64)  | 文件 ID    |
| uploader_uid | varchar(64)  | 上传者      |
| file_name    | varchar(255) | 文件名      |
| mime_type    | varchar(128) | 类型       |
| file_size    | bigint       | 大小       |
| storage_key  | varchar(255) | 对象存储 key |
| access_url   | varchar(255) | 访问地址     |
| encrypt_flag | boolean      | 是否加密上传   |
| created_at   | timestamp    | 创建时间     |

---

# 9.2 前端 IndexedDB 设计

建议使用 Dexie 封装，数据库名例如：`hidechat_db`

## 9.2.1 表 `app_meta`

* key
* value

存储：

* luckyCodeHash
* luckyCodeSalt
* luckyCodeKdfParams
* theme
* disguiseConfig

## 9.2.2 表 `conversation_index`

* conversationId
* peerUid
* peerNickname
* peerAvatar
* lastMessageAt
* unreadCount
* encryptedConversationKey
* pinSalt
* pinVerifierHash
* locked

## 9.2.3 表 `messages`

* messageId
* conversationId
* senderUid
* messageType
* ciphertext
* iv
* createdAt
* localStatus

## 9.2.4 表 `file_cache`

* fileId
* conversationId
* ciphertextBlob
* iv
* mimeType
* createdAt

---

# 10. API 设计

以下为推荐 API 草案。

# 10.1 认证相关

## 10.1.1 注册

`POST /api/auth/register`

请求：

```json
{
  "username": "alice",
  "password": "123456",
  "nickname": "Alice"
}
```

响应：

```json
{
  "code": 0,
  "message": "success"
}
```

## 10.1.2 登录

`POST /api/auth/login`

请求：

```json
{
  "username": "alice",
  "password": "123456"
}
```

响应：

```json
{
  "code": 0,
  "data": {
    "accessToken": "xxx",
    "refreshToken": "xxx",
    "userInfo": {
      "userUid": "u_1001",
      "nickname": "Alice",
      "avatarUrl": ""
    }
  }
}
```

---

# 10.2 用户与联系人

## 10.2.1 获取当前用户信息

`GET /api/user/me`

## 10.2.2 搜索用户

`GET /api/user/search?keyword=xxx`

## 10.2.3 添加联系人

`POST /api/contact/add`

请求：

```json
{
  "peerUid": "u_1002"
}
```

## 10.2.4 获取联系人/会话列表

`GET /api/conversation/list`

响应：

```json
{
  "code": 0,
  "data": [
    {
      "conversationId": "c_1001",
      "peerUid": "u_1002",
      "peerNickname": "Bob",
      "peerAvatar": "",
      "lastMessageType": "text",
      "lastMessagePreview": "[文本消息]",
      "lastMessageAt": 1712300000000,
      "unreadCount": 2
    }
  ]
}
```

---

# 10.3 消息接口

## 10.3.1 拉取历史消息

`GET /api/message/history?conversationId=xxx&cursor=xxx&pageSize=20`

说明：

* 该接口主要用于跨端补偿或服务端中转消息
* 浏览器本地已有缓存的情况下，前端优先读本地 IndexedDB

## 10.3.2 消息已读

`POST /api/message/read`

请求：

```json
{
  "conversationId": "c_1001",
  "messageIds": ["m1", "m2"]
}
```

---

# 10.4 文件上传接口

## 10.4.1 获取上传签名

`POST /api/file/upload-sign`

## 10.4.2 上传完成回调

`POST /api/file/complete`

请求：

```json
{
  "fileId": "f_1001",
  "storageKey": "chat/2026/04/06/abc.bin",
  "mimeType": "image/jpeg",
  "fileSize": 123456,
  "encryptFlag": true
}
```

---

# 11. WebSocket 协议设计

# 11.1 连接地址

`wss://domain/ws/chat`

鉴权：

* 握手时携带 JWT

---

# 11.2 消息类型定义

## 11.2.1 客户端发送文本消息

```json
{
  "type": "CHAT_SEND",
  "data": {
    "messageId": "m_1001",
    "conversationId": "c_1001",
    "receiverUid": "u_1002",
    "messageType": "text",
    "payload": "ciphertext or plain payload",
    "clientMsgTime": 1712300000000
  }
}
```

## 11.2.2 客户端发送图片消息

```json
{
  "type": "CHAT_SEND",
  "data": {
    "messageId": "m_1002",
    "conversationId": "c_1001",
    "receiverUid": "u_1002",
    "messageType": "image",
    "payload": {
      "fileId": "f_1001",
      "fileUrl": "https://xxx/abc.bin"
    },
    "clientMsgTime": 1712300000000
  }
}
```

## 11.2.3 服务端推送新消息

```json
{
  "type": "CHAT_RECEIVE",
  "data": {
    "messageId": "m_1001",
    "conversationId": "c_1001",
    "senderUid": "u_1002",
    "messageType": "text",
    "payload": "ciphertext or plain payload",
    "serverMsgTime": 1712300001000
  }
}
```

## 11.2.4 ACK 回执

```json
{
  "type": "CHAT_ACK",
  "data": {
    "messageId": "m_1001",
    "status": "RECEIVED"
  }
}
```

## 11.2.5 已读回执

```json
{
  "type": "CHAT_READ",
  "data": {
    "conversationId": "c_1001",
    "messageIds": ["m_1001"]
  }
}
```

---

# 11.3 WebSocket 服务端处理逻辑

1. 校验 token
2. 绑定 userUid 和 sessionId
3. 建立 Redis 在线映射
4. 收到消息后：

   * 持久化消息
   * 更新会话索引
   * 判断接收方是否在线
   * 在线则实时推送
   * 离线则写入离线消息队列
5. 客户端重连时拉取未送达消息

---

# 12. 后端详细设计

# 12.1 分层结构建议

```text
controller
service
manager
repository/mapper
domain/entity
dto/vo
config
security
ws
```

---

# 12.2 包结构建议

```text
com.hidechat
 ├── HideChatApplication
 ├── common
 │   ├── config
 │   ├── exception
 │   ├── response
 │   ├── util
 │   └── constant
 ├── security
 │   ├── jwt
 │   ├── filter
 │   └── handler
 ├── modules
 │   ├── auth
 │   ├── user
 │   ├── contact
 │   ├── conversation
 │   ├── message
 │   ├── file
 │   └── disguise
 └── websocket
     ├── handler
     ├── dto
     └── session
```

---

# 12.3 会话列表生成逻辑

用户进入聊天系统后，调用 `/api/conversation/list`，后端返回会话索引：

* 对端信息
* 最近互动时间
* 未读数
* 最近消息类型占位

注意：

* 不返回真实历史消息明文
* 消息真正的可读内容依赖前端本地解密缓存

---

# 12.4 消息持久化策略

MVP 建议：

* 服务端保留最近一段时间的消息记录，便于补偿和排障
* 生产可配消息保留周期，例如 7 天或 30 天
* 对高隐私模式可增加“仅缓存，不长期存储”

---

# 13. 安全设计

# 13.1 核心安全边界声明

本项目提供的是：

* 伪装入口
* 本地加密缓存
* 防止随手查看

无法保证：

* 浏览器层绝对安全
* 高级攻击者无法恢复数据
* 系统级截图不可见
* 设备取证无法拿到缓存

---

# 13.2 后端安全措施

## 13.2.1 鉴权

* JWT 鉴权
* Refresh Token 续签
* WebSocket 握手鉴权

## 13.2.2 限流

* 登录接口限流
* 用户搜索限流
* 文件上传限流
* WebSocket 发消息频控

## 13.2.3 参数校验

* Bean Validation
* 防空值 / 长度限制 / 类型限制

## 13.2.4 XSS / 输入处理

* 文本消息做转义
* 富文本禁止
* 图片类型白名单

## 13.2.5 CSRF

* 前后端分离 + JWT，一般不依赖 Cookie
* 若使用 Cookie，需增加 CSRF Token

## 13.2.6 HTTPS / WSS

* 全站强制 HTTPS
* WebSocket 强制 WSS

---

# 13.3 前端安全措施

1. 幸运数字 hash 保存，不存明文
2. PIN 不明文保存
3. 会话密钥只驻留内存
4. 页面切后台自动锁
5. 一段时间无操作自动锁
6. 紧急隐藏时销毁内存敏感数据
7. 不把聊天明文写入 localStorage
8. 尽量用 IndexedDB 存密文

---

# 13.4 推荐锁屏策略

以下场景自动锁定当前会话：

* 浏览器切到后台
* 页面失焦超过 30 秒
* 用户手动点击“隐藏”
* 路由跳转离开聊天页
* 刷新页面后默认重新输入 PIN

---

# 14. 性能设计

# 14.1 性能目标

* 首页接口 < 200ms
* 会话列表接口 < 300ms
* 单条消息转发 < 150ms
* 图片消息上传走对象存储直传
* WebSocket 在线消息单机支持数千连接

---

# 14.2 性能手段

## 后端

* Redis 缓存在线状态
* 会话列表走索引查询
* 大字段与热点字段分离
* 文件上传走签名直传，不经过应用服务器

## 前端

* 历史记录优先从 IndexedDB 读取
* 图片懒加载
* 消息分页加载

---

# 15. 部署架构

# 15.1 部署拓扑

```text
用户浏览器
   │
   ▼
Nginx
   ├─ 前端静态资源
   ├─ /api 转发到 Spring Boot
   └─ /ws 转发到 Spring Boot WebSocket
            │
            ▼
      Spring Boot 应用
        ├─ PostgreSQL
        ├─ Redis
        └─ MinIO
```

---

# 15.2 环境划分

* dev
* test
* staging
* prod

---

# 15.3 Docker 化建议

服务拆分容器：

* hidechat-web
* hidechat-api
* postgres
* redis
* minio
* nginx

---

# 16. 日志与监控

# 16.1 日志

* 登录日志
* WebSocket 建连/断连日志
* 消息发送日志
* 文件上传日志
* 异常日志

注意：

* 日志中禁止打印 PIN、幸运数字明文、消息明文

# 16.2 监控指标

* 在线连接数
* 消息发送 TPS
* WebSocket 推送成功率
* 登录成功率
* 图片上传成功率
* API RT/P99
* Redis 命中率

---

# 17. 异常与边界处理

# 17.1 幸运数字错误

* 不提示“错误”
* 返回或保留运势页
* 可刷新不同运势文案

# 17.2 PIN 错误

* 提示“PIN 不正确”
* 不暴露更多信息
* 可限制连续错误次数

# 17.3 PIN 忘记

* 当前版本默认不可恢复本地历史
* 可提供“清空本地会话数据”按钮

# 17.4 多端并发登录

MVP 可允许，但聊天历史仅本地缓存，不保证同步

# 17.5 消息丢失

* 客户端本地先保存
* 服务端 ACK
* 重连后拉取补偿消息

---

# 18. 开发实施建议

# 18.1 开发阶段划分

## Phase 1：基础能力

* 用户注册登录
* 联系人搜索与添加
* 会话列表
* WebSocket 实时消息
* 文本消息

## Phase 2：隐私能力

* 运势页
* 幸运数字本地设置与校验
* PIN 设置与解锁
* 会话密钥加密存储
* IndexedDB 密文缓存

## Phase 3：图片能力

* 图片上传
* 图片加密缓存
* 图片展示

## Phase 4：体验增强

* 自动锁定
* 紧急隐藏
* 未读数
* 消息状态

---

# 18.2 后端任务拆分建议

1. Spring Boot 基础工程搭建
2. JWT + Security
3. 用户模块
4. 联系人模块
5. 会话模块
6. 消息模块
7. WebSocket 模块
8. 文件模块
9. Redis 在线状态
10. Nginx / Docker 部署

---

# 19. 风险点

# 19.1 技术风险

1. Web 环境无法做到真正安全容器
2. IndexedDB 数据仍可能被高级攻击者导出
3. 前端加密实现复杂，易出现伪安全
4. WebSocket 重连和消息补偿需要严谨处理

# 19.2 产品风险

1. 用户误以为“绝对安全”
2. 用户忘记 PIN 导致数据不可恢复
3. 伪装页过于机械会被识破

# 19.3 运维风险

1. WebSocket 连接数增长快
2. 图片存储成本增长
3. Redis 在线状态一致性问题

---

# 20. 推荐实现结论

基于当前 PRD 和 Web 平台边界，采用：

* **前端本地幸运数字校验**
* **会话级 PIN 解锁**
* **IndexedDB 密文缓存**
* **Spring Boot + PostgreSQL + Redis + WebSocket**
* **MinIO/S3 存储图片**

是当前阶段最合理的技术路径。

它满足：

* 快速上线
* 架构清晰
* 体验可落地
* 可逐步演进

