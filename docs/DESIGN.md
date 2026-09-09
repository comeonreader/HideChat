# 清语 Qingyu（工程代号 HideChat）方案设计文档

版本：v1.2（已实现并验证：品牌/计时语义/登录/布局/头像，见附录 B）
状态：**全部里程碑已实现并通过验证**（后端集成测试 6/6 绿、真实 Chromium 端到端、compose 冒烟）。本附录为最终实现状态，正文若有出入以本附录为准。

---

## 1. 项目定位与需求

一句话定位：**自托管部署、微信风格 UI、短暂消息自动销毁（发送即计/回复激活）的一对一好友即时通讯 Web 应用「清语 Qingyu」**，
面向 ≤50 人规模（家庭 / 团队 / 私服），手机与电脑浏览器均可使用。

需求逐条落点（下文章节）：

| # | 需求 | 设计落点 |
|---|------|----------|
| R1 | Docker 一键部署 | 第 12 节：单 JAR + PostgreSQL 的 Compose，一条命令启动 |
| R2 | 手机与电脑访问 | 第 10.2 节：响应式双栏/单栏布局 + PWA |
| R3 | 微信风格聊天，文字/图片/视频，对方立刻收到 | 第 6/8/10 节：WebSocket 实时推送 + 媒体上传下载 |
| R4 | 免验证码注册（用户名+密码+重复确认）；搜索/添加/删除好友 | 第 9 节 + 第 7 节 API |
| R5 | 消息销毁规则（见第 4 节核心机制） | 第 4 节状态机 + 清扫器 + 物理删除 |

附加功能（已确认纳入）：语音消息、送达/已读状态、消息撤回；不做群聊。

---

## 2. 已确认决策记录（ADR 摘要）

| # | 决策点 | 结论 | 说明 |
|---|--------|------|------|
| D1 | 规模 | 私用/小团队 ≤50 人 | 单机单实例，不做集群与消息队列 |
| D2 | 后端 | Spring Boot 3（Java 17） | WebSocket + Spring Data JPA + Flyway 迁移 |
| D3 | 前端 | Vue 3 + Vite + Pinia（TS） | 构建产物打进后端 JAR，同源部署免 CORS |
| D4 | 数据库 | PostgreSQL 16 | Compose 内联，volume 持久化 |
| D5 | 销毁语义 | 双向独立计时；服务端物理删除 | 见第 4 节 |
| D6 | 未读留存 | 未读消息等待查看；**兜底上限默认 30 天** | 超过 30 天未查看同样物理删除 |
| D7 | 撤回 | 发出后 2 分钟内；未读=无痕删除，已读=显示撤回提示 | 提示自身按原销毁周期消失 |
| D8 | 删除好友 | 同时清空该好友会话（含挂起未读与媒体文件） | 双方都移除会话 |
| D9 | 推送 | 不做原生推送；浏览器打开页面 = 实时可达 | 离线消息上线即拉取 |
| D10 | 账号规则 | 用户名 [A-Za-z0-9_] 3-20 位唯一；昵称 ≤30 字；密码 6-64 位 | 免验证码，靠限流防滥用 |
| D11 | 头像 | 支持上传/更换/删除；独立 volume 永久保存（不参与消息销毁）；版本化 URL 缓存 | 见 8.5、10.3 |

设计默认假设（可随时调整，均做成配置项）：消息 TTL 20 分钟；撤回窗口 2 分钟；注册/登录限流阈值；
媒体大小上限（图片 20MB / 视频 200MB / 语音 60 秒 5MB）；文本 ≤2000 字；头像 ≤2MB（客户端方形裁剪 ≤512px）。

---

## 3. 总体架构

