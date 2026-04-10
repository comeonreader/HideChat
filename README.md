# HideChat

HideChat 是一个面向手机和桌面浏览器的 Web 隐私聊天系统，核心思路是用“运势页 + 幸运数字”作为伪装入口，再用本地 PIN 和浏览器密文缓存提高随手查看门槛。

当前仓库已经不是纯设计稿或脚手架，而是包含了可运行的前后端实现、数据库 migration、接口测试、前端联调测试，以及一组用于对齐交互方向的 `mockup/` 原型页。

## 1. 项目目标

结合 [PRD](/home/reader/HideChat/docs/prd/HideChat_PRD.md)、[技术方案](/home/reader/HideChat/docs/tech-design/HideChat技术方案文档%20v1.0.md)、[接口文档](/home/reader/HideChat/docs/api/后端接口定义文档%20v1.0.md) 和当前代码，HideChat 当前阶段目标是：

- 伪装入口：幸运数字校验，未命中时继续展示运势内容
- 账号体系：邮箱注册、邮箱密码登录、邮箱验证码登录、重置密码、刷新令牌
- 联系人与 1V1 会话：搜索用户、添加联系人、创建或获取单聊会话
- 消息能力：文本消息、图片消息、通用文件附件消息
- 实时通信：REST + WebSocket
- 本地隐私：PIN 解锁、IndexedDB 密文缓存
- 浏览器适配：手机端与桌面端主链路可用

产品设计理念可以概括为一句话：

> 让聊天存在，但看不见。

## 2. 仓库结构

- `docs/`：产品、技术、数据库、接口、测试文档
- `mockup/`：原型页，覆盖幸运数字页、运势页、聊天列表、聊天页、添加好友页
- `backend/`：Spring Boot 3 + MyBatis-Plus + PostgreSQL + Redis 后端
- `frontend/`：Vite + React + TypeScript 前端
- `scripts/run-backend-integration-tests.sh`：后端集成测试统一入口

## 3. docs、mockup 与当前实现的关系

这三个层次需要分开理解：

- `docs/` 描述的是产品目标、接口边界和推荐技术方案
- `mockup/` 描述的是页面信息架构和视觉/交互方向
- `backend/` 与 `frontend/` 描述的是当前实际可运行实现

当前实现与设计文档整体一致，但有两点需要特别注意：

- 设计文档里有一部分内容是“目标状态”，不代表每个细节都已经完全实现
- 当前代码里也有一些实现已经超过早期文档，例如真实登录、真实联系人/会话/消息联调、真实本地文件上传链路

## 4. 当前已实现能力

### 4.1 伪装入口与运势页

对应原型：

- [mockup/lucky-number.html](/home/reader/HideChat/mockup/lucky-number.html)
- [mockup/fortune.html](/home/reader/HideChat/mockup/fortune.html)

当前实现：

- 前端默认展示伪装入口和运势内容
- 前端会请求后端公开接口：
  - `GET /api/system/fortune/today`
  - `GET /api/system/disguise-config`
  - `POST /api/system/disguise/verify-lucky-number`
- 幸运数字命中后进入隐藏聊天系统；未命中时继续留在伪装链路
- 当前前端在公开接口不可用时，对运势内容有兜底展示

### 4.2 登录、注册与鉴权

当前实现：

- `POST /api/auth/email/send-code`
- `POST /api/auth/email/register`
- `POST /api/auth/email/password-login`
- `POST /api/auth/email/code-login`
- `POST /api/auth/email/reset-password`
- `POST /api/auth/refresh-token`
- `POST /api/auth/logout`

补充说明：

- Access Token / Refresh Token 已接入
- 前端会把登录态保存到 `localStorage`
- 邮件能力支持 SMTP；默认使用 MailPit 测试邮件服务
- 开发环境下，验证码会发送到 MailPit（http://localhost:8025）
- 生产环境需配置真实的 SMTP 服务器

### 4.3 联系人、会话与用户搜索

对应原型：

- [mockup/chat-list.html](/home/reader/HideChat/mockup/chat-list.html)
- [mockup/add-friend.html](/home/reader/HideChat/mockup/add-friend.html)

当前实现：

