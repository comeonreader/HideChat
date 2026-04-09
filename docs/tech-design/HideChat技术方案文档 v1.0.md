# 技术方案文档 v1.1

## 项目名称

HideChat 隐私伪装聊天 Web 应用

## 文档版本

v1.1

---

# 1. 项目背景

本项目目标是构建一个支持手机浏览器与 PC 浏览器的 Web 聊天应用。产品重点不是强匿名通信，而是通过伪装入口、本地密文缓存和会话级 PIN 解锁，提高“随手查看”门槛。

当前版本能力范围：

* 运势伪装入口
* 幸运数字本地校验
* 会话列表脱敏展示
* 联系人搜索与添加
* 1V1 文本、图片、通用文件附件消息
* 本地 PIN 解锁历史消息
* 在线状态与未读数展示
* 移动端单列布局与底部导航

---

# 2. 建设目标

## 2.1 产品目标

实现一个“轻隐私 + 伪装入口 + 本地加密缓存 + 基础聊天体验”的聊天系统。

## 2.2 技术目标

1. Web 端伪装入口机制
2. 浏览器本地密文缓存
3. 会话级 PIN 解锁
4. 联系人 / 会话搜索与索引能力
5. 文本、图片、通用文件附件消息
6. 在线状态、未读数与补偿拉取
7. 手机与 PC 自适应布局

---

# 3. 非目标范围

当前版本不做以下能力：

1. 不做原生 App
2. 不做群聊
3. 不做多设备密钥同步
4. 不做 Signal 双棘轮
5. 不做真正意义上的强端到端加密体系
6. 不做通讯录导入
7. 不做邮箱搜索用户
8. 不做聊天列表真实消息预览
9. 不做音视频通话
10. 不承诺绝对防破解或防截屏

---

# 4. 总体架构设计

## 4.1 架构概览

系统采用前后端分离架构：

* 前端负责页面展示、本地加解密、IndexedDB 持久化、本地搜索过滤、锁定控制
* 后端负责账号、联系人、会话索引、消息中转、附件元数据、在线状态、离线补偿

```text
┌────────────────────────────────────────────┐
│                  Web 前端                  │
│ 1. 幸运数字输入页                          │
│ 2. 运势展示页                              │
│ 3. 聊天列表页                              │
│ 4. 搜索 / 添加好友页                       │
│ 5. PIN 解锁层                              │
│ 6. 聊天页                                  │
│ 7. IndexedDB 本地密文缓存                  │
│ 8. Web Crypto API                          │
│ 9. WebSocket 客户端                        │
└────────────────────┬───────────────────────┘
                     │ HTTPS / WSS
┌────────────────────▼───────────────────────┐
│              Spring Boot 后端              │
│ 1. Auth / User / Contact                   │
│ 2. Conversation / Message                  │
│ 3. File / Attachment                       │
│ 4. System / Disguise                       │
│ 5. WebSocket Gateway                       │
└───────────────┬───────────────┬────────────┘
                │               │
       ┌────────▼──────┐  ┌────▼─────────┐
       │ PostgreSQL    │  │ Redis         │
       │ 用户/联系人/  │  │ 在线状态/会话 │
       │ 会话/附件元数据│ │ 映射/短期缓存 │
       └───────────────┘  └───────────────┘

                ┌──────────────────────┐
                │ MinIO / S3（可选）   │
                │ 加密附件对象存储     │
                └──────────────────────┘
```

## 4.2 架构原则

### 4.2.1 前端负责隐私保护

* 幸运数字仅用于伪装入口
* PIN 仅用于解锁本地历史消息
* 会话列表不得显示真实消息明文与真实文件名
* 本地历史与附件缓存以密文形式落地

### 4.2.2 后端负责中转与索引

* 管理用户、联系人、会话、附件元数据
* 提供搜索、排序、未读、在线状态
* 不参与 PIN 解密

### 4.2.3 安全边界

本方案目标是：