### 3.1 部署拓扑

    手机 / 电脑浏览器（同一域名，http 或 https）
                     │  REST + WebSocket
                     ▼
        ┌─────────────────────────────── Docker 主机 ───────────────────────────────┐
        │                                                                           │
        │   app :8080  （Spring Boot 单 JAR：REST API + WS + Vue 静态资源 + 文件服务）│
        │     ├─ /api/*       业务 API（JSON + JWT）                                │
        │     ├─ /ws          实时通道（认证首帧 + 心跳 + 推送）                     │
        │     ├─ /files/*     媒体下载（签名 URL，校验会话成员）                     │
        │     ├─ 清扫器       每 30s：到期事件广播 + 物理删除（DB 行 + 媒体文件）     │
        │     ├─ /api/avatars/*  头像下载（公开只读，?v=N 防缓存）                  │
        │     └─ 本地磁盘 volumes：/data/uploads（媒体）/data/avatars（头像）            │
        │              │ JDBC                                                        │
        │              ▼                                                            │
        │   db :5432  PostgreSQL 16（volume pgdata）                                │
        └───────────────────────────────────────────────────────────────────────────┘

设计要点：
1. 前端打包产物随 JAR 分发 —— 整个应用只有一个对外端口（8080），WebSocket 与 HTTP 同源，
   无反向代理、无 CORS 配置，是"一键部署"最简形态。
2. 单实例内存态保存连接（用户→Socket 集合），≤50 人规模绰绰有余。
3. 所有计时、销毁判定以**服务器时间 + DB 时间戳**为唯一权威；客户端只做展示与兜底。

### 3.2 技术选型与理由

| 层 | 选型 | 理由 |
|----|------|------|
| 后端框架 | Spring Boot 3 | 内嵌 WebSocket 支持、JPA/Flyway 生态成熟、单 JAR |
| 实时通道 | Spring WebSocket（原生文本帧） | 协议自控（JSON），无需 STOMP 复杂度 |
| ORM/迁移 | Spring Data JPA + Flyway | 表结构随版本演进，升级可控 |
| 任务调度 | @Scheduled 清扫器 | 到期隐藏 + 物理删除，周期 30s |
| 认证 | JWT（HS256）+ bcrypt | 无状态、多端同时登录 |
| 密码哈希 | BCryptPasswordEncoder | Spring Security Crypto 自带 |
| 前端 | Vue 3 + Vite + Pinia + TS | 组件化、组合式 API 适合会话型 UI |
| 移动端 | 响应式 + PWA manifest | 浏览器即可用，可"添加到主屏幕" |
| 数据库 | PostgreSQL 16 (alpine) | 时间函数/部分索引/JSONB 支持好 |
| 部署 | Dockerfile 多阶段 + docker compose | 一条命令启动、数据与媒体独立 volume |

### 3.3 三条主流程（运行时视角）

流程 A —— 发文字、实时到达、已读回执：

    发送方 A                       服务器                             接收方 B
      │  WS send {client_msg_id}      │                                  │
      │──────────────────────────────>│ 校验好友/落库 send_at=now        │
      │  WS ack_send {msg_id,时间}    │  B 在线？─────推送 new_msg──────>│ 渲染气泡
      │<──────────────────────────────│<────────────────────────────────│
      │ 气泡出现（单灰勾"已发送"）     │                                  │
      │                               │<─ 通知送达 msg_delivered ────────│
      │  变双灰勾"已送达"              │                                  │
      │                               │<─ 打开会话 read_conv ────────────│ 置 viewed_at=now
      │  WS conv_read 双蓝勾"已读"─────│                                  │
      │  （本地倒计时：发送方截止=send_at+20min）                          │

流程 B —— 发图片/视频/语音：先 REST 上传拿 media key，再走流程 A 的 send（kind=image/video/voice）。

流程 C —— 到期销毁：清扫器每 30s 把"发送方可视期已到"与"接收方可视期已到"的消息
以 msg_expired 事件推给在线端；客户端收到即移除气泡并刷新会话摘要；DB 行与媒体文件在
物理删除时刻（见 4.1）真正删除。

---

## 4. 核心机制：20 分钟双向销毁

### 4.1 计时规则（每条消息两个独立的"可视期"）

    TTL = 20 分钟（默认，可配）

    发送方视角：消息在 send_at + TTL 时刻从发送方所有界面消失，与是否已读无关。
    接收方视角：activated_at IS NULL（尚未回复过对方）→ 一直可见可等待、不销毁；
                对方一旦在本会话发送消息（视为回复激活），activated_at 置位，
                对方此前发来的消息在 activated_at + TTL 时刻从接收方消失。
    已读与销毁分离：viewed_at（打开会话置位）只用于已读回执展示，不启动销毁。
    物理删除：接收方已回复激活 → activated_at + TTL 后删除 DB 行与媒体文件；
              接收方从未回复（消息一直等待）→ 最多保留 UNREAD_MAX_DAYS（默认 30 天）后兜底删除。
    备注：发送方可视期 (send_at+TTL) 总是早于或等于物理删除点，因此发送方界面的隐藏
          既可依赖本地倒计时/事件，也由查询过滤兜底，不依赖行删除时机。

规则示例（T=20 分钟）：

    时刻                 发送方 A 可见？   接收方 B 可见？   DB 行/媒体
    t=0    A 发出           是              是(未读)          保留
    t=+10  B 打开会话(只读)  是              是(未激活,等待)    保留
    t=+20  A 侧到期         否  ← 事件/倒计时隐藏           保留
    t=+25  B 回复A(激活)     否               是(激活,剩5m)     保留
    t=+45  B 侧到期(激活+20) 否               否              本批清扫物理删除
    —— 若 B 始终未打开：A 于 t=20 不可见；行与文件保留到 30 天兜底删除。

### 4.2 服务端可视性判定（查询统一套用，含拉取分页与会话摘要）

    visible_for(user u, msg m):
      已撤回且 u 非提示接收对象 → false
      u == m.sender  : now < m.send_at + TTL                    -- 发送方：发出即计时
      u != m.sender  : m.activated_at IS NULL                   -- 未回复激活：一直等待
                       OR now < m.activated_at + TTL            -- 已激活：再看 20 分钟

会话摘要中的"最后一条消息"、未读数统计也按同一规则计算，过期消息自然不再出现。

### 4.3 消息状态机

    发送(落库) ──> 对方打开会话(首次) ──> 已查看
       │                                    │
       │ 撤回(2分钟内可)                    │ 到达可视期
       ▼                                    ▼
    已撤回：对方未读 → 行+文件立即物理删除(无痕)     不可见(事件通知在线端)
            对方已读 → 行改写为系统提示"对方撤回了一条消息"，保留至其原可视期结束
    物理删除时机汇总：已读后 +TTL；未读挂起到 30 天兜底；撤回未读即删；删除好友即删。

### 4.4 清扫器（每 30s，@Scheduled）

    1) 到期隐藏广播：查出 send_at+TTL < now（发送方侧）且尚未广播的行 → 向发送方在线端
       推 msg_expired；再查 viewed_at+TTL < now（接收方侧）的行 → 向接收方在线端推送。
       （行上记 expire_notified_at 防重复广播）
    2) 物理删除：删除 (viewed_at 非空 且 viewed_at+TTL < now) 或 (viewed_at 为空 且
       created 超过 UNREAD_MAX_DAYS) 的行；先收集 media_key 列表，删行后删除磁盘文件，
       再清孤儿文件（每日一次：文件存在但无消息引用、或上传超过 24h 未成消息）。
    3) 服务器重启无影响：所有计时依据落库的 send_at/viewed_at，启动后立即进入周期。

### 4.5 事件 + 客户端本地兜底（双保险）

- 在线且正打开会话：服务端 msg_expired 事件即时移除气泡，避免"眼睁睁看着 20 分钟到"。
- 断线/事件丢失：客户端为每个气泡挂本地倒计时（服务端握手时下发 server_time，
  客户端保存时钟偏移校准），到点自行隐藏；
  重连后全量同步拉取时，过期消息本就不在服务端返回中，天然一致。
- UI 提示：气泡下方以小字显示"xx:xx 后自动销毁"剩余时间（发送方按 send_at 计，
  接收方按首次查看时刻计），到期即消失——这是本产品最核心的信任点。

### 4.6 边界场景表

| 场景 | 处理 |
|------|------|
| 发出后对方一直未读 | 发送方 20 分钟后不可见；对方侧保留等待，上限 30 天（D6） |
| 对方恰在 19:59 打开 | 接收方可视期 = 打开时刻+20min；物理删除随之延后，语义自洽 |
| 撤回发生在对方打开会话前一瞬 | 打开会话即置读，无"渲染后才撤回"的窗口；未读撤回=无痕 |
| 撤回时对方已读 | 双方显示撤回提示，提示按各自原可视期结束消失 |
| 到期瞬间对方正在查看 | 读取与清扫同为服务端操作：read 先落库则按新 viewed_at 计时；清扫先执行则该消息已被删除，客户端收到空结果即移除。秒级竞态，行为仍是"到期即不可见"，可接受 |
| 删除好友 | 会话+双方挂起未读+媒体文件一并删除（D8）；在线端收到 friend_deleted 刷新列表 |
| 多端同时登录 | 任一端打开会话即置 viewed_at（微信同语义），已读状态推给发送方所有在线端 |
| 断线重连 | 心跳/指数退避重连 → 重新 auth → 全量 init 同步（见 6.1），本地计时器以服务端数据为准修正 |
| 浏览器缓存 | 已加载的图片可能留在浏览器磁盘缓存中——属 Web 平台固有限制，见第 16 节风险说明 |
| 服务器时钟/时区 | 全部使用 timestamptz + 服务器时间，无时区换算 |

---

## 5. 数据模型（PostgreSQL，Flyway 管理）

    users           用户
      id            BIGSERIAL PK
      username      VARCHAR(20) UNIQUE NOT NULL        -- 登录名，小写唯一（搜索凭据）
      password_hash VARCHAR(100) NOT NULL              -- bcrypt
      nickname      VARCHAR(30) NOT NULL DEFAULT ''
      avatar_ext     VARCHAR(8)                        -- 头像扩展名(jpg/png/webp)；空=默认字母头像
      avatar_version INTEGER NOT NULL DEFAULT 0        -- 头像版本：URL?v=N 强制刷新缓存
      token_version INTEGER NOT NULL DEFAULT 0         -- 改密后旧 token 失效
      created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
      last_login_at TIMESTAMPTZ

    friendships     好友关系（一行一对，约定 a<b）
      id            BIGSERIAL PK
      user_a        BIGINT NOT NULL REFERENCES users(id)
      user_b        BIGINT NOT NULL REFERENCES users(id)
      created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
      CONSTRAINT uq_pair UNIQUE (user_a, user_b),
      CONSTRAINT ck_order CHECK (user_a < user_b)

    friend_requests 好友申请
      id            BIGSERIAL PK
      from_user     BIGINT NOT NULL REFERENCES users(id)
      to_user       BIGINT NOT NULL REFERENCES users(id)
      message       VARCHAR(200)
      status        SMALLINT NOT NULL DEFAULT 0   -- 0待处理 1同意 2拒绝 3撤销
      created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
      responded_at  TIMESTAMPTZ
      -- 部分唯一索引：同一对只能有一条待处理申请
      CREATE UNIQUE INDEX uq_pending_req ON friend_requests(from_user, to_user)
        WHERE status = 0;

    conversations   一对一会话（好友成对即有；删除好友即删）
      id            BIGSERIAL PK
      user_a / user_b（同 friendships 约定）+ CHECK + UNIQUE
      created_at, last_msg_at

    messages        消息（销毁的主体）
      id            BIGINT GENERATED ALWAYS AS IDENTITY  -- 全库单调，作排序与断点
      conv_id       BIGINT NOT NULL REFERENCES conversations(id)
      sender_id     BIGINT NOT NULL REFERENCES users(id)
      kind          SMALLINT NOT NULL     -- 1文本 2图片 3视频 4语音 5系统提示(撤回)
      text_body     VARCHAR(2000)         -- kind=1/5 时使用
      media_key     UUID                  -- kind=2/3/4 时的文件键
      media_meta    JSONB                 -- {size,width,height,duration,orig_name,ext}
      send_at       TIMESTAMPTZ NOT NULL DEFAULT now()
      viewed_at     TIMESTAMPTZ           -- 接收方首次查看时刻（规则唯一权威）
      recalled_at   TIMESTAMPTZ           -- 撤回时刻
      recall_by     BIGINT
      expire_notified_at TIMESTAMPTZ      -- 防重复广播
      索引：(conv_id, id DESC) 分页；(viewed_at) 清扫；(send_at) 兜底清理

说明：
- 无群聊，会话天然一一对应好友对；将来若要群聊，加 conversations.kind + members 表即可扩展。
- 消息过期、撤回、删友产生的删除都是 DELETE 物理删除，不留墓碑（设计目标：服务器不可恢复）。
- 备份策略见 12.4：db volume 备份 + uploads/avatars volume 备份，由运维决定周期；备份含未销毁数据属正常。

---

## 6. 实时通信协议（WS /ws，JSON 文本帧）

### 6.1 连接生命周期

1. 客户端连上 /ws，服务端限 5 秒内必须收到首帧 {"type":"auth","token":...}，否则断开。
2. 认证通过回 {"type":"auth_ok","user":{...},"server_time_ms":...}（校准本地时钟偏移）。
   此后客户端调用 GET /api/init 全量同步（见 6.4）。
3. 心跳：客户端每 25s 发 {"type":"ping"}，服务端回 {"type":"pong"}；60s 无消息判定死链断开。
4. 断线重连：指数退避（1s/2s/4s/…上限 30s）+ 网络恢复监听；重连成功后重复 1-2。

### 6.2 帧类型

客户端 → 服务端

    {"type":"auth","token":"..."}
    {"type":"ping"}
    {"type":"send","client_msg_id":"uuid","conv_id":12,
     "kind":"text"|"image"|"video"|"voice","text":"...",
     "media":{"key":"...","size":123,"width":0,"height":0,"duration":3.2}}
    {"type":"read_conv","conv_id":12}                     -- 打开会话即置读
    {"type":"recall","msg_id":1234}                       -- 2 分钟内
    {"type":"typing","conv_id":12,"on":true}              -- 可选（二期）

服务端 → 客户端

    {"type":"auth_ok","user":{...},"server_time_ms":1710000000000}
    {"type":"ack_send","client_msg_id":"uuid","msg_id":1234,"send_at":1710000000000}
    {"type":"new_msg","msg":{...}}                        -- 对方在线即时到达
    {"type":"msg_delivered","conv_id":12,"msg_id":1234}   -- 对方(某在线端)已收到推送
    {"type":"conv_read","conv_id":12,"read_at":...}       -- 对方打开会话（可能覆盖多条）
    {"type":"recalled","msg_id":1234,"recall_kind":"silent"|"tip"}
    {"type":"msg_expired","msg_id":1234}                  -- 己方该消息可视期到
    {"type":"friend_request","request":{...}}  /  {"type":"friend_accepted",...}
    {"type":"friend_deleted","friend_id":7}               -- 被对方删除：清空其会话 UI
    {"type":"profile_updated","user_id":7,"nickname":"..","avatar_version":2}   -- 好友头像/昵称变更：刷新显示
    {"type":"error","code":"...","message":"..."}
    {"type":"pong"}

### 6.3 送达与已读（微信式对勾）

- 已发送（单灰勾）：服务端 ack_send（已落库）。
- 已送达（双灰勾）：服务端确认已向对方在线端推送 new_msg 后发 msg_delivered；
  对方离线时无此事件，其上线拉取到的消息由服务端补发 delivered（合并进 init/分页结果）。
- 已读（双蓝勾）：对方任一端 read_conv 置 viewed_at 后推 conv_read。
- 发送方离线期间的送达/已读变化：重连后 init/会话分页返回的状态字段直接呈现。

### 6.4 同步策略（小规模全量优先，简单可靠）

- 每次登录/重连：GET /api/init → {me, friends[], pending_requests, conversations[]（含
  未读数、最后可见消息、read/delivered 状态版本）}。≤50 人数据量小，全量拉取即可。
- 打开会话：GET /api/conversations/{id}/messages?before_id=&limit=30 倒序分页，上滑加载更早。
- 增量事件只用于"正在打开的会话"内的新消息与状态变化（new_msg/msg_expired/conv_read 等）。

---

## 7. REST API（/api，统一 JSON；除注册/登录外均需 Authorization: Bearer <JWT>）

    POST /api/auth/register           注册 {username,password,nickname?}（无验证码）
    POST /api/auth/login              登录 → {token,user}
    POST /api/auth/logout             注销（服务端记录可选项）
    GET  /api/init                    全量同步（见 6.4）
    GET  /api/me                      我的资料；PUT /api/me 改昵称/密码
    POST /api/me/avatar              上传/更换头像（multipart，≤2MB）→ {avatar_url,version}
    DELETE /api/me/avatar            删除头像，恢复默认字母头像
    GET  /api/users/search?q=&limit   按用户名搜索（精确或前缀）
    POST /api/friend-requests         发送好友申请 {to_user_id,message?}
    GET  /api/friend-requests         我收到的待处理申请
    POST /api/friend-requests/{id}/accept | /reject
    DELETE /api/friend-requests/{id}  撤销自己的申请
    DELETE /api/friends/{user_id}     删除好友（级联清空会话+消息+媒体，D8）
    GET  /api/conversations           会话列表（摘要、未读数）
    GET  /api/conversations/{id}/messages?before_id=&limit=  分页拉消息
    POST /api/upload                  媒体上传（multipart，kind=image|video|voice）→ {key,meta}
    GET  /api/avatars/{user_id}?v=N  头像读取（公开只读，见 8.5）
    GET  /files/{key}?uid=&exp=&sig   媒体下载（签名 URL，校验成员与有效期，见 8.3）

统一错误体 {"code":"...","message":"..."}；会话/消息访问一律校验"双方为好友且为该会话成员"。

---

## 8. 媒体处理

### 8.1 上传与限制（默认值，均可配）

| 类型 | 格式（魔数/mime 双重校验） | 大小/时长上限 | 说明 |
|------|---------------------------|----------------|------|
| 图片 | jpg/png/webp/gif | ≤20MB | 客户端 canvas 压缩到长边 ≤1920 再传 |
| 视频 | mp4(H.264)/webm | ≤200MB | 原文件直传，不做转码（自托管成本考虑） |
| 语音 | aac-in-mp4 / webm-opus / ogg | ≤60s、≤5MB | MediaRecorder 录制（见 8.4） |

### 8.2 存储

- 服务端 UUID 命名存 /data/uploads（volume），不信任任何客户端文件名（防路径穿越）。
- 服务端做 mime 声明与魔数首字节校验；文本消息由前端 textContent 渲染防 XSS。

### 8.3 鉴权下载

- img/video/audio 标签无法带 Authorization 头，故下载用一次性签名 URL：
  GET /files/{key}?uid={uid}&exp={ms}&sig={HMAC(secret, key|uid|exp)}。
- 服务端校验签名、有效期、uid 与会话成员关系；消息物理删除后文件即 404。

### 8.4 语音录制（浏览器兼容矩阵）

- 优先 audio/mp4（iOS Safari 14.5+ AAC），其次 audio/webm;codecs=opus（Chrome/Edge/Firefox），
  再退 audio/ogg。服务端按扩展名+魔数识别存储；播放一律 audio 原格式直放，不转码。
- 交互按微信：按住说话（触屏 touchstart/touchend、桌面 mousedown/up），松开发送、上滑取消，
  60 秒自动发送；气泡红点圆角卡片样式、播放进度动画。

### 8.5 头像（上传 / 更换 / 删除）

- 上传流程：客户端选照片（相册/拍照）→ 微信式 1:1 方形裁剪预览（canvas ≤512px）→
  压缩为 jpg/png/webp（≤2MB）→ POST /api/me/avatar；服务端魔数校验后原子写入
  /data/avatars/{userId}.{ext}（临时文件+rename，避免半张图）。
- 版本化 URL：users.avatar_version 每次变更 +1；头像地址 /api/avatars/{id}?v=N，
  v 变化即绕过浏览器缓存强制拉新图，好友端无需清缓存。
- 变更传播：换头像/改昵称后，服务端向该用户全部好友的在线端推送 profile_updated
  （含 nickname、avatar_version）；离线好友在下次 init 全量同步中自然更新。
- 删除头像：DELETE /api/me/avatar → 删文件 + 版本号 +1，界面回退为昵称首字彩色默认头像。
- 存储与生命周期：头像是**账号资料**，存独立 avatars volume 永久保留；清扫器（4.4）
  只处理消息媒体（uploads），绝不触碰头像。
- 公开只读的取舍：头像/昵称是加好友前（搜索）即可见的少量公开资料（与微信一致），
  故 /api/avatars 免签名读取；消息媒体仍走 8.3 签名鉴权，会话内容不受影响；
  若将来收紧为仅好友可见，加一层签名即可（二期可配）。

---

## 9. 账号、注册与好友

### 9.1 注册（免验证码，R4）

- 表单：用户名（3-20 位，[A-Za-z0-9_]，唯一）、密码（6-64 位）、确认密码、昵称（可选 ≤30 字）。
- 前后端双重校验一致性与长度规则；后端 bcrypt(强度10) 存储。
- 防滥用（替代验证码的手段）：注册限流 10 次/小时/IP；登录失败 5 次/15 分钟锁账号提示；
  用户名与昵称最小长度过滤垃圾注册；均在内存实现（单实例足够），阈值做成配置。

### 9.2 搜索与添加好友（微信式双向确认流）

搜索用户名（精确/前缀，附昵称与 relation 状态）→ 查看资料卡 → 发送申请（可附言）
→ 对方"新朋友"红点 → 同意/拒绝 → 双向成为好友，服务端建 friendships 与会话行，
在线双方收到 friend_request / friend_accepted 事件 → 之后即可聊天。
自己不能加自己；已是好友/已有待处理申请时按钮置灰（服务端同样拒绝）。

### 9.3 删除好友

资料卡或会话菜单发起 → 二次确认 → 服务端删除好友关系 + 会话 + 全部消息与媒体文件（D8），
向双方在线端广播 friend_deleted；对方在会话中则整会话从其界面移除。

---

## 10. 前端设计（Vue 3 + Pinia + TypeScript，Vite 构建后并入 JAR 静态资源）

### 10.1 页面与路由

    /login            登录（微信风格绿色主题 #07C160）；注册为抽屉/弹层
    /chat             主界面：底部/左侧导航分三个 Tab
        消息   会话列表：头像、昵称、最后可见消息摘要、时间、未读红点数字；
               会话打开：消息区 + 输入区；过期消息到点由 msg_expired/本地倒计时移除
        通讯录 好友列表 + "新朋友"入口（带红点）→ 申请列表（同意/拒绝/附言）
               顶部搜索框 → 搜索结果 → 资料卡（添加好友/发消息/删除好友）
        我     个人资料（点头像：拍照/相册更换、方形裁剪、删除头像；改昵称/改密码）、
               退出登录、关于与"销毁规则说明"页

### 10.2 响应式布局

- 桌面/横屏（≥768px）：微信 PC 双栏——左侧 300px 导航（会话/通讯录/我），右侧主区。
- 手机竖屏（<768px）：单栏；主界面是会话列表页，点入整屏会话，返回键回列表
  （微信手机形态）；聊天输入区随 visualViewport 顶起，适配键盘；safe-area-inset 适配刘海。
- PWA：manifest + 图标 + 主题色，可"添加到主屏幕"全屏运行（局域网 http 下 iOS 需
  手动添加到主屏幕，见 12.5 TLS 说明）。

### 10.3 微信风格组件清单

    ChatBubble（左白右绿气泡；文本/图片九宫格与灯箱预览/视频卡片/语音卡片）
    StatusTicks（单灰勾→双灰勾→双蓝勾 + 时间）
    ExpiryCountdown（气泡下小字"xx:xx 后自动销毁"，到点消失）
    ActionMenu（长按/右键：复制、撤回(2 分钟内)、查看资料；手机端为底部弹层）
    InputBar（文字输入 + "+"面板：相册/拍照/拍摄视频/语音切换）
    HoldToTalk（按住说话/松开发送/上滑取消/60s 自动发）
    ConversationItem / ContactsItem / NewFriendsBadge / Avatar（有头像显示 /api/avatars/{id}?v=N；无则昵称首字彩色圆兜底）

### 10.4 前端状态与实时封装

- Pinia stores：auth（JWT 持久化 localStorage）、chat（socket 封装 + 心跳 + 指数退避重连 +
  事件分发 + 会话内消息列表）、contacts、conversations（列表缓存，靠事件增量刷新）。
- composable useCountdown：以握手 server_time 偏移校准；每个气泡注册到期回调，
  到点本地隐藏并通知列表刷新（服务端 msg_expired 到达时提前触发，双保险）。
- 页面可见性（visibilitychange）恢复时触发一次轻量同步，保证切后台回来状态正确。

---

## 11. 安全设计

| 面 | 措施 |
|----|------|
| 口令 | bcrypt(10)，无明文；登录失败限速防爆破 |
| 会话 | JWT HS256，密钥来自环境变量（必改）；token 带 token_version，改密即失效；30 天过期 |
| 传输 | WebSocket 首帧认证，未认证 5s 断开；全站支持 https 反代/直启（见 12.5） |
| 越权 | 所有会话/消息/申请操作服务端校验归属与好友关系；媒体 key 用 UUID 不可枚举 |
| 上传 | 大小上限、魔数校验、服务端命名、无路径穿越、按类型限流 |
| 头像 | 独立只读接口（仅头像/昵称可对外展示）；版本化 URL 防缓存串图；不参与消息销毁 |
| XSS | 文本一律 textContent 渲染；昵称/附言同规则；无富文本 |
| 注入 | JPA 参数化 + Flyway 迁移；不拼 SQL |
| 限流 | 注册/登录/搜索/上传内存限流（单实例）；阈值配置化 |
| 隐私 | 到期/撤回/删友均物理删除（DB + 文件）；不额外留业务日志 |
| 部署 | 容器非 root 运行；DB 密码与 JWT_SECRET 由 .env 注入、仓库不含真实密钥 |

---

## 12. Docker 一键部署

### 12.1 镜像构建（多阶段 Dockerfile，位于仓库根）

    阶段 1  node:22-alpine  → 构建 web/（npm ci && npm run build，产物 dist/）
    阶段 2  eclipse-temurin:17-jdk → mvn package（server/）
    阶段 3  eclipse-temurin:17-jre → 运行 JAR（web/dist 已并入 spring 静态资源）
            非 root 用户；HEALTHCHECK /api/me

### 12.2 docker-compose.yml（根目录，值从根 .env 自动注入）

services:
  db:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_DB: hidechat
      POSTGRES_USER: hidechat
      POSTGRES_PASSWORD: ${DB_PASSWORD:?set in .env}
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U hidechat"]
      interval: 5s
      retries: 10
  app:
    build: .
    restart: unless-stopped
    ports: ["8080:8080"]
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://db:5432/hidechat
      SPRING_DATASOURCE_USERNAME: hidechat
      SPRING_DATASOURCE_PASSWORD: ${DB_PASSWORD:?set in .env}
      JWT_SECRET: ${JWT_SECRET:?set in .env}
      UPLOAD_DIR: /data/uploads
      AVATAR_DIR: /data/avatars
      MSG_TTL_MINUTES: ${MSG_TTL_MINUTES:-20}
      RECALL_WINDOW_MINUTES: ${RECALL_WINDOW_MINUTES:-2}
      UNREAD_MAX_DAYS: ${UNREAD_MAX_DAYS:-30}
    volumes:
      - uploads:/data/uploads
      - avatars:/data/avatars
    depends_on:
      db:
        condition: service_healthy

volumes:
  pgdata:
  uploads:
  avatars:

### 12.3 操作命令（"一键"形态）

    cp docker/.env.example .env          # 首次：改 DB_PASSWORD / JWT_SECRET
    docker compose up -d --build         # 启动（首次自动建库建表：Flyway）
    docker compose logs -f app           # 看日志
    docker compose down                  # 停止（数据保留在 volume）
    升级：git pull && docker compose up -d --build   # volume 数据不动
    备份：docker compose exec db pg_dump + 拷贝 uploads、avatars volume

### 12.4 备份与恢复

pg_dump 定时任务（宿主机 cron）+ uploads、avatars volume 拷贝。注意：备份中会包含尚未销毁的
消息，属运维控制范围（与"运行期物理删除"不冲突，见第 16 节风险）。

### 12.5 公网与 HTTPS

局域网 http://IP:8080 直接可用。若公网部署：
方式 A：compose 前加 Caddy/nginx 容器反代 443，自动证书；
方式 B：直接暴露 8080 + 部署方自备证书。
HTTPS 同时解锁 PWA 安装与麦克风/相机权限的浏览器安全限制（https 或 localhost 才完整
可用），公网部署建议必须 https。

---

## 13. 目标代码结构

    HideChat/
      server/                          Spring Boot 3（com.hidechat）
        src/main/java/.../config       安全/JWT/WebSocket 配置
                     auth            注册/登录/限流
                     user            资料
                     friend          好友申请/关系
                     chat            会话/消息/已读/撤回/同步
                     ws              握手、SessionRegistry、Pusher、心跳
                     media           存储、签名 URL、魔数校验
                     sweep           ExpirySweeper、OrphanSweeper
        src/main/resources/db/migration/  V1__init.sql ...
      web/                             Vue 3 + Vite + TS
        src/views  components  stores  composables  router  pwa
      docker/Dockerfile                （或根 Dockerfile）
      docker-compose.yml  .env.example
      docs/DESIGN.md  README.md

---

## 14. 里程碑与验收

    M1 骨架与实时链路（约 2-3 天）
        Dockerfile/compose/PostgreSQL/Flyway 起服务；注册/登录/JWT；
        WS 认证+心跳+重连；init 同步；文本消息双向实时收发、ack/送达。
        验收：两台设备登录互相发文字实时到达；docker compose up -d --build 一次成功。
    M2 好友体系与会话 UI（约 2-3 天）
        搜索/申请/同意/删除（含级联清理）；会话列表/未读红点/资料卡/删除好友；
        头像上传/更换/删除（裁剪、版本化 URL、profile_updated 传播）。
    M3 销毁机制全链路 + 媒体（约 3-4 天）
        可视期 SQL/清扫器/msg_expired/本地倒计时兜底/30 天兜底；
        上传/签名下载/图片视频气泡与预览。
        验收：设置 TTL=1 分钟(测试配置)验证三张表场景（未读等待/已读倒计时/物理删除文件）。
    M4 语音、撤回与移动端打磨（约 3-4 天）
        HoldToTalk/语音卡片/撤回规则（未读无痕、已读提示）；
        响应式细节、PWA、输入键盘适配、边界测试（断网/多端/改密踢线）。
    M5 加固与发布（约 2 天）
        限流调参、错误码收敛、操作手册（备份/升级/TLS）、真实 TTL=20 回归。

## 15. 非目标（一期明确不做）

群聊、原生 App/系统级推送、防截屏/转发水印、端到端加密、富文本/表情包商店、视频转码/压缩、
消息云端永久归档、账号注销（二期）。

## 16. 风险与开放问题

1. Web 本质无法防截屏/录屏/复制：本方案承诺的是"服务器不留痕 + 到期物理删除"，不是防拷贝；
   若后续要求防泄密，可二期加会话内昵称水印等（均为弱手段，需在产品上明示）。
2. 浏览器本地缓存/历史 DOM 可能短暂留存已销毁内容，刷新即清；页面关闭后无服务器数据可拉。
3. 语音/视频格式兼容：以 MP4(H.264/AAC)/WebM 为主流测试矩阵；旧版 iOS 语音需 mp4 分支，
   已在 8.4 规避；极端旧浏览器降级提示。
4. 时钟权威在服务器：客户端只做展示；展示倒计时与真实销毁可能有秒级误差（网络延迟），可接受。
5. 备份含未销毁数据：文档 12.4 已声明；如需"备份也匿名化"，二期提供导出脱敏工具。
6. 单实例内存会话表：上限数百并发连接，超出需二期（本需求 ≤50 人不构成风险）。
7. 注册无验证码面向公网必然有垃圾注册：已用限流+命名规则缓解；若公网仍被骚扰，
   可后续加可选邀请码开关（默认关闭，不影响"免验证码"体验）。

---

## 附录 A：实现状态与验证记录（2026-09）

| 能力 | 状态 | 验证 |
|---|---|---|
| 注册登录/JWT/WS 认证心跳 | ✅ | AuthFlowTest、WsFlowTest（真 PostgreSQL16） |
| 好友搜索/申请/同意/删除 | ✅ | FriendChatFlowTest + Chromium E2E |
| 文本实时收发/送达/已读 | ✅ | 同上 + e2e-m2（12/12） |
| 撤回（未读无痕/已读提示） | ✅ | FriendChatFlowTest |
| 图片/视频上传+签名下载+Range | ✅ | MediaFlowTest（403/401/Range/删文件） |
| 语音（按住说话/MediaRecorder） | ✅ | e2e-voice（假麦克风真录制） |
| 头像上传/更换/删除（版本化） | ✅ | e2e-m2 |
| 20 分钟双向销毁+物理删除 | ✅ | e2e-destroy（TTL=1：发送方到期/未读等待/已读到期/服务端清空） |
| 30 天未读兜底 | ✅ | UnreadCapTest（1 天配置加速） |
| PWA / 响应式 | ✅ | manifest+图标；390px 视口 E2E |
| Docker 一键部署 | ✅ | docker-compose 冒烟（db health 门控、静态资源、REST 全链路 18080 端口） |

说明：
- 正文 12.2 的 compose 为最终交付物（docker-compose.yml + Dockerfile 多阶段构建，
  基础镜像 eclipse-temurin/node/postgres；本机因 registry 受限使用同运行时布局的
  Dockerfile.smoke（Temurin21 parentcoach base）完成冒烟，交付镜像结构一致）。
- 语音客户端按正文 8.4 兼容矩阵实现（audio/mp4 → webm/opus → ogg）。
- 头像公开只读取舍（8.5）、限流阈值（9.1）、内容大小限制（8.1）均已按正文落地。

---

## 附录 B：v1.2 需求变更设计（产品名 清语 Qingyu）

需求方确认的变更（2026-09-09），实现与正文冲突处以本附录为准：

1. **品牌**：产品名改为「清语 Qingyu」（工程代号 HideChat 不变）。图标=绿色圆角方形底 + 白色对话气泡含星光，
   界面文案、manifest、图标、README/DESIGN 同步替换。
2. **头像展示修复与规范**：上传头像后必须在下列位置均展示圆角方形头像：左上角昵称旁、消息（会话）列表、
   聊天页（自己与对方气泡旁均显示各自头像）、通讯录、新的朋友（申请列表）、我（个人资料）页。
   自己上传/修改后，自己的所有端即时更新；好友端通过 profile_updated/init 同步。
3. **销毁计时语义（重要修订）**：
   - 发送方：发出即开始计时，send_at + TTL 后自己不可见（不变）。
   - 接收方：打开会话仅置 viewed_at（已读回执），**不启动销毁**；
     **接收方在本会话发出第一条回复消息时**，对该会话中对方尚未激活的消息批量置
     activated_at = 回复时刻（服务端与消息发送同一事务），activated_at + TTL 后销毁；
     未回复前消息一直等待（30 天兜底保留）。
   - 界面：接收方侧对方气泡仅在激活后显示"xx:xx 后销毁"倒计时；未激活显示常驻小字
     "回复后开始计时销毁"（可选弱提示，实现为不显示倒计时）。发送方侧逻辑不变。
   - 撤回判定仍以 viewed_at 为准（查看过→显示撤回提示；未查看→无痕）。
   - 迁移：V3 增加 messages.activated_at（不可空策略为 NULL=等待）；清扫器/可见性 SQL/测试/前端倒计时全部按 activated_at。
4. **登录有效期**：JWT 默认 7 天；登录页提供"保持登录"勾选（默认勾选）：勾选=localStorage（7 天），
   不勾选=sessionStorage（关闭浏览器即失效）；登录页文案友好提示"保持登录状态下，登录状态保持 7 天，到期后需重新登录"。
5. **聊天页输入区固定**：修复窄屏/宽屏下内容增长把输入栏推离视口的问题（主区 flex 布局修正），
   输入栏固定在聊天窗口底部，与微信一致；手机端随键盘弹起。
6. **手机/电脑一致性**：上述变更全部以 390px 手机视口与桌面视口双端 Chromium E2E 验证。
7. **头像组件渲染缺陷修复（v1.2.1）**：Avatar 组件原仅声明 s36/s40/s56/s72 四档样式，而布局使用了
   30/38/44 等其它尺寸（左上角昵称旁、会话列表、聊天气泡旁）。无头像时字母内容小不触发；上传 512px
   头像后 img（width:100%）回退至原图内禀尺寸，把对应容器撑成 512×512，破坏消息/通讯录/我各页布局。
   修复：Avatar 改为按 size prop 内联渲染宽高/圆角/字号，任何尺寸稳定渲染圆角方形头像；
   并统一 桌面右侧占位区品牌图标（原遗留"隐"字）替换为新品牌 icon.svg。验收：e2e-avatar 断言各点位
   .avatar 实际渲染尺寸等于预期值（≤72px）且图片解码成功；DOM 审计无 >200px 头像元素。