- `GET /api/user/me`
- `GET /api/user/search`
- `PUT /api/user/profile`
- `POST /api/contact/add`
- `GET /api/contact/list`
- `GET /api/contact/recent`
- `POST /api/conversation/single`
- `GET /api/conversation/list`
- `POST /api/conversation/clear-unread`

行为特点：

- 支持按昵称和展示用用户 ID 搜索，不返回邮箱
- 联系人列表、最近联系人、会话列表都已落地
- 会话列表按设计要求做脱敏预览，不直接暴露真实消息内容

### 4.4 文本、图片、文件消息

对应原型：

- [mockup/chat.html](/home/reader/HideChat/mockup/chat.html)

当前实现：

- `POST /api/message/send`
- `GET /api/message/history`
- `POST /api/message/read`
- `POST /api/file/upload-sign`
- `PUT /api/file/upload/{fileId}`
- `POST /api/file/complete`
- `GET /api/file/{fileId}`
- `GET /api/file/content/{fileId}?expires=...&signature=...`

补充说明：

- 文本消息、图片消息、通用文件消息已接入
- 文件当前默认落盘到后端本地目录，而不是对象存储
- 文件访问使用签名 URL
- 聊天页可展示真实文件名和大小；会话列表保持脱敏

### 4.5 WebSocket 实时链路

当前实现：

- 端点：`/ws/chat`
- 支持 `CHAT_SEND`、`CHAT_ACK`、`CHAT_RECEIVE`、`CHAT_READ`
- 前端登录后会建立 WebSocket 连接
- 文本消息优先通过 WebSocket 发送并处理 ACK / 已读同步

### 4.6 PIN、本地加密与浏览器缓存

当前实现：

- 浏览器 IndexedDB 库名：`hidechat-local`
- 会话密文缓存存放在 `conversation-cache`
- PIN 校验材料存放在 `local-secrets`
- 加密方案为 `PBKDF2 + AES-GCM`
- PIN 明文不会持久化保存
- 返回伪装页后，可再次通过 PIN 解锁本地历史消息

与设计文档对比：

- 文档建议的本地存储分层与安全边界基本一致
- 当前实现没有做到更高阶的自动锁定、错误次数限制、多端密钥同步

## 5. 技术栈

后端：

- Java 17
- Spring Boot 3.3.5
- Spring Security
- Spring WebSocket
- MyBatis-Plus 3.5.7
- Flyway
- PostgreSQL
- Redis

前端：

- React 18
- TypeScript 5
- Vite 5
- Web Crypto API
- IndexedDB
- 原生 WebSocket

测试：

- JUnit 5
- Spring Boot Test
- Testcontainers
- Vitest
- Testing Library
- fake-indexeddb

## 6. 快速开始

### 6.1 环境要求

- Java 17+
- Maven 3.9+
- Node.js 20+
- npm 10+
- PostgreSQL 14+
- Redis 7+
- Docker

建议先确认版本：

```bash
java -version
mvn -version
node -v
npm -v
psql --version
redis-server --version
docker -v
```

### 6.2 初始化 PostgreSQL

默认开发配置来自 [application.yml](/home/reader/HideChat/backend/src/main/resources/application.yml) 和 [application-dev.yml](/home/reader/HideChat/backend/src/main/resources/application-dev.yml)：

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

首次启动后端时，Flyway 会自动执行：

- [V1__init_schema.sql](/home/reader/HideChat/backend/src/main/resources/db/migration/V1__init_schema.sql)
- [V2__add_disguise_lucky_code.sql](/home/reader/HideChat/backend/src/main/resources/db/migration/V2__add_disguise_lucky_code.sql)
- [V3__allow_file_message_type.sql](/home/reader/HideChat/backend/src/main/resources/db/migration/V3__allow_file_message_type.sql)

### 6.3 初始化 Redis

默认开发配置：

- Host：`localhost`
- Port：`6379`
- DB：`0`

### 6.4 启动邮件服务（MailPit）

开发环境默认包含 MailPit 测试邮件服务：

```bash
# 使用 docker-compose 启动所有服务（包括 MailPit）
docker-compose up -d

# 或者单独启动 MailPit
docker run -d \
  --name hidechat-mailpit \
  -p 1025:1025 \
  -p 8025:8025 \
  axllent/mailpit:latest
```

MailPit 提供：
- SMTP 服务器：`localhost:1025`
- Web 界面：`http://localhost:8025`