* 防止随手查看
* 提高隐私门槛

不是：

* 对抗高级取证
* 对抗浏览器被攻陷
* 对抗 root / 越狱 / 远程注入

---

# 5. 核心业务流程

## 5.1 首次使用

```text
访问首页
→ 展示幸运数字输入页
→ 用户首次设置幸运数字
→ 本地保存 hash / salt / kdf 参数
→ 展示运势页
→ 进入聊天系统
→ 搜索联系人或进入已有会话
→ 首次进入会话设置 PIN
→ 生成会话密钥并加密保存到本地
→ 正常聊天
```

## 5.2 日常进入

```text
访问首页
→ 输入幸运数字
→ 前端本地校验
→ 成功后进入运势页/聊天系统
→ 加载会话列表
→ 本地过滤会话搜索
→ 点击某个联系人
→ 输入 PIN
→ 解密会话密钥与本地消息
→ 展示聊天页
```

## 5.3 收消息

```text
对方发送消息
→ 服务端接收消息与附件引用
→ 更新会话索引与未读数
→ 若接收方在线则实时推送
→ 前端收到消息
→ 已解锁会话：直接解密显示并持久化
→ 未解锁会话：仅缓存密文并展示脱敏索引
```

## 5.4 搜索与添加联系人

```text
用户进入搜索 / 添加好友页
→ 输入昵称或用户 ID
→ 后端搜索用户
→ 返回昵称、展示用用户 ID、匹配类型、已添加状态
→ 用户点击添加
→ 联系人关系落库
→ 最近添加列表刷新
```

## 5.5 一键隐藏

```text
用户点击隐藏
→ 清除当前页面敏感状态
→ 清除内存中的 conversationKey
→ 锁定当前会话
→ 返回运势页
```

---

# 6. 技术选型

## 6.1 前端

* React + TypeScript
* Vite
* Zustand
* Dexie.js
* Web Crypto API
* 原生 WebSocket

## 6.2 后端

* Spring Boot 3.x
* Spring Web / Validation / Security / WebSocket
* MyBatis-Plus
* PostgreSQL
* Redis
* MinIO / S3

---

# 7. 模块拆分

## 7.1 auth 模块

* 登录注册
* JWT 鉴权

## 7.2 user 模块

* 用户资料
* 按昵称 / 用户 ID 搜索

## 7.3 contact 模块

* 联系人添加
* 最近添加列表

## 7.4 disguise 模块

* 幸运数字输入页配置
* 运势内容下发

## 7.5 conversation 模块

* 会话索引
* 列表脱敏预览
* 未读计数
* 排序

## 7.6 message 模块

* 文本 / 图片 / 文件消息
* 历史消息补偿
* 已读回执

## 7.7 file 模块

* 通用附件上传
* 元数据回写
* 预览 / 下载地址生成

## 7.8 websocket 模块

* 在线状态
* 消息推送
* ACK 处理

---

# 8. 前端状态与交互设计

## 8.1 页面状态模型

前端至少维护以下状态：

* disguiseState：幸运数字是否已设置、是否校验通过
* fortuneState：运势内容与伪装配置
* conversationListState：会话列表、搜索关键字、排序、未读数
* contactSearchState：搜索关键字、搜索结果、添加状态、最近添加列表
* unlockState：当前会话锁定状态、PIN 错误次数、自动锁定时间
* chatState：当前会话消息流、输入态、附件上传态
* onlineState：对端在线 / 最近活跃摘要

## 8.2 搜索策略

### 8.2.1 会话搜索

* 仅在前端本地对已加载会话做过滤
* 匹配字段为备注名、昵称、用户 ID
* 不搜索消息明文

### 8.2.2 联系人搜索

* 走后端接口
* 支持昵称与用户 ID 搜索
* 不支持邮箱搜索

## 8.3 列表脱敏预览策略

会话列表只允许渲染固定占位：

* `[文本消息]`
* `[图片消息]`
* `[文件消息]`

