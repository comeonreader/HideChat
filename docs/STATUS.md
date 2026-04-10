# STATUS

STATE: COMPLETE
PROJECT: HideChat
OWNER: Codex
LAST_UPDATED: 2026-04-10

## 更新记录
- 2026-04-10: 完善邮箱验证码发送功能，添加 MailPit 测试邮件服务

## Objective

实现一个可构建、可测试、具备隐私入口与聊天闭环的 HideChat Web 应用，并补齐当前阶段的集成验证与 E2E 验证缺口。

## Current Phase

当前里程碑已完成：

- 前端真实 API 接入已替换关键演示链路
- WebSocket 实时文本 / 图片消息联调已闭环
- 文件上传、邮件发送与基础安全策略已补齐到可运行状态

## Done

### 后端

- Spring Boot 3.3.5 + Java 17 基础工程完成
- auth / user / contact / conversation / message / file / websocket / system 模块已实现
- Redis / PostgreSQL Testcontainers 集成测试恢复
- 文件模块改为真实本地落盘，新增认证上传入口与签名下载地址
- 邮件验证码支持 SMTP 发送，默认集成 MailPit 测试邮件服务
- 开发环境默认启用邮件发送功能
- 改进日志发送器，提供更友好的开发提示
- HTTP 安全头、CORS 白名单、认证限流、WebSocket 消息限流已接入
- 新增后端集成测试：
  - `GET /api/system/fortune/today`
  - 文件上传 / 完成上传 / 签名下载

### 前端

- 伪装入口页、登录/注册、PIN 解锁、聊天页已实现
- IndexedDB 本地缓存与本地加密消息缓存已实现
- 前端聊天页已接入真实用户、联系人、会话、消息历史、已读同步
- 文本消息优先通过 WebSocket 发送并处理 ACK / 接收 / 已读事件
- 图片消息已接入真实上传接口和真实消息发送链路
- 新增前端 E2E：
  - 幸运数字进入隐藏入口
  - PIN 设置
  - 发送消息
  - IndexedDB 中密文落盘验证
  - 返回伪装页后再次解锁
  - 真实 API 登录后通过 WebSocket 发送文本消息
  - WebSocket ACK / 对端推送处理
  - 图片上传并发送图片消息
- 更新邮箱验证码发送提示，引导用户查看测试邮件服务

### 测试基础设施

- `backend` Testcontainers 版本升级到 `1.21.4`
- `backend/src/test/resources/application.yml` 补齐 JWT 测试配置
- `backend/src/test/resources/application-test.yml` 新增 `test` profile，Flyway migration 自动执行
- `backend/src/test/java/com/hidechat/integration/AbstractIntegrationTest.java` 提供共享 Spring Boot + Testcontainers 集成测试基类
- `backend/src/test/java/com/hidechat/integration/IntegrationContainers.java` 提供 PostgreSQL + Redis 共享单例容器，避免 Spring 上下文复用导致端口漂移
- `scripts/run-backend-integration-tests.sh` 提供统一一条命令运行入口，并输出 `backend/target/integration-tests.log`
- 新增 backend 集成测试：
  - `UserProfileIntegrationTest`
  - `ContactIntegrationTest`
  - `ConversationIntegrationTest`
- `frontend` 补齐 `jsdom` + Testing Library + fake IndexedDB 测试环境
- 新增 frontend 浏览器侧模拟联调测试：
  - `backend-realtime.test.tsx`

## In Progress

- 无

## Next

- 无

## Blockers

- 无

## Files Touched