### 6.5 启动后端

```bash
cd backend
mvn spring-boot:run
```

默认端口：

- HTTP：`http://localhost:8080`
- WebSocket：`ws://localhost:8080/ws/chat`

启动后可先做一次 smoke test：

```bash
curl http://localhost:8080/api/system/fortune/today
curl http://localhost:8080/api/system/disguise-config
```

### 6.5 启动前端

```bash
cd frontend
npm install
npm run dev
```

默认端口：

- `http://localhost:5173`

### 6.6 前后端联调方式

前端默认行为：

- `VITE_API_BASE_URL` 未设置时，REST 基地址默认为 `/api`
- `VITE_WS_BASE_URL` 未设置时，WebSocket 默认连到当前域名下的 `/ws/chat`

这意味着本地开发有两种方式：

1. 通过反向代理把前端、后端挂到同一域名
2. 直接指定前端环境变量

示例：

```bash
cd frontend
VITE_API_BASE_URL=http://localhost:8080/api \
VITE_WS_BASE_URL=ws://localhost:8080/ws/chat \
npm run dev
```

如果你使用单独域名联调，还需要确认后端允许来源配置：

- `HIDECHAT_ALLOWED_ORIGIN`

## 7. 常用配置项

### 7.1 后端

常用环境变量或配置项：

- `SPRING_DATASOURCE_URL`
- `SPRING_DATASOURCE_USERNAME`
- `SPRING_DATASOURCE_PASSWORD`
- `SPRING_DATA_REDIS_HOST`
- `SPRING_DATA_REDIS_PORT`
- `SPRING_DATA_REDIS_DATABASE`
- `HIDECHAT_SECURITY_JWT_SECRET`
- `HIDECHAT_ALLOWED_ORIGIN`
- `HIDECHAT_MAIL_ENABLED`
- `SPRING_MAIL_HOST`
- `SPRING_MAIL_PORT`
- `SPRING_MAIL_USERNAME`
- `SPRING_MAIL_PASSWORD`
- `SPRING_MAIL_SMTP_AUTH`
- `SPRING_MAIL_SMTP_STARTTLS`
- `HIDECHAT_MAIL_FROM_ADDRESS`
- `HIDECHAT_MAIL_FROM_NAME`
- `HIDECHAT_FILE_STORAGE_ROOT`
- `HIDECHAT_FILE_MAX_SIZE_BYTES`
- `HIDECHAT_FILE_SIGNED_URL_EXPIRE_SECONDS`
- `HIDECHAT_FILE_URL_SIGNATURE_SECRET`
- `HIDECHAT_AUTH_RPM`
- `HIDECHAT_WS_RPM`

上线前必须修改：

- JWT secret
- 数据库密码
- Redis 密码
- 文件签名密钥
- Allowed origins

### 7.2 前端

当前前端主要依赖两个构建时环境变量：

- `VITE_API_BASE_URL`
- `VITE_WS_BASE_URL`

## 8. 测试与验收

### 8.1 后端单元测试

```bash
cd backend
mvn test -DskipITs
```

### 8.2 后端集成测试

需要 Docker，因为测试依赖 Testcontainers。

```bash
./scripts/run-backend-integration-tests.sh
```

日志输出到：

- [backend/target/integration-tests.log](/home/reader/HideChat/backend/target/integration-tests.log)

### 8.3 前端测试

```bash
cd frontend
npm test
npm run test:e2e
npm run build
```

### 8.4 验收参考

测试与验收标准见：

- [docs/test/测试与验收标准 v1.0.md](/home/reader/HideChat/docs/test/测试与验收标准%20v1.0.md)
- [docs/test/接口测试清单 Postman Apifox.md](/home/reader/HideChat/docs/test/接口测试清单%20Postman%20Apifox.md)
- [docs/STATUS.md](/home/reader/HideChat/docs/STATUS.md)

## 9. Docker 部署指南

仓库当前提供了前后端各自的 Dockerfile，但没有现成的 `docker-compose.yml`。推荐部署形态是：

- `frontend`：Nginx 提供静态资源
- `backend`：Spring Boot 服务
- `postgres`：独立数据库
- `redis`：独立缓存

### 9.1 构建镜像

后端：

