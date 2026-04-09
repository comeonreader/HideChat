# HideChat

HideChat 是一个“伪装入口 + 本地加密缓存 + 1V1 聊天后端”的 Web 隐私聊天项目。仓库内的 `docs/` 给出了完整产品与技术设计，当前代码已经实现可运行的前后端原型、数据库迁移、JWT 鉴权、WebSocket 消息通道，以及一套可执行的单元测试和集成测试。

当前实现需要和设计文档区分理解：

- `docs/` 描述的是目标方案与接口边界
- 当前 `frontend/` 已实现单页隐私演示流转，但主要仍是本地演示态
- 当前 `backend/` 已实现大部分 MVP 后端模块，可独立启动并通过测试

## 仓库结构

- `docs/`: 产品、技术方案、数据库、接口和测试文档
- `frontend/`: Vite + React + TypeScript 前端
- `backend/`: Spring Boot 3 + MyBatis-Plus + PostgreSQL + Redis 后端
- `scripts/run-backend-integration-tests.sh`: 后端集成测试统一入口
- `HideChatDocs/`: 原始文档镜像

## 依据设计文档整理的当前已实现功能

### 1. 伪装入口与系统页

已实现：

- 前端首页以“今日运势”作为伪装入口
- 前端会优先请求后端公开接口：
  - `GET /api/system/fortune/today`
  - `GET /api/system/disguise-config`
- 后端 `system` 模块已返回每日运势和伪装配置
- 当前前端在后端不可用时会自动回退到本地默认数据

当前边界：

- 设计文档中的“用户自定义幸运数字 + localStorage 持久化 hash”尚未落地
- 当前前端使用内置演示幸运数字 `2468`，并在运行时计算 SHA-256 后校验

### 2. PIN 解锁与本地加密缓存

已实现：

- 前端具备 PIN 设置与 PIN 解锁流程
- 消息缓存写入浏览器 IndexedDB，库名为 `hidechat-local`
- 缓存内容以密文形式保存，解锁后再恢复到页面
- 提供“返回伪装页”能力，能从聊天页退回伪装入口
- 已有前端 E2E 覆盖：
  - 幸运数字进入隐藏入口
  - 设置 PIN
  - 发送消息
  - 验证 IndexedDB 中保存的是密文
  - 返回伪装页后再次用 PIN 解锁

当前边界：

- 当前加密实现为 Web Crypto `AES-GCM`，密钥由 `SHA-256(pin)` 派生，和设计文档中建议的 `PBKDF2(pin, salt, 10000)` 不完全一致
- PIN 哈希当前只保存在前端运行时状态中，没有做刷新后持久化
- 自动锁定、标签页切换锁定、错误次数限制等安全策略尚未实现

### 3. 聊天列表与聊天界面

已实现：

- 前端已具备联系人列表、会话列表、消息列表和发送框
- 发送文本消息后会更新会话摘要、联系人最近互动时间，并同步刷新本地密文缓存
- 当前前端演示态内置了示例联系人、会话和消息数据

当前边界：

- 前端还没有接入后端的真实登录、联系人、会话、消息和 WebSocket 链路
- 图片消息前端 UI 与实际上传流程尚未接入
- 当前聊天页更接近“隐私流转原型 + 本地缓存验证页”

### 4. 后端账号与鉴权

已实现：

- 邮箱验证码发送：`POST /api/auth/email/send-code`
- 邮箱注册：`POST /api/auth/email/register`
- 邮箱密码登录：`POST /api/auth/email/password-login`
- 邮箱验证码登录：`POST /api/auth/email/code-login`
- 重置密码：`POST /api/auth/email/reset-password`
- 刷新令牌：`POST /api/auth/refresh-token`
- 登出：`POST /api/auth/logout`
- JWT 鉴权过滤器、Access Token / Refresh Token 机制
- 验证码、Refresh Token、用户认证信息均已落库

当前边界：