禁止项：

* 禁止展示真实文本片段
* 禁止展示真实文件名

## 8.4 在线状态来源与刷新

在线状态来源：

* WebSocket 建连与断连事件
* Redis 在线映射
* 服务端按最后活跃时间生成摘要

刷新策略：

* 会话列表初始化时拉取一次
* 当前聊天页优先订阅实时状态更新
* 状态为弱一致展示，不参与核心权限判断

## 8.5 移动端布局职责

前端负责：

* 聊天列表 / 聊天页 / 搜索页在宽度阈值下切换为单列
* 聊天列表页提供底部导航
* 聊天页输入区固定在底部
* 搜索 / 添加好友页在移动端折叠为单列

---

# 9. 加密与本地存储设计

## 9.1 幸运数字设计

幸运数字是伪装入口凭证，不承担消息加解密职责。

本地存储：

* luckyCodeHash
* luckyCodeSalt
* luckyCodeKdfParams

失败策略：

* 不展示错误提示
* 保持在伪装页链路

## 9.2 PIN 与会话密钥设计

采用两层密钥模型：

```text
PIN -> KEK
KEK -> 解密 encryptedConversationKey
conversationKey -> 解密消息和附件
```

本地保存：

* pinVerifierHash
* pinSalt
* kdf 参数
* encryptedConversationKey

## 9.3 消息加密设计

### 9.3.1 文本消息

* AES-GCM
* 密文存 IndexedDB

### 9.3.2 图片消息

* 图片二进制加密后上传
* 聊天页支持预览
* 会话列表仅显示 `[图片消息]`

### 9.3.3 通用文件消息

* 文件二进制加密后上传
* 聊天页支持下载
* 对可预览类型生成预览链接
* 会话列表仅显示 `[文件消息]`

---

# 10. 数据模型设计

## 10.1 后端数据库

### 10.1.1 `im_contact`

* 按用户视角存储联系人
* 使用 `created_at` 支撑最近添加列表
* 使用 `last_message_at` 支撑联系人最近互动排序

### 10.1.2 `im_conversation`

* `last_message_preview` 仅存固定占位
* 推荐附加 `preview_strategy`，当前值固定为 `masked`

### 10.1.3 `im_message`

* `message_type`：`text / image / file / system`
* `payload_type`：`plain / ref / encrypted`
* 文件消息通过 `file_id` 或附件引用关联

### 10.1.4 `im_file`

作为通用附件元数据表，记录：

* fileName
* fileExt
* fileCategory
* mimeType
* fileSize
* previewable
* storageKey
* accessUrl / downloadUrl

## 10.2 前端 IndexedDB

### 10.2.1 `app_meta`

* 幸运数字数据
* disguiseConfig
* theme

### 10.2.2 `conversation_index`

* conversationId
* peerUid
* peerNickname
* peerAvatar
* lastMessageAt
* unreadCount
* previewStrategy
* onlineState
* encryptedConversationKey
* pinSalt
* pinVerifierHash
* locked

### 10.2.3 `messages`

* messageId
* conversationId
* messageType
* ciphertext
* iv
* createdAt
* localStatus

### 10.2.4 `file_cache`

* fileId
* conversationId
* ciphertextBlob
* iv
* mimeType
* fileCategory
* previewable
* createdAt

说明：

* 当前版本可统一使用 `file_cache`
* 后续如图片预览链路复杂，可再拆成 image/file 两类本地表

---

# 11. API 设计

## 11.1 用户搜索

`GET /api/user/search?keyword=xxx`

返回字段建议：

* userUid
* displayUserId
* nickname
* avatarUrl
* matchType
* alreadyAdded

限制：

* 不返回邮箱

## 11.2 联系人与会话列表

* 联系人列表按最近消息时间排序
* 最近添加列表按 `created_at desc` 排序
* 会话列表返回脱敏预览、未读数、在线状态摘要

## 11.3 文件接口

文件接口按照通用附件设计：

