# 前端本地缓存系统

本文档描述 HideChat 当前前端本地缓存实现。当前版本已移除 PIN 解锁与本地会话密钥机制。

## 1. 概述

前端本地存储当前只承担必要缓存职责，包括：

1. 会话消息本地缓存
2. 刷新后的消息恢复
3. 会话列表继续保持脱敏展示

当前版本不包含：

* PIN 解锁流程
* PIN 校验材料
* `encryptedConversationKey`
* 自动锁定后重新输入 PIN

## 2. 架构设计

```text
frontend/src/
├── storage/             # IndexedDB 存储抽象
├── store/               # 前端运行态工具
├── services/            # 缓存服务
└── app/                 # 页面主链路编排
```

数据流：

```text
认证成功 → 拉取会话与历史 → 写入 message_local → 刷新后优先恢复缓存 → 缓存缺失时回退后端历史
```

## 3. 本地存储

基于 IndexedDB 的存储抽象：

* `conversation-cache`：按会话保存消息缓存

关键函数：

* `saveCachedConversation()`
* `loadCachedConversation()`
* `listCachedConversations()`
* `clearCachedConversations()`

缓存内容：

* `conversationId`
* `messages`
* `updatedAt`

## 4. 恢复策略

### 4.1 页面刷新

* 优先恢复本地登录态
* 幸运数字校验通过后直接进入聊天
* 优先读取本地消息缓存
* 缓存缺失时回退后端历史消息接口

### 4.2 会话打开

* 点击会话直接进入聊天页
* 不需要 PIN、会话解锁或额外本地认证材料

## 5. 安全边界

当前版本的安全控制主要包括：

* 幸运数字隐藏入口
* 会话列表脱敏预览
* 不在后端返回本地解锁材料

当前版本不引入新的替代安全机制，以保持最小变更。

## 6. 测试覆盖目标

应覆盖：

* 幸运数字 -> 认证 -> 直接进入聊天
* 点击会话直接进入聊天
* 刷新后无需 PIN 仍可恢复使用
* 本地消息缓存不依赖 PIN 解锁

---

版本：1.1.0  
最后更新：2026-04-11