- 验证码发送器当前是 `LoggingEmailCodeSender`，只写日志，不会真正发邮件

### 5. 后端用户、联系人、会话、消息

已实现：

- 用户资料：
  - `GET /api/user/me`
  - `PUT /api/user/profile`
- 联系人：
  - `POST /api/contact/add`
  - `GET /api/contact/list`
- 会话：
  - `POST /api/conversation/single`
  - `GET /api/conversation/list`
  - `POST /api/conversation/clear-unread`
- 消息：
  - `POST /api/message/send`
  - `GET /api/message/history`
  - `POST /api/message/read`
- PostgreSQL 中已包含用户、认证、联系人、会话、消息、未读计数、文件等表结构
- 会话摘要、未读数、已读回执、联系人最后互动时间都已在服务层处理
- 用户资料读取带 Redis 缓存

### 6. 文件与 WebSocket

已实现：

- 文件接口：
  - `POST /api/file/upload-sign`
  - `POST /api/file/complete`
  - `GET /api/file/{fileId}`
- WebSocket 端点：`/ws/chat`
- WebSocket 支持：
  - `CHAT_SEND`
  - `CHAT_READ`
  - 服务端 ACK
  - 在线用户转发

当前边界：

- 文件上传签名与访问地址仍是示例 URL：
  - `https://storage.example.com/upload/`
  - `https://cdn.example.com/`
- 当前更适合本地开发和接口联调，不适合直接作为生产存储实现

### 7. 测试与验证

已实现并在状态文档中标记通过：

- 后端单元测试：`mvn test`
- 后端 PostgreSQL + Redis Testcontainers 集成测试
- 前端单元测试：加密逻辑
- 前端 E2E：隐私主路径
- 前端构建：`npm run build`

## 本地启动指南

### 环境准备

建议准备以下环境：

- Java 17
- Maven 3.9+
- Node.js 20 LTS
- npm 10+
- PostgreSQL 14+ 或 15+
- Redis 7+
- Docker
  - 用于执行后端 Testcontainers 集成测试

可先检查版本：

```bash
java -version
mvn -version
node -v
npm -v
docker -v
psql --version
redis-server --version
```

### 1. 初始化数据库与 Redis

先准备一个本地 PostgreSQL 数据库和用户。当前默认开发配置使用：

- 数据库：`hidechat_dev`
- 用户：`hidechat_dev`
- 密码：`hidechat_dev`
- schema：`hidechat`

示例 SQL：

```sql
CREATE DATABASE hidechat_dev;
CREATE USER hidechat_dev WITH PASSWORD 'hidechat_dev';
GRANT ALL PRIVILEGES ON DATABASE hidechat_dev TO hidechat_dev;
```

Redis 默认连接：

- host: `localhost`
- port: `6379`
- database: `0`

后端启动时会通过 Flyway 自动执行 [V1__init_schema.sql](/home/reader/HideChat/backend/src/main/resources/db/migration/V1__init_schema.sql) 初始化表结构。

### 2. 修改后端配置

优先检查这两个文件：

- [application.yml](/home/reader/HideChat/backend/src/main/resources/application.yml)
- [application-dev.yml](/home/reader/HideChat/backend/src/main/resources/application-dev.yml)

最常见需要调整的配置项：

- 数据库连接：
  - `spring.datasource.url`
  - `spring.datasource.username`
  - `spring.datasource.password`
- Redis 连接：
  - `spring.data.redis.host`
  - `spring.data.redis.port`
  - `spring.data.redis.database`
- 服务端口：
  - `server.port`
- JWT：
  - `hidechat.security.jwt.issuer`
  - `hidechat.security.jwt.secret`
  - `hidechat.security.jwt.access-token-expire-seconds`
  - `hidechat.security.jwt.refresh-token-expire-seconds`
- WebSocket 端点：
  - `hidechat.websocket.endpoint`