* 支持图片与非图片文件
* 返回 `fileName / fileExt / fileCategory / previewable / downloadUrl`

## 11.4 System 接口

运势接口需返回完整页面内容：

* title
* summary
* fortuneScore
* luckyColor
* luckyNumber
* suggestedActions
* adviceList
* moodReminder
* keywords

---

# 12. WebSocket 协议设计

## 12.1 连接地址

`wss://domain/ws/chat`

## 12.2 消息类型

### 12.2.1 文本消息

```json
{
  "type": "CHAT_SEND",
  "data": {
    "messageId": "m_1001",
    "conversationId": "c_1001",
    "receiverUid": "u_1002",
    "messageType": "text",
    "payload": "ciphertext",
    "clientMsgTime": 1712300000000
  }
}
```

### 12.2.2 图片消息

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
      "fileCategory": "image",
      "previewable": true
    },
    "clientMsgTime": 1712300000000
  }
}
```

### 12.2.3 文件消息

```json
{
  "type": "CHAT_SEND",
  "data": {
    "messageId": "m_1003",
    "conversationId": "c_1001",
    "receiverUid": "u_1002",
    "messageType": "file",
    "payload": {
      "fileId": "f_1002",
      "fileCategory": "document",
      "previewable": true
    },
    "clientMsgTime": 1712300000000
  }
}
```

---

# 13. 安全设计

## 13.1 核心边界

本项目提供：

* 伪装入口
* 本地加密缓存
* 聊天列表脱敏
* 防止随手查看

无法保证：

* 浏览器层绝对安全
* 高级攻击者无法恢复数据
* 系统级截图不可见

## 13.2 后端安全措施

* JWT / Refresh Token
* 用户搜索限流
* 文件上传限流
* 附件类型白名单
* 预览 / 下载地址权限校验
* 禁止日志输出幸运数字、PIN、消息明文

## 13.3 前端安全措施

* 幸运数字只存 hash
* PIN 不明文保存
* conversationKey 仅驻留内存
* 切后台自动锁
* 路由离开自动锁
* 会话列表永不展示真实预览

---

# 14. 性能与体验设计

## 14.1 性能目标

* 首页接口 < 200ms
* 会话列表接口 < 300ms
* 单条消息转发 < 150ms
* 常规附件上传走对象存储直传

## 14.2 性能手段

后端：

* Redis 缓存在线状态
* 会话列表走索引查询
* 最近添加基于联系人时间索引
* 文件上传直传对象存储

前端：

* 历史记录优先读 IndexedDB
* 会话搜索本地过滤
* 图片懒加载
* 移动端单列布局降复杂度

---

# 15. 异常与边界处理

## 15.1 幸运数字错误

* 不提示错误
* 保留在伪装页

## 15.2 PIN 错误

* 提示“PIN 不正确”
* 限制连续错误次数

## 15.3 文件异常

* 非法类型拦截
* 超大文件拦截
* 下载链接过期需重取

## 15.4 多端并发登录

MVP 允许，但本地历史不保证同步。

---

# 16. 开发实施建议

## 16.1 Phase 1

* 用户注册登录
* 联系人搜索与添加
* 会话列表
* 文本消息

## 16.2 Phase 2

* 运势页
* 幸运数字本地校验
* PIN 设置与解锁
* 脱敏会话列表

## 16.3 Phase 3

* 图片上传与预览
* 通用文件上传与下载
* 最近添加列表
* 在线状态

## 16.4 Phase 4

* 自动锁定
* 紧急隐藏
* 未读数
* 移动端导航增强

---

# 17. 推荐实现结论

基于当前产品边界，推荐采用：

* 前端本地幸运数字校验
* 会话级 PIN 解锁
* IndexedDB 密文缓存
* Spring Boot + PostgreSQL + Redis + WebSocket
* MinIO / S3 存储加密附件
* 会话列表固定占位脱敏策略

这是当前阶段最稳定、实现成本最可控的技术路径。
