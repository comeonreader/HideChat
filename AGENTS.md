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
* Service：`UserService`
* ServiceImpl：`UserServiceImpl`
* Controller：`UserController`
* DTO：`EmailRegisterRequest`
* VO：`ConversationListItemVO`
* Enum：`MessageTypeEnum`

### 6.3 方法命名

* 查询：`get` / `find` / `query` / `list`
* 创建：`create` / `add`
* 更新：`update`
* 删除：`delete` / `remove`
* 状态修改：`mark` / `clear` / `lock` / `unlock`

示例：

* `sendEmailCode`
* `registerByEmail`
* `loginByPassword`
* `createSingleConversation`
* `listConversationItems`
* `markMessagesAsRead`

### 6.4 数据库命名

* 表名：小写下划线
* 字段名：小写下划线
* 时间字段统一：

  * `created_at`
  * `updated_at`
* 业务唯一 ID：

  * `user_uid`
  * `conversation_id`
  * `message_id`
  * `file_id`

### 6.5 前端命名

* React 组件：PascalCase
* hooks：`useXxx`
* store：`xxxStore`
* 本地加密字段命名必须明确：

  * `encryptedConversationKey`
  * `pinVerifierHash`
  * `luckyCodeHash`

---

## 7. 分层规则

### 7.1 后端严格分层

必须遵守：

* Controller
* Service
* Mapper
* Database

### 7.2 Controller 层

允许：

* 接收请求
* 参数校验入口
* 调用 Service
* 返回统一响应

禁止：

* 直接调 Mapper
* 写事务逻辑
* 写复杂业务判断
* 拼装复杂领域规则

### 7.3 Service 层

负责：

* 业务编排
* 事务控制
* 规则校验
* 幂等处理
* 状态流转

禁止：

* 处理 HTTP 细节
* 拼前端展示字段
* 承担数据库细节实现

### 7.4 Mapper 层

负责：

* 单表 CRUD
* 简单查询
* 必要联表查询

禁止：

* 承载完整业务流程
* 混入鉴权逻辑
* 混入 Controller 逻辑

### 7.5 Entity / DTO / VO 规则

* Entity：只映射数据库表
* DTO：只接收输入
* VO：只返回输出

禁止：

* Entity 直接返回前端
* DTO 直接作为数据库对象落库
* VO 承担业务逻辑
* Entity 混入展示字段

### 7.6 前端分层

建议按以下职责分层：

* `pages/` 页面
* `components/` 组件
* `api/` 请求封装
* `store/` 状态
* `crypto/` 加密逻辑
* `storage/` IndexedDB 封装
* `hooks/` 复用逻辑

禁止：

* 页面直接操作加密底层细节
* 页面直接操作 IndexedDB 原生 API
* 页面直接写复杂 socket 状态机

---

## 8. 是否允许直接改 schema

### 8.1 默认不允许

Agent 默认**不允许直接修改 schema**。

包括但不限于：

* 新增表
* 删除表
* 修改字段类型
* 修改字段长度
* 新增索引
* 删除索引
* 修改唯一约束
* 修改外键关系
* 重命名表/字段

### 8.2 如果确实需要改 schema

必须同时满足：

1. 任务明确要求
2. 当前模型无法支持
3. 输出 migration
4. 说明影响范围
5. 说明回滚方案
6. 同步修改实体、Mapper、文档、测试

### 8.3 migration 规则

数据库变更必须通过 migration 管理，不能手改历史脚本。

命名建议：

```text
V1__init_schema.sql
V2__add_unread_counter.sql
V3__add_message_file_id_index.sql
```

规则：

* 一个 migration 只做一类清晰变更
* 不修改已提交的旧 migration
* 需要兼容升级路径
* 需要可重复执行或可安全失败
* 需要附带回滚说明（即使不写回滚脚本，也要说明）

### 8.4 严禁行为

* 直接改生产 schema 假设
* 改实体不改 migration
* 改 migration 不改实体
* 修改上线后的历史 migration 内容
* 删除线上已用字段而没有迁移方案

---

## 9. 测试目录规范

### 9.1 后端测试目录

```text
backend/src/test/java/com/hidechat/
├── modules/
│   ├── auth/
│   ├── user/
│   ├── contact/
│   ├── conversation/
│   ├── message/
│   └── file/
├── integration/
└── support/
```

建议分层：

* 单元测试：按模块放
* 集成测试：放 `integration/`
* 测试工具类：放 `support/`

### 9.2 前端测试目录

```text
frontend/tests/
├── unit/
├── integration/
├── e2e/
└── fixtures/
```

建议：

* `unit/`：工具、store、crypto、storage
* `integration/`：页面与状态联动
* `e2e/`：关键主链路

---

## 10. 提交前必须通过哪些检查

### 10.1 后端必须通过

