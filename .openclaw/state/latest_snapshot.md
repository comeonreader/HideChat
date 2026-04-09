10. 每阶段完成后必须输出“状态快照”

状态快照必须包含：
1. 当前已完成模块
2. 本轮新增/修改的关键文件
3. 已实现接口/页面/功能
4. 已完成的测试与验证结果
5. 当前未完成项
6. 下一轮最合理的继续顺序

请先读取仓库根目录的 agents.md 和 docs 目录，不要改代码。

目标：完成仓库扫描、现状分析、缺口清单、分阶段计划。

输出必须包含：
1. 已实现后端模块和接口
2. 已实现前端页面/API 封装
3. 已有数据库/migration 状态
4. 已有测试覆盖情况
5. 已有 Docker/Compose/脚本状态
6. 与文档要求相比，缺失的功能清单
7. 当前阻塞联调的问题列表
8. 建议的分阶段执行计划
9. 每阶段建议验证方式

要求：
- 只做分析，不改代码
- 先给出现状与缺口，再给出分阶段计划
- 最后输出状态快照
Reading prompt from stdin...
OpenAI Codex v0.118.0 (research preview)
--------
workdir: /home/reader/HideChat
model: gpt-5.4
provider: openai
approval: never
sandbox: danger-full-access
reasoning effort: none
reasoning summaries: none
session id: 019d6f22-8de4-7ad1-9799-3319b6be6e46
--------
user
必须遵守：
1. 严格遵守仓库根目录的 agents.md
2. 必须读取 docs 目录中的相关文档
3. 不直接修改 schema，除非确实无法实现，并且必须通过 migration
4. 不做大范围无关重构
5. 不重复生成已有代码
6. 输出代码时必须补测试
7. Controller 不写业务逻辑，Service 承担业务逻辑，Mapper 只做数据访问
8. 不允许把 Entity 直接返回前端
9. 不允许把 PIN、幸运数字、验证码、token、聊天明文以明文形式持久化或打印日志
10. 每阶段完成后必须输出“状态快照”

状态快照必须包含：
1. 当前已完成模块
2. 本轮新增/修改的关键文件
3. 已实现接口/页面/功能
4. 已完成的测试与验证结果
5. 当前未完成项
6. 下一轮最合理的继续顺序

请先读取仓库根目录的 agents.md 和 docs 目录，不要改代码。

目标：完成仓库扫描、现状分析、缺口清单、分阶段计划。

输出必须包含：
1. 已实现后端模块和接口
2. 已实现前端页面/API 封装
3. 已有数据库/migration 状态
4. 已有测试覆盖情况
5. 已有 Docker/Compose/脚本状态
6. 与文档要求相比，缺失的功能清单
7. 当前阻塞联调的问题列表
8. 建议的分阶段执行计划
9. 每阶段建议验证方式

要求：
- 只做分析，不改代码
- 先给出现状与缺口，再给出分阶段计划
- 最后输出状态快照

codex
先按你的约束做静态梳理：我先读取仓库根目录的 `agents.md` 和 `docs/`，再补充扫描项目结构、后后端/前端/数据库/测试/脚本现状，不做任何代码修改。
exec
/bin/bash -lc "pwd && rg --files -g 'agents.md' -g 'AGENTS.md' -g 'Agents.md' -g 'docs/**'" in /home/reader/HideChat
 succeeded in 0ms:
/home/reader/HideChat
agents.md
HideChatDocs/agents.md
docs/prd/HideChat_PRD.md
docs/test/接口测试清单 Postman Apifox.md
docs/test/测试与验收标准 v1.0.md
docs/CODEX_SOP.md
docs/README.md
docs/STATUS.md
docs/database/PostgreSQL DDL 建表脚本 v1.0.md
docs/database/数据库字段设计文档 v1.0.md
docs/tech-design/Spring Boot 实体类与 MyBatis-Plus Mapper 设计文档 v1.0.md
docs/tech-design/HideChat技术方案文档 v1.0.md
docs/api/后端接口定义文档 v1.0.md

exec
/bin/bash -lc 'rg --files' in /home/reader/HideChat
 succeeded in 0ms:
docker-compose.yml
.env.example
prompts/phase_file.txt
prompts/phase_e2e.txt
prompts/phase_message_ws.txt
prompts/phase_frontend_min.txt
prompts/common_guardrails.txt
prompts/phase_privacy.txt
prompts/phase_backend_core.txt
prompts/phase_scan.txt
README.md
HideChatDocs/README.md
HideChatDocs/agents.md
HideChatDocs/docs/prd/HideChat_PRD.md
backend/Dockerfile
backend/pom.xml
docker/nginx/default.conf
HideChatDocs/docs/test/接口测试清单 Postman Apifox.md
HideChatDocs/docs/test/测试与验收标准 v1.0.md
HideChatDocs/docs/db/PostgreSQL DDL 建表脚本 v1.0.md
HideChatDocs/docs/db/数据库字段设计文档 v1.0.md
agents.md
HideChatDocs/docs/backend/Spring Boot 实体类与 MyBatis-Plus Mapper 设计文档 v1.0.md
frontend/index.html
config/project.env.example
config/phases.conf
HideChatDocs/docs/api/后端接口定义文档 v1.0.md
frontend/package.json
HideChatDocs/docs/tech/HideChat技术方案文档 v1.0.md
frontend/src/components/README.md
backend/src/main/resources/db/migration/V1__init_schema.sql
backend/src/main/resources/application.yml
backend/src/main/resources/application-dev.yml
frontend/src/hooks/index.ts
frontend/src/crypto/index.ts
frontend/tests/setup.ts
frontend/src/pages/README.md
frontend/src/api/client.ts
backend/src/test/resources/application-test.yml
frontend/tests/unit/crypto.test.ts
backend/src/test/resources/application.yml
frontend/tests/unit/placeholder.test.md
frontend/src/types/index.ts
docs/prd/HideChat_PRD.md
docs/STATUS.md
frontend/src/utils/index.ts
frontend/Dockerfile
frontend/README.md
frontend/vite.config.ts
frontend/tsconfig.json
frontend/package-lock.json
frontend/tests/README.md
frontend/src/store/index.ts
docs/test/接口测试清单 Postman Apifox.md
docs/test/测试与验收标准 v1.0.md
docs/CODEX_SOP.md
docs/README.md
scripts/up.sh
scripts/run_all.sh
scripts/recover.sh
scripts/run_phase.sh.backup
scripts/down.sh
scripts/verify.sh
scripts/run_phase_fixed.sh
frontend/tests/e2e/app-flow.test.tsx
backend/src/main/java/com/hidechat/security/SecurityConfig.java
backend/src/main/java/com/hidechat/HideChatApplication.java
scripts/run_all.sh.backup
scripts/run-backend-integration-tests.sh
scripts/run_phase.sh
scripts/run_all_fixed.sh
scripts/check.sh
frontend/src/app/app.css
frontend/src/app/main.tsx
frontend/src/app/App.tsx
frontend/nginx/default.conf
backend/src/main/java/com/hidechat/security/context/AuthenticatedUser.java
backend/src/main/java/com/hidechat/security/context/CurrentUserProvider.java
backend/src/main/java/com/hidechat/common/exception/BusinessException.java
backend/src/main/java/com/hidechat/common/exception/GlobalExceptionHandler.java
backend/src/main/java/com/hidechat/common/util/IdGenerator.java
backend/src/main/java/com/hidechat/websocket/handler/ChatWebSocketHandler.java
backend/src/main/java/com/hidechat/common/util/RandomValueGenerator.java
backend/src/main/java/com/hidechat/persistence/mapper/ImUnreadCounterMapper.java
backend/src/test/java/com/hidechat/modules/contact/ContactServiceImplTest.java
backend/src/main/java/com/hidechat/persistence/mapper/ImUserAuthMapper.java
backend/src/test/java/com/hidechat/modules/contact/package-info.java
backend/src/main/java/com/hidechat/persistence/mapper/ImConversationMapper.java
backend/src/test/java/com/hidechat/modules/contact/ContactControllerTest.java
backend/src/main/java/com/hidechat/persistence/mapper/ImUserMapper.java
backend/src/main/java/com/hidechat/persistence/mapper/ImEmailCodeMapper.java
backend/src/main/java/com/hidechat/persistence/mapper/ImFileMapper.java
backend/src/main/java/com/hidechat/persistence/mapper/ImRefreshTokenMapper.java
backend/src/main/java/com/hidechat/persistence/mapper/ImMessageMapper.java
backend/src/main/java/com/hidechat/persistence/mapper/ImContactMapper.java
backend/src/main/java/com/hidechat/persistence/mapper/ImMessageReadReceiptMapper.java
backend/src/main/java/com/hidechat/common/response/ApiResponse.java
backend/src/main/java/com/hidechat/common/base/BaseIdEntity.java
backend/src/main/java/com/hidechat/security/jwt/JwtProperties.java
backend/src/main/java/com/hidechat/security/jwt/JwtClaims.java
backend/src/main/java/com/hidechat/common/base/BaseMapperExt.java
backend/src/main/java/com/hidechat/security/jwt/JwtTokenProvider.java
backend/src/main/java/com/hidechat/websocket/security/JwtHandshakeInterceptor.java
backend/src/main/java/com/hidechat/common/config/MybatisPlusConfig.java
backend/src/main/java/com/hidechat/common/config/JacksonConfig.java
backend/src/main/java/com/hidechat/common/config/AppConfig.java
backend/src/main/java/com/hidechat/websocket/config/WebSocketConfig.java
backend/src/test/java/com/hidechat/modules/message/MessageControllerTest.java
backend/src/test/java/com/hidechat/modules/message/MessageServiceImplTest.java
backend/src/test/java/com/hidechat/modules/message/package-info.java
backend/src/main/java/com/hidechat/persistence/entity/ImMessageEntity.java
docs/database/PostgreSQL DDL 建表脚本 v1.0.md
backend/src/main/java/com/hidechat/persistence/entity/ImRefreshTokenEntity.java
docs/database/数据库字段设计文档 v1.0.md
backend/src/main/java/com/hidechat/persistence/entity/ImEmailCodeEntity.java
backend/src/main/java/com/hidechat/persistence/entity/ImConversationEntity.java
backend/src/main/java/com/hidechat/persistence/entity/ImMessageReadReceiptEntity.java
backend/src/main/java/com/hidechat/persistence/entity/ImContactEntity.java
backend/src/main/java/com/hidechat/persistence/entity/ImUnreadCounterEntity.java
backend/src/main/java/com/hidechat/persistence/entity/ImUserAuthEntity.java
backend/src/main/java/com/hidechat/persistence/entity/ImUserEntity.java
backend/src/main/java/com/hidechat/persistence/entity/ImFileEntity.java
backend/src/main/java/com/hidechat/security/filter/JwtAuthenticationFilter.java
backend/src/main/java/com/hidechat/websocket/session/WebSocketSessionRegistry.java
backend/src/main/java/com/hidechat/websocket/dto/WebSocketMessageDTO.java
backend/src/main/java/com/hidechat/modules/contact/vo/ContactItemVO.java
docs/api/后端接口定义文档 v1.0.md
backend/src/test/java/com/hidechat/modules/auth/AuthServiceImplTest.java
backend/src/test/java/com/hidechat/modules/auth/package-info.java
backend/src/test/java/com/hidechat/modules/auth/AuthControllerTest.java
backend/src/main/java/com/hidechat/modules/contact/controller/ContactController.java
backend/src/main/java/com/hidechat/modules/file/vo/FileInfoVO.java
backend/src/main/java/com/hidechat/modules/system/service/SystemService.java
backend/src/main/java/com/hidechat/modules/file/vo/FileUploadSignVO.java
backend/src/main/java/com/hidechat/common/constant/AuthConstants.java
backend/src/main/java/com/hidechat/common/constant/RedisKeyConstants.java
backend/src/main/java/com/hidechat/modules/system/vo/DisguiseConfigVO.java
backend/src/main/java/com/hidechat/modules/system/vo/FortuneTodayVO.java
docs/tech-design/Spring Boot 实体类与 MyBatis-Plus Mapper 设计文档 v1.0.md
docs/tech-design/HideChat技术方案文档 v1.0.md
backend/src/main/java/com/hidechat/modules/system/dto/DisguiseConfigRequest.java
backend/src/main/java/com/hidechat/modules/system/service/impl/SystemServiceImpl.java
backend/src/test/java/com/hidechat/websocket/ChatWebSocketHandlerTest.java
backend/src/test/java/com/hidechat/HideChatApplicationTests.java
backend/src/main/java/com/hidechat/modules/system/controller/SystemController.java
backend/src/main/java/com/hidechat/modules/file/controller/FileController.java
backend/src/main/java/com/hidechat/modules/message/vo/MessageHistoryVO.java
backend/src/main/java/com/hidechat/modules/message/vo/MessageItemVO.java
backend/src/test/java/com/hidechat/modules/conversation/package-info.java
backend/src/test/java/com/hidechat/modules/conversation/ConversationControllerTest.java
backend/src/main/java/com/hidechat/modules/file/dto/CreateUploadSignRequest.java
backend/src/test/java/com/hidechat/modules/conversation/ConversationServiceImplTest.java
backend/src/main/java/com/hidechat/modules/file/dto/CompleteFileUploadRequest.java
backend/src/main/java/com/hidechat/modules/message/dto/MarkMessageReadRequest.java
backend/src/main/java/com/hidechat/modules/message/dto/SendMessageRequest.java
backend/src/main/java/com/hidechat/modules/message/controller/MessageController.java
backend/src/main/java/com/hidechat/modules/user/controller/UserController.java
backend/src/main/java/com/hidechat/modules/contact/dto/AddContactRequest.java
backend/src/main/java/com/hidechat/modules/user/vo/UserProfileVO.java
backend/src/main/java/com/hidechat/modules/user/service/UserService.java
backend/src/main/java/com/hidechat/modules/contact/service/ContactService.java
backend/src/main/java/com/hidechat/modules/file/service/FileService.java
backend/src/test/java/com/hidechat/support/package-info.java
backend/src/test/java/com/hidechat/integration/ContactIntegrationTest.java
backend/src/test/java/com/hidechat/integration/ConversationIntegrationTest.java
backend/src/test/java/com/hidechat/integration/UserProfileIntegrationTest.java
backend/src/test/java/com/hidechat/integration/AbstractIntegrationTest.java
backend/src/test/java/com/hidechat/integration/IntegrationContainers.java
backend/src/test/java/com/hidechat/integration/package-info.java
backend/src/main/java/com/hidechat/modules/contact/service/impl/ContactServiceImpl.java
backend/src/test/java/com/hidechat/modules/file/FileServiceImplTest.java
backend/src/test/java/com/hidechat/modules/file/package-info.java
backend/src/test/java/com/hidechat/modules/file/FileControllerTest.java
backend/src/main/java/com/hidechat/modules/message/service/impl/MessageServiceImpl.java
backend/src/main/java/com/hidechat/modules/user/service/impl/UserServiceImpl.java
backend/src/test/java/com/hidechat/modules/system/SystemServiceImplTest.java
backend/src/main/java/com/hidechat/modules/auth/vo/AuthTokenVO.java
backend/src/main/java/com/hidechat/modules/auth/vo/AuthUserInfoVO.java
backend/src/test/java/com/hidechat/modules/system/SystemControllerTest.java
backend/src/main/java/com/hidechat/modules/auth/vo/RegisterUserVO.java
backend/src/main/java/com/hidechat/modules/message/service/MessageService.java
backend/src/main/java/com/hidechat/modules/file/service/impl/FileServiceImpl.java
backend/src/main/java/com/hidechat/modules/user/dto/UpdateProfileRequest.java
backend/src/test/java/com/hidechat/modules/user/UserServiceImplTest.java
backend/src/main/java/com/hidechat/modules/user/cache/UserProfileCacheRepository.java
backend/src/test/java/com/hidechat/modules/user/package-info.java
backend/src/test/java/com/hidechat/modules/user/UserControllerTest.java
backend/src/main/java/com/hidechat/modules/auth/service/EmailCodeSender.java
backend/src/main/java/com/hidechat/modules/auth/service/AuthService.java
backend/src/main/java/com/hidechat/modules/auth/controller/AuthController.java
backend/src/main/java/com/hidechat/modules/conversation/controller/ConversationController.java
backend/src/main/java/com/hidechat/modules/conversation/vo/ConversationItemVO.java
backend/src/main/java/com/hidechat/modules/conversation/service/ConversationService.java
backend/src/main/java/com/hidechat/modules/conversation/dto/ClearUnreadRequest.java
backend/src/main/java/com/hidechat/modules/conversation/dto/CreateSingleConversationRequest.java
backend/src/main/java/com/hidechat/modules/auth/dto/ResetPasswordRequest.java
backend/src/main/java/com/hidechat/modules/auth/dto/SendEmailCodeRequest.java
backend/src/main/java/com/hidechat/modules/auth/dto/EmailRegisterRequest.java
backend/src/main/java/com/hidechat/modules/auth/dto/EmailPasswordLoginRequest.java
backend/src/main/java/com/hidechat/modules/auth/dto/EmailCodeLoginRequest.java
backend/src/main/java/com/hidechat/modules/auth/dto/RefreshTokenRequest.java
backend/src/main/java/com/hidechat/modules/auth/service/impl/AuthServiceImpl.java
backend/src/main/java/com/hidechat/modules/auth/service/impl/LoggingEmailCodeSender.java
backend/src/main/java/com/hidechat/modules/conversation/service/impl/ConversationServiceImpl.java

codex
已经确认文档入口和代码目录。我现在读取根目录规范和 `docs/` 主文档，再对后端接口、前端 API、migration、测试、脚本分别做对应核对，输出会先给现状与缺口，再给分阶段计划。
exec
/bin/bash -lc "sed -n '1,240p' agents.md" in /home/reader/HideChat
 succeeded in 0ms:
## 1. 仓库目标

本仓库用于开发一个 Web 隐私聊天系统，核心能力包括：

- 邮箱注册 / 登录 / 找回密码
- 今日运势伪装入口
- 联系人 / 1V1 会话
- 文本 / 图片消息
- 浏览器本地加密缓存
- PIN 解锁历史消息
- Spring Boot + MyBatis-Plus + PostgreSQL 后端
- Web 前端适配手机和电脑浏览器

所有 Agent 在执行开发任务时，必须优先保证：

1. 不破坏主链路
2. 不破坏数据模型一致性
3. 不绕过分层规则
4. 不直接做高风险 schema 改动
5. 不跳过测试
6. 不引入明显安全问题

---

## 2. Agent 工作方式

### 2.1 默认行为

如果任务描述不完整，Agent 必须：

- 优先遵守现有代码结构
- 优先复用已有模块
- 优先做最小闭环修改
- 不做大范围重构
- 不主动改 schema
- 不主动改公共协议，除非任务明确要求

### 2.2 禁止行为

禁止：

- 为了省事直接跳过 Service 层
- 直接在 Controller 中写业务
- 直接在前端页面里写 IndexedDB / 加密底层逻辑
- 直接修改历史 migration
- 为了通过编译删除关键逻辑
- 为了通过测试 mock 掉核心逻辑而不测真实路径
- 在没有说明影响范围的情况下做大面积重构

### 2.3 输出代码时必须说明

每次输出代码或改动建议时，必须说明：

1. 改动目的
2. 改动文件
3. 是否涉及接口变更
4. 是否涉及数据库变更
5. 是否涉及前端本地存储结构变更
6. 补充了哪些测试
7. 风险点或未覆盖项

---

## 3. 推荐目录结构

Agent 必须尽量遵守以下目录结构，不要随意新增平级目录。

```text
repo-root/
├── agents.md
├── README.md
├── docs/
│   ├── prd/
│   ├── tech-design/
│   ├── api/
│   ├── database/
│   └── test/
├── backend/
│   ├── pom.xml
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/hidechat/
│   │   │   │   ├── HideChatApplication.java
│   │   │   │   ├── common/
│   │   │   │   ├── security/
│   │   │   │   ├── modules/
│   │   │   │   ├── persistence/
│   │   │   │   └── websocket/
│   │   │   └── resources/
│   │   │       ├── application.yml
│   │   │       ├── mapper/
│   │   │       └── db/migration/
│   │   └── test/
│   │       ├── java/com/hidechat/
│   │       └── resources/
├── frontend/
│   ├── package.json
│   ├── src/
│   │   ├── app/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── api/
│   │   ├── store/
│   │   ├── crypto/
│   │   ├── storage/
│   │   ├── hooks/
│   │   ├── utils/
│   │   └── types/
│   └── tests/
└── scripts/
````

---

## 4. Java 包命名模板

后端包结构必须尽量遵循以下模板：

```text
com.hidechat
├── common
│   ├── base
│   ├── config
│   ├── constant
│   ├── enums
│   ├── exception
│   ├── response
│   └── util
├── security
│   ├── jwt
│   ├── filter
│   ├── handler
│   └── context
├── modules
│   ├── auth
│   │   ├── controller
│   │   ├── dto
│   │   ├── service
│   │   ├── service/impl
│   │   └── vo
│   ├── user
│   ├── contact
│   ├── conversation
│   ├── message
│   ├── file
│   └── system
├── persistence
│   ├── entity
│   ├── mapper
│   └── xml
└── websocket
    ├── dto
    ├── handler
    └── session
```

规则：

* `modules/*/controller` 放 Controller
* `modules/*/dto` 放请求对象
* `modules/*/vo` 放响应对象
* `modules/*/service` 放接口
* `modules/*/service/impl` 放实现
* `persistence/entity` 放 Entity
* `persistence/mapper` 放 Mapper
* `persistence/xml` 放复杂 SQL

禁止：

* 把 Entity 放到业务模块中
* 把 Mapper 放到 Controller 包下
* 把 DTO/VO 混放到 entity 包
* 新建没有意义的 util 大杂烩包

---

## 5. 代码风格

### 5.1 通用原则

* 以清晰、稳定、易维护为第一优先级
* 优先最小改动
* 优先复用已有能力
* 一个方法只做一件事
* 一个类只承载一类职责
* 禁止“超长方法”和“上帝类”

### 5.2 Java 风格

* 使用 Java 17+
* 优先构造器注入
* 不使用字段注入
* 不允许在 Controller 写复杂业务
* 不允许在 Entity 写复杂业务
* 不允许滥用 static 工具方法绕过依赖注入
* 日志必须克制，不能打印敏感数据

### 5.3 SQL 风格

* SQL 必须明确 where 条件
* 更新必须避免全表更新
* 删除必须避免全表删除
* 排序必须显式
* 分页优先游标思想，不滥用 offset
* 复杂 SQL 放 XML，不堆在注解里

### 5.4 前端风格

* 页面组件只做页面组织
* 通用组件尽量无业务副作用
* API 调用统一放 `api/`
* IndexedDB 操作统一放 `storage/`
* 加密逻辑统一放 `crypto/`
* 状态管理统一放 `store/`

禁止：

* 在 UI 组件里直接写加解密底层实现
* 在 UI 组件里直接打开 IndexedDB
* 在页面组件里混杂复杂协议处理

---

## 6. 命名规范

### 6.1 通用

命名必须表达业务含义，禁止：

* `temp`
* `obj`
* `data1`
* `test123`
* `handler2`
* `xxx`

### 6.2 Java 类命名

* Entity：`ImUserEntity`
* Mapper：`ImUserMapper`

exec
/bin/bash -lc "sed -n '1,240p' docs/README.md" in /home/reader/HideChat
 succeeded in 0ms:
# Docs Layout

This directory mirrors the existing project documents into the repository layout required by `agents.md`.

Source documents are still preserved under `HideChatDocs/`.

exec
/bin/bash -lc "sed -n '1,260p' docs/STATUS.md" in /home/reader/HideChat
 succeeded in 0ms:
# STATUS

STATE: COMPLETE
PROJECT: HideChat
OWNER: Codex
LAST_UPDATED: 2026-04-08

## Objective

实现一个可构建、可测试、具备隐私入口与聊天闭环的 HideChat Web 应用，并补齐当前阶段的集成验证与 E2E 验证缺口。

## Current Phase

当前里程碑已完成：

- 已确认仓库缺少 `AGENTS.md`，按现有仓库约束继续执行
- backend 已建立可静默执行的真实 PostgreSQL + Redis 集成测试体系

## Done

### 后端

- Spring Boot 3.3.5 + Java 17 基础工程完成
- auth / user / contact / conversation / message / file / websocket / system 模块已实现
- Redis / PostgreSQL Testcontainers 集成测试恢复
- 新增后端 HTTP E2E：
  - `GET /api/system/fortune/today`

### 前端

- 伪装入口页、登录/注册、PIN 解锁、聊天页已实现
- IndexedDB 本地缓存与本地加密消息缓存已实现
- 新增前端 E2E：
  - 幸运数字进入隐藏入口
  - PIN 设置
  - 发送消息
  - IndexedDB 中密文落盘验证
  - 返回伪装页后再次解锁

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

## In Progress

- 无

## Next

- 无

## Blockers

- 无

## Files Touched

- backend/src/test/resources/application-test.yml
- backend/src/test/java/com/hidechat/integration/AbstractIntegrationTest.java
- backend/src/test/java/com/hidechat/integration/ContactIntegrationTest.java
- backend/src/test/java/com/hidechat/integration/ConversationIntegrationTest.java
- backend/src/test/java/com/hidechat/integration/IntegrationContainers.java
- scripts/run-backend-integration-tests.sh
- backend/pom.xml
- backend/src/test/java/com/hidechat/integration/UserProfileIntegrationTest.java
- backend/src/test/resources/application.yml
- frontend/package.json
- frontend/tsconfig.json
- frontend/vite.config.ts
- frontend/tests/setup.ts
- frontend/tests/e2e/app-flow.test.tsx
- docs/STATUS.md

## Commands Run

```bash
./scripts/run-backend-integration-tests.sh           # fail: 每个测试类独立容器，Spring 复用上下文导致 JDBC/Redis 指向失效端口
./scripts/run-backend-integration-tests.sh           # fail: 会话列表排序断言忽略 updated_at 触发器，排序预期错误
./scripts/run-backend-integration-tests.sh           # success (4 tests)
cd backend && mvn -Dtest=UserProfileIntegrationTest test
cd backend && mvn -Dtest=UserProfileIntegrationTest test   # fail: Testcontainers 1.20.4 使用 API 1.32 连接 Docker 29
cd backend && mvn -Dtest=UserProfileIntegrationTest test   # fail: 测试环境缺少 JWT 必填配置
cd backend && mvn -Dtest=UserProfileIntegrationTest test   # success
cd backend && mvn test                                     # success (59 tests)
cd frontend && npm install -D jsdom @testing-library/react @testing-library/user-event @testing-library/jest-dom fake-indexeddb
cd frontend && npm install -D @types/node
cd frontend && npm test                                    # success (3 tests)
cd frontend && npm run build                               # success
```

## Verification

- 统一命令通过：`./scripts/run-backend-integration-tests.sh`
- `backend mvn test` 通过：`59 tests, 0 skipped`
- `backend` 集成测试通过：
  - Redis / PostgreSQL 真实容器联通
  - 用户资料查询/更新 + Redis 缓存刷新
  - 联系人添加与列表排序
  - 会话创建、列表、清空未读
  - 系统公开接口 HTTP 访问
- backend 集成测试日志：`backend/target/integration-tests.log`
- Surefire 明细：`backend/target/surefire-reports/TEST-com.hidechat.integration.*.xml`
- `frontend npm test` 通过：`3 tests`
- `frontend npm run build` 通过

## Risks

- 当前 E2E 主要覆盖前端主路径与后端公开系统接口，尚未扩展到浏览器驱动下的真实 WebSocket 联调
- 文件消息链路已有单测覆盖，但未新增浏览器级 E2E
- 仓库中未找到要求先阅读的 `AGENTS.md`，若存在额外约束需用户补充路径

## Resume Instructions

若继续扩展测试，优先顺序如下：

1. 增加真实浏览器级消息链路 E2E（HTTP + WebSocket）
2. 增加文件消息链路 E2E
3. 视需要补充权限模型细化测试

exec
/bin/bash -lc "sed -n '1,260p' docs/CODEX_SOP.md" in /home/reader/HideChat
 succeeded in 0ms:
# OpenClaw 监督 Codex 执行 SOP v1.0

## 目标

使用 OpenClaw 作为调度与监督层，使用 `codex exec` 作为阶段执行器，实现以下目标：

1. 文档驱动开发
2. 分阶段实现功能
3. 每阶段完成后执行验证
4. 失败可停止、可修复、可恢复
5. 不让单轮执行失控

## 核心原则

- 单轮 `codex exec` 只完成一个阶段
- 每轮必须输出状态快照
- 每轮结束必须停止
- 由 OpenClaw 决定是否进入下一阶段
- 任何数据库变更都只能通过 migration

## 标准流程

1. 扫描仓库与文档
2. 输出缺口分析和阶段计划
3. 逐阶段执行
4. 每阶段后本地验证
5. 失败进入修复轮
6. 输出状态快照
7. 用恢复脚本继续下一轮

## 脚本说明

- `scripts/run_all.sh`：顺序执行全部阶段
- `scripts/run_phase.sh`：执行单个阶段
- `scripts/verify.sh`：执行验证
- `scripts/recover.sh`：根据快照恢复

## 推荐使用方式

```bash
cp config/project.env.example .openclaw.env
bash scripts/run_all.sh
```

如果中途中断：

```bash
bash scripts/recover.sh .openclaw/state/latest_snapshot.md
```

## 阶段执行后检查点

每一阶段都必须确认：

- 改动文件列表清晰
- 测试已补
- 构建/运行通过
- 日志无明显致命错误
- 状态快照已生成

exec
/bin/bash -lc "sed -n '1,260p' docs/prd/HideChat_PRD.md" in /home/reader/HideChat
 succeeded in 0ms:
# 📄 PRD v1：隐私伪装聊天 Web 应用（增强版）

---

# 1. 产品概述（更新）

## 1.1 产品定位（升级版）

一个支持：

* **伪装入口（幸运数字）**
* **本地加密聊天（PIN解锁）**
* **浏览器持久化隐私存储**

的 Web 隐私聊天工具。

---

## 1.2 核心能力（新增重点）

👉 从“无痕”升级为：

* ✅ **加密存储聊天记录（本地）**
* ✅ **PIN 解锁聊天内容**
* ✅ **聊天列表可见，但内容不可见**

---

## 1.3 核心设计理念

> “让聊天存在，但看不见”

---

# 2. 用户流程（更新版）

```id="flow_v2"
打开网页
   ↓
展示运势页
   ↓
输入用户自定义幸运数字
   ↓
验证成功 → 进入聊天系统
   ↓
展示聊天列表（可见联系人）
   ↓
点击某个用户
   ↓
输入PIN code
   ↓
解密聊天记录
   ↓
进入聊天界面
```

---

# 3. 功能模块设计（重点升级）

---

## 3.1 模块一：幸运数字入口（用户自定义）

### 3.1.1 功能说明

* 用户首次设置：

  * 今日幸运数字（本地存储）
* 后续：

  * 每次输入校验

---

### 3.1.2 存储方式

```id="storage1"
localStorage:
{
  luckyCodeHash: "hash值"
}
```

👉 注意：

* ❌ 不存明文
* ✅ 存 hash（如 SHA-256）

---

### 3.1.3 校验逻辑

```id="logic2"
输入数字 → hash → 对比本地hash
```

---

### 3.1.4 错误行为（伪装）

* 不提示错误
* 只刷新运势内容

---

## 3.2 模块二：聊天列表页（新增核心）

### 3.2.1 页面目标

* 展示“聊过的用户”
* 但不暴露内容

---

### 3.2.2 UI结构

```id="list_ui"
聊天列表：
- 用户A（最近时间）
- 用户B
- 用户C
```

---

### 3.2.3 数据来源

```id="storage2"
IndexedDB / localStorage:

conversations = [
  {
    userId: "xxx",
    lastMessageTime: xxx,
    encrypted: true
  }
]
```

---

### 3.2.4 特性

* 不展示消息内容
* 不自动解密

---

## 3.3 模块三：1V1聊天界面（核心升级）

---

### 3.3.1 解锁机制（重点）

进入聊天前：

👉 必须输入 PIN code

---

### 3.3.2 解锁流程

```id="unlock_flow"
输入PIN
   ↓
生成密钥（KDF）
   ↓
解密聊天记录
   ↓
成功 → 展示聊天
失败 → 提示错误
```

---

### 3.3.3 加密设计（关键）

#### 加密算法（MVP建议）

* AES-GCM

---

#### 密钥生成

```id="kdf"
key = PBKDF2(pin, salt, 10000)
```

---

#### 存储结构

```id="msg_storage"
messages = [
  {
    iv: "...",
    ciphertext: "...",
    timestamp: ...
  }
]
```

---

### 3.3.4 本地存储方案

👉 推荐：

* IndexedDB（优先）
* localStorage（简单版）

---

## 3.4 模块四：聊天功能

---

### 3.4.1 文本消息

* 发送 → 加密 → 存储 → 发送（可选服务器）

---

### 3.4.2 图片消息

* base64 → 加密 → 存储

---

### 3.4.3 消息展示

* 解密后渲染
* 内存中存在

---

## 3.5 模块五：安全控制（新增）

---

### 3.5.1 自动锁定

* 切换标签页 → 自动锁
* 超时（如1分钟） → 自动锁

---

### 3.5.2 一键隐藏

* 清空UI
* 返回运势页

---

### 3.5.3 PIN错误策略

* 连续错误5次 → 锁定
* 或清空数据（可选）

exec
/bin/bash -lc "sed -n '1,260p' docs/tech-design/HideChat技术方案文档\\ v1.0.md" in /home/reader/HideChat
 succeeded in 0ms:
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

exec
/bin/bash -lc "sed -n '1,260p' docs/api/后端接口定义文档\\ v1.0.md" in /home/reader/HideChat
 succeeded in 0ms:
# 《后端接口定义文档 v1.0》

适用范围：

* 后端：Spring Boot 3.x
* 认证：邮箱登录 + JWT + Refresh Token
* 通信：REST API + WebSocket
* 当前范围：MVP / V1
* 场景：Web 端 1V1 聊天、联系人、会话列表、图片上传、忘记密码

---

# 1. 文档目标

本文档定义系统后端 REST 接口：

* 接口分组
* 请求/响应规范
* 鉴权方式
* 字段定义
* 错误码约定
* 幂等与安全要求
* 与前端本地加密边界

说明：

* **幸运数字校验默认在前端本地完成**
* **PIN 解锁本地聊天记录默认在前端完成**
* 后端负责：

  * 账号体系
  * 联系人 / 会话 / 消息
  * 文件上传
  * 未读管理
  * 补偿拉取

---

# 2. 接口设计原则

## 2.1 风格

采用 RESTful 风格，统一前缀：

```text
/api
```

## 2.2 传输格式

* 请求：`application/json`
* 响应：`application/json`

## 2.3 时间格式

* 对外推荐返回：

  * 毫秒时间戳 `long`
* 后端内部：

  * `LocalDateTime`

## 2.4 认证方式

除注册、登录、发验证码、重置密码外，其他接口默认需要：

```http
Authorization: Bearer <accessToken>
```

---

# 3. 统一响应结构

所有 REST 接口统一返回：

```json
{
  "code": 0,
  "message": "success",
  "data": {}
}
```

---

## 3.1 响应字段说明

| 字段      | 类型                    | 说明           |
| ------- | --------------------- | ------------ |
| code    | int                   | 业务状态码，0 表示成功 |
| message | string                | 响应描述         |
| data    | object / array / null | 业务数据         |

---

## 3.2 成功示例

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "userUid": "u_1001"
  }
}
```

---

## 3.3 失败示例

```json
{
  "code": 400100,
  "message": "邮箱验证码无效",
  "data": null
}
```

---

# 4. 通用错误码定义

| 错误码    | 含义            |
| ------ | ------------- |
| 0      | 成功            |
| 400001 | 参数错误          |
| 400002 | 缺少必填参数        |
| 400003 | 参数格式非法        |
| 401001 | 未登录或 token 无效 |
| 401002 | token 已过期     |
| 403001 | 无权限访问         |
| 404001 | 资源不存在         |
| 409001 | 资源已存在         |
| 429001 | 请求过于频繁        |
| 500001 | 系统内部错误        |
| 500002 | 数据库异常         |
| 500003 | 文件服务异常        |

认证相关：

| 错误码    | 含义               |
| ------ | ---------------- |
| 410101 | 邮箱已注册            |
| 410102 | 用户不存在            |
| 410103 | 密码错误             |
| 410104 | 邮箱验证码无效          |
| 410105 | 邮箱验证码已过期         |
| 410106 | 邮箱验证码已使用         |
| 410107 | 发送验证码过于频繁        |
| 410108 | refresh token 无效 |

聊天相关：

| 错误码    | 含义       |
| ------ | -------- |
| 420101 | 联系人不存在   |
| 420102 | 会话不存在    |
| 420103 | 消息不存在    |
| 420104 | 文件不存在    |
| 420105 | 不支持的消息类型 |

---

# 5. 鉴权说明

## 5.1 Access Token

* 用于普通 API 访问
* 放在请求头：

```http
Authorization: Bearer <accessToken>
```

## 5.2 Refresh Token

* 用于换取新的 access token
* 只在刷新接口中使用

---

# 6. 接口分组总览

本文档包含以下接口分组：

1. Auth 认证模块
2. User 用户模块
3. Contact 联系人模块
4. Conversation 会话模块
5. Message 消息模块
6. File 文件模块
7. System / Disguise 伪装与系统模块

---

# 7. Auth 模块接口

---

# 7.1 发送邮箱验证码

## 接口

`POST /api/auth/email/send-code`

## 说明

用于：

* 注册
* 邮箱验证码登录
* 找回密码

## 鉴权

不需要

## 请求体

```json
{
  "email": "alice@example.com",
  "bizType": "register"
}
```

## 请求字段

| 字段      | 类型     | 必填 | 说明                                |
| ------- | ------ | -: | --------------------------------- |
| email   | string |  是 | 邮箱地址                              |
| bizType | string |  是 | register / login / reset_password |

## 响应

```json
{
  "code": 0,
  "message": "success",
  "data": null
}
```

## 错误场景

* 邮箱格式非法
* 发送过于频繁
* 邮件服务异常

---

# 7.2 邮箱注册

## 接口

`POST /api/auth/email/register`

## 鉴权

exec
/bin/bash -lc "sed -n '1,260p' docs/test/测试与验收标准\\ v1.0.md" in /home/reader/HideChat
 succeeded in 0ms:
# 《测试与验收标准 v1.0》

适用范围：

* Web 端隐私聊天系统
* 后端：Spring Boot
* 前端：Web（手机浏览器 + PC 浏览器）
* 当前版本范围：邮箱登录、幸运数字伪装入口、联系人、1V1 会话、文本/图片消息、PIN 解锁本地历史消息

---

# 1. 文档目标

本文档用于统一：

* 功能测试范围
* 接口测试范围
* 安全测试范围
* 前端本地存储测试范围
* 性能与稳定性标准
* MVP 上线验收标准

目标是回答两个问题：

1. **这个系统测什么**
2. **什么叫“可以上线”**

---

# 2. 验收原则

本项目验收遵循 4 条原则：

## 2.1 核心链路优先

优先保证以下链路稳定：

* 注册 / 登录 / 找回密码
* 进入聊天系统
* 联系人列表
* 创建会话
* 收发消息
* 历史消息展示
* 图片上传与展示
* 会话未读数
* 自动锁定 / 隐藏

## 2.2 隐私边界要验证

虽然 Web 不是强安全容器，但必须验证：

* 幸运数字不明文存储
* PIN 不明文存储
* 本地历史消息默认不可直接读
* 页面锁定逻辑有效

## 2.3 前后端一致性

要验证：

* REST 接口正确
* WebSocket 消息状态正确
* 前端 IndexedDB 状态与后端会话索引基本一致

## 2.4 MVP 不追求完美，但必须可用

允许：

* 个别低优先级视觉问题
* 非核心功能的弱提示

不允许：

* 登录失败率高
* 消息丢失
* 未读数严重错误
* 本地密文失效
* PIN 解锁错误
* 图片消息不可用

---

# 3. 测试范围总览

分为 8 大类：

1. 功能测试
2. 接口测试
3. WebSocket 实时通信测试
4. 本地存储与隐私测试
5. 安全测试
6. 兼容性测试
7. 性能与稳定性测试
8. 验收标准

---

# 4. 功能测试标准

---

# 4.1 Auth 认证模块

## 4.1.1 邮箱验证码发送

### 测试点

* 输入合法邮箱，可成功发送验证码
* 注册场景验证码可发送
* 登录场景验证码可发送
* 重置密码场景验证码可发送
* 同一邮箱短时间重复发送受限
* 非法邮箱格式报错
* 已超次数限制时报错

### 通过标准

* 合法请求成功率 100%
* 频控逻辑符合预期
* 验证码在有效期内可正常校验
* 验证码过期后不可使用

---

## 4.1.2 邮箱注册

### 测试点

* 正常注册成功
* 已注册邮箱不可重复注册
* 验证码错误注册失败
* 验证码过期注册失败
* 密码不符合规则注册失败
* 昵称为空注册失败

### 通过标准

* 正常注册成功
* 数据库生成 `im_user`、`im_user_auth`
* 注册成功后可直接登录

---

## 4.1.3 邮箱密码登录

### 测试点

* 正确邮箱 + 密码登录成功
* 密码错误登录失败
* 不存在邮箱登录失败
* 被禁用用户登录失败
* 返回 accessToken / refreshToken 正确

### 通过标准

* 登录成功后可访问鉴权接口
* token 过期行为符合设计
* 登录失败错误码正确

---

## 4.1.4 邮箱验证码登录

### 测试点

* 正确验证码登录成功
* 错误验证码失败
* 已使用验证码不可重复用
* 过期验证码失败

### 通过标准

* 行为与密码登录一致
* 验证码消费后状态更新为 used

---

## 4.1.5 找回密码

### 测试点

* 合法验证码可重置密码
* 重置后旧密码失效
* 重置后新密码可登录
* 旧 refresh token 失效
* 错误/过期验证码不可重置

### 通过标准

* 重置流程完整可用
* 安全状态正确更新

---

# 4.2 伪装入口模块

---

## 4.2.1 运势页展示

### 测试点

* 首页默认展示运势内容
* 未登录时可访问
* 手机和 PC 均正常展示
* 文案接口异常时前端有兜底

### 通过标准

* 页面可正常渲染
* 无明显异常暴露聊天系统痕迹

---

## 4.2.2 幸运数字校验

### 测试点

* 首次设置幸运数字成功
* 本地正确保存 hash、salt、kdf 参数
* 输入正确数字可进入聊天系统
* 输入错误数字仍停留运势页
* 不提示“密码错误”字样
* 刷新页面后仍需重新输入幸运数字

### 通过标准

* 浏览器本地不出现幸运数字明文
* 输入错误时伪装逻辑符合 PRD

---

# 4.3 用户与联系人模块

---

## 4.3.1 获取当前用户信息

### 测试点

* 已登录用户获取个人信息成功
* 未登录访问返回 401
* 返回字段完整

### 通过标准

* userUid、nickname、avatarUrl 正确返回

---

## 4.3.2 搜索用户

### 测试点

* 可按昵称/邮箱策略搜索
* 搜索结果不包含敏感字段
* 空关键字行为符合设计
* 高频搜索被限流

### 通过标准

codex
文档基线已经够了。下一步我直接对照代码做“实现清单 vs 文档要求”的映射，重点核实控制器接口、前端页面/API 封装、migration、测试和运行脚本。
exec
/bin/bash -lc 'find backend/src/main/java/com/hidechat/modules -maxdepth 3 -type f | sort' in /home/reader/HideChat
 succeeded in 0ms:
backend/src/main/java/com/hidechat/modules/auth/controller/AuthController.java
backend/src/main/java/com/hidechat/modules/auth/dto/EmailCodeLoginRequest.java
backend/src/main/java/com/hidechat/modules/auth/dto/EmailPasswordLoginRequest.java
backend/src/main/java/com/hidechat/modules/auth/dto/EmailRegisterRequest.java
backend/src/main/java/com/hidechat/modules/auth/dto/RefreshTokenRequest.java
backend/src/main/java/com/hidechat/modules/auth/dto/ResetPasswordRequest.java
backend/src/main/java/com/hidechat/modules/auth/dto/SendEmailCodeRequest.java
backend/src/main/java/com/hidechat/modules/auth/service/AuthService.java
backend/src/main/java/com/hidechat/modules/auth/service/EmailCodeSender.java
backend/src/main/java/com/hidechat/modules/auth/vo/AuthTokenVO.java
backend/src/main/java/com/hidechat/modules/auth/vo/AuthUserInfoVO.java
backend/src/main/java/com/hidechat/modules/auth/vo/RegisterUserVO.java
backend/src/main/java/com/hidechat/modules/contact/controller/ContactController.java
backend/src/main/java/com/hidechat/modules/contact/dto/AddContactRequest.java
backend/src/main/java/com/hidechat/modules/contact/service/ContactService.java
backend/src/main/java/com/hidechat/modules/contact/vo/ContactItemVO.java
backend/src/main/java/com/hidechat/modules/conversation/controller/ConversationController.java
backend/src/main/java/com/hidechat/modules/conversation/dto/ClearUnreadRequest.java
backend/src/main/java/com/hidechat/modules/conversation/dto/CreateSingleConversationRequest.java
backend/src/main/java/com/hidechat/modules/conversation/service/ConversationService.java
backend/src/main/java/com/hidechat/modules/conversation/vo/ConversationItemVO.java
backend/src/main/java/com/hidechat/modules/file/controller/FileController.java
backend/src/main/java/com/hidechat/modules/file/dto/CompleteFileUploadRequest.java
backend/src/main/java/com/hidechat/modules/file/dto/CreateUploadSignRequest.java
backend/src/main/java/com/hidechat/modules/file/service/FileService.java
backend/src/main/java/com/hidechat/modules/file/vo/FileInfoVO.java
backend/src/main/java/com/hidechat/modules/file/vo/FileUploadSignVO.java
backend/src/main/java/com/hidechat/modules/message/controller/MessageController.java
backend/src/main/java/com/hidechat/modules/message/dto/MarkMessageReadRequest.java
backend/src/main/java/com/hidechat/modules/message/dto/SendMessageRequest.java
backend/src/main/java/com/hidechat/modules/message/service/MessageService.java
backend/src/main/java/com/hidechat/modules/message/vo/MessageHistoryVO.java
backend/src/main/java/com/hidechat/modules/message/vo/MessageItemVO.java
backend/src/main/java/com/hidechat/modules/system/controller/SystemController.java
backend/src/main/java/com/hidechat/modules/system/dto/DisguiseConfigRequest.java
backend/src/main/java/com/hidechat/modules/system/service/SystemService.java
backend/src/main/java/com/hidechat/modules/system/vo/DisguiseConfigVO.java
backend/src/main/java/com/hidechat/modules/system/vo/FortuneTodayVO.java
backend/src/main/java/com/hidechat/modules/user/cache/UserProfileCacheRepository.java
backend/src/main/java/com/hidechat/modules/user/controller/UserController.java
backend/src/main/java/com/hidechat/modules/user/dto/UpdateProfileRequest.java
backend/src/main/java/com/hidechat/modules/user/service/UserService.java
backend/src/main/java/com/hidechat/modules/user/vo/UserProfileVO.java

exec
/bin/bash -lc 'find frontend/src -maxdepth 3 -type f | sort' in /home/reader/HideChat
 succeeded in 0ms:
frontend/src/api/client.ts
frontend/src/app/App.tsx
frontend/src/app/app.css
frontend/src/app/main.tsx
frontend/src/components/README.md
frontend/src/crypto/index.ts
frontend/src/hooks/index.ts
frontend/src/pages/README.md
frontend/src/storage/index.ts
frontend/src/store/index.ts
frontend/src/types/index.ts
frontend/src/utils/index.ts

exec
/bin/bash -lc 'find backend/src/test/java/com/hidechat -maxdepth 4 -type f | sort' in /home/reader/HideChat
 succeeded in 0ms:
backend/src/test/java/com/hidechat/HideChatApplicationTests.java
backend/src/test/java/com/hidechat/integration/AbstractIntegrationTest.java
backend/src/test/java/com/hidechat/integration/ContactIntegrationTest.java
backend/src/test/java/com/hidechat/integration/ConversationIntegrationTest.java
backend/src/test/java/com/hidechat/integration/IntegrationContainers.java
backend/src/test/java/com/hidechat/integration/UserProfileIntegrationTest.java
backend/src/test/java/com/hidechat/integration/package-info.java
backend/src/test/java/com/hidechat/modules/auth/AuthControllerTest.java
backend/src/test/java/com/hidechat/modules/auth/AuthServiceImplTest.java
backend/src/test/java/com/hidechat/modules/auth/package-info.java
backend/src/test/java/com/hidechat/modules/contact/ContactControllerTest.java
backend/src/test/java/com/hidechat/modules/contact/ContactServiceImplTest.java
backend/src/test/java/com/hidechat/modules/contact/package-info.java
backend/src/test/java/com/hidechat/modules/conversation/ConversationControllerTest.java
backend/src/test/java/com/hidechat/modules/conversation/ConversationServiceImplTest.java
backend/src/test/java/com/hidechat/modules/conversation/package-info.java
backend/src/test/java/com/hidechat/modules/file/FileControllerTest.java
backend/src/test/java/com/hidechat/modules/file/FileServiceImplTest.java
backend/src/test/java/com/hidechat/modules/file/package-info.java
backend/src/test/java/com/hidechat/modules/message/MessageControllerTest.java
backend/src/test/java/com/hidechat/modules/message/MessageServiceImplTest.java
backend/src/test/java/com/hidechat/modules/message/package-info.java
backend/src/test/java/com/hidechat/modules/system/SystemControllerTest.java
backend/src/test/java/com/hidechat/modules/system/SystemServiceImplTest.java
backend/src/test/java/com/hidechat/modules/user/UserControllerTest.java
backend/src/test/java/com/hidechat/modules/user/UserServiceImplTest.java
backend/src/test/java/com/hidechat/modules/user/package-info.java
backend/src/test/java/com/hidechat/support/package-info.java
backend/src/test/java/com/hidechat/websocket/ChatWebSocketHandlerTest.java

exec
/bin/bash -lc "find scripts -maxdepth 2 -type f | sort && printf '\\n---\\n' && find backend/src/main/resources/db/migration -maxdepth 2 -type f | sort" in /home/reader/HideChat
 succeeded in 0ms:
scripts/.run_all.sh.swp
scripts/check.sh
scripts/down.sh
scripts/recover.sh
scripts/run-backend-integration-tests.sh
scripts/run_all.sh
scripts/run_all.sh.backup
scripts/run_all_fixed.sh
scripts/run_phase.sh
scripts/run_phase.sh.backup
scripts/run_phase_fixed.sh
scripts/up.sh
scripts/verify.sh

---
backend/src/main/resources/db/migration/V1__init_schema.sql

exec
/bin/bash -lc "sed -n '1,260p' frontend/src/app/App.tsx" in /home/reader/HideChat
 succeeded in 0ms:
import { useEffect, useRef, useState } from "react";
import {
  ApiError,
  addContact,
  clearConversationUnread,
  clearStoredAuthState,
  createChatWebSocket,
  createSingleConversation,
  fetchCurrentUser,
  fetchDisguiseConfig,
  fetchTodayFortune,
  listContacts,
  listConversations,
  listMessageHistory,
  loginByPassword,
  registerByEmail,
  sendEmailCode,
  sendMessage
} from "../api/client";
import { decryptString, encryptString, sha256Hex } from "../crypto";
import { loadCachedConversation, saveCachedConversation } from "../storage";
import type {
  ChatMessage,
  ContactItem,
  ConversationItem,
  HiddenSession,
  LocalUser
} from "../types";
import {
  buildMessagePreview,
  createDemoContacts,
  createDemoConversations,
  createDemoMessages,
  createMessage
} from "../utils";
import "./app.css";

const DEMO_LUCKY_CODE = "2468";

type Screen = "disguise" | "auth" | "chat";
type AuthMode = "login" | "register";

interface WsEnvelope {
  type: string;
  data: unknown;
}

interface AuthFormState {
  email: string;
  nickname: string;
  password: string;
  emailCode: string;
}

export function App() {
  const [screen, setScreen] = useState<Screen>("disguise");
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [fortune, setFortune] = useState<Awaited<ReturnType<typeof fetchTodayFortune>> | null>(null);
  const [config, setConfig] = useState<Awaited<ReturnType<typeof fetchDisguiseConfig>> | null>(null);
  const [luckyCodeInput, setLuckyCodeInput] = useState("");
  const [pinInput, setPinInput] = useState("");
  const [luckyCodeHash, setLuckyCodeHash] = useState("");
  const [session, setSession] = useState<HiddenSession | null>(null);
  const [contacts, setContacts] = useState<ContactItem[]>(createDemoContacts());
  const [conversations, setConversations] = useState<ConversationItem[]>(createDemoConversations());
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>(createDemoMessages());
  const [activeConversationId, setActiveConversationId] = useState<string>("c_demo_1");
  const [composer, setComposer] = useState("");
  const [statusText, setStatusText] = useState("运势页已加载，输入幸运数字进入隐藏入口。");
  const [authLoading, setAuthLoading] = useState(false);
  const [sendCodeLoading, setSendCodeLoading] = useState(false);
  const [contactForm, setContactForm] = useState({ peerUid: "", remarkName: "" });
  const [authForm, setAuthForm] = useState<AuthFormState>({
    email: "demo@hide.chat",
    nickname: "Reader",
    password: "reader123",
    emailCode: ""
  });

  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    void (async () => {
      const [fortuneData, disguiseData, hash] = await Promise.all([
        fetchTodayFortune(),
        fetchDisguiseConfig(),
        sha256Hex(DEMO_LUCKY_CODE)
      ]);
      setFortune(fortuneData);
      setConfig(disguiseData);
      setLuckyCodeHash(hash);
    })();
  }, []);

  useEffect(() => {
    if (!session?.pin || screen !== "chat") {
      return;
    }
    const pin = session.pin;
    void (async () => {
      const entries = Object.entries(messages);
      for (const [conversationId, items] of entries) {
        const encryptedPayload = await encryptString(pin, JSON.stringify(items));
        await saveCachedConversation({
          conversationId,
          encryptedPayload,
          updatedAt: Date.now()
        });
      }
    })();
  }, [messages, screen, session]);

  useEffect(() => {
    if (session?.mode !== "backend" || !session.tokens?.accessToken || screen !== "chat") {
      closeWebSocket();
      return;
    }

    const socket = createChatWebSocket(session.tokens.accessToken);
    wsRef.current = socket;

    socket.onopen = () => {
      setStatusText("已连接后端聊天通道，实时消息已启用。");
    };

    socket.onmessage = (event) => {
      try {
        const envelope = JSON.parse(event.data) as WsEnvelope;
        if (envelope.type === "CHAT_RECEIVE") {
          const received = normalizeIncomingMessage(envelope.data);
          applyIncomingMessage(received);
        }
      } catch {
        setStatusText("收到无法解析的实时消息，已忽略。");
      }
    };

    socket.onclose = () => {
      if (wsRef.current === socket) {
        wsRef.current = null;
      }
    };

    return () => {
      if (wsRef.current === socket) {
        wsRef.current = null;
      }
      socket.close();
    };
  }, [screen, session]);

  useEffect(() => {
    if (!session || screen !== "chat" || session.mode !== "backend" || !activeConversationId) {
      return;
    }
    void clearConversationUnread(activeConversationId).catch(() => undefined);
  }, [activeConversationId, screen, session]);

  const activeConversation = conversations.find((item) => item.conversationId === activeConversationId) ?? conversations[0];
  const currentMessages = activeConversation ? messages[activeConversation.conversationId] ?? [] : [];

  async function handleLuckyCodeSubmit() {
    const inputHash = await sha256Hex(luckyCodeInput.trim());
    if (inputHash !== luckyCodeHash) {
      setStatusText("幸运数字不匹配，继续展示正常运势内容。");
      setLuckyCodeInput("");
      return;
    }
    if (!session?.pinHash) {
      setStatusText("幸运数字通过，先登录或注册，再设置 PIN 用于本地加密缓存。");
    } else {
      setStatusText("幸运数字通过，请输入 PIN 解锁本地加密消息。");
    }
    setScreen("auth");
  }

  async function handlePinContinue() {
    const trimmedPin = pinInput.trim();
    if (!trimmedPin) {
      setStatusText("PIN 不能为空。");
      return;
    }
    if (!session?.pinHash) {
      setStatusText("请先完成登录或注册，再设置 PIN。");
      return;
    }

    const candidateHash = await sha256Hex(trimmedPin);
    if (candidateHash !== session.pinHash) {
      setStatusText("PIN 不正确，仍停留在伪装入口。");
      setPinInput("");
      setScreen("disguise");
      return;
    }

    const restored = await loadCachedConversation(activeConversationId);
    if (restored) {
      try {
        const decoded = await decryptString(trimmedPin, restored.encryptedPayload);
        setMessages((prev) => ({
          ...prev,
          [activeConversationId]: JSON.parse(decoded) as ChatMessage[]
        }));
      } catch {
        setStatusText("本地缓存解密失败，已回退到当前内存消息。");
      }
    }

    setSession((prev) => (prev ? { ...prev, pin: trimmedPin } : prev));
    setStatusText("PIN 校验通过，已恢复隐藏聊天界面。");
    setScreen("chat");
  }

  async function handleAuthSubmit() {
    setAuthLoading(true);
    try {
      if (authMode === "register") {
        await registerByEmail({
          email: authForm.email.trim(),
          nickname: authForm.nickname.trim(),
          password: authForm.password,
          emailCode: authForm.emailCode.trim()
        });
      }

      const loginResult = await loginByPassword({
        email: authForm.email.trim(),
        password: authForm.password
      });
      await finishAuthentication({
        ...loginResult,
        user: await fetchCurrentUser().catch(() => loginResult.user)
      });
      setStatusText("已连接后端账号，请继续设置或输入 PIN。");
    } catch (error) {
      if (error instanceof ApiError && (error.isNetworkError || error.status === 404 || error.status === 502 || error.status === 503)) {
        const demoUser = buildDemoUser(authForm.nickname, authForm.email);
        setSession((prev) => ({
          user: demoUser,
          pin: prev?.pin,
          pinHash: prev?.pinHash ?? "",
          mode: "demo"
        }));
        setStatusText("后端不可用，已回退到本地演示模式。继续设置 PIN 即可进入聊天。");
        return;
      }
      setStatusText(error instanceof Error ? error.message : "登录失败");
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleSendCode() {
    setSendCodeLoading(true);
    try {
      await sendEmailCode(authForm.email.trim(), authMode === "register" ? "register" : "login");
      setStatusText("验证码已发送，请查看后端日志中的验证码。");
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : "发送验证码失败");
    } finally {

exec
/bin/bash -lc "for f in backend/src/main/java/com/hidechat/modules/*/controller/*.java; do echo '###' "'$f; sed -n '"'1,240p' \""'$f"; echo; done' in /home/reader/HideChat
 succeeded in 0ms:
### backend/src/main/java/com/hidechat/modules/auth/controller/AuthController.java
package com.hidechat.modules.auth.controller;

import com.hidechat.common.exception.BusinessException;
import com.hidechat.common.response.ApiResponse;
import com.hidechat.modules.auth.dto.EmailCodeLoginRequest;
import com.hidechat.modules.auth.dto.EmailPasswordLoginRequest;
import com.hidechat.modules.auth.dto.EmailRegisterRequest;
import com.hidechat.modules.auth.dto.RefreshTokenRequest;
import com.hidechat.modules.auth.dto.ResetPasswordRequest;
import com.hidechat.modules.auth.dto.SendEmailCodeRequest;
import com.hidechat.modules.auth.service.AuthService;
import com.hidechat.modules.auth.vo.AuthTokenVO;
import com.hidechat.modules.auth.vo.RegisterUserVO;
import jakarta.validation.Valid;
import java.security.Principal;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/email/send-code")
    public ApiResponse<Void> sendEmailCode(@Valid @RequestBody SendEmailCodeRequest request) {
        authService.sendEmailCode(request);
        return ApiResponse.success();
    }

    @PostMapping("/email/register")
    public ApiResponse<RegisterUserVO> register(@Valid @RequestBody EmailRegisterRequest request) {
        return ApiResponse.success(authService.registerByEmail(request));
    }

    @PostMapping("/email/password-login")
    public ApiResponse<AuthTokenVO> passwordLogin(@Valid @RequestBody EmailPasswordLoginRequest request) {
        return ApiResponse.success(authService.loginByEmailPassword(request));
    }

    @PostMapping("/email/code-login")
    public ApiResponse<AuthTokenVO> codeLogin(@Valid @RequestBody EmailCodeLoginRequest request) {
        return ApiResponse.success(authService.loginByEmailCode(request));
    }

    @PostMapping("/email/reset-password")
    public ApiResponse<Void> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
        return ApiResponse.success();
    }

    @PostMapping("/refresh-token")
    public ApiResponse<AuthTokenVO> refreshToken(@Valid @RequestBody RefreshTokenRequest request) {
        return ApiResponse.success(authService.refreshToken(request));
    }

    @PostMapping("/logout")
    public ApiResponse<Void> logout(Principal principal, @Valid @RequestBody RefreshTokenRequest request) {
        if (principal == null) {
            throw new BusinessException(401001, "未登录或 token 无效");
        }
        authService.logout(principal.getName(), request);
        return ApiResponse.success();
    }
}

### backend/src/main/java/com/hidechat/modules/contact/controller/ContactController.java
package com.hidechat.modules.contact.controller;

import com.hidechat.common.response.ApiResponse;
import com.hidechat.modules.contact.dto.AddContactRequest;
import com.hidechat.modules.contact.service.ContactService;
import com.hidechat.modules.contact.vo.ContactItemVO;
import com.hidechat.security.context.CurrentUserProvider;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/contact")
@RequiredArgsConstructor
public class ContactController {

    private final ContactService contactService;
    private final CurrentUserProvider currentUserProvider;

    @PostMapping("/add")
    public ApiResponse<Void> addContact(@Valid @RequestBody AddContactRequest request) {
        contactService.addContact(currentUserProvider.getRequiredUserUid(), request);
        return ApiResponse.success();
    }

    @GetMapping("/list")
    public ApiResponse<List<ContactItemVO>> listContacts() {
        return ApiResponse.success(contactService.listContacts(currentUserProvider.getRequiredUserUid()));
    }
}

### backend/src/main/java/com/hidechat/modules/conversation/controller/ConversationController.java
package com.hidechat.modules.conversation.controller;

import com.hidechat.common.response.ApiResponse;
import com.hidechat.modules.conversation.dto.ClearUnreadRequest;
import com.hidechat.modules.conversation.dto.CreateSingleConversationRequest;
import com.hidechat.modules.conversation.service.ConversationService;
import com.hidechat.modules.conversation.vo.ConversationItemVO;
import com.hidechat.security.context.CurrentUserProvider;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/conversation")
@RequiredArgsConstructor
public class ConversationController {

    private final ConversationService conversationService;
    private final CurrentUserProvider currentUserProvider;

    @PostMapping("/single")
    public ApiResponse<ConversationItemVO> createSingle(@Valid @RequestBody CreateSingleConversationRequest request) {
        return ApiResponse.success(conversationService.createSingleConversation(
            currentUserProvider.getRequiredUserUid(),
            request
        ));
    }

    @GetMapping("/list")
    public ApiResponse<List<ConversationItemVO>> list() {
        return ApiResponse.success(conversationService.listConversations(currentUserProvider.getRequiredUserUid()));
    }

    @PostMapping("/clear-unread")
    public ApiResponse<Void> clearUnread(@Valid @RequestBody ClearUnreadRequest request) {
        conversationService.clearUnread(currentUserProvider.getRequiredUserUid(), request);
        return ApiResponse.success();
    }
}

### backend/src/main/java/com/hidechat/modules/file/controller/FileController.java
package com.hidechat.modules.file.controller;

import com.hidechat.common.response.ApiResponse;
import com.hidechat.modules.file.dto.CompleteFileUploadRequest;
import com.hidechat.modules.file.dto.CreateUploadSignRequest;
import com.hidechat.modules.file.service.FileService;
import com.hidechat.modules.file.vo.FileInfoVO;
import com.hidechat.modules.file.vo.FileUploadSignVO;
import com.hidechat.security.context.CurrentUserProvider;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/file")
@RequiredArgsConstructor
public class FileController {

    private final FileService fileService;
    private final CurrentUserProvider currentUserProvider;

    @PostMapping("/upload-sign")
    public ApiResponse<FileUploadSignVO> uploadSign(@Valid @RequestBody CreateUploadSignRequest request) {
        return ApiResponse.success(fileService.createUploadSign(currentUserProvider.getRequiredUserUid(), request));
    }

    @PostMapping("/complete")
    public ApiResponse<FileInfoVO> complete(@Valid @RequestBody CompleteFileUploadRequest request) {
        return ApiResponse.success(fileService.completeUpload(currentUserProvider.getRequiredUserUid(), request));
    }

    @GetMapping("/{fileId}")
    public ApiResponse<FileInfoVO> getById(@PathVariable String fileId) {
        return ApiResponse.success(fileService.getFileInfo(currentUserProvider.getRequiredUserUid(), fileId));
    }
}

### backend/src/main/java/com/hidechat/modules/message/controller/MessageController.java
package com.hidechat.modules.message.controller;

import com.hidechat.common.response.ApiResponse;
import com.hidechat.modules.message.dto.MarkMessageReadRequest;
import com.hidechat.modules.message.dto.SendMessageRequest;
import com.hidechat.modules.message.service.MessageService;
import com.hidechat.modules.message.vo.MessageHistoryVO;
import com.hidechat.modules.message.vo.MessageItemVO;
import com.hidechat.security.context.CurrentUserProvider;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/message")
@RequiredArgsConstructor
public class MessageController {

    private final MessageService messageService;
    private final CurrentUserProvider currentUserProvider;

    @PostMapping("/send")
    public ApiResponse<MessageItemVO> send(@Valid @RequestBody SendMessageRequest request) {
        return ApiResponse.success(messageService.sendMessage(currentUserProvider.getRequiredUserUid(), request));
    }

    @GetMapping("/history")
    public ApiResponse<MessageHistoryVO> history(@RequestParam String conversationId,
                                                 @RequestParam(required = false) String cursor,
                                                 @RequestParam(required = false) Integer pageSize) {
        return ApiResponse.success(messageService.listHistory(
            currentUserProvider.getRequiredUserUid(),
            conversationId,
            cursor,
            pageSize
        ));
    }

    @PostMapping("/read")
    public ApiResponse<Void> read(@Valid @RequestBody MarkMessageReadRequest request) {
        messageService.markMessagesRead(currentUserProvider.getRequiredUserUid(), request);
        return ApiResponse.success();
    }
}

### backend/src/main/java/com/hidechat/modules/system/controller/SystemController.java
package com.hidechat.modules.system.controller;

import com.hidechat.common.response.ApiResponse;
import com.hidechat.modules.system.service.SystemService;
import com.hidechat.modules.system.vo.DisguiseConfigVO;
import com.hidechat.modules.system.vo.FortuneTodayVO;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/system")
@RequiredArgsConstructor
public class SystemController {

    private final SystemService systemService;

    @GetMapping("/fortune/today")
    public ApiResponse<FortuneTodayVO> getTodayFortune() {
        return ApiResponse.success(systemService.getTodayFortune());
    }

    @GetMapping("/disguise-config")
    public ApiResponse<DisguiseConfigVO> getDisguiseConfig() {
        return ApiResponse.success(systemService.getDisguiseConfig());
    }
}

### backend/src/main/java/com/hidechat/modules/user/controller/UserController.java
package com.hidechat.modules.user.controller;

import com.hidechat.common.response.ApiResponse;
import com.hidechat.modules.user.dto.UpdateProfileRequest;
import com.hidechat.modules.user.service.UserService;
import com.hidechat.modules.user.vo.UserProfileVO;
import com.hidechat.security.context.CurrentUserProvider;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final CurrentUserProvider currentUserProvider;

    @GetMapping("/me")
    public ApiResponse<UserProfileVO> getProfile() {
        String userUid = currentUserProvider.getRequiredUserUid();
        return ApiResponse.success(userService.getUserProfile(userUid));
    }

    @PutMapping("/profile")
    public ApiResponse<Void> updateProfile(@Valid @RequestBody UpdateProfileRequest request) {
        userService.updateProfile(currentUserProvider.getRequiredUserUid(), request);
        return ApiResponse.success();
    }
}


exec
/bin/bash -lc "sed -n '1,260p' frontend/src/api/client.ts" in /home/reader/HideChat
 succeeded in 0ms:
import type {
  ApiErrorPayload,
  AuthTokens,
  ChatMessage,
  ContactItem,
  ConversationItem,
  DisguiseConfig,
  FortuneToday,
  LocalUser
} from "../types";

const baseUrl = "/api";
const AUTH_STORAGE_KEY = "hidechat-auth";

interface ApiEnvelope<T> {
  code: number;
  message: string;
  data: T;
}

interface StoredAuthState {
  accessToken: string;
  refreshToken: string;
}

interface AuthUserInfo {
  userUid: string;
  nickname: string;
  avatarUrl?: string | null;
}

interface AuthTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  userInfo: AuthUserInfo;
}

interface MessageHistoryResponse {
  list: Array<{
    messageId: string;
    conversationId: string;
    senderUid: string;
    receiverUid: string;
    messageType: string;
    payload: string;
    serverMsgTime: number;
  }>;
  nextCursor?: string | null;
  hasMore: boolean;
}

export class ApiError extends Error {
  readonly code?: number;
  readonly status?: number;
  readonly isNetworkError: boolean;

  constructor(message: string, options?: { code?: number; status?: number; isNetworkError?: boolean }) {
    super(message);
    this.name = "ApiError";
    this.code = options?.code;
    this.status = options?.status;
    this.isNetworkError = options?.isNetworkError ?? false;
  }
}

function mapUserInfoToLocalUser(userInfo: AuthUserInfo, email: string): LocalUser {
  return {
    userUid: userInfo.userUid,
    nickname: userInfo.nickname,
    email
  };
}

function mapTokenResponse(token: AuthTokenResponse): AuthTokens {
  return {
    accessToken: token.accessToken,
    refreshToken: token.refreshToken,
    expiresIn: token.expiresIn
  };
}

function mapMessage(message: MessageHistoryResponse["list"][number]): ChatMessage {
  return {
    messageId: message.messageId,
    conversationId: message.conversationId,
    senderUid: message.senderUid,
    receiverUid: message.receiverUid,
    payload: message.payload,
    messageType: message.messageType,
    serverMsgTime: message.serverMsgTime
  };
}

function getStoredAuthState(): StoredAuthState | null {
  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredAuthState) : null;
  } catch {
    return null;
  }
}

function saveStoredAuthState(tokens: AuthTokens): void {
  window.localStorage.setItem(
    AUTH_STORAGE_KEY,
    JSON.stringify({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken
    } satisfies StoredAuthState)
  );
}

export function clearStoredAuthState(): void {
  window.localStorage.removeItem(AUTH_STORAGE_KEY);
}

async function requestJson<T>(path: string, init?: RequestInit, requiresAuth = false): Promise<T> {
  const headers = new Headers(init?.headers);
  headers.set("Content-Type", "application/json");

  if (requiresAuth) {
    const authState = getStoredAuthState();
    if (!authState?.accessToken) {
      throw new ApiError("缺少登录态", { status: 401 });
    }
    headers.set("Authorization", `Bearer ${authState.accessToken}`);
  }

  try {
    const response = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers
    });

    const isJson = response.headers.get("Content-Type")?.includes("application/json");
    const payload = isJson ? ((await response.json()) as ApiEnvelope<T> | ApiErrorPayload) : null;

    if (!response.ok) {
      throw new ApiError((payload as ApiErrorPayload | null)?.message ?? "请求失败", {
        code: (payload as ApiErrorPayload | null)?.code,
        status: response.status
      });
    }

    const envelope = payload as ApiEnvelope<T>;
    if (typeof envelope?.code === "number" && envelope.code !== 0) {
      throw new ApiError(envelope.message || "请求失败", {
        code: envelope.code,
        status: response.status
      });
    }

    return envelope.data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError("后端不可用，已回退到本地演示模式", { isNetworkError: true });
  }
}

async function readJsonWithFallback<T>(path: string, fallback: T): Promise<T> {
  try {
    return await requestJson<T>(path);
  } catch {
    return fallback;
  }
}

export function fetchTodayFortune(): Promise<FortuneToday> {
  return readJsonWithFallback("/system/fortune/today", {
    title: "今日运势",
    summary: "今天适合整理情绪与节奏。",
    luckyColor: "蓝色",
    luckyDirection: "东南",
    advice: "在重要对话中保持耐心。"
  });
}

export function fetchDisguiseConfig(): Promise<DisguiseConfig> {
  return readJsonWithFallback("/system/disguise-config", {
    siteTitle: "今日运势",
    showFortuneInput: true,
    theme: "default"
  });
}

export async function sendEmailCode(email: string, bizType: "register" | "login"): Promise<void> {
  await requestJson<void>("/auth/email/send-code", {
    method: "POST",
    body: JSON.stringify({ email, bizType })
  });
}

export async function registerByEmail(input: {
  email: string;
  password: string;
  nickname: string;
  emailCode: string;
}): Promise<void> {
  await requestJson<void>("/auth/email/register", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export async function loginByPassword(input: {
  email: string;
  password: string;
}): Promise<{ tokens: AuthTokens; user: LocalUser }> {
  const token = await requestJson<AuthTokenResponse>("/auth/email/password-login", {
    method: "POST",
    body: JSON.stringify(input)
  });
  const tokens = mapTokenResponse(token);
  saveStoredAuthState(tokens);
  return {
    tokens,
    user: mapUserInfoToLocalUser(token.userInfo, input.email)
  };
}

export async function fetchCurrentUser(): Promise<LocalUser> {
  return requestJson<LocalUser>("/user/me", { method: "GET" }, true);
}

export async function listContacts(): Promise<ContactItem[]> {
  return requestJson<ContactItem[]>("/contact/list", { method: "GET" }, true);
}

export async function addContact(peerUid: string, remarkName: string): Promise<void> {
  await requestJson<void>(
    "/contact/add",
    {
      method: "POST",
      body: JSON.stringify({ peerUid, remarkName })
    },
    true
  );
}

export async function listConversations(): Promise<ConversationItem[]> {
  return requestJson<ConversationItem[]>("/conversation/list", { method: "GET" }, true);
}

export async function createSingleConversation(peerUid: string): Promise<ConversationItem> {
  return requestJson<ConversationItem>(
    "/conversation/single",
    {
      method: "POST",
      body: JSON.stringify({ peerUid })
    },
    true
  );
}

export async function clearConversationUnread(conversationId: string): Promise<void> {
  await requestJson<void>(
    "/conversation/clear-unread",

exec
/bin/bash -lc "sed -n '1,260p' backend/src/main/resources/db/migration/V1__init_schema.sql" in /home/reader/HideChat
 succeeded in 0ms:
-- HideChat initial schema migration draft.
-- Source aligned with docs/database/PostgreSQL DDL 建表脚本 v1.0.md.
-- Rollback note: drop schema hidechat cascade;

create schema if not exists hidechat;
set search_path to hidechat;

create table im_user (
    id bigint primary key,
    user_uid varchar(64) not null,
    nickname varchar(64) not null,
    avatar_url varchar(255),
    status smallint not null default 1,
    created_at timestamp not null default now(),
    updated_at timestamp not null default now(),
    constraint uk_im_user_user_uid unique (user_uid),
    constraint ck_im_user_status check (status in (0, 1))
);

comment on table im_user is '用户主表';
comment on column im_user.id is '数据库主键';
comment on column im_user.user_uid is '用户业务唯一ID';
comment on column im_user.nickname is '用户昵称';
comment on column im_user.avatar_url is '头像地址';
comment on column im_user.status is '状态：1正常，0禁用';
comment on column im_user.created_at is '创建时间';
comment on column im_user.updated_at is '更新时间';

create index idx_im_user_status on im_user (status);

create table im_user_auth (
    id bigint primary key,
    user_uid varchar(64) not null,
    auth_type varchar(32) not null,
    auth_identifier varchar(128) not null,
    credential_hash varchar(255),
    verified boolean not null default false,
    created_at timestamp not null default now(),
    updated_at timestamp not null default now(),
    constraint uk_im_user_auth_type_identifier unique (auth_type, auth_identifier),
    constraint ck_im_user_auth_auth_type check (auth_type in ('email_password', 'email_code', 'wechat'))
);

comment on table im_user_auth is '用户认证凭证表';
comment on column im_user_auth.id is '数据库主键';
comment on column im_user_auth.user_uid is '关联用户UID';
comment on column im_user_auth.auth_type is '认证类型：email_password / email_code / wechat';
comment on column im_user_auth.auth_identifier is '认证标识，如邮箱/openid';
comment on column im_user_auth.credential_hash is '密码哈希，验证码登录可为空';
comment on column im_user_auth.verified is '是否已验证';
comment on column im_user_auth.created_at is '创建时间';
comment on column im_user_auth.updated_at is '更新时间';

create index idx_im_user_auth_user_uid on im_user_auth (user_uid);

create table im_email_code (
    id bigint primary key,
    email varchar(128) not null,
    biz_type varchar(32) not null,
    code_hash varchar(255) not null,
    expire_at timestamp not null,
    used boolean not null default false,
    send_count integer not null default 1,
    created_at timestamp not null default now(),
    constraint ck_im_email_code_biz_type check (biz_type in ('register', 'login', 'reset_password'))
);

comment on table im_email_code is '邮箱验证码表';
comment on column im_email_code.id is '数据库主键';
comment on column im_email_code.email is '邮箱';
comment on column im_email_code.biz_type is '业务类型：register / login / reset_password';
comment on column im_email_code.code_hash is '验证码哈希';
comment on column im_email_code.expire_at is '过期时间';
comment on column im_email_code.used is '是否已使用';
comment on column im_email_code.send_count is '发送次数统计';
comment on column im_email_code.created_at is '创建时间';

create index idx_im_email_code_email_biz_type on im_email_code (email, biz_type);
create index idx_im_email_code_expire_at on im_email_code (expire_at);

create table im_refresh_token (
    id bigint primary key,
    user_uid varchar(64) not null,
    token_id varchar(128) not null,
    expire_at timestamp not null,
    revoked boolean not null default false,
    created_at timestamp not null default now(),
    constraint uk_im_refresh_token_token_id unique (token_id)
);

comment on table im_refresh_token is '刷新令牌表';
comment on column im_refresh_token.id is '数据库主键';
comment on column im_refresh_token.user_uid is '用户UID';
comment on column im_refresh_token.token_id is 'Token唯一标识';
comment on column im_refresh_token.expire_at is '过期时间';
comment on column im_refresh_token.revoked is '是否已失效';
comment on column im_refresh_token.created_at is '创建时间';

create index idx_im_refresh_token_user_uid on im_refresh_token (user_uid);
create index idx_im_refresh_token_expire_at on im_refresh_token (expire_at);

create table im_contact (
    id bigint primary key,
    owner_uid varchar(64) not null,
    peer_uid varchar(64) not null,
    remark_name varchar(64),
    pinned boolean not null default false,
    last_message_at timestamp,
    created_at timestamp not null default now(),
    updated_at timestamp not null default now(),
    constraint uk_im_contact_owner_peer unique (owner_uid, peer_uid)
);

comment on table im_contact is '联系人关系表（用户视角）';
comment on column im_contact.id is '数据库主键';
comment on column im_contact.owner_uid is '当前用户UID';
comment on column im_contact.peer_uid is '联系人UID';
comment on column im_contact.remark_name is '备注名';
comment on column im_contact.pinned is '是否置顶';
comment on column im_contact.last_message_at is '最后互动时间';
comment on column im_contact.created_at is '创建时间';
comment on column im_contact.updated_at is '更新时间';

create index idx_im_contact_owner_uid on im_contact (owner_uid);
create index idx_im_contact_owner_uid_last_message_at on im_contact (owner_uid, last_message_at desc);

create table im_conversation (
    id bigint primary key,
    conversation_id varchar(64) not null,
    user_a_uid varchar(64) not null,
    user_b_uid varchar(64) not null,
    last_message_id varchar(64),
    last_message_type varchar(32),
    last_message_preview varchar(255),
    last_message_at timestamp,
    created_at timestamp not null default now(),
    updated_at timestamp not null default now(),
    constraint uk_im_conversation_conversation_id unique (conversation_id),
    constraint uk_im_conversation_user_pair unique (user_a_uid, user_b_uid)
);

comment on table im_conversation is '1V1会话表';
comment on column im_conversation.id is '数据库主键';
comment on column im_conversation.conversation_id is '会话唯一ID';
comment on column im_conversation.user_a_uid is '参与方A UID';
comment on column im_conversation.user_b_uid is '参与方B UID';
comment on column im_conversation.last_message_id is '最后一条消息ID';
comment on column im_conversation.last_message_type is '最后消息类型';
comment on column im_conversation.last_message_preview is '最后消息摘要，建议只存占位文本';
comment on column im_conversation.last_message_at is '最后消息时间';
comment on column im_conversation.created_at is '创建时间';
comment on column im_conversation.updated_at is '更新时间';

create index idx_im_conversation_user_a_uid on im_conversation (user_a_uid);
create index idx_im_conversation_user_b_uid on im_conversation (user_b_uid);
create index idx_im_conversation_last_message_at on im_conversation (last_message_at desc);

create table im_file (
    id bigint primary key,
    file_id varchar(64) not null,
    uploader_uid varchar(64) not null,
    file_name varchar(255),
    mime_type varchar(128) not null,
    file_size bigint not null default 0,
    storage_key varchar(255) not null,
    access_url varchar(255),
    encrypt_flag boolean not null default true,
    created_at timestamp not null default now(),
    constraint uk_im_file_file_id unique (file_id)
);

comment on table im_file is '文件元数据表';
comment on column im_file.id is '数据库主键';
comment on column im_file.file_id is '文件唯一ID';
comment on column im_file.uploader_uid is '上传者UID';
comment on column im_file.file_name is '原始文件名';
comment on column im_file.mime_type is 'MIME类型';
comment on column im_file.file_size is '文件大小，字节';
comment on column im_file.storage_key is '对象存储key';
comment on column im_file.access_url is '访问地址';
comment on column im_file.encrypt_flag is '是否加密上传';
comment on column im_file.created_at is '创建时间';

create index idx_im_file_uploader_uid on im_file (uploader_uid);
create index idx_im_file_created_at on im_file (created_at desc);

create table im_message (
    id bigint primary key,
    message_id varchar(64) not null,
    conversation_id varchar(64) not null,
    sender_uid varchar(64) not null,
    receiver_uid varchar(64) not null,
    message_type varchar(16) not null,
    payload_type varchar(16) not null,
    payload text,
    file_id varchar(64),
    server_status varchar(16) not null,
    client_msg_time bigint,
    server_msg_time timestamp not null default now(),
    deleted boolean not null default false,
    constraint uk_im_message_message_id unique (message_id),
    constraint ck_im_message_message_type check (message_type in ('text', 'image', 'system')),
    constraint ck_im_message_payload_type check (payload_type in ('plain', 'ref', 'encrypted')),
    constraint ck_im_message_server_status check (server_status in ('server_received', 'delivered', 'read'))
);

comment on table im_message is '消息表';
comment on column im_message.id is '数据库主键';
comment on column im_message.message_id is '消息唯一ID';
comment on column im_message.conversation_id is '所属会话ID';
comment on column im_message.sender_uid is '发送者UID';
comment on column im_message.receiver_uid is '接收者UID';
comment on column im_message.message_type is '消息类型：text / image / system';
comment on column im_message.payload_type is '负载类型：plain / ref / encrypted';
comment on column im_message.payload is '消息内容或引用数据';
comment on column im_message.file_id is '图片文件ID';
comment on column im_message.server_status is '服务端状态：server_received / delivered / read';
comment on column im_message.client_msg_time is '客户端毫秒时间戳';
comment on column im_message.server_msg_time is '服务端接收时间';
comment on column im_message.deleted is '逻辑删除';

create index idx_im_message_conversation_id_server_msg_time on im_message (conversation_id, server_msg_time desc);
create index idx_im_message_sender_uid on im_message (sender_uid);
create index idx_im_message_receiver_uid on im_message (receiver_uid);
create index idx_im_message_file_id on im_message (file_id);
create index idx_im_message_server_status on im_message (server_status);

create table im_unread_counter (
    id bigint primary key,
    owner_uid varchar(64) not null,
    conversation_id varchar(64) not null,
    unread_count integer not null default 0,
    updated_at timestamp not null default now(),
    constraint uk_im_unread_counter_owner_conversation unique (owner_uid, conversation_id)
);

comment on table im_unread_counter is '未读计数表';
comment on column im_unread_counter.id is '数据库主键';
comment on column im_unread_counter.owner_uid is '未读归属用户UID';
comment on column im_unread_counter.conversation_id is '会话ID';
comment on column im_unread_counter.unread_count is '未读数';
comment on column im_unread_counter.updated_at is '更新时间';

create index idx_im_unread_counter_owner_uid on im_unread_counter (owner_uid);

create table im_message_read_receipt (
    id bigint primary key,
    message_id varchar(64) not null,
    reader_uid varchar(64) not null,
    read_at timestamp not null default now(),
    constraint uk_im_message_read_receipt_message_reader unique (message_id, reader_uid)
);

comment on table im_message_read_receipt is '消息已读回执表';
comment on column im_message_read_receipt.id is '数据库主键';
comment on column im_message_read_receipt.message_id is '消息ID';
comment on column im_message_read_receipt.reader_uid is '已读用户UID';
comment on column im_message_read_receipt.read_at is '已读时间';

create index idx_im_message_read_receipt_reader_uid on im_message_read_receipt (reader_uid);

exec
/bin/bash -lc "sed -n '261,520p' frontend/src/api/client.ts" in /home/reader/HideChat
 succeeded in 0ms:
    {
      method: "POST",
      body: JSON.stringify({ conversationId })
    },
    true
  );
}

export async function listMessageHistory(conversationId: string): Promise<ChatMessage[]> {
  const params = new URLSearchParams({
    conversationId,
    pageSize: "50"
  });
  const history = await requestJson<MessageHistoryResponse>(`/message/history?${params.toString()}`, { method: "GET" }, true);
  return history.list.map(mapMessage).sort((left, right) => left.serverMsgTime - right.serverMsgTime);
}

export async function sendMessage(input: {
  conversationId: string;
  receiverUid: string;
  payload: string;
  clientMsgTime: number;
}): Promise<ChatMessage> {
  const message = await requestJson<MessageHistoryResponse["list"][number]>(
    "/message/send",
    {
      method: "POST",
      body: JSON.stringify({
        conversationId: input.conversationId,
        receiverUid: input.receiverUid,
        messageType: "text",
        payloadType: "text",
        payload: input.payload,
        clientMsgTime: input.clientMsgTime
      })
    },
    true
  );
  return mapMessage(message);
}

export function createChatWebSocket(accessToken: string): WebSocket {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const url = new URL(`${protocol}//${window.location.host}/ws/chat`);
  url.searchParams.set("token", accessToken);
  return new WebSocket(url);
}

exec
/bin/bash -lc "sed -n '261,520p' frontend/src/app/App.tsx" in /home/reader/HideChat
 succeeded in 0ms:
      setSendCodeLoading(false);
    }
  }

  async function handleSetPinAndEnter() {
    const trimmedPin = pinInput.trim();
    if (!session?.user) {
      setStatusText("请先完成登录或注册。");
      return;
    }
    if (!trimmedPin) {
      setStatusText("PIN 不能为空。");
      return;
    }
    const pinHash = await sha256Hex(trimmedPin);
    setSession((prev) => (prev ? { ...prev, pin: trimmedPin, pinHash } : prev));
    setStatusText("PIN 已设置，本地缓存会以加密形式写入 IndexedDB。");
    setScreen("chat");
  }

  async function handleAddContact() {
    if (!session || session.mode !== "backend") {
      setStatusText("演示模式不支持真实联系人写入。");
      return;
    }
    if (!contactForm.peerUid.trim()) {
      setStatusText("请输入联系人 UID。");
      return;
    }
    try {
      await addContact(contactForm.peerUid.trim(), contactForm.remarkName.trim());
      const conversation = await createSingleConversation(contactForm.peerUid.trim());
      const [nextContacts, nextConversations] = await Promise.all([listContacts(), listConversations()]);
      setContacts(sortContacts(nextContacts));
      setConversations(sortConversations(nextConversations));
      setActiveConversationId(conversation.conversationId);
      setContactForm({ peerUid: "", remarkName: "" });
      setStatusText("联系人已添加，并创建了单聊会话。");
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : "添加联系人失败");
    }
  }

  async function handleSendMessage() {
    if (!composer.trim() || !activeConversation || !session) {
      return;
    }

    const payload = composer.trim();
    setComposer("");

    if (session.mode !== "backend") {
      const nextMessage = createMessage({
        conversationId: activeConversation.conversationId,
        senderUid: session.user.userUid,
        receiverUid: activeConversation.peerUid,
        payload
      });
      applyIncomingMessage(nextMessage);
      setStatusText("消息已发送，并写入本地加密缓存。");
      return;
    }

    const socket = wsRef.current;
    const optimisticMessage = createMessage({
      conversationId: activeConversation.conversationId,
      senderUid: session.user.userUid,
      receiverUid: activeConversation.peerUid,
      payload
    });

    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(
        JSON.stringify({
          type: "CHAT_SEND",
          data: {
            conversationId: activeConversation.conversationId,
            receiverUid: activeConversation.peerUid,
            messageType: "text",
            payloadType: "text",
            payload,
            clientMsgTime: optimisticMessage.serverMsgTime
          }
        })
      );
      applyIncomingMessage(optimisticMessage);
      setStatusText("消息已通过 WebSocket 发出。");
      return;
    }

    try {
      const sent = await sendMessage({
        conversationId: activeConversation.conversationId,
        receiverUid: activeConversation.peerUid,
        payload,
        clientMsgTime: Date.now()
      });
      applyIncomingMessage(sent);
      setStatusText("实时通道未连接，已通过 HTTP 发送消息。");
    } catch (error) {
      setComposer(payload);
      setStatusText(error instanceof Error ? error.message : "发送消息失败");
    }
  }

  function applyIncomingMessage(message: ChatMessage) {
    setMessages((prev) => {
      const current = prev[message.conversationId] ?? [];
      const exists = current.some((item) => item.messageId === message.messageId);
      if (exists) {
        return prev;
      }
      return {
        ...prev,
        [message.conversationId]: [...current, message].sort((left, right) => left.serverMsgTime - right.serverMsgTime)
      };
    });

    setConversations((prev) =>
      sortConversations(
        prev.map((item) =>
          item.conversationId === message.conversationId
            ? {
                ...item,
                lastMessagePreview: buildMessagePreview(message),
                lastMessageAt: message.serverMsgTime,
                unreadCount:
                  message.senderUid === session?.user.userUid
                    ? item.unreadCount ?? 0
                    : (item.unreadCount ?? 0) + 1
              }
            : item
        )
      )
    );

    setContacts((prev) =>
      sortContacts(
        prev.map((item) =>
          item.peerUid === resolvePeerUid(message)
            ? {
                ...item,
                lastMessageAt: message.serverMsgTime
              }
            : item
        )
      )
    );
  }

  function handleLock() {
    closeWebSocket();
    setScreen("disguise");
    setPinInput("");
    setStatusText("已返回伪装入口。");
  }

  function closeWebSocket() {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }

  async function finishAuthentication(input: { user: LocalUser; tokens: HiddenSession["tokens"] }) {
    setSession((prev) => ({
      user: input.user,
      tokens: input.tokens,
      pin: prev?.pin,
      pinHash: prev?.pinHash ?? "",
      mode: "backend"
    }));

    const nextContacts = await listContacts();
    const nextConversations = await listConversations();
    const historyEntries = await Promise.all(
      nextConversations.map(async (conversation) => [conversation.conversationId, await listMessageHistory(conversation.conversationId)] as const)
    );

    setContacts(sortContacts(nextContacts));
    setConversations(sortConversations(nextConversations));
    setMessages(Object.fromEntries(historyEntries));
    setActiveConversationId(nextConversations[0]?.conversationId ?? "");
  }

  return (
    <main className="shell">
      <section className="hero">
        <div className="hero__badge">HideChat Privacy Workspace</div>
        <h1>{config?.siteTitle ?? "今日运势"}</h1>
        <p>
          伪装入口、PIN 解锁、联系人、会话、文本消息和 WebSocket 实时收消息都在这一页闭合。
          后端不可用时会自动回退到本地演示模式。
        </p>
      </section>

      {screen === "disguise" && (
        <section className="panel panel--fortune">
          <div className="fortune-card">
            <span className="fortune-card__tag">伪装入口</span>
            <h2>{fortune?.title ?? "今日运势"}</h2>
            <p className="fortune-card__summary">{fortune?.summary ?? "正在整理今日运势..."}</p>
            <div className="fortune-grid">
              <div>
                <span>幸运色</span>
                <strong>{fortune?.luckyColor ?? "蓝色"}</strong>
              </div>
              <div>
                <span>幸运方位</span>
                <strong>{fortune?.luckyDirection ?? "东南"}</strong>
              </div>
              <div className="fortune-grid__wide">
                <span>建议</span>
                <strong>{fortune?.advice ?? "在重要对话中保持耐心。"}</strong>
              </div>
            </div>
          </div>

          <div className="entry-card">
            <label htmlFor="lucky-code">幸运数字</label>
            <input
              id="lucky-code"
              value={luckyCodeInput}
              onChange={(event) => setLuckyCodeInput(event.target.value)}
              placeholder="输入幸运数字"
            />
            <button type="button" onClick={() => void handleLuckyCodeSubmit()}>
              进入隐藏入口
            </button>
          </div>
        </section>
      )}

      {screen === "auth" && (
        <section className="panel panel--auth">
          <div className="auth-card">
            <div className="tabs">
              <button
                className={authMode === "login" ? "is-active" : ""}
                type="button"
                onClick={() => setAuthMode("login")}
              >
                登录
              </button>
              <button
                className={authMode === "register" ? "is-active" : ""}
                type="button"
                onClick={() => setAuthMode("register")}
              >
                注册
              </button>
            </div>

            <div className="fields">
              <input
                value={authForm.email}
                onChange={(event) => setAuthForm((prev) => ({ ...prev, email: event.target.value }))}
                placeholder="邮箱"
              />
              <input

exec
/bin/bash -lc "sed -n '1,260p' frontend/src/storage/index.ts" in /home/reader/HideChat
 succeeded in 0ms:
export interface CachedConversationRecord {
  conversationId: string;
  encryptedPayload: string;
  updatedAt: number;
}

const DB_NAME = "hidechat-local";
const STORE_NAME = "conversation-cache";

async function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: "conversationId" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveCachedConversation(record: CachedConversationRecord): Promise<void> {
  const database = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).put(record);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function loadCachedConversation(conversationId: string): Promise<CachedConversationRecord | null> {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readonly");
    const request = transaction.objectStore(STORE_NAME).get(conversationId);
    request.onsuccess = () => resolve((request.result as CachedConversationRecord | undefined) ?? null);
    request.onerror = () => reject(request.error);
  });
}

exec
/bin/bash -lc "sed -n '1,260p' frontend/src/types/index.ts" in /home/reader/HideChat
 succeeded in 0ms:
export interface LocalUser {
  userUid: string;
  nickname: string;
  email: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface HiddenSession {
  user: LocalUser;
  pin?: string;
  pinHash: string;
  tokens?: AuthTokens;
  mode?: "demo" | "backend";
}

export interface ContactItem {
  peerUid: string;
  peerNickname: string;
  remarkName: string;
  lastMessageAt: number;
}

export interface ConversationItem {
  conversationId: string;
  peerUid: string;
  peerNickname?: string;
  remarkName: string;
  lastMessagePreview: string;
  lastMessageAt: number;
  unreadCount?: number;
}

export interface ChatMessage {
  messageId: string;
  conversationId: string;
  senderUid: string;
  receiverUid: string;
  payload: string;
  messageType: string;
  serverMsgTime: number;
}

export interface FortuneToday {
  title: string;
  summary: string;
  luckyColor: string;
  luckyDirection: string;
  advice: string;
}

export interface DisguiseConfig {
  siteTitle: string;
  showFortuneInput: boolean;
  theme: string;
}

export interface ApiErrorPayload {
  code?: number;
  message?: string;
}

codex
现状已经比较清楚了，但还要把“已实现”与“存在风险/缺口”分开。接下来我补读几个关键实现点：认证、消息、系统配置和 WebSocket，以便判断哪些文档要求只是“有壳子”，哪些真的闭环。
exec
/bin/bash -lc "sed -n '1,320p' backend/src/main/java/com/hidechat/modules/auth/service/impl/AuthServiceImpl.java" in /home/reader/HideChat
 succeeded in 0ms:
package com.hidechat.modules.auth.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.UpdateWrapper;
import com.hidechat.common.constant.AuthConstants;
import com.hidechat.common.exception.BusinessException;
import com.hidechat.common.util.IdGenerator;
import com.hidechat.common.util.RandomValueGenerator;
import com.hidechat.modules.auth.dto.EmailCodeLoginRequest;
import com.hidechat.modules.auth.dto.EmailPasswordLoginRequest;
import com.hidechat.modules.auth.dto.EmailRegisterRequest;
import com.hidechat.modules.auth.dto.RefreshTokenRequest;
import com.hidechat.modules.auth.dto.ResetPasswordRequest;
import com.hidechat.modules.auth.dto.SendEmailCodeRequest;
import com.hidechat.modules.auth.service.AuthService;
import com.hidechat.modules.auth.service.EmailCodeSender;
import com.hidechat.modules.auth.vo.AuthTokenVO;
import com.hidechat.modules.auth.vo.AuthUserInfoVO;
import com.hidechat.modules.auth.vo.RegisterUserVO;
import com.hidechat.persistence.entity.ImEmailCodeEntity;
import com.hidechat.persistence.entity.ImRefreshTokenEntity;
import com.hidechat.persistence.entity.ImUserAuthEntity;
import com.hidechat.persistence.entity.ImUserEntity;
import com.hidechat.persistence.mapper.ImEmailCodeMapper;
import com.hidechat.persistence.mapper.ImRefreshTokenMapper;
import com.hidechat.persistence.mapper.ImUserAuthMapper;
import com.hidechat.persistence.mapper.ImUserMapper;
import com.hidechat.security.jwt.JwtClaims;
import com.hidechat.security.jwt.JwtTokenProvider;
import io.jsonwebtoken.JwtException;
import java.time.Clock;
import java.time.LocalDateTime;
import java.util.Objects;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private static final long EMAIL_CODE_EXPIRE_MINUTES = 10L;
    private static final long EMAIL_CODE_RESEND_SECONDS = 60L;

    private final ImUserMapper userMapper;
    private final ImUserAuthMapper userAuthMapper;
    private final ImEmailCodeMapper emailCodeMapper;
    private final ImRefreshTokenMapper refreshTokenMapper;
    private final PasswordEncoder passwordEncoder;
    private final EmailCodeSender emailCodeSender;
    private final JwtTokenProvider jwtTokenProvider;
    private final IdGenerator idGenerator;
    private final RandomValueGenerator randomValueGenerator;
    private final Clock clock;

    @Override
    @Transactional
    public void sendEmailCode(SendEmailCodeRequest request) {
        String bizType = normalizeBizType(request.getBizType());
        validateEmailBizAccess(request.getEmail(), bizType);

        ImEmailCodeEntity latest = findLatestEmailCode(request.getEmail(), bizType);
        LocalDateTime now = now();
        if (latest != null && latest.getCreatedAt() != null
            && latest.getCreatedAt().plusSeconds(EMAIL_CODE_RESEND_SECONDS).isAfter(now)) {
            throw new BusinessException(410107, "发送验证码过于频繁");
        }

        String code = randomValueGenerator.sixDigitCode();
        ImEmailCodeEntity entity = new ImEmailCodeEntity();
        entity.setId(idGenerator.nextId());
        entity.setEmail(request.getEmail());
        entity.setBizType(bizType);
        entity.setCodeHash(passwordEncoder.encode(code));
        entity.setExpireAt(now.plusMinutes(EMAIL_CODE_EXPIRE_MINUTES));
        entity.setUsed(Boolean.FALSE);
        entity.setSendCount(latest == null ? 1 : Objects.requireNonNullElse(latest.getSendCount(), 0) + 1);
        entity.setCreatedAt(now);
        emailCodeMapper.insert(entity);

        emailCodeSender.send(request.getEmail(), bizType, code);
    }

    @Override
    @Transactional
    public RegisterUserVO registerByEmail(EmailRegisterRequest request) {
        validatePassword(request.getPassword());
        ensureUserNotRegistered(request.getEmail());

        ImEmailCodeEntity emailCode = verifyEmailCode(request.getEmail(), AuthConstants.BIZ_TYPE_REGISTER, request.getEmailCode());
        String userUid = randomValueGenerator.userUid();
        LocalDateTime now = now();

        ImUserEntity user = new ImUserEntity();
        user.setId(idGenerator.nextId());
        user.setUserUid(userUid);
        user.setNickname(request.getNickname());
        user.setStatus(AuthConstants.USER_STATUS_NORMAL);
        user.setCreatedAt(now);
        user.setUpdatedAt(now);
        userMapper.insert(user);

        ImUserAuthEntity auth = new ImUserAuthEntity();
        auth.setId(idGenerator.nextId());
        auth.setUserUid(userUid);
        auth.setAuthType(AuthConstants.AUTH_TYPE_EMAIL_PASSWORD);
        auth.setAuthIdentifier(request.getEmail());
        auth.setCredentialHash(passwordEncoder.encode(request.getPassword()));
        auth.setVerified(Boolean.TRUE);
        auth.setCreatedAt(now);
        auth.setUpdatedAt(now);
        userAuthMapper.insert(auth);

        markEmailCodeUsed(emailCode);
        return new RegisterUserVO(userUid);
    }

    @Override
    public AuthTokenVO loginByEmailPassword(EmailPasswordLoginRequest request) {
        ImUserAuthEntity userAuth = findEmailPasswordAuth(request.getEmail());
        if (userAuth == null) {
            throw new BusinessException(410102, "用户不存在");
        }
        if (!passwordEncoder.matches(request.getPassword(), userAuth.getCredentialHash())) {
            throw new BusinessException(410103, "密码错误");
        }
        ImUserEntity user = requireActiveUser(userAuth.getUserUid());
        return issueTokens(user);
    }

    @Override
    @Transactional
    public AuthTokenVO loginByEmailCode(EmailCodeLoginRequest request) {
        ImUserAuthEntity userAuth = findEmailPasswordAuth(request.getEmail());
        if (userAuth == null) {
            throw new BusinessException(410102, "用户不存在");
        }
        ImEmailCodeEntity emailCode = verifyEmailCode(request.getEmail(), AuthConstants.BIZ_TYPE_LOGIN, request.getEmailCode());
        ImUserEntity user = requireActiveUser(userAuth.getUserUid());
        markEmailCodeUsed(emailCode);
        return issueTokens(user);
    }

    @Override
    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        validatePassword(request.getNewPassword());
        ImUserAuthEntity userAuth = findEmailPasswordAuth(request.getEmail());
        if (userAuth == null) {
            throw new BusinessException(410102, "用户不存在");
        }
        ImEmailCodeEntity emailCode = verifyEmailCode(
            request.getEmail(),
            AuthConstants.BIZ_TYPE_RESET_PASSWORD,
            request.getEmailCode()
        );

        userAuth.setCredentialHash(passwordEncoder.encode(request.getNewPassword()));
        userAuthMapper.updateById(userAuth);
        revokeAllRefreshTokensByUserUid(userAuth.getUserUid());
        markEmailCodeUsed(emailCode);
    }

    @Override
    @Transactional
    public AuthTokenVO refreshToken(RefreshTokenRequest request) {
        JwtClaims claims = parseRefreshToken(request.getRefreshToken());
        ImRefreshTokenEntity tokenEntity = findActiveRefreshToken(claims.tokenId());
        if (tokenEntity == null || tokenEntity.getExpireAt().isBefore(now())) {
            throw new BusinessException(410108, "refresh token 无效");
        }
        ImUserEntity user = requireActiveUser(tokenEntity.getUserUid());

        tokenEntity.setRevoked(Boolean.TRUE);
        refreshTokenMapper.updateById(tokenEntity);
        return issueTokens(user);
    }

    @Override
    @Transactional
    public void logout(String currentUserUid, RefreshTokenRequest request) {
        JwtClaims claims = parseRefreshToken(request.getRefreshToken());
        if (!Objects.equals(currentUserUid, claims.userUid())) {
            throw new BusinessException(403001, "无权限访问");
        }
        ImRefreshTokenEntity tokenEntity = findActiveRefreshToken(claims.tokenId());
        if (tokenEntity == null) {
            throw new BusinessException(410108, "refresh token 无效");
        }
        tokenEntity.setRevoked(Boolean.TRUE);
        refreshTokenMapper.updateById(tokenEntity);
    }

    private void validateEmailBizAccess(String email, String bizType) {
        boolean registered = findEmailPasswordAuth(email) != null;
        if (AuthConstants.BIZ_TYPE_REGISTER.equals(bizType) && registered) {
            throw new BusinessException(410101, "邮箱已注册");
        }
        if (!AuthConstants.BIZ_TYPE_REGISTER.equals(bizType) && !registered) {
            throw new BusinessException(410102, "用户不存在");
        }
    }

    private String normalizeBizType(String bizType) {
        if (AuthConstants.BIZ_TYPE_REGISTER.equals(bizType)
            || AuthConstants.BIZ_TYPE_LOGIN.equals(bizType)
            || AuthConstants.BIZ_TYPE_RESET_PASSWORD.equals(bizType)) {
            return bizType;
        }
        throw new BusinessException(400003, "参数格式非法");
    }

    private void validatePassword(String password) {
        boolean valid = password != null
            && password.length() >= 8
            && password.chars().anyMatch(Character::isLetter)
            && password.chars().anyMatch(Character::isDigit);
        if (!valid) {
            throw new BusinessException(400003, "参数格式非法");
        }
    }

    private void ensureUserNotRegistered(String email) {
        if (findEmailPasswordAuth(email) != null) {
            throw new BusinessException(410101, "邮箱已注册");
        }
    }

    private ImEmailCodeEntity verifyEmailCode(String email, String bizType, String rawCode) {
        ImEmailCodeEntity emailCode = findLatestEmailCode(email, bizType);
        if (emailCode == null) {
            throw new BusinessException(410104, "邮箱验证码无效");
        }
        if (Boolean.TRUE.equals(emailCode.getUsed())) {
            throw new BusinessException(410106, "邮箱验证码已使用");
        }
        if (emailCode.getExpireAt().isBefore(now())) {
            throw new BusinessException(410105, "邮箱验证码已过期");
        }
        if (!passwordEncoder.matches(rawCode, emailCode.getCodeHash())) {
            throw new BusinessException(410104, "邮箱验证码无效");
        }
        return emailCode;
    }

    private void markEmailCodeUsed(ImEmailCodeEntity emailCode) {
        emailCode.setUsed(Boolean.TRUE);
        emailCodeMapper.updateById(emailCode);
    }

    private ImUserAuthEntity findEmailPasswordAuth(String email) {
        return userAuthMapper.selectOne(new LambdaQueryWrapper<ImUserAuthEntity>()
            .eq(ImUserAuthEntity::getAuthType, AuthConstants.AUTH_TYPE_EMAIL_PASSWORD)
            .eq(ImUserAuthEntity::getAuthIdentifier, email)
            .last("limit 1"));
    }

    private ImEmailCodeEntity findLatestEmailCode(String email, String bizType) {
        return emailCodeMapper.selectOne(new LambdaQueryWrapper<ImEmailCodeEntity>()
            .eq(ImEmailCodeEntity::getEmail, email)
            .eq(ImEmailCodeEntity::getBizType, bizType)
            .orderByDesc(ImEmailCodeEntity::getCreatedAt)
            .last("limit 1"));
    }

    private ImRefreshTokenEntity findActiveRefreshToken(String tokenId) {
        return refreshTokenMapper.selectOne(new LambdaQueryWrapper<ImRefreshTokenEntity>()
            .eq(ImRefreshTokenEntity::getTokenId, tokenId)
            .eq(ImRefreshTokenEntity::getRevoked, Boolean.FALSE)
            .last("limit 1"));
    }

    private ImUserEntity requireActiveUser(String userUid) {
        ImUserEntity user = userMapper.selectOne(new LambdaQueryWrapper<ImUserEntity>()
            .eq(ImUserEntity::getUserUid, userUid)
            .last("limit 1"));
        if (user == null) {
            throw new BusinessException(410102, "用户不存在");
        }
        if (Objects.equals(user.getStatus(), AuthConstants.USER_STATUS_DISABLED)) {
            throw new BusinessException(403001, "无权限访问");
        }
        return user;
    }

    private void revokeAllRefreshTokensByUserUid(String userUid) {
        refreshTokenMapper.update(null, new UpdateWrapper<ImRefreshTokenEntity>()
            .eq("user_uid", userUid)
            .eq("revoked", Boolean.FALSE)
            .set("revoked", Boolean.TRUE));
    }

    private JwtClaims parseRefreshToken(String refreshToken) {
        try {
            JwtClaims claims = jwtTokenProvider.parse(refreshToken);
            if (!AuthConstants.TOKEN_TYPE_REFRESH.equals(claims.tokenType())) {
                throw new BusinessException(410108, "refresh token 无效");
            }
            return claims;
        } catch (JwtException | IllegalArgumentException exception) {
            throw new BusinessException(410108, "refresh token 无效");
        }
    }

    private AuthTokenVO issueTokens(ImUserEntity user) {
        String refreshTokenId = randomValueGenerator.tokenId();
        LocalDateTime now = now();

        ImRefreshTokenEntity refreshTokenEntity = new ImRefreshTokenEntity();
        refreshTokenEntity.setId(idGenerator.nextId());
        refreshTokenEntity.setUserUid(user.getUserUid());
        refreshTokenEntity.setTokenId(refreshTokenId);
        refreshTokenEntity.setExpireAt(now.plusSeconds(jwtTokenProvider.getRefreshTokenExpireSeconds()));
        refreshTokenEntity.setRevoked(Boolean.FALSE);
        refreshTokenEntity.setCreatedAt(now);
        refreshTokenMapper.insert(refreshTokenEntity);

        AuthUserInfoVO userInfoVO = new AuthUserInfoVO();
        userInfoVO.setUserUid(user.getUserUid());

exec
/bin/bash -lc "sed -n '1,320p' backend/src/main/java/com/hidechat/modules/message/service/impl/MessageServiceImpl.java" in /home/reader/HideChat
 succeeded in 0ms:
package com.hidechat.modules.message.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.hidechat.common.exception.BusinessException;
import com.hidechat.common.util.IdGenerator;
import com.hidechat.common.util.RandomValueGenerator;
import com.hidechat.modules.message.dto.MarkMessageReadRequest;
import com.hidechat.modules.message.dto.SendMessageRequest;
import com.hidechat.modules.message.service.MessageService;
import com.hidechat.modules.message.vo.MessageHistoryVO;
import com.hidechat.modules.message.vo.MessageItemVO;
import com.hidechat.persistence.entity.ImContactEntity;
import com.hidechat.persistence.entity.ImConversationEntity;
import com.hidechat.persistence.entity.ImMessageEntity;
import com.hidechat.persistence.entity.ImMessageReadReceiptEntity;
import com.hidechat.persistence.entity.ImUnreadCounterEntity;
import com.hidechat.persistence.mapper.ImContactMapper;
import com.hidechat.persistence.mapper.ImConversationMapper;
import com.hidechat.persistence.mapper.ImMessageMapper;
import com.hidechat.persistence.mapper.ImMessageReadReceiptMapper;
import com.hidechat.persistence.mapper.ImUnreadCounterMapper;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class MessageServiceImpl implements MessageService {

    private static final int DEFAULT_PAGE_SIZE = 20;
    private static final int MAX_PAGE_SIZE = 100;

    private final ImMessageMapper messageMapper;
    private final ImConversationMapper conversationMapper;
    private final ImMessageReadReceiptMapper readReceiptMapper;
    private final ImUnreadCounterMapper unreadCounterMapper;
    private final ImContactMapper contactMapper;
    private final IdGenerator idGenerator;
    private final RandomValueGenerator randomValueGenerator;
    private final Clock clock;

    public MessageServiceImpl(ImMessageMapper messageMapper,
                              ImConversationMapper conversationMapper,
                              ImMessageReadReceiptMapper readReceiptMapper,
                              ImUnreadCounterMapper unreadCounterMapper,
                              ImContactMapper contactMapper,
                              IdGenerator idGenerator,
                              RandomValueGenerator randomValueGenerator,
                              Clock clock) {
        this.messageMapper = messageMapper;
        this.conversationMapper = conversationMapper;
        this.readReceiptMapper = readReceiptMapper;
        this.unreadCounterMapper = unreadCounterMapper;
        this.contactMapper = contactMapper;
        this.idGenerator = idGenerator;
        this.randomValueGenerator = randomValueGenerator;
        this.clock = clock;
    }

    @Override
    @Transactional
    public MessageItemVO sendMessage(String userUid, SendMessageRequest request) {
        ImConversationEntity conversation = requireConversationMember(request.getConversationId(), userUid);
        String peerUid = resolvePeerUid(conversation, userUid);
        if (!Objects.equals(peerUid, request.getReceiverUid())) {
            throw new BusinessException(420201, "接收方不属于当前会话");
        }
        validateMessageRequest(request);

        LocalDateTime now = LocalDateTime.now(clock);
        ImMessageEntity entity = new ImMessageEntity();
        entity.setId(idGenerator.nextId());
        entity.setMessageId(StringUtils.hasText(request.getMessageId())
            ? request.getMessageId()
            : randomValueGenerator.messageId());
        entity.setConversationId(request.getConversationId());
        entity.setSenderUid(userUid);
        entity.setReceiverUid(request.getReceiverUid());
        entity.setMessageType(request.getMessageType());
        entity.setPayloadType(request.getPayloadType());
        entity.setPayload(request.getPayload());
        entity.setFileId(request.getFileId());
        entity.setServerStatus("delivered");
        entity.setClientMsgTime(request.getClientMsgTime());
        entity.setServerMsgTime(now);
        entity.setDeleted(Boolean.FALSE);
        messageMapper.insert(entity);

        updateConversationAfterMessage(conversation, entity, now);
        touchContacts(userUid, request.getReceiverUid(), now);
        incrementUnreadCounter(request.getReceiverUid(), request.getConversationId(), now);
        return toMessageItem(entity);
    }

    @Override
    @Transactional(readOnly = true)
    public MessageHistoryVO listHistory(String userUid, String conversationId, String cursor, Integer pageSize) {
        requireConversationMember(conversationId, userUid);
        int normalizedPageSize = normalizePageSize(pageSize);
        LambdaQueryWrapper<ImMessageEntity> queryWrapper = new LambdaQueryWrapper<ImMessageEntity>()
            .eq(ImMessageEntity::getConversationId, conversationId)
            .eq(ImMessageEntity::getDeleted, Boolean.FALSE);
        if (StringUtils.hasText(cursor)) {
            queryWrapper.lt(ImMessageEntity::getServerMsgTime, parseCursor(cursor));
        }
        queryWrapper.orderByDesc(ImMessageEntity::getServerMsgTime)
            .orderByDesc(ImMessageEntity::getId)
            .last("limit " + (normalizedPageSize + 1));
        List<ImMessageEntity> messages = messageMapper.selectList(queryWrapper);

        boolean hasMore = messages.size() > normalizedPageSize;
        if (hasMore) {
            messages = new ArrayList<>(messages.subList(0, normalizedPageSize));
        }
        messages.sort(Comparator.comparing(ImMessageEntity::getServerMsgTime).thenComparing(ImMessageEntity::getId));

        MessageHistoryVO historyVO = new MessageHistoryVO();
        historyVO.setList(messages.stream().map(this::toMessageItem).toList());
        historyVO.setHasMore(hasMore);
        historyVO.setNextCursor(hasMore && !messages.isEmpty()
            ? String.valueOf(toEpochMilli(messages.get(0).getServerMsgTime()))
            : null);
        return historyVO;
    }

    @Override
    @Transactional
    public void markMessagesRead(String userUid, MarkMessageReadRequest request) {
        requireConversationMember(request.getConversationId(), userUid);
        List<String> requestedIds = request.getMessageIds() == null
            ? Collections.emptyList()
            : request.getMessageIds().stream().filter(StringUtils::hasText).distinct().toList();
        if (!requestedIds.isEmpty()) {
            List<ImMessageEntity> messages = messageMapper.selectList(new LambdaQueryWrapper<ImMessageEntity>()
                .eq(ImMessageEntity::getConversationId, request.getConversationId())
                .eq(ImMessageEntity::getReceiverUid, userUid)
                .eq(ImMessageEntity::getDeleted, Boolean.FALSE)
                .in(ImMessageEntity::getMessageId, requestedIds));
            if (messages.size() != requestedIds.size()) {
                throw new BusinessException(420202, "消息不存在或无权限读取");
            }
            LocalDateTime now = LocalDateTime.now(clock);
            for (ImMessageEntity message : messages) {
                upsertReadReceipt(userUid, message.getMessageId(), now);
                if (!Objects.equals("read", message.getServerStatus())) {
                    message.setServerStatus("read");
                    messageMapper.updateById(message);
                }
            }
        }
        refreshUnreadCounter(userUid, request.getConversationId(), LocalDateTime.now(clock));
    }

    private void validateMessageRequest(SendMessageRequest request) {
        if (!List.of("text", "image", "system").contains(request.getMessageType())) {
            throw new BusinessException(400001, "消息类型不支持");
        }
        if (!List.of("plain", "ref", "encrypted").contains(request.getPayloadType())) {
            throw new BusinessException(400001, "消息负载类型不支持");
        }
        if ("image".equals(request.getMessageType()) && !StringUtils.hasText(request.getFileId())) {
            throw new BusinessException(400001, "图片消息必须关联文件");
        }
        if ("text".equals(request.getMessageType()) && !StringUtils.hasText(request.getPayload())) {
            throw new BusinessException(400001, "文本消息内容不能为空");
        }
    }

    private ImConversationEntity requireConversationMember(String conversationId, String userUid) {
        ImConversationEntity conversation = conversationMapper.selectOne(new LambdaQueryWrapper<ImConversationEntity>()
            .eq(ImConversationEntity::getConversationId, conversationId));
        if (conversation == null) {
            throw new BusinessException(420102, "会话不存在");
        }
        if (!Objects.equals(conversation.getUserAUid(), userUid)
            && !Objects.equals(conversation.getUserBUid(), userUid)) {
            throw new BusinessException(403001, "无权限访问");
        }
        return conversation;
    }

    private String resolvePeerUid(ImConversationEntity conversation, String userUid) {
        if (Objects.equals(conversation.getUserAUid(), userUid)) {
            return conversation.getUserBUid();
        }
        return conversation.getUserAUid();
    }

    private void updateConversationAfterMessage(ImConversationEntity conversation,
                                                ImMessageEntity message,
                                                LocalDateTime now) {
        conversation.setLastMessageId(message.getMessageId());
        conversation.setLastMessageType(message.getMessageType());
        conversation.setLastMessagePreview(buildPreview(message.getMessageType()));
        conversation.setLastMessageAt(now);
        conversation.setUpdatedAt(now);
        conversationMapper.updateById(conversation);
    }

    private void touchContacts(String senderUid, String receiverUid, LocalDateTime now) {
        touchContact(senderUid, receiverUid, now);
        touchContact(receiverUid, senderUid, now);
    }

    private void touchContact(String ownerUid, String peerUid, LocalDateTime now) {
        ImContactEntity contact = contactMapper.selectOne(new LambdaQueryWrapper<ImContactEntity>()
            .eq(ImContactEntity::getOwnerUid, ownerUid)
            .eq(ImContactEntity::getPeerUid, peerUid));
        if (contact != null) {
            contact.setLastMessageAt(now);
            contact.setUpdatedAt(now);
            contactMapper.updateById(contact);
        }
    }

    private void incrementUnreadCounter(String ownerUid, String conversationId, LocalDateTime now) {
        ImUnreadCounterEntity counter = unreadCounterMapper.selectOne(new LambdaQueryWrapper<ImUnreadCounterEntity>()
            .eq(ImUnreadCounterEntity::getOwnerUid, ownerUid)
            .eq(ImUnreadCounterEntity::getConversationId, conversationId));
        if (counter == null) {
            counter = new ImUnreadCounterEntity();
            counter.setId(idGenerator.nextId());
            counter.setOwnerUid(ownerUid);
            counter.setConversationId(conversationId);
            counter.setUnreadCount(1);
            counter.setUpdatedAt(now);
            unreadCounterMapper.insert(counter);
            return;
        }
        counter.setUnreadCount(counter.getUnreadCount() == null ? 1 : counter.getUnreadCount() + 1);
        counter.setUpdatedAt(now);
        unreadCounterMapper.updateById(counter);
    }

    private void upsertReadReceipt(String readerUid, String messageId, LocalDateTime now) {
        ImMessageReadReceiptEntity receipt = readReceiptMapper.selectOne(new LambdaQueryWrapper<ImMessageReadReceiptEntity>()
            .eq(ImMessageReadReceiptEntity::getMessageId, messageId)
            .eq(ImMessageReadReceiptEntity::getReaderUid, readerUid));
        if (receipt != null) {
            return;
        }
        receipt = new ImMessageReadReceiptEntity();
        receipt.setId(idGenerator.nextId());
        receipt.setMessageId(messageId);
        receipt.setReaderUid(readerUid);
        receipt.setReadAt(now);
        readReceiptMapper.insert(receipt);
    }

    private void refreshUnreadCounter(String ownerUid, String conversationId, LocalDateTime now) {
        Long unread = messageMapper.selectCount(new LambdaQueryWrapper<ImMessageEntity>()
            .eq(ImMessageEntity::getConversationId, conversationId)
            .eq(ImMessageEntity::getReceiverUid, ownerUid)
            .eq(ImMessageEntity::getDeleted, Boolean.FALSE)
            .ne(ImMessageEntity::getServerStatus, "read"));
        ImUnreadCounterEntity counter = unreadCounterMapper.selectOne(new LambdaQueryWrapper<ImUnreadCounterEntity>()
            .eq(ImUnreadCounterEntity::getOwnerUid, ownerUid)
            .eq(ImUnreadCounterEntity::getConversationId, conversationId));
        int unreadCount = unread == null ? 0 : unread.intValue();
        if (counter == null) {
            counter = new ImUnreadCounterEntity();
            counter.setId(idGenerator.nextId());
            counter.setOwnerUid(ownerUid);
            counter.setConversationId(conversationId);
            counter.setUnreadCount(unreadCount);
            counter.setUpdatedAt(now);
            unreadCounterMapper.insert(counter);
            return;
        }
        counter.setUnreadCount(unreadCount);
        counter.setUpdatedAt(now);
        unreadCounterMapper.updateById(counter);
    }

    private MessageItemVO toMessageItem(ImMessageEntity entity) {
        MessageItemVO vo = new MessageItemVO();
        vo.setMessageId(entity.getMessageId());
        vo.setConversationId(entity.getConversationId());
        vo.setSenderUid(entity.getSenderUid());
        vo.setReceiverUid(entity.getReceiverUid());
        vo.setMessageType(entity.getMessageType());
        vo.setPayloadType(entity.getPayloadType());
        vo.setPayload(entity.getPayload());
        vo.setFileId(entity.getFileId());
        vo.setClientMsgTime(entity.getClientMsgTime());
        vo.setServerMsgTime(toEpochMilli(entity.getServerMsgTime()));
        vo.setServerStatus(entity.getServerStatus());
        return vo;
    }

    private int normalizePageSize(Integer pageSize) {
        if (pageSize == null || pageSize <= 0) {
            return DEFAULT_PAGE_SIZE;
        }
        return Math.min(pageSize, MAX_PAGE_SIZE);
    }

    private LocalDateTime parseCursor(String cursor) {
        try {
            return LocalDateTime.ofInstant(Instant.ofEpochMilli(Long.parseLong(cursor)), clock.getZone());
        } catch (RuntimeException ex) {
            throw new BusinessException(400001, "消息游标不合法");
        }
    }

    private long toEpochMilli(LocalDateTime time) {
        return time.atZone(clock.getZone()).toInstant().toEpochMilli();
    }

    private String buildPreview(String messageType) {
        return switch (messageType) {
            case "image" -> "[图片消息]";
            case "system" -> "[系统消息]";

exec
/bin/bash -lc "sed -n '1,240p' backend/src/main/java/com/hidechat/modules/system/service/impl/SystemServiceImpl.java" in /home/reader/HideChat
 succeeded in 0ms:
package com.hidechat.modules.system.service.impl;

import com.hidechat.modules.system.service.SystemService;
import com.hidechat.modules.system.vo.DisguiseConfigVO;
import com.hidechat.modules.system.vo.FortuneTodayVO;
import java.time.Clock;
import java.time.LocalDate;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class SystemServiceImpl implements SystemService {

    private static final List<String> SUMMARIES = List.of(
        "今天适合整理情绪与节奏。",
        "适合把注意力放回真正重要的人和事。",
        "先慢下来，再决定是否回应外界噪声。"
    );
    private static final List<String> COLORS = List.of("蓝色", "青色", "米白");
    private static final List<String> DIRECTIONS = List.of("东南", "正北", "西南");
    private static final List<String> ADVICES = List.of(
        "在重要对话中保持耐心。",
        "给自己留一点不被打扰的时间。",
        "避免在疲惫时做冲动决定。"
    );

    private final Clock clock;

    public SystemServiceImpl(Clock clock) {
        this.clock = clock;
    }

    @Override
    public FortuneTodayVO getTodayFortune() {
        int seed = Math.floorMod(LocalDate.now(clock).getDayOfYear(), SUMMARIES.size());
        FortuneTodayVO vo = new FortuneTodayVO();
        vo.setTitle("今日运势");
        vo.setSummary(SUMMARIES.get(seed));
        vo.setLuckyColor(COLORS.get(seed));
        vo.setLuckyDirection(DIRECTIONS.get(seed));
        vo.setAdvice(ADVICES.get(seed));
        return vo;
    }

    @Override
    public DisguiseConfigVO getDisguiseConfig() {
        DisguiseConfigVO vo = new DisguiseConfigVO();
        vo.setSiteTitle("今日运势");
        vo.setShowFortuneInput(Boolean.TRUE);
        vo.setTheme("default");
        return vo;
    }
}

exec
/bin/bash -lc "sed -n '1,280p' backend/src/main/java/com/hidechat/websocket/handler/ChatWebSocketHandler.java" in /home/reader/HideChat
 succeeded in 0ms:
package com.hidechat.websocket.handler;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hidechat.modules.message.dto.MarkMessageReadRequest;
import com.hidechat.modules.message.dto.SendMessageRequest;
import com.hidechat.modules.message.service.MessageService;
import com.hidechat.modules.message.vo.MessageItemVO;
import com.hidechat.persistence.entity.ImConversationEntity;
import com.hidechat.persistence.mapper.ImConversationMapper;
import com.hidechat.websocket.dto.WebSocketMessageDTO;
import com.hidechat.websocket.security.JwtHandshakeInterceptor;
import com.hidechat.websocket.session.WebSocketSessionRegistry;
import java.io.IOException;
import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

@Component
public class ChatWebSocketHandler extends TextWebSocketHandler {

    private final ObjectMapper objectMapper;
    private final MessageService messageService;
    private final ImConversationMapper conversationMapper;
    private final WebSocketSessionRegistry sessionRegistry;
    private final Clock clock;

    public ChatWebSocketHandler(ObjectMapper objectMapper,
                                MessageService messageService,
                                ImConversationMapper conversationMapper,
                                WebSocketSessionRegistry sessionRegistry,
                                Clock clock) {
        this.objectMapper = objectMapper;
        this.messageService = messageService;
        this.conversationMapper = conversationMapper;
        this.sessionRegistry = sessionRegistry;
        this.clock = clock;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        String userUid = getUserUid(session);
        if (StringUtils.hasText(userUid)) {
            sessionRegistry.put(userUid, session);
        }
    }

    @Override
    public void handleTextMessage(WebSocketSession session, TextMessage message) throws IOException {
        WebSocketMessageDTO wsMessage = objectMapper.readValue(message.getPayload(), WebSocketMessageDTO.class);
        String userUid = getUserUid(session);
        if ("CHAT_SEND".equals(wsMessage.getType())) {
            handleChatSend(session, userUid, wsMessage);
            return;
        }
        if ("CHAT_READ".equals(wsMessage.getType())) {
            handleChatRead(userUid, wsMessage);
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        String userUid = getUserUid(session);
        if (StringUtils.hasText(userUid)) {
            sessionRegistry.remove(userUid);
        }
    }

    private void handleChatSend(WebSocketSession senderSession,
                                String senderUid,
                                WebSocketMessageDTO wsMessage) throws IOException {
        SendMessageRequest request = objectMapper.treeToValue(wsMessage.getData(), SendMessageRequest.class);
        MessageItemVO sentMessage = messageService.sendMessage(senderUid, request);
        send(senderSession, buildEnvelope("CHAT_ACK", Map.of(
            "messageId", sentMessage.getMessageId(),
            "status", "server_received"
        )));
        WebSocketSession receiverSession = sessionRegistry.get(sentMessage.getReceiverUid());
        if (receiverSession != null && receiverSession.isOpen()) {
            send(receiverSession, buildEnvelope("CHAT_RECEIVE", sentMessage));
        }
    }

    private void handleChatRead(String readerUid, WebSocketMessageDTO wsMessage) throws IOException {
        MarkMessageReadRequest request = objectMapper.treeToValue(wsMessage.getData(), MarkMessageReadRequest.class);
        messageService.markMessagesRead(readerUid, request);
        String peerUid = resolvePeerUid(request.getConversationId(), readerUid);
        if (!StringUtils.hasText(peerUid)) {
            return;
        }
        WebSocketSession peerSession = sessionRegistry.get(peerUid);
        if (peerSession != null && peerSession.isOpen()) {
            send(peerSession, buildEnvelope("CHAT_READ", Map.of(
                "conversationId", request.getConversationId(),
                "messageIds", request.getMessageIds() == null ? List.of() : request.getMessageIds(),
                "readerUid", readerUid,
                "readAt", Instant.now(clock).toEpochMilli()
            )));
        }
    }

    private String resolvePeerUid(String conversationId, String userUid) {
        ImConversationEntity conversation = conversationMapper.selectOne(new LambdaQueryWrapper<ImConversationEntity>()
            .eq(ImConversationEntity::getConversationId, conversationId));
        if (conversation == null) {
            return null;
        }
        if (Objects.equals(conversation.getUserAUid(), userUid)) {
            return conversation.getUserBUid();
        }
        if (Objects.equals(conversation.getUserBUid(), userUid)) {
            return conversation.getUserAUid();
        }
        return null;
    }

    private String buildEnvelope(String type, Object data) throws JsonProcessingException {
        return objectMapper.writeValueAsString(Map.of("type", type, "data", data));
    }

    private void send(WebSocketSession session, String payload) throws IOException {
        session.sendMessage(new TextMessage(payload));
    }

    private String getUserUid(WebSocketSession session) {
        Object userUid = session.getAttributes().get(JwtHandshakeInterceptor.ATTR_USER_UID);
        return userUid == null ? null : userUid.toString();
    }
}

exec
/bin/bash -lc "sed -n '1,220p' backend/src/main/java/com/hidechat/modules/auth/service/impl/LoggingEmailCodeSender.java" in /home/reader/HideChat
 succeeded in 0ms:
package com.hidechat.modules.auth.service.impl;

import com.hidechat.modules.auth.service.EmailCodeSender;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class LoggingEmailCodeSender implements EmailCodeSender {

    @Override
    public void send(String email, String bizType, String code) {
        log.info("Email code generated for email={}, bizType={}, code={}", email, bizType, code);
    }
}

exec
/bin/bash -lc "sed -n '1,260p' backend/src/main/java/com/hidechat/modules/file/service/impl/FileServiceImpl.java" in /home/reader/HideChat
 succeeded in 0ms:
package com.hidechat.modules.file.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.hidechat.common.exception.BusinessException;
import com.hidechat.common.util.IdGenerator;
import com.hidechat.common.util.RandomValueGenerator;
import com.hidechat.modules.file.dto.CompleteFileUploadRequest;
import com.hidechat.modules.file.dto.CreateUploadSignRequest;
import com.hidechat.modules.file.service.FileService;
import com.hidechat.modules.file.vo.FileInfoVO;
import com.hidechat.modules.file.vo.FileUploadSignVO;
import com.hidechat.persistence.entity.ImFileEntity;
import com.hidechat.persistence.mapper.ImFileMapper;
import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Objects;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class FileServiceImpl implements FileService {

    private static final String STORAGE_UPLOAD_BASE_URL = "https://storage.example.com/upload/";
    private static final String STORAGE_ACCESS_BASE_URL = "https://cdn.example.com/";

    private final ImFileMapper fileMapper;
    private final IdGenerator idGenerator;
    private final RandomValueGenerator randomValueGenerator;
    private final Clock clock;

    public FileServiceImpl(ImFileMapper fileMapper,
                           IdGenerator idGenerator,
                           RandomValueGenerator randomValueGenerator,
                           Clock clock) {
        this.fileMapper = fileMapper;
        this.idGenerator = idGenerator;
        this.randomValueGenerator = randomValueGenerator;
        this.clock = clock;
    }

    @Override
    @Transactional
    public FileUploadSignVO createUploadSign(String userUid, CreateUploadSignRequest request) {
        validateUploadRequest(request.getMimeType(), request.getFileSize());
        LocalDateTime now = LocalDateTime.now(clock);
        String fileId = randomValueGenerator.fileId();
        String storageKey = buildStorageKey(fileId);

        ImFileEntity entity = new ImFileEntity();
        entity.setId(idGenerator.nextId());
        entity.setFileId(fileId);
        entity.setUploaderUid(userUid);
        entity.setFileName(request.getFileName());
        entity.setMimeType(request.getMimeType());
        entity.setFileSize(request.getFileSize());
        entity.setStorageKey(storageKey);
        entity.setEncryptFlag(request.getEncryptFlag());
        entity.setCreatedAt(now);
        fileMapper.insert(entity);

        FileUploadSignVO vo = new FileUploadSignVO();
        vo.setFileId(fileId);
        vo.setStorageKey(storageKey);
        vo.setUploadUrl(STORAGE_UPLOAD_BASE_URL + storageKey);
        vo.setHeaders(Map.of("Content-Type", request.getMimeType()));
        return vo;
    }

    @Override
    @Transactional
    public FileInfoVO completeUpload(String userUid, CompleteFileUploadRequest request) {
        validateUploadRequest(request.getMimeType(), request.getFileSize());
        ImFileEntity entity = requireOwnedFile(request.getFileId(), userUid);
        if (!Objects.equals(entity.getStorageKey(), request.getStorageKey())) {
            throw new BusinessException(420301, "storageKey 不匹配");
        }
        entity.setMimeType(request.getMimeType());
        entity.setFileSize(request.getFileSize());
        entity.setEncryptFlag(request.getEncryptFlag());
        entity.setAccessUrl(buildAccessUrl(request.getStorageKey()));
        fileMapper.updateById(entity);
        return toFileInfo(entity);
    }

    @Override
    @Transactional(readOnly = true)
    public FileInfoVO getFileInfo(String userUid, String fileId) {
        return toFileInfo(requireOwnedFile(fileId, userUid));
    }

    private ImFileEntity requireOwnedFile(String fileId, String userUid) {
        ImFileEntity entity = fileMapper.selectOne(new LambdaQueryWrapper<ImFileEntity>()
            .eq(ImFileEntity::getFileId, fileId));
        if (entity == null) {
            throw new BusinessException(404001, "文件不存在");
        }
        if (!Objects.equals(entity.getUploaderUid(), userUid)) {
            throw new BusinessException(403001, "无权限访问");
        }
        return entity;
    }

    private void validateUploadRequest(String mimeType, Long fileSize) {
        if (!StringUtils.hasText(mimeType) || !isSupportedMimeType(mimeType)) {
            throw new BusinessException(400001, "文件类型不支持");
        }
        if (fileSize == null || fileSize <= 0) {
            throw new BusinessException(400001, "文件大小不合法");
        }
    }

    private boolean isSupportedMimeType(String mimeType) {
        return mimeType.startsWith("image/")
            || mimeType.equals("application/pdf")
            || mimeType.equals("text/plain")
            || mimeType.equals("application/octet-stream");
    }

    private String buildStorageKey(String fileId) {
        LocalDate date = LocalDate.now(clock);
        return "chat/" + date.getYear()
            + "/" + String.format("%02d", date.getMonthValue())
            + "/" + String.format("%02d", date.getDayOfMonth())
            + "/" + fileId + ".bin";
    }

    private String buildAccessUrl(String storageKey) {
        return STORAGE_ACCESS_BASE_URL + storageKey;
    }

    private FileInfoVO toFileInfo(ImFileEntity entity) {
        FileInfoVO vo = new FileInfoVO();
        vo.setFileId(entity.getFileId());
        vo.setFileName(entity.getFileName());
        vo.setMimeType(entity.getMimeType());
        vo.setFileSize(entity.getFileSize());
        vo.setAccessUrl(entity.getAccessUrl());
        vo.setEncryptFlag(Boolean.TRUE.equals(entity.getEncryptFlag()));
        return vo;
    }
}

exec
/bin/bash -lc "sed -n '1,260p' backend/src/main/java/com/hidechat/modules/conversation/service/impl/ConversationServiceImpl.java" in /home/reader/HideChat
 succeeded in 0ms:
package com.hidechat.modules.conversation.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.hidechat.common.exception.BusinessException;
import com.hidechat.common.util.IdGenerator;
import com.hidechat.common.util.RandomValueGenerator;
import com.hidechat.modules.conversation.dto.ClearUnreadRequest;
import com.hidechat.modules.conversation.dto.CreateSingleConversationRequest;
import com.hidechat.modules.conversation.service.ConversationService;
import com.hidechat.modules.conversation.vo.ConversationItemVO;
import com.hidechat.modules.user.service.UserService;
import com.hidechat.modules.user.vo.UserProfileVO;
import com.hidechat.persistence.entity.ImContactEntity;
import com.hidechat.persistence.entity.ImConversationEntity;
import com.hidechat.persistence.entity.ImUnreadCounterEntity;
import com.hidechat.persistence.mapper.ImContactMapper;
import com.hidechat.persistence.mapper.ImConversationMapper;
import com.hidechat.persistence.mapper.ImUnreadCounterMapper;
import java.time.Clock;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ConversationServiceImpl implements ConversationService {

    private final ImConversationMapper conversationMapper;
    private final ImContactMapper contactMapper;
    private final ImUnreadCounterMapper unreadCounterMapper;
    private final UserService userService;
    private final IdGenerator idGenerator;
    private final RandomValueGenerator randomValueGenerator;
    private final Clock clock;

    public ConversationServiceImpl(ImConversationMapper conversationMapper,
                                   ImContactMapper contactMapper,
                                   ImUnreadCounterMapper unreadCounterMapper,
                                   UserService userService,
                                   IdGenerator idGenerator,
                                   RandomValueGenerator randomValueGenerator,
                                   Clock clock) {
        this.conversationMapper = conversationMapper;
        this.contactMapper = contactMapper;
        this.unreadCounterMapper = unreadCounterMapper;
        this.userService = userService;
        this.idGenerator = idGenerator;
        this.randomValueGenerator = randomValueGenerator;
        this.clock = clock;
    }

    @Override
    @Transactional
    public ConversationItemVO createSingleConversation(String userUid, CreateSingleConversationRequest request) {
        ensureContactExists(userUid, request.getPeerUid());
        ParticipantPair pair = orderParticipants(userUid, request.getPeerUid());
        ImConversationEntity entity = conversationMapper.selectOne(new LambdaQueryWrapper<ImConversationEntity>()
            .eq(ImConversationEntity::getUserAUid, pair.userA())
            .eq(ImConversationEntity::getUserBUid, pair.userB()));
        if (entity == null) {
            entity = createConversationEntity(pair);
        }
        return buildConversationItem(Collections.singletonList(entity), userUid).get(0);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ConversationItemVO> listConversations(String userUid) {
        List<ImConversationEntity> conversations = conversationMapper.selectList(new LambdaQueryWrapper<ImConversationEntity>()
            .eq(ImConversationEntity::getUserAUid, userUid)
            .or()
            .eq(ImConversationEntity::getUserBUid, userUid)
            .orderByDesc(ImConversationEntity::getUpdatedAt));
        return buildConversationItem(conversations, userUid);
    }

    @Override
    @Transactional
    public void clearUnread(String userUid, ClearUnreadRequest request) {
        ImConversationEntity conversation = conversationMapper.selectOne(new LambdaQueryWrapper<ImConversationEntity>()
            .eq(ImConversationEntity::getConversationId, request.getConversationId()));
        if (conversation == null) {
            throw new BusinessException(420102, "会话不存在");
        }
        if (!Objects.equals(conversation.getUserAUid(), userUid)
            && !Objects.equals(conversation.getUserBUid(), userUid)) {
            throw new BusinessException(403001, "无权限访问");
        }
        ImUnreadCounterEntity counter = unreadCounterMapper.selectOne(new LambdaQueryWrapper<ImUnreadCounterEntity>()
            .eq(ImUnreadCounterEntity::getOwnerUid, userUid)
            .eq(ImUnreadCounterEntity::getConversationId, request.getConversationId()));
        LocalDateTime now = LocalDateTime.now(clock);
        if (counter == null) {
            counter = new ImUnreadCounterEntity();
            counter.setId(idGenerator.nextId());
            counter.setOwnerUid(userUid);
            counter.setConversationId(request.getConversationId());
            counter.setUnreadCount(0);
            counter.setUpdatedAt(now);
            unreadCounterMapper.insert(counter);
        } else {
            counter.setUnreadCount(0);
            counter.setUpdatedAt(now);
            unreadCounterMapper.updateById(counter);
        }
    }

    private void ensureContactExists(String ownerUid, String peerUid) {
        ImContactEntity contact = contactMapper.selectOne(new LambdaQueryWrapper<ImContactEntity>()
            .eq(ImContactEntity::getOwnerUid, ownerUid)
            .eq(ImContactEntity::getPeerUid, peerUid));
        if (contact == null) {
            throw new BusinessException(420101, "联系人不存在");
        }
    }

    private ImConversationEntity createConversationEntity(ParticipantPair pair) {
        LocalDateTime now = LocalDateTime.now(clock);
        ImConversationEntity entity = new ImConversationEntity();
        entity.setId(idGenerator.nextId());
        entity.setConversationId(randomValueGenerator.conversationId());
        entity.setUserAUid(pair.userA());
        entity.setUserBUid(pair.userB());
        entity.setCreatedAt(now);
        entity.setUpdatedAt(now);
        conversationMapper.insert(entity);
        return entity;
    }

    private ParticipantPair orderParticipants(String userUid, String peerUid) {
        if (userUid.compareTo(peerUid) <= 0) {
            return new ParticipantPair(userUid, peerUid);
        }
        return new ParticipantPair(peerUid, userUid);
    }

    private List<ConversationItemVO> buildConversationItem(List<ImConversationEntity> conversations, String ownerUid) {
        if (conversations.isEmpty()) {
            return Collections.emptyList();
        }
        Set<String> peerUids = conversations.stream()
            .map(conversation -> resolvePeerUid(conversation, ownerUid))
            .collect(Collectors.toSet());
        Map<String, UserProfileVO> peerProfiles = userService.getUserProfiles(peerUids);
        Map<String, ImContactEntity> contactMap = loadContactMap(ownerUid, peerUids);
        Map<String, ImUnreadCounterEntity> unreadMap = loadUnreadCounters(ownerUid, conversations);
        ZoneId zoneId = clock.getZone();
        return conversations.stream()
            .map(conversation -> {
                String peerUid = resolvePeerUid(conversation, ownerUid);
                UserProfileVO profile = peerProfiles.get(peerUid);
                ImContactEntity contact = contactMap.get(peerUid);
                ImUnreadCounterEntity counter = unreadMap.get(conversation.getConversationId());
                ConversationItemVO vo = new ConversationItemVO();
                vo.setConversationId(conversation.getConversationId());
                vo.setPeerUid(peerUid);
                if (profile != null) {
                    vo.setPeerNickname(profile.getNickname());
                    vo.setPeerAvatar(profile.getAvatarUrl());
                    vo.setRemarkName(profile.getNickname());
                }
                if (contact != null) {
                    vo.setRemarkName(contact.getRemarkName());
                    vo.setPinned(Boolean.TRUE.equals(contact.getPinned()));
                } else {
                    vo.setPinned(Boolean.FALSE);
                }
                vo.setLastMessagePreview(conversation.getLastMessagePreview());
                vo.setLastMessageType(conversation.getLastMessageType());
                vo.setLastMessageAt(conversation.getLastMessageAt() == null ? null
                    : conversation.getLastMessageAt().atZone(zoneId).toInstant().toEpochMilli());
                vo.setUnreadCount(counter == null ? 0 : counter.getUnreadCount());
                if (vo.getUnreadCount() == null) {
                    vo.setUnreadCount(0);
                }
                if (vo.getPinned() == null) {
                    vo.setPinned(Boolean.FALSE);
                }
                return vo;
            })
            .collect(Collectors.toList());
    }

    private Map<String, ImContactEntity> loadContactMap(String ownerUid, Collection<String> peerUids) {
        if (peerUids.isEmpty()) {
            return Collections.emptyMap();
        }
        List<ImContactEntity> contacts = contactMapper.selectList(new LambdaQueryWrapper<ImContactEntity>()
            .eq(ImContactEntity::getOwnerUid, ownerUid)
            .in(ImContactEntity::getPeerUid, peerUids));
        return contacts.stream()
            .collect(Collectors.toMap(ImContactEntity::getPeerUid, contact -> contact, (a, b) -> a));
    }

    private Map<String, ImUnreadCounterEntity> loadUnreadCounters(String ownerUid,
                                                                  Collection<ImConversationEntity> conversations) {
        Set<String> conversationIds = conversations.stream()
            .map(ImConversationEntity::getConversationId)
            .collect(Collectors.toSet());
        if (conversationIds.isEmpty()) {
            return Collections.emptyMap();
        }
        List<ImUnreadCounterEntity> counters = unreadCounterMapper.selectList(new LambdaQueryWrapper<ImUnreadCounterEntity>()
            .eq(ImUnreadCounterEntity::getOwnerUid, ownerUid)
            .in(ImUnreadCounterEntity::getConversationId, conversationIds));
        return counters.stream()
            .collect(Collectors.toMap(ImUnreadCounterEntity::getConversationId, counter -> counter, (a, b) -> a));
    }

    private String resolvePeerUid(ImConversationEntity conversation, String ownerUid) {
        if (Objects.equals(conversation.getUserAUid(), ownerUid)) {
            return conversation.getUserBUid();
        }
        return conversation.getUserAUid();
    }

    private record ParticipantPair(String userA, String userB) {
        public String userA() {
            return userA;
        }

        public String userB() {
            return userB;
        }
    }
}

exec
/bin/bash -lc "sed -n '1,220p' backend/src/main/java/com/hidechat/modules/user/service/impl/UserServiceImpl.java" in /home/reader/HideChat
 succeeded in 0ms:
package com.hidechat.modules.user.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.hidechat.common.constant.AuthConstants;
import com.hidechat.common.exception.BusinessException;
import com.hidechat.modules.user.cache.UserProfileCacheRepository;
import com.hidechat.modules.user.dto.UpdateProfileRequest;
import com.hidechat.modules.user.service.UserService;
import com.hidechat.modules.user.vo.UserProfileVO;
import com.hidechat.persistence.entity.ImUserAuthEntity;
import com.hidechat.persistence.entity.ImUserEntity;
import com.hidechat.persistence.mapper.ImUserAuthMapper;
import com.hidechat.persistence.mapper.ImUserMapper;
import java.time.Clock;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.CollectionUtils;

@Service
public class UserServiceImpl implements UserService {

    private final ImUserMapper userMapper;
    private final ImUserAuthMapper userAuthMapper;
    private final UserProfileCacheRepository userProfileCacheRepository;
    private final Clock clock;

    public UserServiceImpl(ImUserMapper userMapper,
                           ImUserAuthMapper userAuthMapper,
                           UserProfileCacheRepository userProfileCacheRepository,
                           Clock clock) {
        this.userMapper = userMapper;
        this.userAuthMapper = userAuthMapper;
        this.userProfileCacheRepository = userProfileCacheRepository;
        this.clock = clock;
    }

    @Override
    @Transactional(readOnly = true)
    public UserProfileVO getUserProfile(String userUid) {
        return userProfileCacheRepository.get(userUid)
            .orElseGet(() -> {
                UserProfileVO profile = loadUserProfile(userUid);
                userProfileCacheRepository.put(profile);
                return profile;
            });
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, UserProfileVO> getUserProfiles(Collection<String> userUids) {
        if (CollectionUtils.isEmpty(userUids)) {
            return Collections.emptyMap();
        }
        Map<String, UserProfileVO> cached = new HashMap<>(userProfileCacheRepository.getBatch(userUids));
        Set<String> missing = userUids.stream()
            .filter(uid -> !cached.containsKey(uid))
            .collect(Collectors.toSet());
        if (!missing.isEmpty()) {
            Map<String, UserProfileVO> loaded = loadUserProfiles(missing);
            loaded.values().forEach(userProfileCacheRepository::put);
            cached.putAll(loaded);
        }
        return cached;
    }

    @Override
    @Transactional
    public void updateProfile(String userUid, UpdateProfileRequest request) {
        LambdaQueryWrapper<ImUserEntity> wrapper = new LambdaQueryWrapper<ImUserEntity>()
            .eq(ImUserEntity::getUserUid, userUid);
        ImUserEntity entity = userMapper.selectOne(wrapper);
        if (entity == null) {
            throw new BusinessException(404001, "用户不存在");
        }
        entity.setNickname(request.getNickname());
        entity.setAvatarUrl(request.getAvatarUrl());
        entity.setUpdatedAt(LocalDateTime.now(clock));
        userMapper.updateById(entity);
        userProfileCacheRepository.evict(userUid);
        userProfileCacheRepository.put(buildProfileVO(entity, resolvePrimaryEmail(userUid)));
    }

    private UserProfileVO loadUserProfile(String userUid) {
        Map<String, UserProfileVO> result = loadUserProfiles(Collections.singleton(userUid));
        UserProfileVO profile = result.get(userUid);
        if (profile == null) {
            throw new BusinessException(404001, "用户不存在");
        }
        return profile;
    }

    private Map<String, UserProfileVO> loadUserProfiles(Collection<String> userUids) {
        if (CollectionUtils.isEmpty(userUids)) {
            return Collections.emptyMap();
        }
        List<ImUserEntity> users = userMapper.selectList(new LambdaQueryWrapper<ImUserEntity>()
            .in(ImUserEntity::getUserUid, userUids));
        if (users.isEmpty()) {
            return Collections.emptyMap();
        }
        Map<String, ImUserEntity> userByUid = users.stream()
            .collect(Collectors.toMap(ImUserEntity::getUserUid, user -> user));
        Map<String, String> emailByUid = loadPrimaryEmails(userByUid.keySet());
        Map<String, UserProfileVO> result = new HashMap<>();
        userByUid.forEach((uid, entity) -> result.put(uid, buildProfileVO(entity, emailByUid.get(uid))));
        return result;
    }

    private Map<String, String> loadPrimaryEmails(Collection<String> userUids) {
        if (CollectionUtils.isEmpty(userUids)) {
            return Collections.emptyMap();
        }
        List<ImUserAuthEntity> authEntities = userAuthMapper.selectList(new LambdaQueryWrapper<ImUserAuthEntity>()
            .eq(ImUserAuthEntity::getAuthType, AuthConstants.AUTH_TYPE_EMAIL_PASSWORD)
            .in(ImUserAuthEntity::getUserUid, userUids));
        return authEntities.stream()
            .collect(Collectors.toMap(ImUserAuthEntity::getUserUid, ImUserAuthEntity::getAuthIdentifier, (a, b) -> a));
    }

    private String resolvePrimaryEmail(String userUid) {
        Map<String, String> map = loadPrimaryEmails(Collections.singleton(userUid));
        return map.get(userUid);
    }

    private UserProfileVO buildProfileVO(ImUserEntity entity, String email) {
        if (entity == null) {
            return null;
        }
        UserProfileVO vo = new UserProfileVO();
        vo.setUserUid(entity.getUserUid());
        vo.setNickname(entity.getNickname());
        vo.setAvatarUrl(entity.getAvatarUrl());
        vo.setEmail(email);
        return vo;
    }
}

exec
/bin/bash -lc "sed -n '1,260p' docker-compose.yml" in /home/reader/HideChat
 succeeded in 0ms:
services:
  postgres:
    image: postgres:15-alpine
    container_name: hidechat-postgres
    environment:
      POSTGRES_DB: ${POSTGRES_DB:-hidechat_dev}
      POSTGRES_USER: ${POSTGRES_USER:-hidechat_dev}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-hidechat_dev}
    ports:
      - "${POSTGRES_PORT:-5432}:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-hidechat_dev} -d ${POSTGRES_DB:-hidechat_dev}"]
      interval: 10s
      timeout: 5s
      retries: 10

  redis:
    image: redis:7-alpine
    container_name: hidechat-redis
    ports:
      - "${REDIS_PORT:-6379}:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 10

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    image: hidechat/backend:local
    container_name: hidechat-backend
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    environment:
      SPRING_PROFILES_ACTIVE: ${SPRING_PROFILES_ACTIVE:-dev}
      SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/${POSTGRES_DB:-hidechat_dev}?currentSchema=${POSTGRES_SCHEMA:-hidechat}
      SPRING_DATASOURCE_USERNAME: ${POSTGRES_USER:-hidechat_dev}
      SPRING_DATASOURCE_PASSWORD: ${POSTGRES_PASSWORD:-hidechat_dev}
      SPRING_DATA_REDIS_HOST: redis
      SPRING_DATA_REDIS_PORT: 6379
      SPRING_DATA_REDIS_DATABASE: 0
      HIDECHAT_SECURITY_JWT_SECRET: ${HIDECHAT_JWT_SECRET:-hidechat-dev-secret-key-hidechat-dev-secret-key-2026}
    ports:
      - "${BACKEND_PORT:-8080}:8080"

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    image: hidechat/frontend:local
    container_name: hidechat-frontend
    depends_on:
      - backend
    ports:
      - "${FRONTEND_PORT:-5173}:80"

  nginx:
    image: nginx:1.27-alpine
    container_name: hidechat-gateway
    depends_on:
      - frontend
      - backend
    ports:
      - "${GATEWAY_PORT:-80}:80"
    volumes:
      - ./docker/nginx/default.conf:/etc/nginx/conf.d/default.conf:ro

volumes:
  postgres_data:
  redis_data:

exec
/bin/bash -lc "for f in scripts/up.sh scripts/down.sh scripts/check.sh scripts/verify.sh scripts/run_all.sh scripts/run_phase.sh scripts/recover.sh scripts/run-backend-integration-tests.sh; do echo '###' "'$f; sed -n '"'1,220p' \""'$f"; echo; done' in /home/reader/HideChat
 succeeded in 0ms:
### scripts/up.sh
#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${ROOT_DIR}/.env"

if [[ ! -f "${ENV_FILE}" ]]; then
  ENV_FILE="${ROOT_DIR}/.env.example"
fi

echo "Using env file: ${ENV_FILE}"
docker compose --env-file "${ENV_FILE}" -f "${ROOT_DIR}/docker-compose.yml" up -d --build

### scripts/down.sh
#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${ROOT_DIR}/.env"

if [[ ! -f "${ENV_FILE}" ]]; then
  ENV_FILE="${ROOT_DIR}/.env.example"
fi

echo "Using env file: ${ENV_FILE}"
docker compose --env-file "${ENV_FILE}" -f "${ROOT_DIR}/docker-compose.yml" down --remove-orphans

### scripts/check.sh
#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${ROOT_DIR}/.env"

if [[ ! -f "${ENV_FILE}" ]]; then
  ENV_FILE="${ROOT_DIR}/.env.example"
fi

set -a
source "${ENV_FILE}"
set +a

COMPOSE_ARGS=(--env-file "${ENV_FILE}" -f "${ROOT_DIR}/docker-compose.yml")

wait_for_http() {
  local url="$1"
  local output_file="$2"
  local attempts="${3:-20}"
  local sleep_seconds="${4:-2}"

  local i
  for ((i = 1; i <= attempts; i++)); do
    if curl --fail --silent --show-error "${url}" >"${output_file}"; then
      return 0
    fi
    sleep "${sleep_seconds}"
  done

  return 1
}

echo "== docker compose ps =="
docker compose "${COMPOSE_ARGS[@]}" ps

echo
echo "== backend =="
wait_for_http "http://127.0.0.1:${BACKEND_PORT}/api/system/fortune/today" /tmp/hidechat-backend-check.json
cat /tmp/hidechat-backend-check.json

echo
echo "== frontend =="
wait_for_http "http://127.0.0.1:${FRONTEND_PORT}/" /tmp/hidechat-frontend-check.html
grep -q "HideChat" /tmp/hidechat-frontend-check.html
echo "frontend ok"

echo
echo "== gateway =="
wait_for_http "http://127.0.0.1:${GATEWAY_PORT}/" /tmp/hidechat-gateway-check.html
grep -q "HideChat" /tmp/hidechat-gateway-check.html
echo "gateway ok"

echo
echo "== postgres =="
docker compose "${COMPOSE_ARGS[@]}" exec -T postgres pg_isready -U "${POSTGRES_USER}" -d "${POSTGRES_DB}"
docker compose "${COMPOSE_ARGS[@]}" exec -T postgres psql -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" -c "select schema_name from information_schema.schemata where schema_name = '${POSTGRES_SCHEMA}';"

echo
echo "== redis =="
docker compose "${COMPOSE_ARGS[@]}" exec -T redis redis-cli ping

### scripts/verify.sh
#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

if [[ -f .openclaw.env ]]; then
  # shellcheck disable=SC1091
  source .openclaw.env
else
  # shellcheck disable=SC1091
  source config/project.env.example
fi

PROFILE="${1:-full}"
mkdir -p "$LOG_DIR"
VERIFY_LOG="$LOG_DIR/verify_${PROFILE}.log"

echo "==> 开始验证: $PROFILE" | tee "$VERIFY_LOG"

run_cmd() {
  local name="$1"
  local cmd="$2"
  echo "\n---- $name ----" | tee -a "$VERIFY_LOG"
  bash -lc "$cmd" | tee -a "$VERIFY_LOG"
}

case "$PROFILE" in
  none)
    echo "跳过验证" | tee -a "$VERIFY_LOG"
    ;;
  backend)
    run_cmd "backend test" "$BACKEND_TEST_CMD"
    ;;
  frontend)
    run_cmd "frontend test/build" "$FRONTEND_TEST_CMD"
    ;;
  full)
    run_cmd "backend test" "$BACKEND_TEST_CMD"
    run_cmd "frontend test/build" "$FRONTEND_TEST_CMD"
    if [[ "$ENABLE_DOCKER_VERIFY" == "true" ]]; then
      run_cmd "docker compose up" "$DOCKER_UP_CMD"
      run_cmd "docker compose ps" "$DOCKER_PS_CMD"
      run_cmd "backend health" "$BACKEND_HEALTH_CMD"
      run_cmd "frontend health" "$FRONTEND_HEALTH_CMD"
    fi
    ;;
  *)
    echo "未知验证类型: $PROFILE" | tee -a "$VERIFY_LOG"
    exit 1
    ;;
esac

echo "==> 验证完成: $VERIFY_LOG"

### scripts/run_all.sh
#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

if [[ -f .openclaw.env ]]; then
  # shellcheck disable=SC1091
  source .openclaw.env
else
  # shellcheck disable=SC1091
  source config/project.env.example
fi

mkdir -p "$STATE_DIR" "$LOG_DIR"

# 检查 codex 命令是否可用
if ! command -v "$CODEX_CMD" &> /dev/null; then
  echo "错误: $CODEX_CMD 命令未找到"
  echo "请安装 Codex 或检查 PATH 环境变量"
  exit 1
fi

echo "开始执行所有阶段..."
echo "Codex 命令: $CODEX_CMD"
echo "项目根目录: $ROOT_DIR"
echo ""

while IFS='|' read -r PHASE_ID PHASE_NAME PROMPT_FILE VERIFY_PROFILE; do
  [[ -z "$PHASE_ID" || "$PHASE_ID" =~ ^# ]] && continue
  
  echo "\n=============================="
  echo "执行阶段: $PHASE_ID - $PHASE_NAME"
  echo "=============================="

  # 检查 prompt 文件是否存在
  if [[ ! -f "$PROMPT_FILE" ]]; then
    echo "警告: prompt 文件不存在: $PROMPT_FILE"
    echo "跳过此阶段"
    continue
  fi

  # 执行阶段，添加超时处理
  echo "执行阶段脚本..."
  if timeout 300 bash scripts/run_phase.sh "$PHASE_ID"; then
    echo "阶段执行成功"
  else
    EXIT_CODE=$?
    if [[ $EXIT_CODE -eq 124 ]]; then
      echo "错误: 阶段执行超时 (5分钟)"
    else
      echo "错误: 阶段执行失败，退出码: $EXIT_CODE"
    fi
    echo "跳过后续阶段"
    exit 1
  fi

  echo "\n==> 开始阶段验证: $PHASE_ID"
  if [[ "$VERIFY_PROFILE" != "none" ]]; then
    if bash scripts/verify.sh "$VERIFY_PROFILE"; then
      echo "验证成功"
    else
      echo "\n阶段验证失败: $PHASE_ID"
      echo "请检查日志并决定是否进入修复轮。"
      exit 1
    fi
  else
    echo "跳过验证 (profile: none)"
  fi

done < config/phases.conf

echo "\n所有阶段执行完成。请检查 .openclaw/state/latest_snapshot.md 和日志目录。"
echo "完成时间: $(date)"
### scripts/run_phase.sh
#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

if [[ -f .openclaw.env ]]; then
  # shellcheck disable=SC1091
  source .openclaw.env
else
  # shellcheck disable=SC1091
  source config/project.env.example
fi

PHASE_ID="${1:-}"
if [[ -z "$PHASE_ID" ]]; then
  echo "用法: bash scripts/run_phase.sh <phase_id>"
  exit 1
fi

mkdir -p "$STATE_DIR" "$LOG_DIR"

PHASE_LINE=$(grep -E "^${PHASE_ID}\|" config/phases.conf || true)
if [[ -z "$PHASE_LINE" ]]; then
  echo "未找到阶段: $PHASE_ID"
  exit 1
fi

IFS='|' read -r _ PHASE_NAME PROMPT_FILE VERIFY_PROFILE <<< "$PHASE_LINE"
PROMPT_PATH="$ROOT_DIR/$PROMPT_FILE"
GUARDRAILS_PATH="$ROOT_DIR/prompts/common_guardrails.txt"
LOG_FILE="$LOG_DIR/${PHASE_ID}.log"
SNAPSHOT_FILE="$STATE_DIR/${PHASE_ID}_snapshot.md"

if [[ ! -f "$PROMPT_PATH" ]]; then
  echo "缺少 prompt 文件: $PROMPT_PATH"
  exit 1
fi

echo "==> 执行阶段: $PHASE_ID ($PHASE_NAME)"

echo "# 阶段: $PHASE_NAME" > "$LOG_FILE"
echo >> "$LOG_FILE"
cat "$GUARDRAILS_PATH" >> "$LOG_FILE"
echo >> "$LOG_FILE"
cat "$PROMPT_PATH" >> "$LOG_FILE"

PROMPT_CONTENT=$(cat "$GUARDRAILS_PATH"; echo; cat "$PROMPT_PATH")

# 添加超时处理
echo "调用 Codex 执行分析..."
# 直接使用管道传递输入给 Codex
if echo "$PROMPT_CONTENT" | timeout 300 $CODEX_CMD exec 2>&1 | tee -a "$LOG_FILE"; then
  echo "Codex 执行完成"
else
  EXIT_CODE=$?
  if [[ $EXIT_CODE -eq 124 ]]; then
    echo "警告: Codex 执行超时 (5分钟)" | tee -a "$LOG_FILE"
    echo "超时，继续处理已有输出..." | tee -a "$LOG_FILE"
  else
    echo "错误: Codex 执行失败，退出码: $EXIT_CODE" | tee -a "$LOG_FILE"
    exit $EXIT_CODE
  fi
fi

# 提取状态快照
awk '/状态快照|【状态快照】/{flag=1} flag{print}' "$LOG_FILE" > "$SNAPSHOT_FILE" || true
if [[ ! -s "$SNAPSHOT_FILE" ]]; then
  echo "# 状态快照" > "$SNAPSHOT_FILE"
  echo "未从日志中提取到标准状态快照，请人工检查 $LOG_FILE" >> "$SNAPSHOT_FILE"
fi

cp "$SNAPSHOT_FILE" "$STATE_DIR/latest_snapshot.md"

echo "==> 阶段日志: $LOG_FILE"
echo "==> 状态快照: $SNAPSHOT_FILE"

echo "$VERIFY_PROFILE" > "$STATE_DIR/.last_verify_profile"
### scripts/recover.sh
#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

if [[ -f .openclaw.env ]]; then
  # shellcheck disable=SC1091
  source .openclaw.env
else
  # shellcheck disable=SC1091
  source config/project.env.example
fi

SNAPSHOT_FILE="${1:-.openclaw/state/latest_snapshot.md}"
if [[ ! -f "$SNAPSHOT_FILE" ]]; then
  echo "找不到状态快照: $SNAPSHOT_FILE"
  exit 1
fi

PROMPT=$(cat <<EOF2
请先读取本仓库的 agents.md 和 docs 目录。

以下是上一轮状态快照：

$(cat "$SNAPSHOT_FILE")

要求：
1. 严格遵守 agents.md
2. 不重复生成已有代码
3. 不做大范围重构
4. 优先继续未完成项

请先输出：
1. 你对当前工程状态的理解
2. 当前代码中已存在的关键模块
3. 下一步最合理的开发计划

不要直接写代码。
EOF2
)

$CODEX_CMD exec "$PROMPT"

### scripts/run-backend-integration-tests.sh
#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="${ROOT_DIR}/backend"
LOG_DIR="${BACKEND_DIR}/target"
LOG_FILE="${LOG_DIR}/integration-tests.log"

mkdir -p "${LOG_DIR}"

cd "${BACKEND_DIR}"

echo "Running backend integration tests with Testcontainers..."

if mvn -B -Dtest='*IntegrationTest' test | tee "${LOG_FILE}"; then
  echo "Integration tests passed. Log: ${LOG_FILE}"
else
  echo "Integration tests failed. Log: ${LOG_FILE}" >&2
  exit 1
fi


exec
/bin/bash -lc "sed -n '1,260p' frontend/tests/e2e/app-flow.test.tsx" in /home/reader/HideChat
 succeeded in 0ms:
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "../../src/app/App";
import { loadCachedConversation } from "../../src/storage";

describe("hidechat app flow", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: string | URL | Request) => {
        const url = String(
          typeof input === "string"
            ? input
            : input instanceof URL
              ? input.href
              : input.url
        );

        if (url.endsWith("/api/system/fortune/today")) {
          return new Response(
            JSON.stringify({
              data: {
                title: "今日运势",
                summary: "今天适合整理情绪与节奏。",
                luckyColor: "蓝色",
                luckyDirection: "东南",
                advice: "在重要对话中保持耐心。"
              }
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          );
        }

        if (url.endsWith("/api/system/disguise-config")) {
          return new Response(
            JSON.stringify({
              data: {
                siteTitle: "今日运势",
                showFortuneInput: true,
                theme: "default"
              }
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          );
        }

        return new Response(null, { status: 404 });
      })
    );
  });

  it("covers disguise entry, pin setup, send message, cache encryption, and relock", async () => {
    const user = userEvent.setup();
    render(<App />);

    await screen.findByRole("heading", { name: "今日运势", level: 1 });

    await user.type(screen.getByLabelText("幸运数字"), "2468");
    await user.click(screen.getByRole("button", { name: "进入隐藏入口" }));

    await screen.findByRole("button", { name: "使用当前信息进入" });
    await user.click(screen.getByRole("button", { name: "使用当前信息进入" }));

    await user.type(screen.getByLabelText("PIN 解锁"), "1357");
    await user.click(screen.getByRole("button", { name: "设置 PIN 并继续" }));

    await screen.findByRole("heading", { name: "Anna" });

    await user.type(screen.getByPlaceholderText("输入加密前的原始消息文本"), "你好，隐藏世界");
    await user.click(screen.getByRole("button", { name: "发送" }));

    await screen.findByText("你好，隐藏世界");

    await waitFor(async () => {
      const cached = await loadCachedConversation("c_demo_1");
      expect(cached).not.toBeNull();
      expect(cached?.encryptedPayload).not.toContain("你好，隐藏世界");
    });

    await user.click(screen.getByRole("button", { name: "返回伪装页" }));
    await screen.findByLabelText("幸运数字");

    await user.clear(screen.getByLabelText("幸运数字"));
    await user.type(screen.getByLabelText("幸运数字"), "2468");
    await user.click(screen.getByRole("button", { name: "进入隐藏入口" }));

    await user.clear(screen.getByLabelText("PIN 解锁"));
    await user.type(screen.getByLabelText("PIN 解锁"), "1357");
    await user.click(screen.getByRole("button", { name: "解锁消息缓存" }));

    await screen.findByText("你好，隐藏世界");
    expect(screen.getByText("PIN 校验通过，已恢复隐藏聊天界面。")).toBeInTheDocument();
  });
});

exec
/bin/bash -lc "sed -n '1,260p' frontend/tests/unit/crypto.test.ts" in /home/reader/HideChat
 succeeded in 0ms:
import { describe, expect, it } from "vitest";
import { decryptString, encryptString, sha256Hex } from "../../src/crypto";

describe("crypto helpers", () => {
  it("hashes lucky code deterministically", async () => {
    await expect(sha256Hex("2468")).resolves.toHaveLength(64);
  });

  it("encrypts and decrypts payload with pin", async () => {
    const encrypted = await encryptString("1357", "hidechat");
    await expect(decryptString("1357", encrypted)).resolves.toBe("hidechat");
  });
});

exec
/bin/bash -lc 'cat backend/pom.xml' in /home/reader/HideChat
 succeeded in 0ms:
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.3.5</version>
        <relativePath/>
    </parent>

    <groupId>com.hidechat</groupId>
    <artifactId>hidechat-backend</artifactId>
    <version>0.0.1-SNAPSHOT</version>
    <name>hidechat-backend</name>
    <description>HideChat backend scaffold</description>

    <properties>
        <java.version>17</java.version>
        <mybatis-plus.version>3.5.7</mybatis-plus.version>
        <testcontainers.version>1.21.4</testcontainers.version>
    </properties>

    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-validation</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-security</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-websocket</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-redis</artifactId>
        </dependency>
        <dependency>
            <groupId>com.baomidou</groupId>
            <artifactId>mybatis-plus-spring-boot3-starter</artifactId>
            <version>${mybatis-plus.version}</version>
        </dependency>
        <dependency>
            <groupId>org.flywaydb</groupId>
            <artifactId>flyway-core</artifactId>
        </dependency>
        <dependency>
            <groupId>org.flywaydb</groupId>
            <artifactId>flyway-database-postgresql</artifactId>
        </dependency>
        <dependency>
            <groupId>org.postgresql</groupId>
            <artifactId>postgresql</artifactId>
            <scope>runtime</scope>
        </dependency>
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <optional>true</optional>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
        <dependency>
            <groupId>org.springframework.security</groupId>
            <artifactId>spring-security-test</artifactId>
            <scope>test</scope>
        </dependency>
        <dependency>
            <groupId>org.testcontainers</groupId>
            <artifactId>testcontainers</artifactId>
            <version>${testcontainers.version}</version>
            <scope>test</scope>
        </dependency>
        <dependency>
            <groupId>org.testcontainers</groupId>
            <artifactId>junit-jupiter</artifactId>
            <version>${testcontainers.version}</version>
            <scope>test</scope>
        </dependency>
        <dependency>
            <groupId>org.testcontainers</groupId>
            <artifactId>postgresql</artifactId>
            <version>${testcontainers.version}</version>
            <scope>test</scope>
        </dependency>
        <dependency>
            <groupId>io.jsonwebtoken</groupId>
            <artifactId>jjwt-api</artifactId>
            <version>0.12.6</version>
        </dependency>
        <dependency>
            <groupId>io.jsonwebtoken</groupId>
            <artifactId>jjwt-impl</artifactId>
            <version>0.12.6</version>
            <scope>runtime</scope>
        </dependency>
        <dependency>
            <groupId>io.jsonwebtoken</groupId>
            <artifactId>jjwt-jackson</artifactId>
            <version>0.12.6</version>
            <scope>runtime</scope>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>
</project>

exec
/bin/bash -lc 'cat frontend/package.json' in /home/reader/HideChat
 succeeded in 0ms:
{
  "name": "hidechat-frontend",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "test": "vitest run",
    "test:e2e": "vitest run tests/e2e"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.9.1",
    "@testing-library/react": "^16.3.2",
    "@testing-library/user-event": "^14.6.1",
    "@types/node": "^25.5.2",
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.3",
    "fake-indexeddb": "^6.2.5",
    "jsdom": "^29.0.2",
    "typescript": "^5.6.3",
    "vite": "^5.4.10",
    "vitest": "^2.1.4"
  }
}

exec
/bin/bash -lc "sed -n '1,240p' README.md" in /home/reader/HideChat
 succeeded in 0ms:
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

exec
/bin/bash -lc "sed -n '1,240p' frontend/README.md" in /home/reader/HideChat
 succeeded in 0ms:
# Frontend Scaffold

This directory contains the phase-one frontend skeleton for HideChat.

Implemented in this phase:

- Vite + React + TypeScript project shape
- source directories required by `agents.md`
- placeholder files for later module development
- test directory layout placeholders

Business pages and privacy flows are intentionally not implemented yet.

exec
/bin/bash -lc "rg -n '"'^#|`(GET|POST|PUT|DELETE) '"' docs/api/后端接口定义文档\\ v1.0.md" in /home/reader/HideChat
 succeeded in 0ms:
1:# 《后端接口定义文档 v1.0》
13:# 1. 文档目标
39:# 2. 接口设计原则
41:## 2.1 风格
49:## 2.2 传输格式
54:## 2.3 时间格式
63:## 2.4 认证方式
73:# 3. 统一响应结构
87:## 3.1 响应字段说明
97:## 3.2 成功示例
111:## 3.3 失败示例
123:# 4. 通用错误码定义
166:# 5. 鉴权说明
168:## 5.1 Access Token
177:## 5.2 Refresh Token
184:# 6. 接口分组总览
198:# 7. Auth 模块接口
202:# 7.1 发送邮箱验证码
204:## 接口
206:`POST /api/auth/email/send-code`
208:## 说明
216:## 鉴权
220:## 请求体
229:## 请求字段
236:## 响应
246:## 错误场景
254:# 7.2 邮箱注册
256:## 接口
258:`POST /api/auth/email/register`
260:## 鉴权
264:## 请求体
275:## 请求字段
284:## 响应
296:## 业务规则
304:# 7.3 邮箱密码登录
306:## 接口
308:`POST /api/auth/email/password-login`
310:## 鉴权
314:## 请求体
323:## 响应
344:# 7.4 邮箱验证码登录
346:## 接口
348:`POST /api/auth/email/code-login`
350:## 鉴权
354:## 请求体
363:## 响应
369:# 7.5 重置密码
371:## 接口
373:`POST /api/auth/email/reset-password`
375:## 鉴权
379:## 请求体
389:## 响应
399:## 业务规则
406:# 7.6 刷新 Token
408:## 接口
410:`POST /api/auth/refresh-token`
412:## 鉴权
416:## 请求体
424:## 响应
440:# 7.7 登出
442:## 接口
444:`POST /api/auth/logout`
446:## 鉴权
450:## 请求体
458:## 响应
468:## 业务规则
475:# 8. User 模块接口
479:# 8.1 获取当前用户信息
481:## 接口
483:`GET /api/user/me`
485:## 鉴权
489:## 响应
506:# 8.2 更新用户资料
508:## 接口
510:`PUT /api/user/profile`
512:## 鉴权
516:## 请求体
525:## 响应
537:# 8.3 搜索用户
539:## 接口
541:`GET /api/user/search?keyword=alice`
543:## 鉴权
547:## 响应
563:## 业务规则
571:# 9. Contact 模块接口
575:# 9.1 添加联系人
577:## 接口
579:`POST /api/contact/add`
581:## 鉴权
585:## 请求体
594:## 响应
604:## 业务规则
611:# 9.2 获取联系人列表
613:## 接口
615:`GET /api/contact/list`
617:## 鉴权
621:## 响应
642:# 9.3 更新联系人备注/置顶状态
644:## 接口
646:`PUT /api/contact/update`
648:## 鉴权
652:## 请求体
662:## 响应
674:# 9.4 删除联系人
676:## 接口
678:`DELETE /api/contact/{peerUid}`
680:## 鉴权
684:## 响应
694:## 说明
701:# 10. Conversation 模块接口
705:# 10.1 获取会话列表
707:## 接口
709:`GET /api/conversation/list`
711:## 鉴权
715:## 说明
719:## 响应
742:## 注意
750:# 10.2 获取或创建 1V1 会话
752:## 接口
754:`POST /api/conversation/single`
756:## 鉴权
760:## 请求体
768:## 响应
781:## 业务规则
790:# 10.3 获取会话详情
792:## 接口
794:`GET /api/conversation/{conversationId}`
796:## 鉴权
800:## 响应
819:# 10.4 清空未读数
821:## 接口
823:`POST /api/conversation/clear-unread`
825:## 鉴权
829:## 请求体
837:## 响应
849:# 11. Message 模块接口
853:# 11.1 拉取历史消息
855:## 接口
857:`GET /api/message/history`
859:## 鉴权
863:## 请求参数
877:## 响应
905:## 说明
916:# 11.2 标记消息已读
918:## 接口
920:`POST /api/message/read`
922:## 鉴权
926:## 请求体
935:## 响应
945:## 业务规则
953:# 11.3 删除单条消息（逻辑删除）
955:## 接口
957:`DELETE /api/message/{messageId}`
959:## 鉴权
963:## 响应
973:## 说明
980:# 11.4 批量获取未送达/补偿消息
982:## 接口
984:`GET /api/message/pending?since=1712300000000`
986:## 鉴权
990:## 响应
1011:## 用途
1018:# 12. File 模块接口
1022:# 12.1 获取上传签名
1024:## 接口
1026:`POST /api/file/upload-sign`
1028:## 鉴权
1032:## 请求体
1043:## 响应
1060:## 说明
1066:# 12.2 上传完成回调
1068:## 接口
1070:`POST /api/file/complete`
1072:## 鉴权
1076:## 请求体
1088:## 响应
1103:# 12.3 获取文件信息
1105:## 接口
1107:`GET /api/file/{fileId}`
1109:## 鉴权
1113:## 响应
1131:# 13. System / Disguise 模块接口
1135:# 13.1 获取今日运势内容
1137:## 接口
1139:`GET /api/system/fortune/today`
1141:## 鉴权
1145:## 说明
1149:## 响应
1167:# 13.2 获取伪装页配置
1169:## 接口
1171:`GET /api/system/disguise-config`
1173:## 鉴权
1177:## 响应
1193:# 14. WebSocket 协议补充说明
1199:## 14.1 连接地址
1213:## 14.2 客户端发送消息
1233:## 14.3 服务端推送消息
1255:## 14.4 ACK 回执
1269:## 14.5 已读通知
1285:# 15. DTO 建议清单
1289:## Auth
1299:## User
1303:## Contact
1308:## Conversation
1313:## Message
1317:## File
1324:# 16. VO 建议清单
1326:## Auth
1331:## User
1336:## Contact
1340:## Conversation
1345:## Message
1350:## File
1355:## System
1362:# 17. 安全要求
1364:## 17.1 认证接口
1370:## 17.2 用户搜索接口
1376:## 17.3 文件上传接口
1382:## 17.4 消息接口
1390:# 18. 幂等要求
1392:## 18.1 推荐幂等接口
1401:## 18.2 幂等方式
1409:# 19. 分页与游标建议
1411:## 19.1 会话列表
1415:## 19.2 消息列表
1425:# 20. 前后端职责边界再次确认
1427:## 前端负责
1434:## 后端负责
1445:# 21. 最小可开发接口集
1449:## Auth
1451:* `POST /api/auth/email/send-code`
1452:* `POST /api/auth/email/register`
1453:* `POST /api/auth/email/password-login`
1454:* `POST /api/auth/email/reset-password`
1455:* `POST /api/auth/refresh-token`
1456:* `POST /api/auth/logout`
1458:## User
1460:* `GET /api/user/me`
1461:* `GET /api/user/search`
1463:## Contact
1465:* `POST /api/contact/add`
1466:* `GET /api/contact/list`
1468:## Conversation
1470:* `GET /api/conversation/list`
1471:* `POST /api/conversation/single`
1472:* `POST /api/conversation/clear-unread`
1474:## Message
1476:* `GET /api/message/history`
1477:* `POST /api/message/read`
1478:* `GET /api/message/pending`
1480:## File
1482:* `POST /api/file/upload-sign`
1483:* `POST /api/file/complete`
1484:* `GET /api/file/{fileId}`
1486:## System
1488:* `GET /api/system/fortune/today`

exec
/bin/bash -lc "rg -n '"'^#|自动锁定|一键隐藏|错误5次|搜索用户|图片|WebSocket|IndexedDB|幸运数字'"' docs/test/测试与验收标准\\ v1.0.md docs/prd/HideChat_PRD.md docs/tech-design/HideChat技术方案文档\\ v1.0.md" in /home/reader/HideChat
 succeeded in 0ms:
docs/tech-design/HideChat技术方案文档 v1.0.md:1:# 技术方案文档 v1.0
docs/tech-design/HideChat技术方案文档 v1.0.md:3:## 项目名称
docs/tech-design/HideChat技术方案文档 v1.0.md:7:## 文档版本
docs/tech-design/HideChat技术方案文档 v1.0.md:11:## 技术方案负责人视角
docs/tech-design/HideChat技术方案文档 v1.0.md:17:# 1. 项目背景
docs/tech-design/HideChat技术方案文档 v1.0.md:22:* 支持用户自定义“今日幸运数字”
docs/tech-design/HideChat技术方案文档 v1.0.md:23:* 输入幸运数字后进入聊天系统
docs/tech-design/HideChat技术方案文档 v1.0.md:28:* 支持文字、图片消息
docs/tech-design/HideChat技术方案文档 v1.0.md:33:# 2. 建设目标
docs/tech-design/HideChat技术方案文档 v1.0.md:35:## 2.1 产品目标
docs/tech-design/HideChat技术方案文档 v1.0.md:39:## 2.2 技术目标
docs/tech-design/HideChat技术方案文档 v1.0.md:52:# 3. 非目标范围
docs/tech-design/HideChat技术方案文档 v1.0.md:69:# 4. 总体架构设计
docs/tech-design/HideChat技术方案文档 v1.0.md:71:# 4.1 架构概览
docs/tech-design/HideChat技术方案文档 v1.0.md:73:系统采用**前后端分离**架构，前端负责页面展示、本地加解密和 IndexedDB 持久化；后端负责账号、联系人元数据、实时消息路由、消息中转与离线补偿。
docs/tech-design/HideChat技术方案文档 v1.0.md:83:│ 2. 幸运数字校验                            │
docs/tech-design/HideChat技术方案文档 v1.0.md:87:│ 6. IndexedDB 本地密文缓存                  │
docs/tech-design/HideChat技术方案文档 v1.0.md:89:│ 8. WebSocket 客户端                        │
docs/tech-design/HideChat技术方案文档 v1.0.md:98:│ 4. WebSocket 消息网关                      │
docs/tech-design/HideChat技术方案文档 v1.0.md:101:│ 7. 图片对象存储服务                        │
docs/tech-design/HideChat技术方案文档 v1.0.md:112:                │ 加密图片对象存储     │
docs/tech-design/HideChat技术方案文档 v1.0.md:118:# 4.2 架构设计原则
docs/tech-design/HideChat技术方案文档 v1.0.md:120:## 4.2.1 前端负责隐私保护
docs/tech-design/HideChat技术方案文档 v1.0.md:122:* 幸运数字只用于入口伪装
docs/tech-design/HideChat技术方案文档 v1.0.md:127:## 4.2.2 后端负责“中转 + 元数据”
docs/tech-design/HideChat技术方案文档 v1.0.md:134:## 4.2.3 明确安全边界
docs/tech-design/HideChat技术方案文档 v1.0.md:149:# 5. 核心业务流程
docs/tech-design/HideChat技术方案文档 v1.0.md:151:# 5.1 首次使用流程
docs/tech-design/HideChat技术方案文档 v1.0.md:157:→ 设置幸运数字
docs/tech-design/HideChat技术方案文档 v1.0.md:158:→ 设置幸运数字 hash 并保存本地
docs/tech-design/HideChat技术方案文档 v1.0.md:168:# 5.2 日常进入流程
docs/tech-design/HideChat技术方案文档 v1.0.md:173:→ 输入幸运数字
docs/tech-design/HideChat技术方案文档 v1.0.md:186:# 5.3 收消息流程
docs/tech-design/HideChat技术方案文档 v1.0.md:200:# 5.4 一键隐藏流程
docs/tech-design/HideChat技术方案文档 v1.0.md:208:→ 历史消息仍存在 IndexedDB，但保持加密态
docs/tech-design/HideChat技术方案文档 v1.0.md:213:# 6. 技术选型
docs/tech-design/HideChat技术方案文档 v1.0.md:215:# 6.1 前端建议
docs/tech-design/HideChat技术方案文档 v1.0.md:223:* Dexie.js（IndexedDB 封装）
docs/tech-design/HideChat技术方案文档 v1.0.md:225:* 原生 WebSocket
docs/tech-design/HideChat技术方案文档 v1.0.md:229:# 6.2 后端技术栈
docs/tech-design/HideChat技术方案文档 v1.0.md:231:## 核心框架
docs/tech-design/HideChat技术方案文档 v1.0.md:235:## Web 层
docs/tech-design/HideChat技术方案文档 v1.0.md:240:## 实时通信
docs/tech-design/HideChat技术方案文档 v1.0.md:242:* Spring WebSocket
docs/tech-design/HideChat技术方案文档 v1.0.md:244:## 安全
docs/tech-design/HideChat技术方案文档 v1.0.md:249:## ORM / 数据访问
docs/tech-design/HideChat技术方案文档 v1.0.md:258:## 数据库
docs/tech-design/HideChat技术方案文档 v1.0.md:262:## 缓存 / 会话 / 在线状态
docs/tech-design/HideChat技术方案文档 v1.0.md:266:## 对象存储
docs/tech-design/HideChat技术方案文档 v1.0.md:270:## 构建
docs/tech-design/HideChat技术方案文档 v1.0.md:274:## 部署
docs/tech-design/HideChat技术方案文档 v1.0.md:280:# 7. 模块拆分
docs/tech-design/HideChat技术方案文档 v1.0.md:284:# 7.1 模块划分
docs/tech-design/HideChat技术方案文档 v1.0.md:286:## 7.1.1 auth 模块
docs/tech-design/HideChat技术方案文档 v1.0.md:294:## 7.1.2 user 模块
docs/tech-design/HideChat技术方案文档 v1.0.md:302:## 7.1.3 disguise 模块
docs/tech-design/HideChat技术方案文档 v1.0.md:312:* 幸运数字本身建议**默认仅前端本地校验**
docs/tech-design/HideChat技术方案文档 v1.0.md:315:## 7.1.4 conversation 模块
docs/tech-design/HideChat技术方案文档 v1.0.md:324:## 7.1.5 message 模块
docs/tech-design/HideChat技术方案文档 v1.0.md:328:* 文本/图片消息处理
docs/tech-design/HideChat技术方案文档 v1.0.md:333:## 7.1.6 websocket 模块
docs/tech-design/HideChat技术方案文档 v1.0.md:337:* WebSocket 建联
docs/tech-design/HideChat技术方案文档 v1.0.md:342:## 7.1.7 storage 模块
docs/tech-design/HideChat技术方案文档 v1.0.md:346:* 图片上传
docs/tech-design/HideChat技术方案文档 v1.0.md:350:## 7.1.8 security 模块
docs/tech-design/HideChat技术方案文档 v1.0.md:360:# 8. 详细架构设计
docs/tech-design/HideChat技术方案文档 v1.0.md:362:# 8.1 认证模型
docs/tech-design/HideChat技术方案文档 v1.0.md:364:## 8.1.1 登录方式
docs/tech-design/HideChat技术方案文档 v1.0.md:372:## 8.1.2 登录结果
docs/tech-design/HideChat技术方案文档 v1.0.md:379:## 8.1.3 WebSocket 鉴权
docs/tech-design/HideChat技术方案文档 v1.0.md:381:建立 WebSocket 连接时：
docs/tech-design/HideChat技术方案文档 v1.0.md:389:# 8.2 幸运数字设计
docs/tech-design/HideChat技术方案文档 v1.0.md:391:# 8.2.1 定位
docs/tech-design/HideChat技术方案文档 v1.0.md:393:幸运数字是“**伪装入口密码**”，不承担消息加解密职责。
docs/tech-design/HideChat技术方案文档 v1.0.md:395:# 8.2.2 存储策略
docs/tech-design/HideChat技术方案文档 v1.0.md:399:* 用户自定义幸运数字
docs/tech-design/HideChat技术方案文档 v1.0.md:401:* 后端不保存幸运数字明文
docs/tech-design/HideChat技术方案文档 v1.0.md:415:# 8.2.3 校验策略
docs/tech-design/HideChat技术方案文档 v1.0.md:417:* 用户输入幸运数字
docs/tech-design/HideChat技术方案文档 v1.0.md:423:# 8.2.4 为什么不放后端
docs/tech-design/HideChat技术方案文档 v1.0.md:430:# 8.3 PIN 与会话密钥设计
docs/tech-design/HideChat技术方案文档 v1.0.md:434:# 8.3.1 设计目标
docs/tech-design/HideChat技术方案文档 v1.0.md:440:# 8.3.2 设计原则
docs/tech-design/HideChat技术方案文档 v1.0.md:457:# 8.3.3 首次设置会话 PIN
docs/tech-design/HideChat技术方案文档 v1.0.md:465:5. 将加密后的 `conversationKey` 保存到 IndexedDB
docs/tech-design/HideChat技术方案文档 v1.0.md:468:# 8.3.4 PIN 校验
docs/tech-design/HideChat技术方案文档 v1.0.md:487:# 8.4 消息加密设计
docs/tech-design/HideChat技术方案文档 v1.0.md:489:# 8.4.1 文本消息
docs/tech-design/HideChat技术方案文档 v1.0.md:503:# 8.4.2 图片消息
docs/tech-design/HideChat技术方案文档 v1.0.md:507:1. 前端读取图片 Blob
docs/tech-design/HideChat技术方案文档 v1.0.md:517:# 8.4.3 服务端职责
docs/tech-design/HideChat技术方案文档 v1.0.md:523:# 9. 数据模型设计
docs/tech-design/HideChat技术方案文档 v1.0.md:525:# 9.1 后端数据库表设计
docs/tech-design/HideChat技术方案文档 v1.0.md:529:## 9.1.1 用户表 `im_user`
docs/tech-design/HideChat技术方案文档 v1.0.md:550:## 9.1.2 联系人关系表 `im_contact`
docs/tech-design/HideChat技术方案文档 v1.0.md:570:## 9.1.3 会话表 `im_conversation`
docs/tech-design/HideChat技术方案文档 v1.0.md:588:* 可以只存固定占位，如 `[文本消息]`、`[图片消息]`
docs/tech-design/HideChat技术方案文档 v1.0.md:592:## 9.1.4 消息表 `im_message`
docs/tech-design/HideChat技术方案文档 v1.0.md:621:## 9.1.5 未读计数表 `im_unread_counter`
docs/tech-design/HideChat技术方案文档 v1.0.md:633:## 9.1.6 文件表 `im_file`
docs/tech-design/HideChat技术方案文档 v1.0.md:650:# 9.2 前端 IndexedDB 设计
docs/tech-design/HideChat技术方案文档 v1.0.md:654:## 9.2.1 表 `app_meta`
docs/tech-design/HideChat技术方案文档 v1.0.md:667:## 9.2.2 表 `conversation_index`
docs/tech-design/HideChat技术方案文档 v1.0.md:680:## 9.2.3 表 `messages`
docs/tech-design/HideChat技术方案文档 v1.0.md:691:## 9.2.4 表 `file_cache`
docs/tech-design/HideChat技术方案文档 v1.0.md:702:# 10. API 设计
docs/tech-design/HideChat技术方案文档 v1.0.md:706:# 10.1 认证相关
docs/tech-design/HideChat技术方案文档 v1.0.md:708:## 10.1.1 注册
docs/tech-design/HideChat技术方案文档 v1.0.md:731:## 10.1.2 登录
docs/tech-design/HideChat技术方案文档 v1.0.md:763:# 10.2 用户与联系人
docs/tech-design/HideChat技术方案文档 v1.0.md:765:## 10.2.1 获取当前用户信息
docs/tech-design/HideChat技术方案文档 v1.0.md:769:## 10.2.2 搜索用户
docs/tech-design/HideChat技术方案文档 v1.0.md:773:## 10.2.3 添加联系人
docs/tech-design/HideChat技术方案文档 v1.0.md:785:## 10.2.4 获取联系人/会话列表
docs/tech-design/HideChat技术方案文档 v1.0.md:811:# 10.3 消息接口
docs/tech-design/HideChat技术方案文档 v1.0.md:813:## 10.3.1 拉取历史消息
docs/tech-design/HideChat技术方案文档 v1.0.md:820:* 浏览器本地已有缓存的情况下，前端优先读本地 IndexedDB
docs/tech-design/HideChat技术方案文档 v1.0.md:822:## 10.3.2 消息已读
docs/tech-design/HideChat技术方案文档 v1.0.md:837:# 10.4 文件上传接口
docs/tech-design/HideChat技术方案文档 v1.0.md:839:## 10.4.1 获取上传签名
docs/tech-design/HideChat技术方案文档 v1.0.md:843:## 10.4.2 上传完成回调
docs/tech-design/HideChat技术方案文档 v1.0.md:861:# 11. WebSocket 协议设计
docs/tech-design/HideChat技术方案文档 v1.0.md:863:# 11.1 连接地址
docs/tech-design/HideChat技术方案文档 v1.0.md:873:# 11.2 消息类型定义
docs/tech-design/HideChat技术方案文档 v1.0.md:875:## 11.2.1 客户端发送文本消息
docs/tech-design/HideChat技术方案文档 v1.0.md:891:## 11.2.2 客户端发送图片消息
docs/tech-design/HideChat技术方案文档 v1.0.md:910:## 11.2.3 服务端推送新消息
docs/tech-design/HideChat技术方案文档 v1.0.md:926:## 11.2.4 ACK 回执
docs/tech-design/HideChat技术方案文档 v1.0.md:938:## 11.2.5 已读回执
docs/tech-design/HideChat技术方案文档 v1.0.md:952:# 11.3 WebSocket 服务端处理逻辑
docs/tech-design/HideChat技术方案文档 v1.0.md:968:# 12. 后端详细设计
docs/tech-design/HideChat技术方案文档 v1.0.md:970:# 12.1 分层结构建议
docs/tech-design/HideChat技术方案文档 v1.0.md:986:# 12.2 包结构建议
docs/tech-design/HideChat技术方案文档 v1.0.md:1017:# 12.3 会话列表生成逻辑
docs/tech-design/HideChat技术方案文档 v1.0.md:1033:# 12.4 消息持久化策略
docs/tech-design/HideChat技术方案文档 v1.0.md:1043:# 13. 安全设计
docs/tech-design/HideChat技术方案文档 v1.0.md:1045:# 13.1 核心安全边界声明
docs/tech-design/HideChat技术方案文档 v1.0.md:1062:# 13.2 后端安全措施
docs/tech-design/HideChat技术方案文档 v1.0.md:1064:## 13.2.1 鉴权
docs/tech-design/HideChat技术方案文档 v1.0.md:1068:* WebSocket 握手鉴权
docs/tech-design/HideChat技术方案文档 v1.0.md:1070:## 13.2.2 限流
docs/tech-design/HideChat技术方案文档 v1.0.md:1075:* WebSocket 发消息频控
docs/tech-design/HideChat技术方案文档 v1.0.md:1077:## 13.2.3 参数校验
docs/tech-design/HideChat技术方案文档 v1.0.md:1082:## 13.2.4 XSS / 输入处理
docs/tech-design/HideChat技术方案文档 v1.0.md:1086:* 图片类型白名单
docs/tech-design/HideChat技术方案文档 v1.0.md:1088:## 13.2.5 CSRF
docs/tech-design/HideChat技术方案文档 v1.0.md:1093:## 13.2.6 HTTPS / WSS
docs/tech-design/HideChat技术方案文档 v1.0.md:1096:* WebSocket 强制 WSS
docs/tech-design/HideChat技术方案文档 v1.0.md:1100:# 13.3 前端安全措施
docs/tech-design/HideChat技术方案文档 v1.0.md:1102:1. 幸运数字 hash 保存，不存明文
docs/tech-design/HideChat技术方案文档 v1.0.md:1109:8. 尽量用 IndexedDB 存密文
docs/tech-design/HideChat技术方案文档 v1.0.md:1113:# 13.4 推荐锁屏策略
docs/tech-design/HideChat技术方案文档 v1.0.md:1115:以下场景自动锁定当前会话：
docs/tech-design/HideChat技术方案文档 v1.0.md:1125:# 14. 性能设计
docs/tech-design/HideChat技术方案文档 v1.0.md:1127:# 14.1 性能目标
docs/tech-design/HideChat技术方案文档 v1.0.md:1132:* 图片消息上传走对象存储直传
docs/tech-design/HideChat技术方案文档 v1.0.md:1133:* WebSocket 在线消息单机支持数千连接
docs/tech-design/HideChat技术方案文档 v1.0.md:1137:# 14.2 性能手段
docs/tech-design/HideChat技术方案文档 v1.0.md:1139:## 后端
docs/tech-design/HideChat技术方案文档 v1.0.md:1146:## 前端
docs/tech-design/HideChat技术方案文档 v1.0.md:1148:* 历史记录优先从 IndexedDB 读取
docs/tech-design/HideChat技术方案文档 v1.0.md:1149:* 图片懒加载
docs/tech-design/HideChat技术方案文档 v1.0.md:1154:# 15. 部署架构
docs/tech-design/HideChat技术方案文档 v1.0.md:1156:# 15.1 部署拓扑
docs/tech-design/HideChat技术方案文档 v1.0.md:1165:   └─ /ws 转发到 Spring Boot WebSocket
docs/tech-design/HideChat技术方案文档 v1.0.md:1176:# 15.2 环境划分
docs/tech-design/HideChat技术方案文档 v1.0.md:1185:# 15.3 Docker 化建议
docs/tech-design/HideChat技术方案文档 v1.0.md:1198:# 16. 日志与监控
docs/tech-design/HideChat技术方案文档 v1.0.md:1200:# 16.1 日志
docs/tech-design/HideChat技术方案文档 v1.0.md:1203:* WebSocket 建连/断连日志
docs/tech-design/HideChat技术方案文档 v1.0.md:1210:* 日志中禁止打印 PIN、幸运数字明文、消息明文
docs/tech-design/HideChat技术方案文档 v1.0.md:1212:# 16.2 监控指标
docs/tech-design/HideChat技术方案文档 v1.0.md:1216:* WebSocket 推送成功率
docs/tech-design/HideChat技术方案文档 v1.0.md:1218:* 图片上传成功率
docs/tech-design/HideChat技术方案文档 v1.0.md:1224:# 17. 异常与边界处理
docs/tech-design/HideChat技术方案文档 v1.0.md:1226:# 17.1 幸运数字错误
docs/tech-design/HideChat技术方案文档 v1.0.md:1232:# 17.2 PIN 错误
docs/tech-design/HideChat技术方案文档 v1.0.md:1238:# 17.3 PIN 忘记
docs/tech-design/HideChat技术方案文档 v1.0.md:1243:# 17.4 多端并发登录
docs/tech-design/HideChat技术方案文档 v1.0.md:1247:# 17.5 消息丢失
docs/tech-design/HideChat技术方案文档 v1.0.md:1255:# 18. 开发实施建议
docs/tech-design/HideChat技术方案文档 v1.0.md:1257:# 18.1 开发阶段划分
docs/tech-design/HideChat技术方案文档 v1.0.md:1259:## Phase 1：基础能力
docs/tech-design/HideChat技术方案文档 v1.0.md:1264:* WebSocket 实时消息
docs/tech-design/HideChat技术方案文档 v1.0.md:1267:## Phase 2：隐私能力
docs/tech-design/HideChat技术方案文档 v1.0.md:1270:* 幸运数字本地设置与校验
docs/tech-design/HideChat技术方案文档 v1.0.md:1273:* IndexedDB 密文缓存
docs/tech-design/HideChat技术方案文档 v1.0.md:1275:## Phase 3：图片能力
docs/tech-design/HideChat技术方案文档 v1.0.md:1277:* 图片上传
docs/tech-design/HideChat技术方案文档 v1.0.md:1278:* 图片加密缓存
docs/tech-design/HideChat技术方案文档 v1.0.md:1279:* 图片展示
docs/tech-design/HideChat技术方案文档 v1.0.md:1281:## Phase 4：体验增强
docs/tech-design/HideChat技术方案文档 v1.0.md:1283:* 自动锁定
docs/tech-design/HideChat技术方案文档 v1.0.md:1290:# 18.2 后端任务拆分建议
docs/tech-design/HideChat技术方案文档 v1.0.md:1298:7. WebSocket 模块
docs/tech-design/HideChat技术方案文档 v1.0.md:1305:# 19. 风险点
docs/tech-design/HideChat技术方案文档 v1.0.md:1307:# 19.1 技术风险
docs/tech-design/HideChat技术方案文档 v1.0.md:1310:2. IndexedDB 数据仍可能被高级攻击者导出
docs/tech-design/HideChat技术方案文档 v1.0.md:1312:4. WebSocket 重连和消息补偿需要严谨处理
docs/tech-design/HideChat技术方案文档 v1.0.md:1314:# 19.2 产品风险
docs/tech-design/HideChat技术方案文档 v1.0.md:1320:# 19.3 运维风险
docs/tech-design/HideChat技术方案文档 v1.0.md:1322:1. WebSocket 连接数增长快
docs/tech-design/HideChat技术方案文档 v1.0.md:1323:2. 图片存储成本增长
docs/tech-design/HideChat技术方案文档 v1.0.md:1328:# 20. 推荐实现结论
docs/tech-design/HideChat技术方案文档 v1.0.md:1332:* **前端本地幸运数字校验**
docs/tech-design/HideChat技术方案文档 v1.0.md:1334:* **IndexedDB 密文缓存**
docs/tech-design/HideChat技术方案文档 v1.0.md:1335:* **Spring Boot + PostgreSQL + Redis + WebSocket**
docs/tech-design/HideChat技术方案文档 v1.0.md:1336:* **MinIO/S3 存储图片**
docs/tech-design/HideChat技术方案文档 v1.0.md:1349:# 21. Redis 缓存策略（新增）
docs/tech-design/HideChat技术方案文档 v1.0.md:1351:## 21.1 用户资料缓存
docs/tech-design/HideChat技术方案文档 v1.0.md:1362:## 21.2 预留扩展方向
docs/prd/HideChat_PRD.md:1:# 📄 PRD v1：隐私伪装聊天 Web 应用（增强版）
docs/prd/HideChat_PRD.md:5:# 1. 产品概述（更新）
docs/prd/HideChat_PRD.md:7:## 1.1 产品定位（升级版）
docs/prd/HideChat_PRD.md:11:* **伪装入口（幸运数字）**
docs/prd/HideChat_PRD.md:19:## 1.2 核心能力（新增重点）
docs/prd/HideChat_PRD.md:29:## 1.3 核心设计理念
docs/prd/HideChat_PRD.md:35:# 2. 用户流程（更新版）
docs/prd/HideChat_PRD.md:42:输入用户自定义幸运数字
docs/prd/HideChat_PRD.md:59:# 3. 功能模块设计（重点升级）
docs/prd/HideChat_PRD.md:63:## 3.1 模块一：幸运数字入口（用户自定义）
docs/prd/HideChat_PRD.md:65:### 3.1.1 功能说明
docs/prd/HideChat_PRD.md:69:  * 今日幸运数字（本地存储）
docs/prd/HideChat_PRD.md:76:### 3.1.2 存储方式
docs/prd/HideChat_PRD.md:92:### 3.1.3 校验逻辑
docs/prd/HideChat_PRD.md:100:### 3.1.4 错误行为（伪装）
docs/prd/HideChat_PRD.md:107:## 3.2 模块二：聊天列表页（新增核心）
docs/prd/HideChat_PRD.md:109:### 3.2.1 页面目标
docs/prd/HideChat_PRD.md:116:### 3.2.2 UI结构
docs/prd/HideChat_PRD.md:127:### 3.2.3 数据来源
docs/prd/HideChat_PRD.md:130:IndexedDB / localStorage:
docs/prd/HideChat_PRD.md:143:### 3.2.4 特性
docs/prd/HideChat_PRD.md:150:## 3.3 模块三：1V1聊天界面（核心升级）
docs/prd/HideChat_PRD.md:154:### 3.3.1 解锁机制（重点）
docs/prd/HideChat_PRD.md:162:### 3.3.2 解锁流程
docs/prd/HideChat_PRD.md:177:### 3.3.3 加密设计（关键）
docs/prd/HideChat_PRD.md:179:#### 加密算法（MVP建议）
docs/prd/HideChat_PRD.md:185:#### 密钥生成
docs/prd/HideChat_PRD.md:193:#### 存储结构
docs/prd/HideChat_PRD.md:207:### 3.3.4 本地存储方案
docs/prd/HideChat_PRD.md:211:* IndexedDB（优先）
docs/prd/HideChat_PRD.md:216:## 3.4 模块四：聊天功能
docs/prd/HideChat_PRD.md:220:### 3.4.1 文本消息
docs/prd/HideChat_PRD.md:226:### 3.4.2 图片消息
docs/prd/HideChat_PRD.md:232:### 3.4.3 消息展示
docs/prd/HideChat_PRD.md:239:## 3.5 模块五：安全控制（新增）
docs/prd/HideChat_PRD.md:243:### 3.5.1 自动锁定
docs/prd/HideChat_PRD.md:250:### 3.5.2 一键隐藏
docs/prd/HideChat_PRD.md:257:### 3.5.3 PIN错误策略
docs/prd/HideChat_PRD.md:259:* 连续错误5次 → 锁定
docs/prd/HideChat_PRD.md:264:# 4. 数据模型设计
docs/prd/HideChat_PRD.md:268:## 4.1 本地数据库结构（简化）
docs/prd/HideChat_PRD.md:288:# 5. 接口设计（简化）
docs/prd/HideChat_PRD.md:292:## 5.1 消息发送
docs/prd/HideChat_PRD.md:303:## 5.2 消息接收
docs/prd/HideChat_PRD.md:305:* WebSocket推送密文
docs/prd/HideChat_PRD.md:309:# 6. 非功能需求
docs/prd/HideChat_PRD.md:313:## 6.1 安全
docs/prd/HideChat_PRD.md:321:## 6.2 性能
docs/prd/HideChat_PRD.md:328:## 6.3 兼容性
docs/prd/HideChat_PRD.md:335:# 7. 风险与限制（更新版）
docs/prd/HideChat_PRD.md:339:## ❗1. PIN被暴力破解
docs/prd/HideChat_PRD.md:350:## ❗2. 浏览器安全问题
docs/prd/HideChat_PRD.md:356:## ❗3. 本地存储不绝对安全
docs/prd/HideChat_PRD.md:362:## ❗4. 用户遗忘PIN
docs/prd/HideChat_PRD.md:368:## ❗5. 伪装被识破
docs/prd/HideChat_PRD.md:374:# 8. 成功指标（更新）
docs/prd/HideChat_PRD.md:378:## 1. 解锁行为
docs/prd/HideChat_PRD.md:385:## 2. 隐私使用深度
docs/prd/HideChat_PRD.md:392:## 3. 留存
docs/prd/HideChat_PRD.md:398:## 4. 安全行为
docs/prd/HideChat_PRD.md:405:# 9. 版本规划（升级）
docs/prd/HideChat_PRD.md:409:## V1
docs/prd/HideChat_PRD.md:411:* 幸运数字入口
docs/prd/HideChat_PRD.md:416:## V2（当前设计）
docs/prd/HideChat_PRD.md:424:## V3
docs/test/测试与验收标准 v1.0.md:1:# 《测试与验收标准 v1.0》
docs/test/测试与验收标准 v1.0.md:8:* 当前版本范围：邮箱登录、幸运数字伪装入口、联系人、1V1 会话、文本/图片消息、PIN 解锁本地历史消息
docs/test/测试与验收标准 v1.0.md:12:# 1. 文档目标
docs/test/测试与验收标准 v1.0.md:30:# 2. 验收原则
docs/test/测试与验收标准 v1.0.md:34:## 2.1 核心链路优先
docs/test/测试与验收标准 v1.0.md:44:* 图片上传与展示
docs/test/测试与验收标准 v1.0.md:46:* 自动锁定 / 隐藏
docs/test/测试与验收标准 v1.0.md:48:## 2.2 隐私边界要验证
docs/test/测试与验收标准 v1.0.md:52:* 幸运数字不明文存储
docs/test/测试与验收标准 v1.0.md:57:## 2.3 前后端一致性
docs/test/测试与验收标准 v1.0.md:62:* WebSocket 消息状态正确
docs/test/测试与验收标准 v1.0.md:63:* 前端 IndexedDB 状态与后端会话索引基本一致
docs/test/测试与验收标准 v1.0.md:65:## 2.4 MVP 不追求完美，但必须可用
docs/test/测试与验收标准 v1.0.md:79:* 图片消息不可用
docs/test/测试与验收标准 v1.0.md:83:# 3. 测试范围总览
docs/test/测试与验收标准 v1.0.md:89:3. WebSocket 实时通信测试
docs/test/测试与验收标准 v1.0.md:98:# 4. 功能测试标准
docs/test/测试与验收标准 v1.0.md:102:# 4.1 Auth 认证模块
docs/test/测试与验收标准 v1.0.md:104:## 4.1.1 邮箱验证码发送
docs/test/测试与验收标准 v1.0.md:106:### 测试点
docs/test/测试与验收标准 v1.0.md:116:### 通过标准
docs/test/测试与验收标准 v1.0.md:125:## 4.1.2 邮箱注册
docs/test/测试与验收标准 v1.0.md:127:### 测试点
docs/test/测试与验收标准 v1.0.md:136:### 通过标准
docs/test/测试与验收标准 v1.0.md:144:## 4.1.3 邮箱密码登录
docs/test/测试与验收标准 v1.0.md:146:### 测试点
docs/test/测试与验收标准 v1.0.md:154:### 通过标准
docs/test/测试与验收标准 v1.0.md:162:## 4.1.4 邮箱验证码登录
docs/test/测试与验收标准 v1.0.md:164:### 测试点
docs/test/测试与验收标准 v1.0.md:171:### 通过标准
docs/test/测试与验收标准 v1.0.md:178:## 4.1.5 找回密码
docs/test/测试与验收标准 v1.0.md:180:### 测试点
docs/test/测试与验收标准 v1.0.md:188:### 通过标准
docs/test/测试与验收标准 v1.0.md:195:# 4.2 伪装入口模块
docs/test/测试与验收标准 v1.0.md:199:## 4.2.1 运势页展示
docs/test/测试与验收标准 v1.0.md:201:### 测试点
docs/test/测试与验收标准 v1.0.md:208:### 通过标准
docs/test/测试与验收标准 v1.0.md:215:## 4.2.2 幸运数字校验
docs/test/测试与验收标准 v1.0.md:217:### 测试点
docs/test/测试与验收标准 v1.0.md:219:* 首次设置幸运数字成功
docs/test/测试与验收标准 v1.0.md:224:* 刷新页面后仍需重新输入幸运数字
docs/test/测试与验收标准 v1.0.md:226:### 通过标准
docs/test/测试与验收标准 v1.0.md:228:* 浏览器本地不出现幸运数字明文
docs/test/测试与验收标准 v1.0.md:233:# 4.3 用户与联系人模块
docs/test/测试与验收标准 v1.0.md:237:## 4.3.1 获取当前用户信息
docs/test/测试与验收标准 v1.0.md:239:### 测试点
docs/test/测试与验收标准 v1.0.md:245:### 通过标准
docs/test/测试与验收标准 v1.0.md:251:## 4.3.2 搜索用户
docs/test/测试与验收标准 v1.0.md:253:### 测试点
docs/test/测试与验收标准 v1.0.md:260:### 通过标准
docs/test/测试与验收标准 v1.0.md:267:## 4.3.3 添加联系人
docs/test/测试与验收标准 v1.0.md:269:### 测试点
docs/test/测试与验收标准 v1.0.md:276:### 通过标准
docs/test/测试与验收标准 v1.0.md:283:## 4.3.4 联系人列表
docs/test/测试与验收标准 v1.0.md:285:### 测试点
docs/test/测试与验收标准 v1.0.md:292:### 通过标准
docs/test/测试与验收标准 v1.0.md:299:# 4.4 会话模块
docs/test/测试与验收标准 v1.0.md:303:## 4.4.1 创建或获取 1V1 会话
docs/test/测试与验收标准 v1.0.md:305:### 测试点
docs/test/测试与验收标准 v1.0.md:311:### 通过标准
docs/test/测试与验收标准 v1.0.md:318:## 4.4.2 会话列表
docs/test/测试与验收标准 v1.0.md:320:### 测试点
docs/test/测试与验收标准 v1.0.md:328:### 通过标准
docs/test/测试与验收标准 v1.0.md:335:## 4.4.3 清空未读
docs/test/测试与验收标准 v1.0.md:337:### 测试点
docs/test/测试与验收标准 v1.0.md:343:### 通过标准
docs/test/测试与验收标准 v1.0.md:350:# 4.5 消息模块
docs/test/测试与验收标准 v1.0.md:354:## 4.5.1 文本消息发送
docs/test/测试与验收标准 v1.0.md:356:### 测试点
docs/test/测试与验收标准 v1.0.md:365:### 通过标准
docs/test/测试与验收标准 v1.0.md:373:## 4.5.2 图片消息发送
docs/test/测试与验收标准 v1.0.md:375:### 测试点
docs/test/测试与验收标准 v1.0.md:377:* 图片上传签名获取成功
docs/test/测试与验收标准 v1.0.md:380:* 图片消息发送成功
docs/test/测试与验收标准 v1.0.md:382:* 图片类型限制有效
docs/test/测试与验收标准 v1.0.md:383:* 超大图片被拒绝
docs/test/测试与验收标准 v1.0.md:385:### 通过标准
docs/test/测试与验收标准 v1.0.md:387:* 图片消息全链路可用
docs/test/测试与验收标准 v1.0.md:392:## 4.5.3 历史消息拉取
docs/test/测试与验收标准 v1.0.md:394:### 测试点
docs/test/测试与验收标准 v1.0.md:402:### 通过标准
docs/test/测试与验收标准 v1.0.md:409:## 4.5.4 已读回执
docs/test/测试与验收标准 v1.0.md:411:### 测试点
docs/test/测试与验收标准 v1.0.md:418:### 通过标准
docs/test/测试与验收标准 v1.0.md:425:## 4.5.5 补偿消息
docs/test/测试与验收标准 v1.0.md:427:### 测试点
docs/test/测试与验收标准 v1.0.md:429:* WebSocket 断开后重新连接可拉取未收到消息
docs/test/测试与验收标准 v1.0.md:433:### 通过标准
docs/test/测试与验收标准 v1.0.md:440:# 4.6 本地 PIN 解锁与历史消息
docs/test/测试与验收标准 v1.0.md:446:## 4.6.1 首次设置 PIN
docs/test/测试与验收标准 v1.0.md:448:### 测试点
docs/test/测试与验收标准 v1.0.md:456:### 通过标准
docs/test/测试与验收标准 v1.0.md:463:## 4.6.2 PIN 解锁会话
docs/test/测试与验收标准 v1.0.md:465:### 测试点
docs/test/测试与验收标准 v1.0.md:473:### 通过标准
docs/test/测试与验收标准 v1.0.md:480:## 4.6.3 刷新/重新打开页面
docs/test/测试与验收标准 v1.0.md:482:### 测试点
docs/test/测试与验收标准 v1.0.md:488:### 通过标准
docs/test/测试与验收标准 v1.0.md:495:## 4.6.4 自动锁定
docs/test/测试与验收标准 v1.0.md:497:### 测试点
docs/test/测试与验收标准 v1.0.md:499:* 页面切后台自动锁定
docs/test/测试与验收标准 v1.0.md:500:* 无操作超时自动锁定
docs/test/测试与验收标准 v1.0.md:501:* 手动隐藏后自动锁定
docs/test/测试与验收标准 v1.0.md:504:### 通过标准
docs/test/测试与验收标准 v1.0.md:506:* 自动锁定触发符合 PRD
docs/test/测试与验收标准 v1.0.md:511:# 5. 接口测试标准
docs/test/测试与验收标准 v1.0.md:515:# 5.1 REST API 测试要求
docs/test/测试与验收标准 v1.0.md:530:# 5.2 REST API 验收标准
docs/test/测试与验收标准 v1.0.md:532:## 必须满足
docs/test/测试与验收标准 v1.0.md:542:# 5.3 WebSocket 测试要求
docs/test/测试与验收标准 v1.0.md:558:# 5.4 WebSocket 验收标准
docs/test/测试与验收标准 v1.0.md:560:## 必须满足
docs/test/测试与验收标准 v1.0.md:569:# 6. 本地存储与隐私测试标准
docs/test/测试与验收标准 v1.0.md:573:# 6.1 浏览器本地数据测试
docs/test/测试与验收标准 v1.0.md:575:需要检查 IndexedDB / localStorage / sessionStorage：
docs/test/测试与验收标准 v1.0.md:577:### 必测项
docs/test/测试与验收标准 v1.0.md:579:* 幸运数字是否明文存储
docs/test/测试与验收标准 v1.0.md:585:### 通过标准
docs/test/测试与验收标准 v1.0.md:587:* 幸运数字：仅 hash / salt / KDF 参数
docs/test/测试与验收标准 v1.0.md:590:* 图片：密文 Blob 存储
docs/test/测试与验收标准 v1.0.md:594:## 6.2 隐私场景测试
docs/test/测试与验收标准 v1.0.md:596:### 场景 A：别人拿到已解锁电脑但页面已锁
docs/test/测试与验收标准 v1.0.md:600:### 场景 B：别人打开聊天列表
docs/test/测试与验收标准 v1.0.md:604:### 场景 C：切到后台再切回
docs/test/测试与验收标准 v1.0.md:608:### 场景 D：开发者工具查看本地存储
docs/test/测试与验收标准 v1.0.md:614:# 7. 安全测试标准
docs/test/测试与验收标准 v1.0.md:618:# 7.1 认证安全测试
docs/test/测试与验收标准 v1.0.md:620:### 必测项
docs/test/测试与验收标准 v1.0.md:627:### 通过标准
docs/test/测试与验收标准 v1.0.md:633:## 7.2 接口安全测试
docs/test/测试与验收标准 v1.0.md:635:### 必测项
docs/test/测试与验收标准 v1.0.md:643:### 通过标准
docs/test/测试与验收标准 v1.0.md:650:## 7.3 文件安全测试
docs/test/测试与验收标准 v1.0.md:652:### 必测项
docs/test/测试与验收标准 v1.0.md:654:* 非图片文件上传拦截
docs/test/测试与验收标准 v1.0.md:659:### 通过标准
docs/test/测试与验收标准 v1.0.md:666:## 7.4 频控测试
docs/test/测试与验收标准 v1.0.md:668:### 必测项
docs/test/测试与验收标准 v1.0.md:675:### 通过标准
docs/test/测试与验收标准 v1.0.md:681:# 8. 兼容性测试标准
docs/test/测试与验收标准 v1.0.md:685:# 8.1 浏览器范围
docs/test/测试与验收标准 v1.0.md:697:## 8.2 兼容性测试点
docs/test/测试与验收标准 v1.0.md:699:### 必测项
docs/test/测试与验收标准 v1.0.md:704:* 图片消息
docs/test/测试与验收标准 v1.0.md:705:* IndexedDB 能力
docs/test/测试与验收标准 v1.0.md:707:* WebSocket 连接
docs/test/测试与验收标准 v1.0.md:709:### 通过标准
docs/test/测试与验收标准 v1.0.md:716:# 9. 性能与稳定性测试标准
docs/test/测试与验收标准 v1.0.md:720:# 9.1 REST 性能标准
docs/test/测试与验收标准 v1.0.md:722:## 目标
docs/test/测试与验收标准 v1.0.md:730:## 9.2 WebSocket 性能标准
docs/test/测试与验收标准 v1.0.md:732:## 目标
docs/test/测试与验收标准 v1.0.md:740:## 9.3 前端性能标准
docs/test/测试与验收标准 v1.0.md:742:## 目标
docs/test/测试与验收标准 v1.0.md:747:* 单张图片预览可接受时间 < 2s（常规网络）
docs/test/测试与验收标准 v1.0.md:751:## 9.4 稳定性标准
docs/test/测试与验收标准 v1.0.md:753:### 必测项
docs/test/测试与验收标准 v1.0.md:761:### 通过标准
docs/test/测试与验收标准 v1.0.md:769:# 10. 测试用例优先级
docs/test/测试与验收标准 v1.0.md:773:## P0：阻断级
docs/test/测试与验收标准 v1.0.md:779:* 幸运数字进入聊天系统
docs/test/测试与验收标准 v1.0.md:782:* 正确收发图片消息
docs/test/测试与验收标准 v1.0.md:788:## P1：高优先级
docs/test/测试与验收标准 v1.0.md:795:* 自动锁定
docs/test/测试与验收标准 v1.0.md:798:* 搜索用户与添加联系人
docs/test/测试与验收标准 v1.0.md:800:## P2：中优先级
docs/test/测试与验收标准 v1.0.md:811:# 11. 验收清单
docs/test/测试与验收标准 v1.0.md:817:# 11.1 功能验收清单
docs/test/测试与验收标准 v1.0.md:824:| 幸运数字入口 | 正确进入，错误保持伪装     | 必须   |
docs/test/测试与验收标准 v1.0.md:828:| 图片消息   | 可上传、发送、查看       | 必须   |
docs/test/测试与验收标准 v1.0.md:837:# 11.2 安全验收清单
docs/test/测试与验收标准 v1.0.md:841:| 幸运数字不明文存储  | 浏览器本地不可直接见明文    | 必须   |
docs/test/测试与验收标准 v1.0.md:843:| 历史消息不明文持久化 | IndexedDB 中应为密文 | 必须   |
docs/test/测试与验收标准 v1.0.md:851:# 11.3 性能验收清单
docs/test/测试与验收标准 v1.0.md:862:# 12. 上线前最终验收标准
docs/test/测试与验收标准 v1.0.md:866:## 必须全部满足
docs/test/测试与验收标准 v1.0.md:872:5. 幸运数字、PIN、历史消息未明文落地
docs/test/测试与验收标准 v1.0.md:874:7. 登录、聊天、图片发送、解锁、锁定五条主链路全部打通
docs/test/测试与验收标准 v1.0.md:876:## 可接受但需记录的问题
docs/test/测试与验收标准 v1.0.md:885:# 13. 建议的测试执行顺序
docs/test/测试与验收标准 v1.0.md:889:## 第一阶段：接口冒烟
docs/test/测试与验收标准 v1.0.md:898:## 第二阶段：主链路联调
docs/test/测试与验收标准 v1.0.md:905:* 发图片
docs/test/测试与验收标准 v1.0.md:909:## 第三阶段：异常与安全
docs/test/测试与验收标准 v1.0.md:918:## 第四阶段：稳定性与兼容性

exec
/bin/bash -lc "rg -n 'log\\.|logger|System\\.out|print' backend/src/main/java frontend/src -g '"'!**/node_modules/**'"'" in /home/reader/HideChat
 succeeded in 0ms:
backend/src/main/java/com/hidechat/modules/auth/service/impl/LoggingEmailCodeSender.java:13:        log.info("Email code generated for email={}, bizType={}, code={}", email, bizType, code);
backend/src/main/java/com/hidechat/modules/user/cache/UserProfileCacheRepository.java:46:            log.warn("Failed to parse user profile cache for {}", userUid, exception);
backend/src/main/java/com/hidechat/modules/user/cache/UserProfileCacheRepository.java:74:                log.warn("Failed to parse user profile cache for {}", uidList.get(i), exception);
backend/src/main/java/com/hidechat/modules/user/cache/UserProfileCacheRepository.java:88:            log.warn("Failed to serialize user profile for {}", profile.getUserUid(), exception);

exec
/bin/bash -lc "rg -n 'payloadType|messageType|lucky|PIN|pin|IndexedDB|storage|localStorage|WebSocket' frontend/src backend/src/main/java docs -g '"'!**/node_modules/**'"'" in /home/reader/HideChat
 succeeded in 0ms:
docs/prd/HideChat_PRD.md:12:* **本地加密聊天（PIN解锁）**
docs/prd/HideChat_PRD.md:24:* ✅ **PIN 解锁聊天内容**
docs/prd/HideChat_PRD.md:50:输入PIN code
docs/prd/HideChat_PRD.md:78:```id="storage1"
docs/prd/HideChat_PRD.md:79:localStorage:
docs/prd/HideChat_PRD.md:81:  luckyCodeHash: "hash值"
docs/prd/HideChat_PRD.md:129:```id="storage2"
docs/prd/HideChat_PRD.md:130:IndexedDB / localStorage:
docs/prd/HideChat_PRD.md:158:👉 必须输入 PIN code
docs/prd/HideChat_PRD.md:165:输入PIN
docs/prd/HideChat_PRD.md:188:key = PBKDF2(pin, salt, 10000)
docs/prd/HideChat_PRD.md:195:```id="msg_storage"
docs/prd/HideChat_PRD.md:211:* IndexedDB（优先）
docs/prd/HideChat_PRD.md:212:* localStorage（简单版）
docs/prd/HideChat_PRD.md:257:### 3.5.3 PIN错误策略
docs/prd/HideChat_PRD.md:305:* WebSocket推送密文
docs/prd/HideChat_PRD.md:315:* PIN不存明文
docs/prd/HideChat_PRD.md:339:## ❗1. PIN被暴力破解
docs/prd/HideChat_PRD.md:362:## ❗4. 用户遗忘PIN
docs/prd/HideChat_PRD.md:380:* PIN输入成功率
docs/prd/HideChat_PRD.md:419:* PIN解锁
docs/STATUS.md:31:- 伪装入口页、登录/注册、PIN 解锁、聊天页已实现
docs/STATUS.md:32:- IndexedDB 本地缓存与本地加密消息缓存已实现
docs/STATUS.md:35:  - PIN 设置
docs/STATUS.md:37:  - IndexedDB 中密文落盘验证
docs/STATUS.md:52:- `frontend` 补齐 `jsdom` + Testing Library + fake IndexedDB 测试环境
docs/STATUS.md:118:- 当前 E2E 主要覆盖前端主路径与后端公开系统接口，尚未扩展到浏览器驱动下的真实 WebSocket 联调
docs/STATUS.md:126:1. 增加真实浏览器级消息链路 E2E（HTTP + WebSocket）
docs/test/接口测试清单 Postman Apifox.md:6:* 协议：REST API + WebSocket
docs/test/接口测试清单 Postman Apifox.md:30:* WebSocket 联调验证点
docs/test/接口测试清单 Postman Apifox.md:43:| `wsUrl`          | `ws://localhost:8080/ws/chat` | WebSocket 地址       |
docs/test/接口测试清单 Postman Apifox.md:72:├── 08. WebSocket
docs/test/接口测试清单 Postman Apifox.md:552:  "pinned": true
docs/test/接口测试清单 Postman Apifox.md:770:* 返回 `storageKey`
docs/test/接口测试清单 Postman Apifox.md:813:  "storageKey": "chat/2026/04/06/abc.bin",
docs/test/接口测试清单 Postman Apifox.md:870:# 13. 08. WebSocket 测试清单
docs/test/接口测试清单 Postman Apifox.md:872:Postman 对 WebSocket 支持有限，Apifox 或专用 WebSocket 工具会更方便。这里给你“测试项清单 + 报文样例”。
docs/test/接口测试清单 Postman Apifox.md:906:    "messageType": "text",
docs/test/接口测试清单 Postman Apifox.md:907:    "payloadType": "encrypted",
docs/test/接口测试清单 Postman Apifox.md:933:    "messageType": "image",
docs/test/接口测试清单 Postman Apifox.md:934:    "payloadType": "ref",
docs/test/接口测试清单 Postman Apifox.md:990:* 断开 WebSocket
docs/test/接口测试清单 Postman Apifox.md:1026:11. WebSocket 发文本消息
docs/test/接口测试清单 Postman Apifox.md:1027:12. WebSocket 发图片消息
docs/test/接口测试清单 Postman Apifox.md:1097:11. WebSocket 发送文本消息
docs/test/接口测试清单 Postman Apifox.md:1110:* WebSocket 文本消息、图片消息、ACK、重连补偿均通过
docs/test/测试与验收标准 v1.0.md:8:* 当前版本范围：邮箱登录、幸运数字伪装入口、联系人、1V1 会话、文本/图片消息、PIN 解锁本地历史消息
docs/test/测试与验收标准 v1.0.md:53:* PIN 不明文存储
docs/test/测试与验收标准 v1.0.md:62:* WebSocket 消息状态正确
docs/test/测试与验收标准 v1.0.md:63:* 前端 IndexedDB 状态与后端会话索引基本一致
docs/test/测试与验收标准 v1.0.md:78:* PIN 解锁错误
docs/test/测试与验收标准 v1.0.md:89:3. WebSocket 实时通信测试
docs/test/测试与验收标准 v1.0.md:326:* 不返回本地 PIN 材料
docs/test/测试与验收标准 v1.0.md:429:* WebSocket 断开后重新连接可拉取未收到消息
docs/test/测试与验收标准 v1.0.md:440:# 4.6 本地 PIN 解锁与历史消息
docs/test/测试与验收标准 v1.0.md:446:## 4.6.1 首次设置 PIN
docs/test/测试与验收标准 v1.0.md:450:* 首次进入会话可设置 PIN
docs/test/测试与验收标准 v1.0.md:453:* 本地保存 `pinSalt`、`pinVerifierHash`
docs/test/测试与验收标准 v1.0.md:454:* 不保存 PIN 明文
docs/test/测试与验收标准 v1.0.md:458:* 本地存储中找不到 PIN 明文
docs/test/测试与验收标准 v1.0.md:459:* 后续可用该 PIN 解锁会话
docs/test/测试与验收标准 v1.0.md:463:## 4.6.2 PIN 解锁会话
docs/test/测试与验收标准 v1.0.md:467:* 输入正确 PIN 可解锁历史消息
docs/test/测试与验收标准 v1.0.md:468:* 输入错误 PIN 提示失败
docs/test/测试与验收标准 v1.0.md:469:* 错误 PIN 不泄露更多信息
docs/test/测试与验收标准 v1.0.md:475:* 正确 PIN 解密成功率 100%
docs/test/测试与验收标准 v1.0.md:476:* 错误 PIN 不能看到历史消息
docs/test/测试与验收标准 v1.0.md:484:* 页面刷新后，已锁定会话需要重新输入 PIN
docs/test/测试与验收标准 v1.0.md:485:* 未输入 PIN 时只能看到会话索引，不能看到消息明文
docs/test/测试与验收标准 v1.0.md:542:# 5.3 WebSocket 测试要求
docs/test/测试与验收标准 v1.0.md:558:# 5.4 WebSocket 验收标准
docs/test/测试与验收标准 v1.0.md:575:需要检查 IndexedDB / localStorage / sessionStorage：
docs/test/测试与验收标准 v1.0.md:580:* PIN 是否明文存储
docs/test/测试与验收标准 v1.0.md:588:* PIN：仅 verifier / salt
docs/test/测试与验收标准 v1.0.md:606:* 应要求重新输入 PIN 或符合锁定策略
docs/test/测试与验收标准 v1.0.md:610:* 不应直接看到历史消息明文和 PIN 明文
docs/test/测试与验收标准 v1.0.md:705:* IndexedDB 能力
docs/test/测试与验收标准 v1.0.md:707:* WebSocket 连接
docs/test/测试与验收标准 v1.0.md:730:## 9.2 WebSocket 性能标准
docs/test/测试与验收标准 v1.0.md:783:* PIN 解锁历史消息
docs/test/测试与验收标准 v1.0.md:830:| PIN 解锁 | 正确 PIN 可解密历史    | 必须   |
docs/test/测试与验收标准 v1.0.md:842:| PIN 不明文存储  | 浏览器本地不可直接见明文    | 必须   |
docs/test/测试与验收标准 v1.0.md:843:| 历史消息不明文持久化 | IndexedDB 中应为密文 | 必须   |
docs/test/测试与验收标准 v1.0.md:872:5. 幸运数字、PIN、历史消息未明文落地
docs/test/测试与验收标准 v1.0.md:907:* PIN 解锁
docs/database/PostgreSQL DDL 建表脚本 v1.0.md:7:* 前端本地表（IndexedDB）**不属于 PostgreSQL DDL 范围**，我会在文末补一份前端 object store 定义建议
docs/database/PostgreSQL DDL 建表脚本 v1.0.md:182:    pinned              boolean      not null default false,
docs/database/PostgreSQL DDL 建表脚本 v1.0.md:193:comment on column im_contact.pinned is '是否置顶';
docs/database/PostgreSQL DDL 建表脚本 v1.0.md:266:    storage_key         varchar(255)  not null,
docs/database/PostgreSQL DDL 建表脚本 v1.0.md:279:comment on column im_file.storage_key is '对象存储key';
docs/database/PostgreSQL DDL 建表脚本 v1.0.md:538:前端 IndexedDB 建议维护这些 object store：
docs/database/PostgreSQL DDL 建表脚本 v1.0.md:547:* `luckyCodeHash`
docs/database/PostgreSQL DDL 建表脚本 v1.0.md:548:* `luckyCodeSalt`
docs/database/PostgreSQL DDL 建表脚本 v1.0.md:549:* `luckyCodeKdfParams`
docs/database/PostgreSQL DDL 建表脚本 v1.0.md:558:* `pin_salt`
docs/database/PostgreSQL DDL 建表脚本 v1.0.md:559:* `pin_verifier_hash`
docs/tech-design/HideChat技术方案文档 v1.0.md:25:* 进入某个 1V1 聊天界面前，必须输入 **PIN code**
docs/tech-design/HideChat技术方案文档 v1.0.md:26:* PIN 用于解密**浏览器本地持久化缓存**中的历史消息
docs/tech-design/HideChat技术方案文档 v1.0.md:27:* 历史消息默认不可见，只有输入 PIN 后才能查看
docs/tech-design/HideChat技术方案文档 v1.0.md:45:3. 会话级 PIN 解锁
docs/tech-design/HideChat技术方案文档 v1.0.md:73:系统采用**前后端分离**架构，前端负责页面展示、本地加解密和 IndexedDB 持久化；后端负责账号、联系人元数据、实时消息路由、消息中转与离线补偿。
docs/tech-design/HideChat技术方案文档 v1.0.md:85:│ 4. PIN 解锁层                              │
docs/tech-design/HideChat技术方案文档 v1.0.md:87:│ 6. IndexedDB 本地密文缓存                  │
docs/tech-design/HideChat技术方案文档 v1.0.md:89:│ 8. WebSocket 客户端                        │
docs/tech-design/HideChat技术方案文档 v1.0.md:98:│ 4. WebSocket 消息网关                      │
docs/tech-design/HideChat技术方案文档 v1.0.md:123:* PIN 用于解密本地聊天历史
docs/tech-design/HideChat技术方案文档 v1.0.md:161:→ 设置该会话 PIN
docs/tech-design/HideChat技术方案文档 v1.0.md:177:→ 弹出 PIN 输入框
docs/tech-design/HideChat技术方案文档 v1.0.md:178:→ PIN 校验成功
docs/tech-design/HideChat技术方案文档 v1.0.md:195:→ 用户后续输入 PIN 后再解密历史记录
docs/tech-design/HideChat技术方案文档 v1.0.md:208:→ 历史消息仍存在 IndexedDB，但保持加密态
docs/tech-design/HideChat技术方案文档 v1.0.md:223:* Dexie.js（IndexedDB 封装）
docs/tech-design/HideChat技术方案文档 v1.0.md:225:* 原生 WebSocket
docs/tech-design/HideChat技术方案文档 v1.0.md:242:* Spring WebSocket
docs/tech-design/HideChat技术方案文档 v1.0.md:337:* WebSocket 建联
docs/tech-design/HideChat技术方案文档 v1.0.md:342:## 7.1.7 storage 模块
docs/tech-design/HideChat技术方案文档 v1.0.md:379:## 8.1.3 WebSocket 鉴权
docs/tech-design/HideChat技术方案文档 v1.0.md:381:建立 WebSocket 连接时：
docs/tech-design/HideChat技术方案文档 v1.0.md:406:luckyCode + salt -> PBKDF2 -> luckyCodeHash
docs/tech-design/HideChat技术方案文档 v1.0.md:411:* luckyCodeHash
docs/tech-design/HideChat技术方案文档 v1.0.md:419:* 与本地 luckyCodeHash 比较
docs/tech-design/HideChat技术方案文档 v1.0.md:430:# 8.3 PIN 与会话密钥设计
docs/tech-design/HideChat技术方案文档 v1.0.md:436:* PIN 用于解锁某个 1V1 会话历史
docs/tech-design/HideChat技术方案文档 v1.0.md:438:* 不输入 PIN 时无法查看明文
docs/tech-design/HideChat技术方案文档 v1.0.md:442:不要让 PIN 直接成为消息加密密钥。
docs/tech-design/HideChat技术方案文档 v1.0.md:446:PIN -> 派生 KEK（Key Encryption Key）
docs/tech-design/HideChat技术方案文档 v1.0.md:453:1. 后续可更换 PIN
docs/tech-design/HideChat技术方案文档 v1.0.md:455:3. 消息层与 PIN 层解耦
docs/tech-design/HideChat技术方案文档 v1.0.md:457:# 8.3.3 首次设置会话 PIN
docs/tech-design/HideChat技术方案文档 v1.0.md:459:用户进入某个会话首次设置 PIN 时：
docs/tech-design/HideChat技术方案文档 v1.0.md:461:1. 用户输入 PIN
docs/tech-design/HideChat技术方案文档 v1.0.md:463:3. 使用 `PBKDF2(pin, pinSalt)` 派生 `KEK`
docs/tech-design/HideChat技术方案文档 v1.0.md:465:5. 将加密后的 `conversationKey` 保存到 IndexedDB
docs/tech-design/HideChat技术方案文档 v1.0.md:468:# 8.3.4 PIN 校验
docs/tech-design/HideChat技术方案文档 v1.0.md:472:* pinVerifierHash
docs/tech-design/HideChat技术方案文档 v1.0.md:473:* pinSalt
docs/tech-design/HideChat技术方案文档 v1.0.md:477:用户输入 PIN 后：
docs/tech-design/HideChat技术方案文档 v1.0.md:479:1. 用 pin + salt 派生 KEK
docs/tech-design/HideChat技术方案文档 v1.0.md:480:2. 先验证 pinVerifierHash
docs/tech-design/HideChat技术方案文档 v1.0.md:501:* messageType
docs/tech-design/HideChat技术方案文档 v1.0.md:519:服务端不参与 PIN 解密逻辑，只传输消息载荷和元数据。
docs/tech-design/HideChat技术方案文档 v1.0.md:558:| pinned          | boolean     | 是否置顶   |
docs/tech-design/HideChat技术方案文档 v1.0.md:643:| storage_key  | varchar(255) | 对象存储 key |
docs/tech-design/HideChat技术方案文档 v1.0.md:650:# 9.2 前端 IndexedDB 设计
docs/tech-design/HideChat技术方案文档 v1.0.md:661:* luckyCodeHash
docs/tech-design/HideChat技术方案文档 v1.0.md:662:* luckyCodeSalt
docs/tech-design/HideChat技术方案文档 v1.0.md:663:* luckyCodeKdfParams
docs/tech-design/HideChat技术方案文档 v1.0.md:676:* pinSalt
docs/tech-design/HideChat技术方案文档 v1.0.md:677:* pinVerifierHash
docs/tech-design/HideChat技术方案文档 v1.0.md:685:* messageType
docs/tech-design/HideChat技术方案文档 v1.0.md:820:* 浏览器本地已有缓存的情况下，前端优先读本地 IndexedDB
docs/tech-design/HideChat技术方案文档 v1.0.md:852:  "storageKey": "chat/2026/04/06/abc.bin",
docs/tech-design/HideChat技术方案文档 v1.0.md:861:# 11. WebSocket 协议设计
docs/tech-design/HideChat技术方案文档 v1.0.md:884:    "messageType": "text",
docs/tech-design/HideChat技术方案文档 v1.0.md:900:    "messageType": "image",
docs/tech-design/HideChat技术方案文档 v1.0.md:919:    "messageType": "text",
docs/tech-design/HideChat技术方案文档 v1.0.md:952:# 11.3 WebSocket 服务端处理逻辑
docs/tech-design/HideChat技术方案文档 v1.0.md:1068:* WebSocket 握手鉴权
docs/tech-design/HideChat技术方案文档 v1.0.md:1075:* WebSocket 发消息频控
docs/tech-design/HideChat技术方案文档 v1.0.md:1096:* WebSocket 强制 WSS
docs/tech-design/HideChat技术方案文档 v1.0.md:1103:2. PIN 不明文保存
docs/tech-design/HideChat技术方案文档 v1.0.md:1108:7. 不把聊天明文写入 localStorage
docs/tech-design/HideChat技术方案文档 v1.0.md:1109:8. 尽量用 IndexedDB 存密文
docs/tech-design/HideChat技术方案文档 v1.0.md:1121:* 刷新页面后默认重新输入 PIN
docs/tech-design/HideChat技术方案文档 v1.0.md:1133:* WebSocket 在线消息单机支持数千连接
docs/tech-design/HideChat技术方案文档 v1.0.md:1148:* 历史记录优先从 IndexedDB 读取
docs/tech-design/HideChat技术方案文档 v1.0.md:1165:   └─ /ws 转发到 Spring Boot WebSocket
docs/tech-design/HideChat技术方案文档 v1.0.md:1203:* WebSocket 建连/断连日志
docs/tech-design/HideChat技术方案文档 v1.0.md:1210:* 日志中禁止打印 PIN、幸运数字明文、消息明文
docs/tech-design/HideChat技术方案文档 v1.0.md:1216:* WebSocket 推送成功率
docs/tech-design/HideChat技术方案文档 v1.0.md:1232:# 17.2 PIN 错误
docs/tech-design/HideChat技术方案文档 v1.0.md:1234:* 提示“PIN 不正确”
docs/tech-design/HideChat技术方案文档 v1.0.md:1238:# 17.3 PIN 忘记
docs/tech-design/HideChat技术方案文档 v1.0.md:1264:* WebSocket 实时消息
docs/tech-design/HideChat技术方案文档 v1.0.md:1271:* PIN 设置与解锁
docs/tech-design/HideChat技术方案文档 v1.0.md:1273:* IndexedDB 密文缓存
docs/tech-design/HideChat技术方案文档 v1.0.md:1298:7. WebSocket 模块
docs/tech-design/HideChat技术方案文档 v1.0.md:1310:2. IndexedDB 数据仍可能被高级攻击者导出
docs/tech-design/HideChat技术方案文档 v1.0.md:1312:4. WebSocket 重连和消息补偿需要严谨处理
docs/tech-design/HideChat技术方案文档 v1.0.md:1317:2. 用户忘记 PIN 导致数据不可恢复
docs/tech-design/HideChat技术方案文档 v1.0.md:1322:1. WebSocket 连接数增长快
docs/tech-design/HideChat技术方案文档 v1.0.md:1333:* **会话级 PIN 解锁**
docs/tech-design/HideChat技术方案文档 v1.0.md:1334:* **IndexedDB 密文缓存**
docs/tech-design/HideChat技术方案文档 v1.0.md:1335:* **Spring Boot + PostgreSQL + Redis + WebSocket**
docs/database/数据库字段设计文档 v1.0.md:6:* 前端：Web 浏览器本地持久化（IndexedDB）
docs/database/数据库字段设计文档 v1.0.md:7:* 场景：1V1 聊天、邮箱登录、幸运数字伪装入口、PIN 解锁本地历史消息
docs/database/数据库字段设计文档 v1.0.md:43:* PIN 校验材料
docs/database/数据库字段设计文档 v1.0.md:56:* PIN 明文
docs/database/数据库字段设计文档 v1.0.md:70:* IndexedDB
docs/database/数据库字段设计文档 v1.0.md:81:* 前端 IndexedDB object store 不强制加前缀
docs/database/数据库字段设计文档 v1.0.md:176:        boolean pinned
docs/database/数据库字段设计文档 v1.0.md:218:        varchar storage_key
docs/database/数据库字段设计文档 v1.0.md:273:        string pin_salt
docs/database/数据库字段设计文档 v1.0.md:274:        string pin_verifier_hash
docs/database/数据库字段设计文档 v1.0.md:452:| pinned          | boolean     |  是 | false | 是否置顶   |
docs/database/数据库字段设计文档 v1.0.md:575:| storage_key  | varchar(255) |  是 | -     | 对象存储 key |
docs/database/数据库字段设计文档 v1.0.md:661:# 8. 前端本地表设计（IndexedDB）
docs/database/数据库字段设计文档 v1.0.md:684:* `luckyCodeHash`
docs/database/数据库字段设计文档 v1.0.md:685:* `luckyCodeSalt`
docs/database/数据库字段设计文档 v1.0.md:686:* `luckyCodeKdfParams`
docs/database/数据库字段设计文档 v1.0.md:700:存放本地会话索引与 PIN 解锁材料。
docs/database/数据库字段设计文档 v1.0.md:711:| pin_salt                   | string  | PIN 派生盐值    |
docs/database/数据库字段设计文档 v1.0.md:712:| pin_verifier_hash          | string  | PIN 校验 hash |
docs/database/数据库字段设计文档 v1.0.md:837:## 10.2 前端 IndexedDB 类型建议
docs/database/数据库字段设计文档 v1.0.md:912:  * PIN 忘记后清空
docs/database/数据库字段设计文档 v1.0.md:921:* 不记录 PIN 明文
docs/database/数据库字段设计文档 v1.0.md:932:* 不把消息明文写入 localStorage
docs/database/数据库字段设计文档 v1.0.md:1000:* PIN 解锁
docs/api/后端接口定义文档 v1.0.md:7:* 通信：REST API + WebSocket
docs/api/后端接口定义文档 v1.0.md:28:* **PIN 解锁本地聊天记录默认在前端完成**
docs/api/后端接口定义文档 v1.0.md:633:      "pinned": false,
docs/api/后端接口定义文档 v1.0.md:658:  "pinned": true
docs/api/后端接口定义文档 v1.0.md:736:      "pinned": false
docs/api/后端接口定义文档 v1.0.md:744:* 不返回本地 PIN 材料
docs/api/后端接口定义文档 v1.0.md:890:        "messageType": "text",
docs/api/后端接口定义文档 v1.0.md:891:        "payloadType": "encrypted",
docs/api/后端接口定义文档 v1.0.md:907:* 前端优先读本地 IndexedDB
docs/api/后端接口定义文档 v1.0.md:949:* 可通过 WebSocket 通知对端
docs/api/后端接口定义文档 v1.0.md:1002:      "messageType": "text",
docs/api/后端接口定义文档 v1.0.md:1003:      "payloadType": "encrypted",
docs/api/后端接口定义文档 v1.0.md:1013:* WebSocket 重连后补偿
docs/api/后端接口定义文档 v1.0.md:1051:    "uploadUrl": "https://storage.example.com/xxx",
docs/api/后端接口定义文档 v1.0.md:1052:    "storageKey": "chat/2026/04/06/abc.bin",
docs/api/后端接口定义文档 v1.0.md:1081:  "storageKey": "chat/2026/04/06/abc.bin",
docs/api/后端接口定义文档 v1.0.md:1158:    "luckyColor": "蓝色",
docs/api/后端接口定义文档 v1.0.md:1159:    "luckyDirection": "东南",
docs/api/后端接口定义文档 v1.0.md:1193:# 14. WebSocket 协议补充说明
docs/api/后端接口定义文档 v1.0.md:1195:虽然你要求的是后端接口文档，但消息实时发送核心走 WebSocket，这里做最小补充。
docs/api/后端接口定义文档 v1.0.md:1222:    "messageType": "text",
docs/api/后端接口定义文档 v1.0.md:1223:    "payloadType": "encrypted",
docs/api/后端接口定义文档 v1.0.md:1243:    "messageType": "text",
docs/api/后端接口定义文档 v1.0.md:1244:    "payloadType": "encrypted",
docs/api/后端接口定义文档 v1.0.md:1399:* WebSocket 消息发送（以 `messageId` 幂等）
docs/api/后端接口定义文档 v1.0.md:1430:* PIN 校验
docs/api/后端接口定义文档 v1.0.md:1432:* IndexedDB 密文存储
frontend/src/utils/index.ts:72:    messageType: "text",
frontend/src/utils/index.ts:78:  return message.messageType === "text" ? "[文本消息]" : "[消息]";
frontend/src/api/client.ts:45:    messageType: string;
frontend/src/api/client.ts:90:    messageType: message.messageType,
frontend/src/api/client.ts:97:    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
frontend/src/api/client.ts:105:  window.localStorage.setItem(
frontend/src/api/client.ts:115:  window.localStorage.removeItem(AUTH_STORAGE_KEY);
frontend/src/api/client.ts:175:    luckyColor: "蓝色",
frontend/src/api/client.ts:176:    luckyDirection: "东南",
frontend/src/api/client.ts:291:        messageType: "text",
frontend/src/api/client.ts:292:        payloadType: "text",
frontend/src/api/client.ts:302:export function createChatWebSocket(accessToken: string): WebSocket {
frontend/src/api/client.ts:306:  return new WebSocket(url);
frontend/src/crypto/index.ts:15:async function deriveKey(pin: string): Promise<CryptoKey> {
frontend/src/crypto/index.ts:16:  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(pin));
frontend/src/crypto/index.ts:25:export async function encryptString(pin: string, value: string): Promise<string> {
frontend/src/crypto/index.ts:26:  const key = await deriveKey(pin);
frontend/src/crypto/index.ts:39:export async function decryptString(pin: string, encryptedValue: string): Promise<string> {
frontend/src/crypto/index.ts:40:  const key = await deriveKey(pin);
backend/src/main/java/com/hidechat/websocket/handler/ChatWebSocketHandler.java:12:import com.hidechat.websocket.dto.WebSocketMessageDTO;
backend/src/main/java/com/hidechat/websocket/handler/ChatWebSocketHandler.java:14:import com.hidechat.websocket.session.WebSocketSessionRegistry;
backend/src/main/java/com/hidechat/websocket/handler/ChatWebSocketHandler.java:25:import org.springframework.web.socket.WebSocketSession;
backend/src/main/java/com/hidechat/websocket/handler/ChatWebSocketHandler.java:26:import org.springframework.web.socket.handler.TextWebSocketHandler;
backend/src/main/java/com/hidechat/websocket/handler/ChatWebSocketHandler.java:29:public class ChatWebSocketHandler extends TextWebSocketHandler {
backend/src/main/java/com/hidechat/websocket/handler/ChatWebSocketHandler.java:34:    private final WebSocketSessionRegistry sessionRegistry;
backend/src/main/java/com/hidechat/websocket/handler/ChatWebSocketHandler.java:37:    public ChatWebSocketHandler(ObjectMapper objectMapper,
backend/src/main/java/com/hidechat/websocket/handler/ChatWebSocketHandler.java:40:                                WebSocketSessionRegistry sessionRegistry,
backend/src/main/java/com/hidechat/websocket/handler/ChatWebSocketHandler.java:50:    public void afterConnectionEstablished(WebSocketSession session) {
backend/src/main/java/com/hidechat/websocket/handler/ChatWebSocketHandler.java:58:    public void handleTextMessage(WebSocketSession session, TextMessage message) throws IOException {
backend/src/main/java/com/hidechat/websocket/handler/ChatWebSocketHandler.java:59:        WebSocketMessageDTO wsMessage = objectMapper.readValue(message.getPayload(), WebSocketMessageDTO.class);
backend/src/main/java/com/hidechat/websocket/handler/ChatWebSocketHandler.java:71:    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
backend/src/main/java/com/hidechat/websocket/handler/ChatWebSocketHandler.java:78:    private void handleChatSend(WebSocketSession senderSession,
backend/src/main/java/com/hidechat/websocket/handler/ChatWebSocketHandler.java:80:                                WebSocketMessageDTO wsMessage) throws IOException {
backend/src/main/java/com/hidechat/websocket/handler/ChatWebSocketHandler.java:87:        WebSocketSession receiverSession = sessionRegistry.get(sentMessage.getReceiverUid());
backend/src/main/java/com/hidechat/websocket/handler/ChatWebSocketHandler.java:93:    private void handleChatRead(String readerUid, WebSocketMessageDTO wsMessage) throws IOException {
backend/src/main/java/com/hidechat/websocket/handler/ChatWebSocketHandler.java:100:        WebSocketSession peerSession = sessionRegistry.get(peerUid);
backend/src/main/java/com/hidechat/websocket/handler/ChatWebSocketHandler.java:130:    private void send(WebSocketSession session, String payload) throws IOException {
backend/src/main/java/com/hidechat/websocket/handler/ChatWebSocketHandler.java:134:    private String getUserUid(WebSocketSession session) {
frontend/src/app/app.css:87:.pin-card {
frontend/src/app/app.css:141:.pin-card label {
frontend/src/app/app.css:147:.pin-card input,
frontend/src/app/app.css:159:.pin-card button,
frontend/src/app/app.css:172:.pin-card button,
frontend/src/app/app.css:181:.pin-card button:hover,
frontend/src/components/README.md:3:Reusable UI components belong here. Do not place crypto or IndexedDB logic in UI components.
frontend/src/types/index.ts:15:  pin?: string;
frontend/src/types/index.ts:16:  pinHash: string;
frontend/src/types/index.ts:44:  messageType: string;
frontend/src/types/index.ts:51:  luckyColor: string;
frontend/src/types/index.ts:52:  luckyDirection: string;
backend/src/main/java/com/hidechat/websocket/security/JwtHandshakeInterceptor.java:15:import org.springframework.web.socket.WebSocketHandler;
backend/src/main/java/com/hidechat/websocket/security/JwtHandshakeInterceptor.java:32:                                   WebSocketHandler wsHandler,
backend/src/main/java/com/hidechat/websocket/security/JwtHandshakeInterceptor.java:56:                               WebSocketHandler wsHandler,
backend/src/main/java/com/hidechat/modules/contact/vo/ContactItemVO.java:14:    private Boolean pinned;
backend/src/main/java/com/hidechat/websocket/dto/WebSocketMessageDTO.java:9:public class WebSocketMessageDTO {
backend/src/main/java/com/hidechat/persistence/entity/ImMessageEntity.java:18:    private String messageType;
backend/src/main/java/com/hidechat/persistence/entity/ImMessageEntity.java:19:    private String payloadType;
backend/src/main/java/com/hidechat/persistence/entity/ImContactEntity.java:17:    private Boolean pinned;
backend/src/main/java/com/hidechat/websocket/session/WebSocketSessionRegistry.java:6:import org.springframework.web.socket.WebSocketSession;
backend/src/main/java/com/hidechat/websocket/session/WebSocketSessionRegistry.java:9:public class WebSocketSessionRegistry {
backend/src/main/java/com/hidechat/websocket/session/WebSocketSessionRegistry.java:11:    private final Map<String, WebSocketSession> sessionByUserUid = new ConcurrentHashMap<>();
backend/src/main/java/com/hidechat/websocket/session/WebSocketSessionRegistry.java:13:    public void put(String userUid, WebSocketSession session) {
backend/src/main/java/com/hidechat/websocket/session/WebSocketSessionRegistry.java:17:    public WebSocketSession get(String userUid) {
backend/src/main/java/com/hidechat/websocket/config/WebSocketConfig.java:3:import com.hidechat.websocket.handler.ChatWebSocketHandler;
backend/src/main/java/com/hidechat/websocket/config/WebSocketConfig.java:6:import org.springframework.web.socket.config.annotation.EnableWebSocket;
backend/src/main/java/com/hidechat/websocket/config/WebSocketConfig.java:7:import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
backend/src/main/java/com/hidechat/websocket/config/WebSocketConfig.java:8:import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;
backend/src/main/java/com/hidechat/websocket/config/WebSocketConfig.java:11:@EnableWebSocket
backend/src/main/java/com/hidechat/websocket/config/WebSocketConfig.java:12:public class WebSocketConfig implements WebSocketConfigurer {
backend/src/main/java/com/hidechat/websocket/config/WebSocketConfig.java:14:    private final ChatWebSocketHandler chatWebSocketHandler;
backend/src/main/java/com/hidechat/websocket/config/WebSocketConfig.java:17:    public WebSocketConfig(ChatWebSocketHandler chatWebSocketHandler,
backend/src/main/java/com/hidechat/websocket/config/WebSocketConfig.java:19:        this.chatWebSocketHandler = chatWebSocketHandler;
backend/src/main/java/com/hidechat/websocket/config/WebSocketConfig.java:24:    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
backend/src/main/java/com/hidechat/websocket/config/WebSocketConfig.java:25:        registry.addHandler(chatWebSocketHandler, "/ws/chat")
frontend/src/app/App.tsx:7:  createChatWebSocket,
frontend/src/app/App.tsx:21:import { loadCachedConversation, saveCachedConversation } from "../storage";
frontend/src/app/App.tsx:60:  const [luckyCodeInput, setLuckyCodeInput] = useState("");
frontend/src/app/App.tsx:61:  const [pinInput, setPinInput] = useState("");
frontend/src/app/App.tsx:62:  const [luckyCodeHash, setLuckyCodeHash] = useState("");
frontend/src/app/App.tsx:80:  const wsRef = useRef<WebSocket | null>(null);
frontend/src/app/App.tsx:96:    if (!session?.pin || screen !== "chat") {
frontend/src/app/App.tsx:99:    const pin = session.pin;
frontend/src/app/App.tsx:103:        const encryptedPayload = await encryptString(pin, JSON.stringify(items));
frontend/src/app/App.tsx:115:      closeWebSocket();
frontend/src/app/App.tsx:119:    const socket = createChatWebSocket(session.tokens.accessToken);
frontend/src/app/App.tsx:163:    const inputHash = await sha256Hex(luckyCodeInput.trim());
frontend/src/app/App.tsx:164:    if (inputHash !== luckyCodeHash) {
frontend/src/app/App.tsx:169:    if (!session?.pinHash) {
frontend/src/app/App.tsx:170:      setStatusText("幸运数字通过，先登录或注册，再设置 PIN 用于本地加密缓存。");
frontend/src/app/App.tsx:172:      setStatusText("幸运数字通过，请输入 PIN 解锁本地加密消息。");
frontend/src/app/App.tsx:178:    const trimmedPin = pinInput.trim();
frontend/src/app/App.tsx:180:      setStatusText("PIN 不能为空。");
frontend/src/app/App.tsx:183:    if (!session?.pinHash) {
frontend/src/app/App.tsx:184:      setStatusText("请先完成登录或注册，再设置 PIN。");
frontend/src/app/App.tsx:189:    if (candidateHash !== session.pinHash) {
frontend/src/app/App.tsx:190:      setStatusText("PIN 不正确，仍停留在伪装入口。");
frontend/src/app/App.tsx:209:    setSession((prev) => (prev ? { ...prev, pin: trimmedPin } : prev));
frontend/src/app/App.tsx:210:    setStatusText("PIN 校验通过，已恢复隐藏聊天界面。");
frontend/src/app/App.tsx:234:      setStatusText("已连接后端账号，请继续设置或输入 PIN。");
frontend/src/app/App.tsx:240:          pin: prev?.pin,
frontend/src/app/App.tsx:241:          pinHash: prev?.pinHash ?? "",
frontend/src/app/App.tsx:244:        setStatusText("后端不可用，已回退到本地演示模式。继续设置 PIN 即可进入聊天。");
frontend/src/app/App.tsx:266:    const trimmedPin = pinInput.trim();
frontend/src/app/App.tsx:272:      setStatusText("PIN 不能为空。");
frontend/src/app/App.tsx:275:    const pinHash = await sha256Hex(trimmedPin);
frontend/src/app/App.tsx:276:    setSession((prev) => (prev ? { ...prev, pin: trimmedPin, pinHash } : prev));
frontend/src/app/App.tsx:277:    setStatusText("PIN 已设置，本地缓存会以加密形式写入 IndexedDB。");
frontend/src/app/App.tsx:332:    if (socket && socket.readyState === WebSocket.OPEN) {
frontend/src/app/App.tsx:339:            messageType: "text",
frontend/src/app/App.tsx:340:            payloadType: "text",
frontend/src/app/App.tsx:347:      setStatusText("消息已通过 WebSocket 发出。");
frontend/src/app/App.tsx:412:    closeWebSocket();
frontend/src/app/App.tsx:418:  function closeWebSocket() {
frontend/src/app/App.tsx:429:      pin: prev?.pin,
frontend/src/app/App.tsx:430:      pinHash: prev?.pinHash ?? "",
frontend/src/app/App.tsx:452:          伪装入口、PIN 解锁、联系人、会话、文本消息和 WebSocket 实时收消息都在这一页闭合。
frontend/src/app/App.tsx:466:                <strong>{fortune?.luckyColor ?? "蓝色"}</strong>
frontend/src/app/App.tsx:470:                <strong>{fortune?.luckyDirection ?? "东南"}</strong>
frontend/src/app/App.tsx:480:            <label htmlFor="lucky-code">幸运数字</label>
frontend/src/app/App.tsx:482:              id="lucky-code"
frontend/src/app/App.tsx:483:              value={luckyCodeInput}
frontend/src/app/App.tsx:551:          <div className="pin-card">
frontend/src/app/App.tsx:552:            <label htmlFor="pin-input">PIN 解锁</label>
frontend/src/app/App.tsx:554:              id="pin-input"
frontend/src/app/App.tsx:556:              value={pinInput}
frontend/src/app/App.tsx:558:              placeholder={session?.pinHash ? "输入已有 PIN" : "设置一个新的 PIN"}
frontend/src/app/App.tsx:562:              onClick={() => void (session?.pinHash ? handlePinContinue() : handleSetPinAndEnter())}
frontend/src/app/App.tsx:564:              {session?.pinHash ? "解锁消息缓存" : "设置 PIN 并继续"}
frontend/src/app/App.tsx:704:    messageType: String(raw.messageType ?? "text"),
backend/src/main/java/com/hidechat/modules/contact/controller/ContactController.java:11:import org.springframework.web.bind.annotation.GetMapping;
backend/src/main/java/com/hidechat/modules/contact/controller/ContactController.java:12:import org.springframework.web.bind.annotation.PostMapping;
backend/src/main/java/com/hidechat/modules/contact/controller/ContactController.java:14:import org.springframework.web.bind.annotation.RequestMapping;
backend/src/main/java/com/hidechat/modules/contact/controller/ContactController.java:18:@RequestMapping("/api/contact")
backend/src/main/java/com/hidechat/modules/contact/controller/ContactController.java:25:    @PostMapping("/add")
backend/src/main/java/com/hidechat/modules/contact/controller/ContactController.java:31:    @GetMapping("/list")
backend/src/main/java/com/hidechat/persistence/entity/ImFileEntity.java:19:    private String storageKey;
backend/src/main/java/com/hidechat/modules/conversation/vo/ConversationItemVO.java:19:    private Boolean pinned;
backend/src/main/java/com/hidechat/modules/message/vo/MessageItemVO.java:14:    private String messageType;
backend/src/main/java/com/hidechat/modules/message/vo/MessageItemVO.java:15:    private String payloadType;
backend/src/main/java/com/hidechat/modules/system/vo/FortuneTodayVO.java:12:    private String luckyColor;
backend/src/main/java/com/hidechat/modules/system/vo/FortuneTodayVO.java:13:    private String luckyDirection;
backend/src/main/java/com/hidechat/modules/conversation/controller/ConversationController.java:12:import org.springframework.web.bind.annotation.GetMapping;
backend/src/main/java/com/hidechat/modules/conversation/controller/ConversationController.java:13:import org.springframework.web.bind.annotation.PostMapping;
backend/src/main/java/com/hidechat/modules/conversation/controller/ConversationController.java:15:import org.springframework.web.bind.annotation.RequestMapping;
backend/src/main/java/com/hidechat/modules/conversation/controller/ConversationController.java:19:@RequestMapping("/api/conversation")
backend/src/main/java/com/hidechat/modules/conversation/controller/ConversationController.java:26:    @PostMapping("/single")
backend/src/main/java/com/hidechat/modules/conversation/controller/ConversationController.java:34:    @GetMapping("/list")
backend/src/main/java/com/hidechat/modules/conversation/controller/ConversationController.java:39:    @PostMapping("/clear-unread")
backend/src/main/java/com/hidechat/modules/message/dto/SendMessageRequest.java:20:    private String messageType;
backend/src/main/java/com/hidechat/modules/message/dto/SendMessageRequest.java:23:    private String payloadType;
backend/src/main/java/com/hidechat/modules/file/vo/FileUploadSignVO.java:13:    private String storageKey;
backend/src/main/java/com/hidechat/modules/system/controller/SystemController.java:8:import org.springframework.web.bind.annotation.GetMapping;
backend/src/main/java/com/hidechat/modules/system/controller/SystemController.java:9:import org.springframework.web.bind.annotation.RequestMapping;
backend/src/main/java/com/hidechat/modules/system/controller/SystemController.java:13:@RequestMapping("/api/system")
backend/src/main/java/com/hidechat/modules/system/controller/SystemController.java:19:    @GetMapping("/fortune/today")
backend/src/main/java/com/hidechat/modules/system/controller/SystemController.java:24:    @GetMapping("/disguise-config")
backend/src/main/java/com/hidechat/modules/message/controller/MessageController.java:12:import org.springframework.web.bind.annotation.GetMapping;
backend/src/main/java/com/hidechat/modules/message/controller/MessageController.java:13:import org.springframework.web.bind.annotation.PostMapping;
backend/src/main/java/com/hidechat/modules/message/controller/MessageController.java:15:import org.springframework.web.bind.annotation.RequestMapping;
backend/src/main/java/com/hidechat/modules/message/controller/MessageController.java:20:@RequestMapping("/api/message")
backend/src/main/java/com/hidechat/modules/message/controller/MessageController.java:27:    @PostMapping("/send")
backend/src/main/java/com/hidechat/modules/message/controller/MessageController.java:32:    @GetMapping("/history")
backend/src/main/java/com/hidechat/modules/message/controller/MessageController.java:44:    @PostMapping("/read")
backend/src/main/java/com/hidechat/modules/user/controller/UserController.java:10:import org.springframework.web.bind.annotation.GetMapping;
backend/src/main/java/com/hidechat/modules/user/controller/UserController.java:11:import org.springframework.web.bind.annotation.PutMapping;
backend/src/main/java/com/hidechat/modules/user/controller/UserController.java:13:import org.springframework.web.bind.annotation.RequestMapping;
backend/src/main/java/com/hidechat/modules/user/controller/UserController.java:17:@RequestMapping("/api/user")
backend/src/main/java/com/hidechat/modules/user/controller/UserController.java:24:    @GetMapping("/me")
backend/src/main/java/com/hidechat/modules/user/controller/UserController.java:30:    @PutMapping("/profile")
backend/src/main/java/com/hidechat/modules/file/controller/FileController.java:12:import org.springframework.web.bind.annotation.GetMapping;
backend/src/main/java/com/hidechat/modules/file/controller/FileController.java:14:import org.springframework.web.bind.annotation.PostMapping;
backend/src/main/java/com/hidechat/modules/file/controller/FileController.java:16:import org.springframework.web.bind.annotation.RequestMapping;
backend/src/main/java/com/hidechat/modules/file/controller/FileController.java:20:@RequestMapping("/api/file")
backend/src/main/java/com/hidechat/modules/file/controller/FileController.java:27:    @PostMapping("/upload-sign")
backend/src/main/java/com/hidechat/modules/file/controller/FileController.java:32:    @PostMapping("/complete")
backend/src/main/java/com/hidechat/modules/file/controller/FileController.java:37:    @GetMapping("/{fileId}")
backend/src/main/java/com/hidechat/modules/file/dto/CompleteFileUploadRequest.java:16:    private String storageKey;
backend/src/main/java/com/hidechat/modules/file/service/impl/FileServiceImpl.java:26:    private static final String STORAGE_UPLOAD_BASE_URL = "https://storage.example.com/upload/";
backend/src/main/java/com/hidechat/modules/file/service/impl/FileServiceImpl.java:50:        String storageKey = buildStorageKey(fileId);
backend/src/main/java/com/hidechat/modules/file/service/impl/FileServiceImpl.java:59:        entity.setStorageKey(storageKey);
backend/src/main/java/com/hidechat/modules/file/service/impl/FileServiceImpl.java:66:        vo.setStorageKey(storageKey);
backend/src/main/java/com/hidechat/modules/file/service/impl/FileServiceImpl.java:67:        vo.setUploadUrl(STORAGE_UPLOAD_BASE_URL + storageKey);
backend/src/main/java/com/hidechat/modules/file/service/impl/FileServiceImpl.java:78:            throw new BusinessException(420301, "storageKey 不匹配");
backend/src/main/java/com/hidechat/modules/file/service/impl/FileServiceImpl.java:130:    private String buildAccessUrl(String storageKey) {
backend/src/main/java/com/hidechat/modules/file/service/impl/FileServiceImpl.java:131:        return STORAGE_ACCESS_BASE_URL + storageKey;
backend/src/main/java/com/hidechat/modules/message/service/impl/MessageServiceImpl.java:317:    private String buildPreview(String messageType) {
backend/src/main/java/com/hidechat/modules/message/service/impl/MessageServiceImpl.java:318:        return switch (messageType) {
backend/src/main/java/com/hidechat/modules/auth/controller/AuthController.java:17:import org.springframework.web.bind.annotation.PostMapping;
backend/src/main/java/com/hidechat/modules/auth/controller/AuthController.java:19:import org.springframework.web.bind.annotation.RequestMapping;
backend/src/main/java/com/hidechat/modules/auth/controller/AuthController.java:23:@RequestMapping("/api/auth")
backend/src/main/java/com/hidechat/modules/auth/controller/AuthController.java:29:    @PostMapping("/email/send-code")
backend/src/main/java/com/hidechat/modules/auth/controller/AuthController.java:35:    @PostMapping("/email/register")
backend/src/main/java/com/hidechat/modules/auth/controller/AuthController.java:40:    @PostMapping("/email/password-login")
backend/src/main/java/com/hidechat/modules/auth/controller/AuthController.java:45:    @PostMapping("/email/code-login")
backend/src/main/java/com/hidechat/modules/auth/controller/AuthController.java:50:    @PostMapping("/email/reset-password")
backend/src/main/java/com/hidechat/modules/auth/controller/AuthController.java:56:    @PostMapping("/refresh-token")
backend/src/main/java/com/hidechat/modules/auth/controller/AuthController.java:61:    @PostMapping("/logout")

codex
关键风险已经浮现出来了：不仅有“未实现”，还存在几处会直接阻断联调或违反文档/安全边界的现状。我再核实消息 DTO、VO 和前端存储实现的细节，然后整理成阻塞项和阶段计划。
exec
/bin/bash -lc "sed -n '1,220p' backend/src/main/java/com/hidechat/modules/message/dto/SendMessageRequest.java" in /home/reader/HideChat
 succeeded in 0ms:
package com.hidechat.modules.message.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SendMessageRequest {

    private String messageId;

    @NotBlank
    private String conversationId;

    @NotBlank
    private String receiverUid;

    @NotBlank
    private String messageType;

    @NotBlank
    private String payloadType;

    private String payload;

    private String fileId;

    private Long clientMsgTime;
}

exec
/bin/bash -lc "sed -n '1,220p' backend/src/main/java/com/hidechat/modules/message/vo/MessageItemVO.java" in /home/reader/HideChat
 succeeded in 0ms:
package com.hidechat.modules.message.vo;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class MessageItemVO {

    private String messageId;
    private String conversationId;
    private String senderUid;
    private String receiverUid;
    private String messageType;
    private String payloadType;
    private String payload;
    private String fileId;
    private Long clientMsgTime;
    private Long serverMsgTime;
    private String serverStatus;
}

exec
/bin/bash -lc "sed -n '1,220p' backend/src/main/java/com/hidechat/modules/conversation/vo/ConversationItemVO.java" in /home/reader/HideChat
 succeeded in 0ms:
package com.hidechat.modules.conversation.vo;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ConversationItemVO {

    private String conversationId;
    private String peerUid;
    private String peerNickname;
    private String peerAvatar;
    private String remarkName;
    private String lastMessagePreview;
    private String lastMessageType;
    private Long lastMessageAt;
    private Integer unreadCount;
    private Boolean pinned;
}

exec
/bin/bash -lc "sed -n '1,220p' frontend/src/crypto/index.ts" in /home/reader/HideChat
 succeeded in 0ms:
function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function toBase64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes));
}

function fromBase64(value: string): Uint8Array {
  return Uint8Array.from(atob(value), (char) => char.charCodeAt(0));
}

async function deriveKey(pin: string): Promise<CryptoKey> {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(pin));
  return crypto.subtle.importKey("raw", hash, "AES-GCM", false, ["encrypt", "decrypt"]);
}

export async function sha256Hex(value: string): Promise<string> {
  const buffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return toHex(buffer);
}

export async function encryptString(pin: string, value: string): Promise<string> {
  const key = await deriveKey(pin);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(value)
  );
  const payload = new Uint8Array(iv.length + ciphertext.byteLength);
  payload.set(iv, 0);
  payload.set(new Uint8Array(ciphertext), iv.length);
  return toBase64(payload);
}

export async function decryptString(pin: string, encryptedValue: string): Promise<string> {
  const key = await deriveKey(pin);
  const payload = fromBase64(encryptedValue);
  const iv = payload.slice(0, 12);
  const data = payload.slice(12);
  const plainBuffer = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, data);
  return new TextDecoder().decode(plainBuffer);
}

exec
/bin/bash -lc "nl -ba frontend/src/api/client.ts | sed -n '210,245p'" in /home/reader/HideChat
 succeeded in 0ms:
   210	  password: string;
   211	}): Promise<{ tokens: AuthTokens; user: LocalUser }> {
   212	  const token = await requestJson<AuthTokenResponse>("/auth/email/password-login", {
   213	    method: "POST",
   214	    body: JSON.stringify(input)
   215	  });
   216	  const tokens = mapTokenResponse(token);
   217	  saveStoredAuthState(tokens);
   218	  return {
   219	    tokens,
   220	    user: mapUserInfoToLocalUser(token.userInfo, input.email)
   221	  };
   222	}
   223	
   224	export async function fetchCurrentUser(): Promise<LocalUser> {
   225	  return requestJson<LocalUser>("/user/me", { method: "GET" }, true);
   226	}
   227	
   228	export async function listContacts(): Promise<ContactItem[]> {
   229	  return requestJson<ContactItem[]>("/contact/list", { method: "GET" }, true);
   230	}
   231	
   232	export async function addContact(peerUid: string, remarkName: string): Promise<void> {
   233	  await requestJson<void>(
   234	    "/contact/add",
   235	    {
   236	      method: "POST",
   237	      body: JSON.stringify({ peerUid, remarkName })
   238	    },
   239	    true
   240	  );
   241	}
   242	
   243	export async function listConversations(): Promise<ConversationItem[]> {
   244	  return requestJson<ConversationItem[]>("/conversation/list", { method: "GET" }, true);
   245	}

exec
/bin/bash -lc "nl -ba frontend/src/app/App.tsx | sed -n '325,345p'" in /home/reader/HideChat
 succeeded in 0ms:
   325	    const optimisticMessage = createMessage({
   326	      conversationId: activeConversation.conversationId,
   327	      senderUid: session.user.userUid,
   328	      receiverUid: activeConversation.peerUid,
   329	      payload
   330	    });
   331	
   332	    if (socket && socket.readyState === WebSocket.OPEN) {
   333	      socket.send(
   334	        JSON.stringify({
   335	          type: "CHAT_SEND",
   336	          data: {
   337	            conversationId: activeConversation.conversationId,
   338	            receiverUid: activeConversation.peerUid,
   339	            messageType: "text",
   340	            payloadType: "text",
   341	            payload,
   342	            clientMsgTime: optimisticMessage.serverMsgTime
   343	          }
   344	        })
   345	      );

exec
/bin/bash -lc 'nl -ba backend/src/main/java/com/hidechat/modules/auth/service/impl/LoggingEmailCodeSender.java' in /home/reader/HideChat
 succeeded in 0ms:
     1	package com.hidechat.modules.auth.service.impl;
     2	
     3	import com.hidechat.modules.auth.service.EmailCodeSender;
     4	import lombok.extern.slf4j.Slf4j;
     5	import org.springframework.stereotype.Component;
     6	
     7	@Slf4j
     8	@Component
     9	public class LoggingEmailCodeSender implements EmailCodeSender {
    10	
    11	    @Override
    12	    public void send(String email, String bizType, String code) {
    13	        log.info("Email code generated for email={}, bizType={}, code={}", email, bizType, code);
    14	    }
    15	}

exec
/bin/bash -lc "nl -ba backend/src/main/java/com/hidechat/modules/message/service/impl/MessageServiceImpl.java | sed -n '70,95p'" in /home/reader/HideChat
 succeeded in 0ms:
    70	        ImConversationEntity conversation = requireConversationMember(request.getConversationId(), userUid);
    71	        String peerUid = resolvePeerUid(conversation, userUid);
    72	        if (!Objects.equals(peerUid, request.getReceiverUid())) {
    73	            throw new BusinessException(420201, "接收方不属于当前会话");
    74	        }
    75	        validateMessageRequest(request);
    76	
    77	        LocalDateTime now = LocalDateTime.now(clock);
    78	        ImMessageEntity entity = new ImMessageEntity();
    79	        entity.setId(idGenerator.nextId());
    80	        entity.setMessageId(StringUtils.hasText(request.getMessageId())
    81	            ? request.getMessageId()
    82	            : randomValueGenerator.messageId());
    83	        entity.setConversationId(request.getConversationId());
    84	        entity.setSenderUid(userUid);
    85	        entity.setReceiverUid(request.getReceiverUid());
    86	        entity.setMessageType(request.getMessageType());
    87	        entity.setPayloadType(request.getPayloadType());
    88	        entity.setPayload(request.getPayload());
    89	        entity.setFileId(request.getFileId());
    90	        entity.setServerStatus("delivered");
    91	        entity.setClientMsgTime(request.getClientMsgTime());
    92	        entity.setServerMsgTime(now);
    93	        entity.setDeleted(Boolean.FALSE);
    94	        messageMapper.insert(entity);
    95	

exec
/bin/bash -lc "nl -ba backend/src/main/java/com/hidechat/modules/message/service/impl/MessageServiceImpl.java | sed -n '150,170p'" in /home/reader/HideChat
 succeeded in 0ms:
   150	            for (ImMessageEntity message : messages) {
   151	                upsertReadReceipt(userUid, message.getMessageId(), now);
   152	                if (!Objects.equals("read", message.getServerStatus())) {
   153	                    message.setServerStatus("read");
   154	                    messageMapper.updateById(message);
   155	                }
   156	            }
   157	        }
   158	        refreshUnreadCounter(userUid, request.getConversationId(), LocalDateTime.now(clock));
   159	    }
   160	
   161	    private void validateMessageRequest(SendMessageRequest request) {
   162	        if (!List.of("text", "image", "system").contains(request.getMessageType())) {
   163	            throw new BusinessException(400001, "消息类型不支持");
   164	        }
   165	        if (!List.of("plain", "ref", "encrypted").contains(request.getPayloadType())) {
   166	            throw new BusinessException(400001, "消息负载类型不支持");
   167	        }
   168	        if ("image".equals(request.getMessageType()) && !StringUtils.hasText(request.getFileId())) {
   169	            throw new BusinessException(400001, "图片消息必须关联文件");
   170	        }

exec
/bin/bash -lc 'nl -ba frontend/src/crypto/index.ts' in /home/reader/HideChat
 succeeded in 0ms:
     1	function toHex(buffer: ArrayBuffer): string {
     2	  return Array.from(new Uint8Array(buffer))
     3	    .map((byte) => byte.toString(16).padStart(2, "0"))
     4	    .join("");
     5	}
     6	
     7	function toBase64(bytes: Uint8Array): string {
     8	  return btoa(String.fromCharCode(...bytes));
     9	}
    10	
    11	function fromBase64(value: string): Uint8Array {
    12	  return Uint8Array.from(atob(value), (char) => char.charCodeAt(0));
    13	}
    14	
    15	async function deriveKey(pin: string): Promise<CryptoKey> {
    16	  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(pin));
    17	  return crypto.subtle.importKey("raw", hash, "AES-GCM", false, ["encrypt", "decrypt"]);
    18	}
    19	
    20	export async function sha256Hex(value: string): Promise<string> {
    21	  const buffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
    22	  return toHex(buffer);
    23	}
    24	
    25	export async function encryptString(pin: string, value: string): Promise<string> {
    26	  const key = await deriveKey(pin);
    27	  const iv = crypto.getRandomValues(new Uint8Array(12));
    28	  const ciphertext = await crypto.subtle.encrypt(
    29	    { name: "AES-GCM", iv },
    30	    key,
    31	    new TextEncoder().encode(value)
    32	  );
    33	  const payload = new Uint8Array(iv.length + ciphertext.byteLength);
    34	  payload.set(iv, 0);
    35	  payload.set(new Uint8Array(ciphertext), iv.length);
    36	  return toBase64(payload);
    37	}
    38	
    39	export async function decryptString(pin: string, encryptedValue: string): Promise<string> {
    40	  const key = await deriveKey(pin);
    41	  const payload = fromBase64(encryptedValue);
    42	  const iv = payload.slice(0, 12);
    43	  const data = payload.slice(12);
    44	  const plainBuffer = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, data);
    45	  return new TextDecoder().decode(plainBuffer);
    46	}

exec
/bin/bash -lc "nl -ba frontend/src/app/App.tsx | sed -n '1,90p'" in /home/reader/HideChat
 succeeded in 0ms:
     1	import { useEffect, useRef, useState } from "react";
     2	import {
     3	  ApiError,
     4	  addContact,
     5	  clearConversationUnread,
     6	  clearStoredAuthState,
     7	  createChatWebSocket,
     8	  createSingleConversation,
     9	  fetchCurrentUser,
    10	  fetchDisguiseConfig,
    11	  fetchTodayFortune,
    12	  listContacts,
    13	  listConversations,
    14	  listMessageHistory,
    15	  loginByPassword,
    16	  registerByEmail,
    17	  sendEmailCode,
    18	  sendMessage
    19	} from "../api/client";
    20	import { decryptString, encryptString, sha256Hex } from "../crypto";
    21	import { loadCachedConversation, saveCachedConversation } from "../storage";
    22	import type {
    23	  ChatMessage,
    24	  ContactItem,
    25	  ConversationItem,
    26	  HiddenSession,
    27	  LocalUser
    28	} from "../types";
    29	import {
    30	  buildMessagePreview,
    31	  createDemoContacts,
    32	  createDemoConversations,
    33	  createDemoMessages,
    34	  createMessage
    35	} from "../utils";
    36	import "./app.css";
    37	
    38	const DEMO_LUCKY_CODE = "2468";
    39	
    40	type Screen = "disguise" | "auth" | "chat";
    41	type AuthMode = "login" | "register";
    42	
    43	interface WsEnvelope {
    44	  type: string;
    45	  data: unknown;
    46	}
    47	
    48	interface AuthFormState {
    49	  email: string;
    50	  nickname: string;
    51	  password: string;
    52	  emailCode: string;
    53	}
    54	
    55	export function App() {
    56	  const [screen, setScreen] = useState<Screen>("disguise");
    57	  const [authMode, setAuthMode] = useState<AuthMode>("login");
    58	  const [fortune, setFortune] = useState<Awaited<ReturnType<typeof fetchTodayFortune>> | null>(null);
    59	  const [config, setConfig] = useState<Awaited<ReturnType<typeof fetchDisguiseConfig>> | null>(null);
    60	  const [luckyCodeInput, setLuckyCodeInput] = useState("");
    61	  const [pinInput, setPinInput] = useState("");
    62	  const [luckyCodeHash, setLuckyCodeHash] = useState("");
    63	  const [session, setSession] = useState<HiddenSession | null>(null);
    64	  const [contacts, setContacts] = useState<ContactItem[]>(createDemoContacts());
    65	  const [conversations, setConversations] = useState<ConversationItem[]>(createDemoConversations());
    66	  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>(createDemoMessages());
    67	  const [activeConversationId, setActiveConversationId] = useState<string>("c_demo_1");
    68	  const [composer, setComposer] = useState("");
    69	  const [statusText, setStatusText] = useState("运势页已加载，输入幸运数字进入隐藏入口。");
    70	  const [authLoading, setAuthLoading] = useState(false);
    71	  const [sendCodeLoading, setSendCodeLoading] = useState(false);
    72	  const [contactForm, setContactForm] = useState({ peerUid: "", remarkName: "" });
    73	  const [authForm, setAuthForm] = useState<AuthFormState>({
    74	    email: "demo@hide.chat",
    75	    nickname: "Reader",
    76	    password: "reader123",
    77	    emailCode: ""
    78	  });
    79	
    80	  const wsRef = useRef<WebSocket | null>(null);
    81	
    82	  useEffect(() => {
    83	    void (async () => {
    84	      const [fortuneData, disguiseData, hash] = await Promise.all([
    85	        fetchTodayFortune(),
    86	        fetchDisguiseConfig(),
    87	        sha256Hex(DEMO_LUCKY_CODE)
    88	      ]);
    89	      setFortune(fortuneData);
    90	      setConfig(disguiseData);

exec
/bin/bash -lc 'nl -ba frontend/src/storage/index.ts' in /home/reader/HideChat
 succeeded in 0ms:
     1	export interface CachedConversationRecord {
     2	  conversationId: string;
     3	  encryptedPayload: string;
     4	  updatedAt: number;
     5	}
     6	
     7	const DB_NAME = "hidechat-local";
     8	const STORE_NAME = "conversation-cache";
     9	
    10	async function openDatabase(): Promise<IDBDatabase> {
    11	  return new Promise((resolve, reject) => {
    12	    const request = indexedDB.open(DB_NAME, 1);
    13	    request.onupgradeneeded = () => {
    14	      const database = request.result;
    15	      if (!database.objectStoreNames.contains(STORE_NAME)) {
    16	        database.createObjectStore(STORE_NAME, { keyPath: "conversationId" });
    17	      }
    18	    };
    19	    request.onsuccess = () => resolve(request.result);
    20	    request.onerror = () => reject(request.error);
    21	  });
    22	}
    23	
    24	export async function saveCachedConversation(record: CachedConversationRecord): Promise<void> {
    25	  const database = await openDatabase();
    26	  await new Promise<void>((resolve, reject) => {
    27	    const transaction = database.transaction(STORE_NAME, "readwrite");
    28	    transaction.objectStore(STORE_NAME).put(record);
    29	    transaction.oncomplete = () => resolve();
    30	    transaction.onerror = () => reject(transaction.error);
    31	  });
    32	}
    33	
    34	export async function loadCachedConversation(conversationId: string): Promise<CachedConversationRecord | null> {
    35	  const database = await openDatabase();
    36	  return new Promise((resolve, reject) => {
    37	    const transaction = database.transaction(STORE_NAME, "readonly");
    38	    const request = transaction.objectStore(STORE_NAME).get(conversationId);
    39	    request.onsuccess = () => resolve((request.result as CachedConversationRecord | undefined) ?? null);
    40	    request.onerror = () => reject(request.error);
    41	  });
    42	}

exec
/bin/bash -lc "nl -ba frontend/src/api/client.ts | sed -n '255,290p'" in /home/reader/HideChat
 succeeded in 0ms:
   255	  );
   256	}
   257	
   258	export async function clearConversationUnread(conversationId: string): Promise<void> {
   259	  await requestJson<void>(
   260	    "/conversation/clear-unread",
   261	    {
   262	      method: "POST",
   263	      body: JSON.stringify({ conversationId })
   264	    },
   265	    true
   266	  );
   267	}
   268	
   269	export async function listMessageHistory(conversationId: string): Promise<ChatMessage[]> {
   270	  const params = new URLSearchParams({
   271	    conversationId,
   272	    pageSize: "50"
   273	  });
   274	  const history = await requestJson<MessageHistoryResponse>(`/message/history?${params.toString()}`, { method: "GET" }, true);
   275	  return history.list.map(mapMessage).sort((left, right) => left.serverMsgTime - right.serverMsgTime);
   276	}
   277	
   278	export async function sendMessage(input: {
   279	  conversationId: string;
   280	  receiverUid: string;
   281	  payload: string;
   282	  clientMsgTime: number;
   283	}): Promise<ChatMessage> {
   284	  const message = await requestJson<MessageHistoryResponse["list"][number]>(
   285	    "/message/send",
   286	    {
   287	      method: "POST",
   288	      body: JSON.stringify({
   289	        conversationId: input.conversationId,
   290	        receiverUid: input.receiverUid,

exec
/bin/bash -lc "nl -ba backend/src/main/java/com/hidechat/modules/file/service/impl/FileServiceImpl.java | sed -n '97,111p'" in /home/reader/HideChat
 succeeded in 0ms:
    97	        if (entity == null) {
    98	            throw new BusinessException(404001, "文件不存在");
    99	        }
   100	        if (!Objects.equals(entity.getUploaderUid(), userUid)) {
   101	            throw new BusinessException(403001, "无权限访问");
   102	        }
   103	        return entity;
   104	    }
   105	
   106	    private void validateUploadRequest(String mimeType, Long fileSize) {
   107	        if (!StringUtils.hasText(mimeType) || !isSupportedMimeType(mimeType)) {
   108	            throw new BusinessException(400001, "文件类型不支持");
   109	        }
   110	        if (fileSize == null || fileSize <= 0) {
   111	            throw new BusinessException(400001, "文件大小不合法");

exec
/bin/bash -lc 'nl -ba frontend/README.md' in /home/reader/HideChat
 succeeded in 0ms:
     1	# Frontend Scaffold
     2	
     3	This directory contains the phase-one frontend skeleton for HideChat.
     4	
     5	Implemented in this phase:
     6	
     7	- Vite + React + TypeScript project shape
     8	- source directories required by `agents.md`
     9	- placeholder files for later module development
    10	- test directory layout placeholders
    11	
    12	Business pages and privacy flows are intentionally not implemented yet.

exec
/bin/bash -lc "nl -ba README.md | sed -n '1,120p'" in /home/reader/HideChat
 succeeded in 0ms:
     1	# HideChat
     2	
     3	HideChat 是一个“伪装入口 + 本地加密缓存 + 1V1 聊天后端”的 Web 隐私聊天项目。仓库内的 `docs/` 给出了完整产品与技术设计，当前代码已经实现可运行的前后端原型、数据库迁移、JWT 鉴权、WebSocket 消息通道，以及一套可执行的单元测试和集成测试。
     4	
     5	当前实现需要和设计文档区分理解：
     6	
     7	- `docs/` 描述的是目标方案与接口边界
     8	- 当前 `frontend/` 已实现单页隐私演示流转，但主要仍是本地演示态
     9	- 当前 `backend/` 已实现大部分 MVP 后端模块，可独立启动并通过测试
    10	
    11	## 仓库结构
    12	
    13	- `docs/`: 产品、技术方案、数据库、接口和测试文档
    14	- `frontend/`: Vite + React + TypeScript 前端
    15	- `backend/`: Spring Boot 3 + MyBatis-Plus + PostgreSQL + Redis 后端
    16	- `scripts/run-backend-integration-tests.sh`: 后端集成测试统一入口
    17	- `HideChatDocs/`: 原始文档镜像
    18	
    19	## 依据设计文档整理的当前已实现功能
    20	
    21	### 1. 伪装入口与系统页
    22	
    23	已实现：
    24	
    25	- 前端首页以“今日运势”作为伪装入口
    26	- 前端会优先请求后端公开接口：
    27	  - `GET /api/system/fortune/today`
    28	  - `GET /api/system/disguise-config`
    29	- 后端 `system` 模块已返回每日运势和伪装配置
    30	- 当前前端在后端不可用时会自动回退到本地默认数据
    31	
    32	当前边界：
    33	
    34	- 设计文档中的“用户自定义幸运数字 + localStorage 持久化 hash”尚未落地
    35	- 当前前端使用内置演示幸运数字 `2468`，并在运行时计算 SHA-256 后校验
    36	
    37	### 2. PIN 解锁与本地加密缓存
    38	
    39	已实现：
    40	
    41	- 前端具备 PIN 设置与 PIN 解锁流程
    42	- 消息缓存写入浏览器 IndexedDB，库名为 `hidechat-local`
    43	- 缓存内容以密文形式保存，解锁后再恢复到页面
    44	- 提供“返回伪装页”能力，能从聊天页退回伪装入口
    45	- 已有前端 E2E 覆盖：
    46	  - 幸运数字进入隐藏入口
    47	  - 设置 PIN
    48	  - 发送消息
    49	  - 验证 IndexedDB 中保存的是密文
    50	  - 返回伪装页后再次用 PIN 解锁
    51	
    52	当前边界：
    53	
    54	- 当前加密实现为 Web Crypto `AES-GCM`，密钥由 `SHA-256(pin)` 派生，和设计文档中建议的 `PBKDF2(pin, salt, 10000)` 不完全一致
    55	- PIN 哈希当前只保存在前端运行时状态中，没有做刷新后持久化
    56	- 自动锁定、标签页切换锁定、错误次数限制等安全策略尚未实现
    57	
    58	### 3. 聊天列表与聊天界面
    59	
    60	已实现：
    61	
    62	- 前端已具备联系人列表、会话列表、消息列表和发送框
    63	- 发送文本消息后会更新会话摘要、联系人最近互动时间，并同步刷新本地密文缓存
    64	- 当前前端演示态内置了示例联系人、会话和消息数据
    65	
    66	当前边界：
    67	
    68	- 前端还没有接入后端的真实登录、联系人、会话、消息和 WebSocket 链路
    69	- 图片消息前端 UI 与实际上传流程尚未接入
    70	- 当前聊天页更接近“隐私流转原型 + 本地缓存验证页”
    71	
    72	### 4. 后端账号与鉴权
    73	
    74	已实现：
    75	
    76	- 邮箱验证码发送：`POST /api/auth/email/send-code`
    77	- 邮箱注册：`POST /api/auth/email/register`
    78	- 邮箱密码登录：`POST /api/auth/email/password-login`
    79	- 邮箱验证码登录：`POST /api/auth/email/code-login`
    80	- 重置密码：`POST /api/auth/email/reset-password`
    81	- 刷新令牌：`POST /api/auth/refresh-token`
    82	- 登出：`POST /api/auth/logout`
    83	- JWT 鉴权过滤器、Access Token / Refresh Token 机制
    84	- 验证码、Refresh Token、用户认证信息均已落库
    85	
    86	当前边界：
    87	
    88	- 验证码发送器当前是 `LoggingEmailCodeSender`，只写日志，不会真正发邮件
    89	
    90	### 5. 后端用户、联系人、会话、消息
    91	
    92	已实现：
    93	
    94	- 用户资料：
    95	  - `GET /api/user/me`
    96	  - `PUT /api/user/profile`
    97	- 联系人：
    98	  - `POST /api/contact/add`
    99	  - `GET /api/contact/list`
   100	- 会话：
   101	  - `POST /api/conversation/single`
   102	  - `GET /api/conversation/list`
   103	  - `POST /api/conversation/clear-unread`
   104	- 消息：
   105	  - `POST /api/message/send`
   106	  - `GET /api/message/history`
   107	  - `POST /api/message/read`
   108	- PostgreSQL 中已包含用户、认证、联系人、会话、消息、未读计数、文件等表结构
   109	- 会话摘要、未读数、已读回执、联系人最后互动时间都已在服务层处理
   110	- 用户资料读取带 Redis 缓存
   111	
   112	### 6. 文件与 WebSocket
   113	
   114	已实现：
   115	
   116	- 文件接口：
   117	  - `POST /api/file/upload-sign`
   118	  - `POST /api/file/complete`
   119	  - `GET /api/file/{fileId}`
   120	- WebSocket 端点：`/ws/chat`

codex
**现状与缺口**

本轮只做了仓库和文档扫描，没有改代码，也没有重新跑测试。测试结果以 [STATUS.md](/home/reader/HideChat/docs/STATUS.md) 和现有测试文件为准。根约束已按 [agents.md](/home/reader/HideChat/agents.md) 和 [CODEX_SOP.md](/home/reader/HideChat/docs/CODEX_SOP.md) 对齐。

**1. 已实现后端模块和接口**

后端模块已具备 `auth / user / contact / conversation / message / file / system / websocket` 主体结构，分层基本符合“Controller 不写业务、Service 承担业务、Mapper 只做数据访问”的约束，控制器返回的也是 VO 而不是 Entity。

已实现 REST 接口：
- Auth
  - `POST /api/auth/email/send-code`
  - `POST /api/auth/email/register`
  - `POST /api/auth/email/password-login`
  - `POST /api/auth/email/code-login`
  - `POST /api/auth/email/reset-password`
  - `POST /api/auth/refresh-token`
  - `POST /api/auth/logout`
  - 见 [AuthController.java](/home/reader/HideChat/backend/src/main/java/com/hidechat/modules/auth/controller/AuthController.java)
- User
  - `GET /api/user/me`
  - `PUT /api/user/profile`
  - 见 [UserController.java](/home/reader/HideChat/backend/src/main/java/com/hidechat/modules/user/controller/UserController.java)
- Contact
  - `POST /api/contact/add`
  - `GET /api/contact/list`
  - 见 [ContactController.java](/home/reader/HideChat/backend/src/main/java/com/hidechat/modules/contact/controller/ContactController.java)
- Conversation
  - `POST /api/conversation/single`
  - `GET /api/conversation/list`
  - `POST /api/conversation/clear-unread`
  - 见 [ConversationController.java](/home/reader/HideChat/backend/src/main/java/com/hidechat/modules/conversation/controller/ConversationController.java)
- Message
  - `POST /api/message/send`
  - `GET /api/message/history`
  - `POST /api/message/read`
  - 见 [MessageController.java](/home/reader/HideChat/backend/src/main/java/com/hidechat/modules/message/controller/MessageController.java)
- File
  - `POST /api/file/upload-sign`
  - `POST /api/file/complete`
  - `GET /api/file/{fileId}`
  - 见 [FileController.java](/home/reader/HideChat/backend/src/main/java/com/hidechat/modules/file/controller/FileController.java)
- System
  - `GET /api/system/fortune/today`
  - `GET /api/system/disguise-config`
  - 见 [SystemController.java](/home/reader/HideChat/backend/src/main/java/com/hidechat/modules/system/controller/SystemController.java)

已实现 WebSocket：
- 端点 `/ws/chat`
- 支持 `CHAT_SEND`、`CHAT_READ`
- 服务端会推 `CHAT_ACK`、`CHAT_RECEIVE`、`CHAT_READ`
- 见 [ChatWebSocketHandler.java](/home/reader/HideChat/backend/src/main/java/com/hidechat/websocket/handler/ChatWebSocketHandler.java)

**2. 已实现前端页面/API 封装**

前端不是多页面结构，而是单文件状态机式单页应用：
- 伪装页、登录/注册、PIN 设置/解锁、聊天页都集中在 [App.tsx](/home/reader/HideChat/frontend/src/app/App.tsx)
- `api/` 已有统一封装 [client.ts](/home/reader/HideChat/frontend/src/api/client.ts)
- `crypto/` 已有本地加解密实现 [index.ts](/home/reader/HideChat/frontend/src/crypto/index.ts)
- `storage/` 已有 IndexedDB 缓存封装 [index.ts](/home/reader/HideChat/frontend/src/storage/index.ts)

前端已封装 API：
- `fetchTodayFortune`
- `fetchDisguiseConfig`
- `sendEmailCode`
- `registerByEmail`
- `loginByPassword`
- `fetchCurrentUser`
- `listContacts` / `addContact`
- `listConversations` / `createSingleConversation` / `clearConversationUnread`
- `listMessageHistory` / `sendMessage`
- `createChatWebSocket`

前端现状限制：
- `pages/`、`components/` 基本还是占位 README，没形成真正模块化页面结构
- [frontend/README.md](/home/reader/HideChat/frontend/README.md#L1) 仍写着“只有骨架，业务未实现”，和当前代码不一致，文档已漂移
- 幸运数字仍是硬编码演示值 `2468`，见 [App.tsx](/home/reader/HideChat/frontend/src/app/App.tsx#L38)
- 本地存储只有一个 `conversation-cache` store，和设计文档要求的 `app_meta / conversation_index / messages / file_cache` 还有距离，见 [storage/index.ts](/home/reader/HideChat/frontend/src/storage/index.ts#L7)

**3. 已有数据库 / migration 状态**

数据库当前走 Flyway migration，符合“不能直接改 schema，只能通过 migration”的原则。
- 只有一个 migration：[V1__init_schema.sql](/home/reader/HideChat/backend/src/main/resources/db/migration/V1__init_schema.sql)
- 当前没有 `V2+`，说明 schema 仍停留在初始版
- 已建表共 10 张：
  - `im_user`
  - `im_user_auth`
  - `im_email_code`
  - `im_refresh_token`
  - `im_contact`
  - `im_conversation`
  - `im_file`
  - `im_message`
  - `im_unread_counter`
  - `im_message_read_receipt`

结论：
- 数据库基础表够用来支撑 MVP 元数据链路
- 但如果后续要修正明文消息持久化、补偿消息、对象存储、搜索索引等，必须新增 migration，不能改历史 `V1`

**4. 已有测试覆盖情况**

后端测试覆盖：
- 单元测试覆盖了 auth/contact/conversation/file/message/system/user 的 controller/service
- WebSocket handler 也有测试
- 集成测试有：
  - `UserProfileIntegrationTest`
  - `ContactIntegrationTest`
  - `ConversationIntegrationTest`
- 目录见 [backend/src/test/java/com/hidechat](/home/reader/HideChat/backend/src/test/java/com/hidechat)

前端测试覆盖：
- 加密单测：[crypto.test.ts](/home/reader/HideChat/frontend/tests/unit/crypto.test.ts)
- UI 主流程测试：[app-flow.test.tsx](/home/reader/HideChat/frontend/tests/e2e/app-flow.test.tsx)
- 还有一个占位文件 [placeholder.test.md](/home/reader/HideChat/frontend/tests/unit/placeholder.test.md)，不是可执行测试

按 [STATUS.md](/home/reader/HideChat/docs/STATUS.md) 记录的最近验证结果：
- backend `mvn test` 通过，`59 tests`
- backend Testcontainers 集成测试通过
- frontend `npm test` 通过，`3 tests`
- frontend `npm run build` 通过

测试缺口：
- 没有真实浏览器级 WebSocket 联调 E2E
- 没有图片消息前端 E2E
- 没有自动锁定 / 标签页切换锁定测试
- 没有搜索用户、联系人更新/删除、补偿消息测试
- 没有安全回归测试覆盖“敏感信息不得明文落盘/日志”

**5. 已有 Docker / Compose / 脚本状态**

基础运行环境是完整的：
- `docker-compose.yml` 提供 `postgres / redis / backend / frontend / nginx`
- 见 [docker-compose.yml](/home/reader/HideChat/docker-compose.yml)

主要脚本已具备：
- 启停：`scripts/up.sh`、`scripts/down.sh`
- 健康检查：`scripts/check.sh`
- 验证：`scripts/verify.sh`
- 分阶段执行：`scripts/run_all.sh`、`scripts/run_phase.sh`、`scripts/recover.sh`
- 后端集成测试：`scripts/run-backend-integration-tests.sh`

脚本层面的现状：
- OpenClaw 分阶段流程是可用的，和 [CODEX_SOP.md](/home/reader/HideChat/docs/CODEX_SOP.md) 一致
- 但 compose 里没有 MinIO/S3，文件上传仍是示例 URL，不是可联调的真实对象存储
- `scripts/` 里有 `.backup/.fixed/.swp` 杂项，说明仓库有运行脚本历史残留，但不影响扫描结论

**6. 与文档要求相比，缺失的功能清单**

后端接口缺失：
- `GET /api/user/search`
- `PUT /api/contact/update`
- `DELETE /api/contact/{peerUid}`
- `GET /api/conversation/{conversationId}`
- `DELETE /api/message/{messageId}`
- `GET /api/message/pending`
- 这些都在 [后端接口定义文档](/home/reader/HideChat/docs/api/后端接口定义文档%20v1.0.md) 中定义了，但代码里没有对应 controller 方法

前端隐私能力缺失：
- 用户自定义幸运数字 + 本地 hash/salt/KDF 参数持久化
- PIN 的 `salt/verifier` 持久化
- 会话级密钥设计
- 刷新后重新锁定但仍可恢复会话索引
- 自动锁定、切后台锁定、超时锁定、错误次数限制
- 真正的 per-conversation PIN，而不是当前全局内存态 PIN

聊天与文件能力缺失：
- 图片消息前端发送/展示闭环
- 对象存储真实接入
- 断线重连后的补偿消息拉取
- 搜索用户后再添加联系人这一条完整前端链路

测试与验收缺失：
- 浏览器级联调 E2E
- WebSocket 重连补偿测试
- 图片消息全链路测试
- 兼容性、性能、安全专项测试

**7. 当前阻塞联调的问题列表**

这些不是“以后优化”，而是现在就会阻断或违反目标的点：

- 前后端消息协议不一致。前端发送 `payloadType: "text"`，后端只接受 `plain/ref/encrypted`，真实发送会失败。见 [client.ts](/home/reader/HideChat/frontend/src/api/client.ts#L278) 与 [App.tsx](/home/reader/HideChat/frontend/src/app/App.tsx#L332)，后端校验在 [MessageServiceImpl.java](/home/reader/HideChat/backend/src/main/java/com/hidechat/modules/message/service/impl/MessageServiceImpl.java#L161)
- 当前消息正文会被明文写入后端数据库。`entity.setPayload(request.getPayload())` 直接落库，和“服务端不持有聊天明文”“不明文持久化”的要求冲突。见 [MessageServiceImpl.java](/home/reader/HideChat/backend/src/main/java/com/hidechat/modules/message/service/impl/MessageServiceImpl.java#L78)
- 验证码被明文打印日志，直接违反你的第 9 条约束。见 [LoggingEmailCodeSender.java](/home/reader/HideChat/backend/src/main/java/com/hidechat/modules/auth/service/impl/LoggingEmailCodeSender.java#L12)
- 幸运数字是硬编码演示值，不是用户自定义，也没有本地持久化 hash/salt。见 [App.tsx](/home/reader/HideChat/frontend/src/app/App.tsx#L38)
- PIN 派生方案与文档不符。现在是 `SHA-256(pin)` 直接导 AES key，不是文档要求的 `PBKDF2 + salt + verifier`。见 [crypto/index.ts](/home/reader/HideChat/frontend/src/crypto/index.ts#L15)
- 前端本地存储模型过于简化，只能存一份会话密文缓存，不能支撑文档里的会话索引、PIN 材料、文件缓存与锁定恢复。见 [storage/index.ts](/home/reader/HideChat/frontend/src/storage/index.ts#L7)
- 用户搜索接口缺失，真实用户侧无法在不知道 `peerUid` 的前提下完成加联系人主流程
- `message/pending` 缺失，WebSocket 断线补偿无法完成，和测试文档要求不符
- 文件上传是示例 URL，compose 也没有对象存储，图片消息无法完成真实联调
- 文件服务允许 `pdf/text/plain/octet-stream`，和当前“图片消息”场景及测试文档的文件安全要求不完全一致，见 [FileServiceImpl.java](/home/reader/HideChat/backend/src/main/java/com/hidechat/modules/file/service/impl/FileServiceImpl.java#L106)

**8. 建议的分阶段执行计划**

先给现状和缺口，再给计划，按你要求分阶段如下。

1. 阶段一：先修联调阻塞和安全红线  
目标：先把“不能发、发错、明文泄露”这几个问题清掉。  
范围：
- 修正前后端消息协议
- 去掉验证码明文日志
- 明确消息密文边界，禁止聊天明文持久化
- 补对应单测/集成测试  
理由：这些问题不先解决，后续所有联调都不可信。

2. 阶段二：补齐后端最小缺口接口  
目标：让后端达到文档中的“最小可联调接口集”。  
范围：
- `GET /api/user/search`
- `GET /api/message/pending`
- 视实际优先级补 `contact update/delete`、`conversation detail`、`message delete`
- 若涉及 schema，必须新增 migration  
理由：先补最影响前端闭环和重连能力的接口。

3. 阶段三：重做前端本地隐私模型  
目标：把前端从“演示态”改成“符合 PRD 的可用态”。  
范围：
- 用户自定义幸运数字
- `luckyCodeHash/salt/kdfParams` 持久化
- `pinSalt/pinVerifierHash` 与会话级密钥
- 刷新后锁定恢复
- 自动锁定/切后台锁定/手动隐藏  
理由：这是 PRD 的核心，不做这层，HideChat 只是聊天 demo。

4. 阶段四：打通真实前后端聊天联调  
目标：登录、联系人、会话、历史消息、WebSocket 收发形成真闭环。  
范围：
- 前端移除关键路径 demo fallback
- 接入真实搜索用户与加联系人
- 接入 `message/history`、`message/pending`
- 实时收发、已读、重连补偿  
理由：这是后端与前端从“各自可跑”到“系统可联调”的分水岭。

5. 阶段五：补图片消息和对象存储  
目标：完成文档要求的文本/图片消息双链路。  
范围：
- 对象存储接入
- 前端上传、回调、消息引用发送、展示
- 文件类型和大小限制收紧到设计要求  
理由：图片是验收清单里的必须项，不是可选项。

6. 阶段六：补验收级测试和脚本  
目标：让仓库具备“按 SOP 连续执行并验证”的能力。  
范围：
- 浏览器级 E2E
- WebSocket 联调 E2E
- 图片消息 E2E
- 安全回归测试
- 补文档漂移  
理由：没有验收级测试，后续每轮改动都会反复破主链路。

**9. 每阶段建议验证方式**

- 阶段一
  - backend 单测
  - message/auth 相关 controller/service 测试
  - grep 检查敏感日志
  - 定向集成测试验证消息不再明文持久化
- 阶段二
  - 新接口 controller/service 单测
  - Postman/MockMvc 冒烟
  - `run-backend-integration-tests.sh`
- 阶段三
  - frontend unit test 覆盖 crypto/storage
  - jsdom 测 PIN/幸运数字持久化
  - 补锁定场景测试
- 阶段四
  - 前后端同时启动
  - 登录 -> 搜索 -> 加联系人 -> 创建会话 -> 发消息 -> 刷新 -> 补偿拉取
  - 优先补真实浏览器 E2E
- 阶段五
  - 文件上传接口测试
  - 图片消息端到端 E2E
  - 非图片/超限文件拒绝测试
- 阶段六
  - `scripts/verify.sh full`
  - docker compose 冒烟
  - 浏览器级回归套件
  - 更新状态快照和文档

**状态快照**

1. 当前已完成模块
- 后端：auth、user、contact、conversation、message、file、system、websocket
- 前端：单页 disguise/auth/PIN/chat 流程、API client、crypto、IndexedDB conversation cache
- 基础设施：Flyway V1、PostgreSQL/Redis/Testcontainers、Docker Compose、OpenClaw 阶段脚本

2. 本轮新增/修改的关键文件
- 无，本轮只做分析，未改代码

3. 已实现接口/页面/功能
- 已实现后端接口见上文 20 个 REST 接口 + `/ws/chat`
- 已实现前端页面为单页整合流程，入口在 [App.tsx](/home/reader/HideChat/frontend/src/app/App.tsx)
- 已有本地加密缓存、PIN 解锁、聊天列表和文本消息演示链路

4. 已完成的测试与验证结果
- 根据 [STATUS.md](/home/reader/HideChat/docs/STATUS.md)：
- backend `mvn test` 通过，59 tests
- backend 集成测试通过
- frontend `npm test` 通过，3 tests
- frontend `npm run build` 通过
- 本轮未重新执行验证命令

5. 当前未完成项
- 安全红线修复：验证码日志明文、消息明文持久化
- 文档定义缺失接口：`user/search`、`message/pending` 等
- 前端真实隐私模型：幸运数字持久化、PIN verifier/salt、自动锁定
- 真实前后端联调闭环
- 图片消息链路
- 浏览器级 E2E 和安全回归

6. 下一轮最合理的继续顺序
- 先做阶段一：修协议不一致、清敏感日志、明确消息密文边界
- 再做阶段二：补 `user/search` 和 `message/pending`
- 然后做阶段三：前端本地隐私模型重构
- 最后再推进真实联调、图片消息和验收级测试
tokens used
102,357
**现状与缺口**

本轮只做了仓库和文档扫描，没有改代码，也没有重新跑测试。测试结果以 [STATUS.md](/home/reader/HideChat/docs/STATUS.md) 和现有测试文件为准。根约束已按 [agents.md](/home/reader/HideChat/agents.md) 和 [CODEX_SOP.md](/home/reader/HideChat/docs/CODEX_SOP.md) 对齐。

**1. 已实现后端模块和接口**

后端模块已具备 `auth / user / contact / conversation / message / file / system / websocket` 主体结构，分层基本符合“Controller 不写业务、Service 承担业务、Mapper 只做数据访问”的约束，控制器返回的也是 VO 而不是 Entity。

已实现 REST 接口：
- Auth
  - `POST /api/auth/email/send-code`
  - `POST /api/auth/email/register`
  - `POST /api/auth/email/password-login`
  - `POST /api/auth/email/code-login`
  - `POST /api/auth/email/reset-password`
  - `POST /api/auth/refresh-token`
  - `POST /api/auth/logout`
  - 见 [AuthController.java](/home/reader/HideChat/backend/src/main/java/com/hidechat/modules/auth/controller/AuthController.java)
- User
  - `GET /api/user/me`
  - `PUT /api/user/profile`
  - 见 [UserController.java](/home/reader/HideChat/backend/src/main/java/com/hidechat/modules/user/controller/UserController.java)
- Contact
  - `POST /api/contact/add`
  - `GET /api/contact/list`
  - 见 [ContactController.java](/home/reader/HideChat/backend/src/main/java/com/hidechat/modules/contact/controller/ContactController.java)
- Conversation
  - `POST /api/conversation/single`
  - `GET /api/conversation/list`
  - `POST /api/conversation/clear-unread`
  - 见 [ConversationController.java](/home/reader/HideChat/backend/src/main/java/com/hidechat/modules/conversation/controller/ConversationController.java)
- Message
  - `POST /api/message/send`
  - `GET /api/message/history`
  - `POST /api/message/read`
  - 见 [MessageController.java](/home/reader/HideChat/backend/src/main/java/com/hidechat/modules/message/controller/MessageController.java)
- File
  - `POST /api/file/upload-sign`
  - `POST /api/file/complete`
  - `GET /api/file/{fileId}`
  - 见 [FileController.java](/home/reader/HideChat/backend/src/main/java/com/hidechat/modules/file/controller/FileController.java)
- System
  - `GET /api/system/fortune/today`
  - `GET /api/system/disguise-config`
  - 见 [SystemController.java](/home/reader/HideChat/backend/src/main/java/com/hidechat/modules/system/controller/SystemController.java)

已实现 WebSocket：
- 端点 `/ws/chat`
- 支持 `CHAT_SEND`、`CHAT_READ`
- 服务端会推 `CHAT_ACK`、`CHAT_RECEIVE`、`CHAT_READ`
- 见 [ChatWebSocketHandler.java](/home/reader/HideChat/backend/src/main/java/com/hidechat/websocket/handler/ChatWebSocketHandler.java)

**2. 已实现前端页面/API 封装**

前端不是多页面结构，而是单文件状态机式单页应用：
- 伪装页、登录/注册、PIN 设置/解锁、聊天页都集中在 [App.tsx](/home/reader/HideChat/frontend/src/app/App.tsx)
- `api/` 已有统一封装 [client.ts](/home/reader/HideChat/frontend/src/api/client.ts)
- `crypto/` 已有本地加解密实现 [index.ts](/home/reader/HideChat/frontend/src/crypto/index.ts)
- `storage/` 已有 IndexedDB 缓存封装 [index.ts](/home/reader/HideChat/frontend/src/storage/index.ts)

前端已封装 API：
- `fetchTodayFortune`
- `fetchDisguiseConfig`
- `sendEmailCode`
- `registerByEmail`
- `loginByPassword`
- `fetchCurrentUser`
- `listContacts` / `addContact`
- `listConversations` / `createSingleConversation` / `clearConversationUnread`
- `listMessageHistory` / `sendMessage`
- `createChatWebSocket`

前端现状限制：
- `pages/`、`components/` 基本还是占位 README，没形成真正模块化页面结构
- [frontend/README.md](/home/reader/HideChat/frontend/README.md#L1) 仍写着“只有骨架，业务未实现”，和当前代码不一致，文档已漂移
- 幸运数字仍是硬编码演示值 `2468`，见 [App.tsx](/home/reader/HideChat/frontend/src/app/App.tsx#L38)
- 本地存储只有一个 `conversation-cache` store，和设计文档要求的 `app_meta / conversation_index / messages / file_cache` 还有距离，见 [storage/index.ts](/home/reader/HideChat/frontend/src/storage/index.ts#L7)

**3. 已有数据库 / migration 状态**

数据库当前走 Flyway migration，符合“不能直接改 schema，只能通过 migration”的原则。
- 只有一个 migration：[V1__init_schema.sql](/home/reader/HideChat/backend/src/main/resources/db/migration/V1__init_schema.sql)
- 当前没有 `V2+`，说明 schema 仍停留在初始版
- 已建表共 10 张：
  - `im_user`
  - `im_user_auth`
  - `im_email_code`
  - `im_refresh_token`
  - `im_contact`
  - `im_conversation`
  - `im_file`
  - `im_message`
  - `im_unread_counter`
  - `im_message_read_receipt`

结论：
- 数据库基础表够用来支撑 MVP 元数据链路
- 但如果后续要修正明文消息持久化、补偿消息、对象存储、搜索索引等，必须新增 migration，不能改历史 `V1`

**4. 已有测试覆盖情况**

后端测试覆盖：
- 单元测试覆盖了 auth/contact/conversation/file/message/system/user 的 controller/service
- WebSocket handler 也有测试
- 集成测试有：
  - `UserProfileIntegrationTest`
  - `ContactIntegrationTest`
  - `ConversationIntegrationTest`
- 目录见 [backend/src/test/java/com/hidechat](/home/reader/HideChat/backend/src/test/java/com/hidechat)

前端测试覆盖：
- 加密单测：[crypto.test.ts](/home/reader/HideChat/frontend/tests/unit/crypto.test.ts)
- UI 主流程测试：[app-flow.test.tsx](/home/reader/HideChat/frontend/tests/e2e/app-flow.test.tsx)
- 还有一个占位文件 [placeholder.test.md](/home/reader/HideChat/frontend/tests/unit/placeholder.test.md)，不是可执行测试

按 [STATUS.md](/home/reader/HideChat/docs/STATUS.md) 记录的最近验证结果：
- backend `mvn test` 通过，`59 tests`
- backend Testcontainers 集成测试通过
- frontend `npm test` 通过，`3 tests`
- frontend `npm run build` 通过

测试缺口：
- 没有真实浏览器级 WebSocket 联调 E2E
- 没有图片消息前端 E2E
- 没有自动锁定 / 标签页切换锁定测试
- 没有搜索用户、联系人更新/删除、补偿消息测试
- 没有安全回归测试覆盖“敏感信息不得明文落盘/日志”

**5. 已有 Docker / Compose / 脚本状态**

基础运行环境是完整的：
- `docker-compose.yml` 提供 `postgres / redis / backend / frontend / nginx`
- 见 [docker-compose.yml](/home/reader/HideChat/docker-compose.yml)

主要脚本已具备：
- 启停：`scripts/up.sh`、`scripts/down.sh`
- 健康检查：`scripts/check.sh`
- 验证：`scripts/verify.sh`
- 分阶段执行：`scripts/run_all.sh`、`scripts/run_phase.sh`、`scripts/recover.sh`
- 后端集成测试：`scripts/run-backend-integration-tests.sh`

脚本层面的现状：
- OpenClaw 分阶段流程是可用的，和 [CODEX_SOP.md](/home/reader/HideChat/docs/CODEX_SOP.md) 一致
- 但 compose 里没有 MinIO/S3，文件上传仍是示例 URL，不是可联调的真实对象存储
- `scripts/` 里有 `.backup/.fixed/.swp` 杂项，说明仓库有运行脚本历史残留，但不影响扫描结论

**6. 与文档要求相比，缺失的功能清单**

后端接口缺失：
- `GET /api/user/search`
- `PUT /api/contact/update`
- `DELETE /api/contact/{peerUid}`
- `GET /api/conversation/{conversationId}`
- `DELETE /api/message/{messageId}`
- `GET /api/message/pending`
- 这些都在 [后端接口定义文档](/home/reader/HideChat/docs/api/后端接口定义文档%20v1.0.md) 中定义了，但代码里没有对应 controller 方法

前端隐私能力缺失：
- 用户自定义幸运数字 + 本地 hash/salt/KDF 参数持久化
- PIN 的 `salt/verifier` 持久化
- 会话级密钥设计
- 刷新后重新锁定但仍可恢复会话索引
- 自动锁定、切后台锁定、超时锁定、错误次数限制
- 真正的 per-conversation PIN，而不是当前全局内存态 PIN

聊天与文件能力缺失：
- 图片消息前端发送/展示闭环
- 对象存储真实接入
- 断线重连后的补偿消息拉取
- 搜索用户后再添加联系人这一条完整前端链路

测试与验收缺失：
- 浏览器级联调 E2E
- WebSocket 重连补偿测试
- 图片消息全链路测试
- 兼容性、性能、安全专项测试

**7. 当前阻塞联调的问题列表**

这些不是“以后优化”，而是现在就会阻断或违反目标的点：

- 前后端消息协议不一致。前端发送 `payloadType: "text"`，后端只接受 `plain/ref/encrypted`，真实发送会失败。见 [client.ts](/home/reader/HideChat/frontend/src/api/client.ts#L278) 与 [App.tsx](/home/reader/HideChat/frontend/src/app/App.tsx#L332)，后端校验在 [MessageServiceImpl.java](/home/reader/HideChat/backend/src/main/java/com/hidechat/modules/message/service/impl/MessageServiceImpl.java#L161)
- 当前消息正文会被明文写入后端数据库。`entity.setPayload(request.getPayload())` 直接落库，和“服务端不持有聊天明文”“不明文持久化”的要求冲突。见 [MessageServiceImpl.java](/home/reader/HideChat/backend/src/main/java/com/hidechat/modules/message/service/impl/MessageServiceImpl.java#L78)
- 验证码被明文打印日志，直接违反你的第 9 条约束。见 [LoggingEmailCodeSender.java](/home/reader/HideChat/backend/src/main/java/com/hidechat/modules/auth/service/impl/LoggingEmailCodeSender.java#L12)
- 幸运数字是硬编码演示值，不是用户自定义，也没有本地持久化 hash/salt。见 [App.tsx](/home/reader/HideChat/frontend/src/app/App.tsx#L38)
- PIN 派生方案与文档不符。现在是 `SHA-256(pin)` 直接导 AES key，不是文档要求的 `PBKDF2 + salt + verifier`。见 [crypto/index.ts](/home/reader/HideChat/frontend/src/crypto/index.ts#L15)
- 前端本地存储模型过于简化，只能存一份会话密文缓存，不能支撑文档里的会话索引、PIN 材料、文件缓存与锁定恢复。见 [storage/index.ts](/home/reader/HideChat/frontend/src/storage/index.ts#L7)
- 用户搜索接口缺失，真实用户侧无法在不知道 `peerUid` 的前提下完成加联系人主流程
- `message/pending` 缺失，WebSocket 断线补偿无法完成，和测试文档要求不符
- 文件上传是示例 URL，compose 也没有对象存储，图片消息无法完成真实联调
- 文件服务允许 `pdf/text/plain/octet-stream`，和当前“图片消息”场景及测试文档的文件安全要求不完全一致，见 [FileServiceImpl.java](/home/reader/HideChat/backend/src/main/java/com/hidechat/modules/file/service/impl/FileServiceImpl.java#L106)

**8. 建议的分阶段执行计划**

先给现状和缺口，再给计划，按你要求分阶段如下。

1. 阶段一：先修联调阻塞和安全红线  
目标：先把“不能发、发错、明文泄露”这几个问题清掉。  
范围：
- 修正前后端消息协议
- 去掉验证码明文日志
- 明确消息密文边界，禁止聊天明文持久化
- 补对应单测/集成测试  
理由：这些问题不先解决，后续所有联调都不可信。

2. 阶段二：补齐后端最小缺口接口  
目标：让后端达到文档中的“最小可联调接口集”。  
范围：
- `GET /api/user/search`
- `GET /api/message/pending`
- 视实际优先级补 `contact update/delete`、`conversation detail`、`message delete`
- 若涉及 schema，必须新增 migration  
理由：先补最影响前端闭环和重连能力的接口。

3. 阶段三：重做前端本地隐私模型  
目标：把前端从“演示态”改成“符合 PRD 的可用态”。  
范围：
- 用户自定义幸运数字
- `luckyCodeHash/salt/kdfParams` 持久化
- `pinSalt/pinVerifierHash` 与会话级密钥
- 刷新后锁定恢复
- 自动锁定/切后台锁定/手动隐藏  
理由：这是 PRD 的核心，不做这层，HideChat 只是聊天 demo。

4. 阶段四：打通真实前后端聊天联调  
目标：登录、联系人、会话、历史消息、WebSocket 收发形成真闭环。  
范围：
- 前端移除关键路径 demo fallback
- 接入真实搜索用户与加联系人
- 接入 `message/history`、`message/pending`
- 实时收发、已读、重连补偿  
理由：这是后端与前端从“各自可跑”到“系统可联调”的分水岭。

5. 阶段五：补图片消息和对象存储  
目标：完成文档要求的文本/图片消息双链路。  
范围：
- 对象存储接入
- 前端上传、回调、消息引用发送、展示
- 文件类型和大小限制收紧到设计要求  
理由：图片是验收清单里的必须项，不是可选项。

6. 阶段六：补验收级测试和脚本  
目标：让仓库具备“按 SOP 连续执行并验证”的能力。  
范围：
- 浏览器级 E2E
- WebSocket 联调 E2E
- 图片消息 E2E
- 安全回归测试
- 补文档漂移  
理由：没有验收级测试，后续每轮改动都会反复破主链路。

**9. 每阶段建议验证方式**

- 阶段一
  - backend 单测
  - message/auth 相关 controller/service 测试
  - grep 检查敏感日志
  - 定向集成测试验证消息不再明文持久化
- 阶段二
  - 新接口 controller/service 单测
  - Postman/MockMvc 冒烟
  - `run-backend-integration-tests.sh`
- 阶段三
  - frontend unit test 覆盖 crypto/storage
  - jsdom 测 PIN/幸运数字持久化
  - 补锁定场景测试
- 阶段四
  - 前后端同时启动
  - 登录 -> 搜索 -> 加联系人 -> 创建会话 -> 发消息 -> 刷新 -> 补偿拉取
  - 优先补真实浏览器 E2E
- 阶段五
  - 文件上传接口测试
  - 图片消息端到端 E2E
  - 非图片/超限文件拒绝测试
- 阶段六
  - `scripts/verify.sh full`
  - docker compose 冒烟
  - 浏览器级回归套件
  - 更新状态快照和文档

**状态快照**

1. 当前已完成模块
- 后端：auth、user、contact、conversation、message、file、system、websocket
- 前端：单页 disguise/auth/PIN/chat 流程、API client、crypto、IndexedDB conversation cache
- 基础设施：Flyway V1、PostgreSQL/Redis/Testcontainers、Docker Compose、OpenClaw 阶段脚本

2. 本轮新增/修改的关键文件
- 无，本轮只做分析，未改代码

3. 已实现接口/页面/功能
- 已实现后端接口见上文 20 个 REST 接口 + `/ws/chat`
- 已实现前端页面为单页整合流程，入口在 [App.tsx](/home/reader/HideChat/frontend/src/app/App.tsx)
- 已有本地加密缓存、PIN 解锁、聊天列表和文本消息演示链路

4. 已完成的测试与验证结果
- 根据 [STATUS.md](/home/reader/HideChat/docs/STATUS.md)：
- backend `mvn test` 通过，59 tests
- backend 集成测试通过
- frontend `npm test` 通过，3 tests
- frontend `npm run build` 通过
- 本轮未重新执行验证命令

5. 当前未完成项
- 安全红线修复：验证码日志明文、消息明文持久化
- 文档定义缺失接口：`user/search`、`message/pending` 等
- 前端真实隐私模型：幸运数字持久化、PIN verifier/salt、自动锁定
- 真实前后端联调闭环
- 图片消息链路
- 浏览器级 E2E 和安全回归

6. 下一轮最合理的继续顺序
- 先做阶段一：修协议不一致、清敏感日志、明确消息密文边界
- 再做阶段二：补 `user/search` 和 `message/pending`
- 然后做阶段三：前端本地隐私模型重构
- 最后再推进真实联调、图片消息和验收级测试
