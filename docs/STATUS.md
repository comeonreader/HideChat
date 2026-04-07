下面是按照**标准 `STATUS.md` 模板**整理后的版本（已结构化为 Codex 可直接使用的“静默编程状态文件”👇）

------

# STATUS

STATE: IN_PROGRESS
PROJECT: HideChat
OWNER: Codex
LAST_UPDATED: 2026-04-08

------

## Objective

实现一个“隐私聊天 Web 应用（HideChat）”，包含：

- 账号体系（认证）
- 联系人与会话管理
- 实时消息通信（WebSocket）
- 文件传输
- 前端隐私能力（PIN / 本地加密 / 伪装入口）
- 前后端完整闭环可联调

------

## Current Phase

后端 Phase 1（基础能力）已基本完成
前端 Phase 1（业务实现）尚未开始
整体处于：**后端骨架完成，核心聊天链路未闭环**

------

## Done

### 仓库与文档

-  agents.md 已建立并定义开发规范
-  docs/ 已按结构整理
-  README.md 已说明工程骨架来源

### 后端基础工程

-  Spring Boot 3.3.5 + Java 17 项目初始化
-  核心组件接入（Web / Security / Redis / MyBatis-Plus / Flyway / PostgreSQL / JWT）
-  通用能力：
  - 统一响应
  - 全局异常处理
  - ID生成
  - JWT鉴权链

### 数据库

-  Flyway 初始化脚本完成
-  核心表建模完成（user / contact / conversation / message / file 等）
-  与 docs/database 基本一致

### 已实现业务模块

-  auth（注册 / 登录 / refresh token / logout / 验证码 / 重置密码）
-  user（用户资料查询 + 更新 + Redis缓存）
-  contact（添加联系人 / 联系人列表）
-  conversation（单聊创建 / 会话列表 / 清空未读）

### 测试

-  mvn test 全通过（38 tests）
-  覆盖 auth / user / contact / conversation

------

## In Progress

- 后端：
  - message / file / system / websocket 模块仍为占位实现
- 前端：
  - Vite + React 工程已搭建
  - 目录结构已存在，但无业务实现
- 安全：
  - 基础 JWT 鉴权完成，但权限模型未细化

------

## Next

### 后端优先

1. 实现 message 模块（发送 / 拉取 / 已读回执）
2. 实现 file 模块（上传 / 元数据 / 存储）
3. 完成 websocket 消息路由与连接管理
4. 实现 system 模块（伪装入口）

### 联调链路

1. 打通消息链路：
   - send → conversation → unread → contact排序
2. 更新：
   - im_conversation
   - im_contact.last_message_at

### 前端基础页面

1. 实现：
   - 登录注册页
   - 联系人 / 会话列表
   - 聊天页面
   - 伪装入口页

### 前端隐私能力

1. 实现：
   - PIN 解锁
   - lucky code hash
   - IndexedDB 本地存储
   - 本地加密消息缓存

### 测试与验证

1. 增加：
   - Redis / PostgreSQL 集成测试
   - WebSocket 测试
   - E2E 测试

------

## Blockers

- WebSocket 未实现 → 聊天主链路不可用
- message/file 模块为空 → 无法发送消息
- 前端未实现 → 无法联调
- 前端依赖未安装（npm build/test失败）
- Redis / DB 尚未验证真实联调

------

## Files Touched

- backend/src/main/java/com/hidechat/modules/*
- backend/src/main/resources/db/migration/V1__init_schema.sql
- frontend/src/*
- docs/*
- agents.md

------

## Commands Run

```bash
cd backend && mvn test   # success
cd frontend && npm test  # vitest not found
cd frontend && npm run build  # tsc not found
```

------

## Verification

-  后端编译通过
-  单元测试通过（38/38）
-  Redis 联调
-  PostgreSQL 联调
-  WebSocket 可用
-  消息链路完整
-  前端 build 成功
-  前后端联调
-  E2E 测试

------

## Risks

- 文档设计与实际实现存在明显差距
- 后端“模块齐全但未实现” → 容易误判进度
- 前端未承接 → 无法验证真实用户路径
- 消息 / WebSocket 未完成 → 核心能力缺失
- 隐私能力未实现 → PRD核心未达成

------

## Resume Instructions

恢复后必须执行：

1. 先读取本文件（STATUS.md）
2. 仅执行 Next 中第 1 项（message 模块实现）
3. 完成后：
   - 更新 Done / In Progress / Next
   - 写入 Commands Run
4. 若失败：
   - 分析 root cause
   - 最小修复
   - 重试
5. 当所有功能完成：
   - 将 STATE 改为 COMPLETE