- backend/pom.xml
- backend/src/main/java/com/hidechat/HideChatApplication.java
- backend/src/main/java/com/hidechat/modules/auth/service/MailProperties.java
- backend/src/main/java/com/hidechat/modules/auth/service/impl/LoggingEmailCodeSender.java
- backend/src/main/java/com/hidechat/modules/auth/service/impl/SmtpEmailCodeSender.java
- backend/src/main/java/com/hidechat/modules/file/controller/FileController.java
- backend/src/main/java/com/hidechat/modules/file/service/FileService.java
- backend/src/main/java/com/hidechat/modules/file/service/FileStorageProperties.java
- backend/src/main/java/com/hidechat/modules/file/service/FileUrlSignatureService.java
- backend/src/main/java/com/hidechat/modules/file/service/PublicFileContent.java
- backend/src/main/java/com/hidechat/modules/file/service/impl/FileServiceImpl.java
- backend/src/main/java/com/hidechat/security/SecurityConfig.java
- backend/src/main/java/com/hidechat/security/SecurityWebProperties.java
- backend/src/main/java/com/hidechat/security/filter/AuthRateLimitFilter.java
- backend/src/main/java/com/hidechat/websocket/config/WebSocketConfig.java
- backend/src/main/java/com/hidechat/websocket/handler/ChatWebSocketHandler.java
- backend/src/main/java/com/hidechat/websocket/security/WebSocketRateLimiter.java
- backend/src/main/resources/application.yml
- backend/src/test/java/com/hidechat/integration/AbstractIntegrationTest.java
- backend/src/test/java/com/hidechat/integration/FileUploadIntegrationTest.java
- backend/src/test/java/com/hidechat/modules/file/FileControllerTest.java
- backend/src/test/java/com/hidechat/modules/file/FileServiceImplTest.java
- backend/src/test/java/com/hidechat/websocket/ChatWebSocketHandlerTest.java
- backend/src/test/resources/application-test.yml
- frontend/src/api/client.ts
- frontend/src/app/App.tsx
- frontend/src/app/app.css
- frontend/src/types/index.ts
- frontend/src/utils/index.ts
- frontend/src/vite-env.d.ts
- frontend/tests/e2e/app-flow.test.tsx
- frontend/tests/e2e/backend-realtime.test.tsx
- docs/STATUS.md
- docker-compose.yml (添加 MailPit 服务)
- .env.example (添加邮件配置)
- README.md (更新邮件服务说明)
- frontend/src/app/App.tsx (更新验证码发送提示)
- backend/src/main/resources/application.yml (默认启用邮件功能)
- backend/src/main/java/com/hidechat/modules/auth/service/impl/LoggingEmailCodeSender.java (改进开发提示)

## Commands Run

```bash
cd frontend && npm test
cd frontend && npm run build
cd backend && mvn test -DskipITs
```

## Verification

- `backend mvn test -DskipITs` 通过：`64 tests, 0 skipped`
- `backend` 集成测试通过：
  - Redis / PostgreSQL 真实容器联通
  - 用户资料查询/更新 + Redis 缓存刷新
  - 联系人添加与列表排序
  - 会话创建、列表、清空未读
  - 系统公开接口 HTTP 访问
- 文件上传 / 文件签名下载真实联通
- Surefire 明细：`backend/target/surefire-reports/TEST-com.hidechat.integration.*.xml`
- `frontend npm test` 通过：`4 tests`
- `frontend npm run build` 通过
- 前端模拟联调验证通过：
  - 真实 API 登录
  - WebSocket ACK / 对端消息推送
  - 图片上传并发送图片消息

## Risks

- 文件下载签名为单体服务内 HMAC 实现，若未来拆分独立对象存储，需要切换为对象存储预签名能力
- 当前限流为单实例内存窗口，若部署多实例需迁移到 Redis 或网关级统一限流
- 图片消息目前使用签名 URL 直接展示，过期时间需要结合实际产品策略继续校准

## Resume Instructions

若继续扩展，优先顺序如下：

1. 增加真实浏览器驱动 E2E，替代当前 jsdom + Mock WebSocket 联调
2. 将限流从单实例内存实现迁移到 Redis / 网关
3. 视部署形态切换本地文件存储为对象存储预签名上传下载
