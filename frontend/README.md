# Frontend

当前前端已不是单纯脚手架。

## 当前能力

- 基于 Vite + React + TypeScript
- 已实现伪装入口页、认证页、PIN 设置/解锁页、聊天页
- 已接入真实后端 API：
  - 今日运势 / 伪装配置 / 幸运数字校验
  - 邮箱注册
  - 密码登录
  - 邮箱验证码登录
  - 发送验证码
  - 重置密码
  - 当前用户信息
  - 搜索用户 / 添加联系人
  - 创建单聊 / 会话列表 / 最近联系人
  - 历史消息 / 已读同步
  - 文件上传签名 / 上传完成
- 已接入 WebSocket 聊天通道
- 已实现本地 PIN、自动锁定、本地加密消息缓存和解锁恢复

## 当前测试形态

截至 2026-04-10，当前工作区实际执行结果如下：

- `npm test`
  - `7` 个测试文件通过
  - `35` 个测试用例通过
- `npm run build`
  - 通过
- `npm run test:e2e`
  - `3` 个 Playwright 用例通过

## 限制与说明

- `tests/e2e/` 下的用例是 `jsdom` 环境中的前端伪 E2E，不是真实浏览器全链路验收
- `tests/browser/` 下的 Playwright 用例运行在真实浏览器中，但当前依赖 `tests/fixtures/e2e/mock-backend.mjs`
- 因此，前端目前具备浏览器自动化能力，但还不能宣称已经完成“真实后端全链路 E2E”
- 前端主流程仍主要集中在 `src/app/App.tsx`，后续继续扩展前建议进一步拆分职责

## 目录说明

- `src/app/` 应用入口与主流程编排
- `src/pages/` 页面级组件
- `src/api/` HTTP / WebSocket 请求封装
- `src/store/` 本地状态与锁定状态编排
- `src/crypto/` 加密与校验逻辑
- `src/storage/` 本地存储封装
- `tests/unit/` 单元测试
- `tests/e2e/` 基于 `vitest` + `jsdom` 的伪 E2E
- `tests/browser/` 基于 Playwright 的真实浏览器测试

## 当前不应宣称的状态

- 不应再称为“仅有 phase-one skeleton”
- 不应再称为“业务页面和隐私流程尚未实现”
- 不应宣称“真实后端真 E2E 已完成”