* 编译通过
* 单元测试通过
* 受影响模块集成测试通过
* 新增 SQL 正常执行
* 无明显死代码
* 无明显 unused import
* 核心接口可联调

### 10.2 前端必须通过

* 构建通过
* lint 通过
* 受影响页面/组件测试通过
* 不引入明显控制台报错
* IndexedDB / 本地加密逻辑完成手测

### 10.3 如果改动影响以下模块，必须手工验证主链路

#### Auth 改动

必须验证：

* 注册
* 密码登录
* 发验证码
* 找回密码
* token 刷新

#### Contact / Conversation 改动

必须验证：

* 搜索用户
* 添加联系人
* 创建/获取 1V1 会话
* 获取会话列表

#### Message / WebSocket 改动

必须验证：

* 发送文本消息
* ACK
* 对端接收
* 历史消息查询
* 未读数更新

#### File 改动

必须验证：

* 获取上传签名
* 上传完成回调
* 文件信息获取

#### PIN / 本地加密 改动

必须验证：

* 首次设置 PIN
* PIN 解锁
* 刷新后重新解锁
* 锁定后不可直接查看历史

---

## 11. 输出代码时必须补哪些测试

默认规则：

**不允许只改实现，不补测试。**

### 11.1 后端最低测试要求

#### Controller 改动

至少补：

* 成功用例
* 参数错误用例
* 未鉴权或权限错误用例

#### Service 改动

至少补：

* 成功路径
* 关键失败路径
* 边界条件
* 幂等场景（如适用）

#### Mapper / SQL 改动

至少补：

* 查询正确性
* 排序/分页正确性
* 条件过滤正确性

### 11.2 前端最低测试要求

#### 页面 / 组件改动

至少补：

* 基本渲染
* 核心交互
* 异常状态

#### store / crypto / storage 改动

至少补：

* 状态更新
* 本地存取
* 加解密成功路径
* 加解密失败路径
* 锁定/解锁行为

### 11.3 必须优先补的高价值测试

优先覆盖：

1. 注册 / 登录 / 重置密码
2. 搜索用户 / 添加联系人
3. 创建会话 / 获取会话列表
4. 消息发送 / 查询 / ACK
5. 文件上传元数据流程
6. PIN 解锁 / 自动锁定 / 手动隐藏

### 11.4 以下不算合格测试

* 空测试
* 只测 happy path
* 只测 getter/setter
* 没有关键断言
* 只为了凑覆盖率

---

## 12. PR 与提交要求

### 12.1 Commit message 建议

建议使用以下格式：

```text
feat(auth): add email reset password flow
fix(message): prevent duplicate message ack handling
refactor(conversation): simplify query service logic
test(file): add upload complete integration tests
docs(api): update conversation endpoints
```

### 12.2 PR 描述必须包含

1. 背景
2. 改动点
3. 是否涉及接口变更
4. 是否涉及数据库变更
5. 是否涉及本地存储结构变更
6. 测试说明
7. 风险说明
8. 回滚说明（如适用）

### 12.3 PR 禁止事项

禁止提交以下类型 PR：

* 改动过大但没有拆分说明
* 改 schema 但没有 migration
* 改接口但没有更新文档
* 改主链路但没有测试
* 混入无关重构

---

## 13. 安全红线

Agent 不得引入以下问题：

* 在日志中打印密码、PIN、幸运数字明文、验证码明文、token 明文
* 在前端本地存 PIN 明文
* 在前端本地存幸运数字明文
* 在前端持久化历史消息明文
* 在接口中绕过鉴权
* 查询消息时不校验会话归属
* 文件访问不校验权限
* 无 where 的 update/delete
* 将 Entity 直接暴露给前端

---

## 14. Code X 专用执行要求

### 14.1 Agent 修改前必须先判断

1. 是新增功能，还是修复 bug
2. 是否影响 API
3. 是否影响 DB
4. 是否影响前端本地存储
5. 是否影响主链路
6. 需要补哪些测试

### 14.2 Agent 输出时推荐格式

建议输出内容按以下顺序组织：

1. 改动概述
2. 改动文件
3. 关键实现说明
4. 测试补充说明
5. 风险与后续建议

### 14.3 如果需求不清晰

Agent 应：

* 优先沿用现有设计
* 做最小合理实现
* 明确写出假设
* 不擅自做架构级扩张

---

## 15. 默认优先级

发生冲突时，按以下优先级决策：

1. 安全
2. 数据正确性
3. 主链路稳定
4. 分层清晰
5. 可维护性
6. 开发速度
7. 代码简洁性

---

## 16. 默认结论

在没有额外说明时，Agent 必须默认：

* 不改 schema
* 不跳过测试
* 不绕过分层
* 不把 Entity 直接返回前端
* 不把本地加密做成明文缓存
* 不做大范围重构
* 不引入破坏主链路的修改