至少应把开发环境的 JWT secret 改成你自己的值，不要继续使用仓库内默认示例值。

### 3. 启动后端

```bash
cd backend
mvn spring-boot:run
```

默认启动后：

- HTTP: `http://localhost:8080`
- WebSocket: `ws://localhost:8080/ws/chat`

如果只想先验证公开接口，可直接访问：

```bash
curl http://localhost:8080/api/system/fortune/today
curl http://localhost:8080/api/system/disguise-config
```

### 4. 启动前端

先安装依赖：

```bash
cd frontend
npm install
```

开发模式启动：

```bash
npm run dev
```

默认地址：

- `http://localhost:5173`

### 5. 前端联调说明

当前前端请求使用相对路径 `/api`，而 [vite.config.ts](/home/reader/HideChat/frontend/vite.config.ts) 里没有配置开发代理。

这意味着：

- 只启动前端时，系统公开接口会失败并自动回退到本地默认数据
- 如果要在本地开发时直接联调后端，建议给 Vite 增加代理

可在 [vite.config.ts](/home/reader/HideChat/frontend/vite.config.ts) 中加入：

```ts
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:8080",
      "/ws": {
        target: "ws://localhost:8080",
        ws: true
      }
    }
  },
  test: {
    environment: "jsdom",
    setupFiles: "./tests/setup.ts"
  }
});
```

如果你不想改 Vite，也可以在 Nginx / Caddy 上把前端和后端挂到同一域名下，用反向代理统一 `/api` 和 `/ws`。

## 常用命令

### 后端

```bash
cd backend
mvn test
```

```bash
./scripts/run-backend-integration-tests.sh
```

### 前端

```bash
cd frontend
npm test
```

```bash
cd frontend
npm run test:e2e
```

```bash
cd frontend
npm run build
```

## 项目部署建议

### 1. 部署形态建议

建议采用下面的拆分：

- `frontend`
  - 打包成静态资源
  - 由 Nginx、Caddy 或 CDN 提供访问
- `backend`
  - 独立部署为 Spring Boot 服务
  - 对外暴露 REST 和 WebSocket
- `postgresql`
  - 独立实例或托管数据库
- `redis`
  - 独立实例或托管缓存
- `object storage`
  - 使用 MinIO、S3、OSS、COS 等真实对象存储

### 2. 网关与反向代理建议

建议通过 Nginx 或 Caddy 暴露单一域名：

- `/` -> 前端静态资源
- `/api` -> 后端 HTTP
- `/ws/chat` -> 后端 WebSocket

这样可以同时解决：

- 前端相对路径请求
- WebSocket 升级转发
- CORS 复杂度

### 3. 上生产前必须补齐的内容

- 把 JWT secret、数据库密码、Redis 密码改为环境变量注入
- 将 `LoggingEmailCodeSender` 替换为真实邮件服务
- 将文件服务中的示例上传 URL / CDN URL 替换为真实对象存储实现
- 收紧 WebSocket 和 HTTP 的允许来源，不要保留 `setAllowedOriginPatterns("*")`
- 为 PostgreSQL 与 Redis 配置备份、监控和告警
- 增加浏览器级 WebSocket 联调测试和文件消息 E2E

### 4. 对当前代码的落地建议

如果近期目标是“尽快形成可演示版本”，建议按这个优先级推进：

1. 先把前端接上后端真实登录、联系人、会话、消息接口
2. 给 Vite 或网关补齐本地联调代理
3. 把 PIN 与幸运数字配置做本地持久化
4. 替换邮件与对象存储占位实现
5. 再补自动锁定、图片消息和更严格的安全策略

## 当前结论

HideChat 现在已经不是单纯脚手架，而是“后端 MVP 基本完整 + 前端隐私流转原型已可运行”的状态。若目标是继续作为产品推进，下一阶段的关键不是再补设计文档，而是把前端从演示态接到真实后端链路，并替换邮件、对象存储和联调代理这些占位实现。