```bash
docker build -t hidechat-backend:local ./backend
```

前端：

```bash
docker build -t hidechat-frontend:local ./frontend
```

### 9.2 创建网络

```bash
docker network create hidechat-net
```

### 9.3 启动 PostgreSQL 和 Redis

```bash
docker run -d \
  --name hidechat-postgres \
  --network hidechat-net \
  -e POSTGRES_DB=hidechat \
  -e POSTGRES_USER=hidechat \
  -e POSTGRES_PASSWORD=hidechat \
  postgres:16
```

```bash
docker run -d \
  --name hidechat-redis \
  --network hidechat-net \
  redis:7-alpine
```

### 9.4 启动后端容器

```bash
docker run -d \
  --name hidechat-backend \
  --network hidechat-net \
  -p 8080:8080 \
  -e SPRING_DATASOURCE_URL='jdbc:postgresql://hidechat-postgres:5432/hidechat?currentSchema=hidechat' \
  -e SPRING_DATASOURCE_USERNAME=hidechat \
  -e SPRING_DATASOURCE_PASSWORD=hidechat \
  -e SPRING_DATA_REDIS_HOST=hidechat-redis \
  -e SPRING_DATA_REDIS_PORT=6379 \
  -e HIDECHAT_SECURITY_JWT_SECRET='replace-with-a-long-random-secret' \
  -e HIDECHAT_ALLOWED_ORIGIN=http://localhost \
  -e HIDECHAT_MAIL_ENABLED=false \
  -e HIDECHAT_FILE_STORAGE_ROOT=/data/uploads \
  -e HIDECHAT_FILE_URL_SIGNATURE_SECRET='change-this-secret' \
  -v "$(pwd)/.data/uploads:/data/uploads" \
  hidechat-backend:local
```

说明：

- 后端启动时会自动执行 Flyway migration
- 文件默认落盘到容器内 `/data/uploads`
- 本地卷挂载建议保留，否则容器重建后文件会丢失

### 9.5 启动前端容器

如果前端和后端不在同一域名下，需要在构建前指定 API / WS 地址：

```bash
cd frontend
VITE_API_BASE_URL=http://localhost:8080/api \
VITE_WS_BASE_URL=ws://localhost:8080/ws/chat \
docker build -t hidechat-frontend:local .
```

启动：

```bash
docker run -d \
  --name hidechat-frontend \
  --network hidechat-net \
  -p 80:80 \
  hidechat-frontend:local
```

### 9.6 推荐的生产代理方式

更稳妥的生产方案是把前端和后端收敛到同一域名：

- `/` -> 前端静态资源
- `/api` -> 后端 HTTP
- `/ws/chat` -> 后端 WebSocket

这样可以简化：

- 前端环境变量管理
- WebSocket 地址切换
- CORS 配置

## 10. 当前已知边界

基于设计文档和当前实现，下面这些点仍应视为后续增强项，而不是已经完全收口的生产能力：

- 还没有提供官方 `docker-compose.yml` 或 Kubernetes 清单
- 文件存储仍是本地文件系统，不是对象存储预签名上传
- 限流是单实例内存窗口，多实例部署需要升级
- 没有实现更严格的 PIN 错误次数限制和自动锁定策略
- 真实浏览器驱动 E2E 仍可继续补强

## 11. 相关文档

- [docs/prd/HideChat_PRD.md](/home/reader/HideChat/docs/prd/HideChat_PRD.md)
- [docs/tech-design/HideChat技术方案文档 v1.0.md](/home/reader/HideChat/docs/tech-design/HideChat技术方案文档%20v1.0.md)
- [docs/api/后端接口定义文档 v1.0.md](/home/reader/HideChat/docs/api/后端接口定义文档%20v1.0.md)
- [docs/database/PostgreSQL DDL 建表脚本 v1.0.md](/home/reader/HideChat/docs/database/PostgreSQL%20DDL%20建表脚本%20v1.0.md)
- [docs/database/数据库字段设计文档 v1.0.md](/home/reader/HideChat/docs/database/数据库字段设计文档%20v1.0.md)
- [docs/test/测试与验收标准 v1.0.md](/home/reader/HideChat/docs/test/测试与验收标准%20v1.0.md)
- [docs/STATUS.md](/home/reader/HideChat/docs/STATUS.md)
