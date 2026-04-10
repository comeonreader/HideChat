# STATUS

PROJECT: HideChat
LAST_UPDATED: 2026-04-11
STATE: ACTIVE_DEVELOPMENT

## 状态说明

当前仓库不应标记为 `COMPLETE`。

依据 2026-04-11 当前工作区计划，本轮正在完成“去除 PIN 解锁流程”的第一轮完整落地，目标是统一主链路为 `disguise -> auth -> chat`，并将本地存储收敛为必要消息缓存。

## 当前基线

已确认：

* 后端当前无独立 PIN API / Service / 模型需要同步调整
* 本轮不修改 schema
* 本轮不新增 migration

## 本轮目标

* 文档统一为“幸运数字 -> 认证 -> 直接进入聊天”
* 删除前端 PIN 设置 / 解锁 / 自动锁定 / 重新解锁流程
* 删除本地 PIN secret 结构和相关字段
* 调整测试覆盖直接进入聊天与刷新恢复路径

## 已完成范围

### 后端

* 账号、联系人、会话、消息、文件、伪装入口接口保持现状
* 本轮仅做文档层面清理，不改协议

### 前端

* 本轮目标是将页面链路收敛为：伪装入口、认证页、聊天页
* 本地缓存仅保留 `message_local` 等必要结构

## 风险项

* 前端主流程仍集中在 `frontend/src/app/App.tsx`
* 浏览器自动化仍需在去除 PIN 后重新校验真实路径
* 本地缓存从依赖 PIN 转为直接恢复后，需要重点验证刷新恢复与会话切换

## 下一阶段计划

* 完成本轮代码与测试落地
* 执行 `backend mvn test -DskipITs`
* 执行 `frontend npm test`
* 执行 `frontend npm run build`
* 执行 `docker compose up -d --build`
