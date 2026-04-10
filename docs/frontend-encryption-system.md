# 前端加密存储系统

本文档详细描述了 HideChat 项目的前端加密存储系统实现。

## 概述

前端加密存储系统为 HideChat 提供了完整的本地数据保护机制，包括：

1. **PIN 解锁流程**：用户通过 4-6 位数字 PIN 解锁本地加密数据
2. **消息本地加密存储**：所有聊天消息在本地加密存储
3. **自动锁定机制**：根据用户活动自动锁定会话
4. **安全状态管理**：管理解锁状态和过期时间

## 架构设计

### 核心组件

```
frontend/src/
├── crypto/              # 加密工具函数
├── storage/             # 本地存储抽象层
├── store/               # 状态管理
├── services/            # 服务层
└── pages/auth/          # 认证相关页面
```

### 数据流

```
用户输入 PIN → 验证 PIN → 解锁保险库 → 恢复加密消息 → 用户活动 → 自动锁定
```

## 详细实现

### 1. 加密工具 (crypto/)

提供基础的加密功能：

- `createSecretVerifier()`: 创建 PIN 验证器
- `verifySecret()`: 验证 PIN
- `encryptString()` / `decryptString()`: 字符串加密解密
- `sha256Hex()`: SHA-256 哈希

### 2. 本地存储 (storage/)

基于 IndexedDB 的存储抽象：

- **cached_conversations**: 存储加密的会话消息
- **local_secrets**: 存储 PIN 验证器和加密参数

关键函数：
- `saveCachedConversation()` / `loadCachedConversation()`
- `listCachedConversations()` / `clearCachedConversations()`
- `saveLocalSecret()` / `loadLocalSecret()` / `deleteLocalSecret()`

### 3. 状态管理 (store/)

管理本地保险库状态：

```typescript
interface LocalVaultState {
  hasPinVerifier: boolean;      // 是否有 PIN 验证器
  isUnlocked: boolean;          // 是否已解锁
  lastUnlockAt: number | null;  // 最后解锁时间
  expiresAt: number | null;     // 过期时间
  lastLockReason: VaultLockReason | null; // 最后锁定原因
}
```

状态操作函数：
- `createLocalVaultState()`: 创建初始状态
- `unlockLocalVault()`: 解锁保险库
- `lockLocalVault()`: 锁定保险库
- `touchLocalVault()`: 延长过期时间
- `isLocalVaultExpired()`: 检查是否过期

### 4. 自动锁定服务

自动锁定机制基于以下条件：

1. **不活动超时**: 2分钟无操作自动锁定
2. **页面切换**: 切换到其他标签页时锁定
3. **手动锁定**: 用户主动锁定
4. **浏览器关闭**: 页面卸载时锁定

### 5. PIN 解锁页面

专门的 PIN 解锁页面 (`PinUnlockPage.tsx`) 提供：

- 美观的用户界面
- 错误尝试限制（5次后锁定30分钟）
- 安全特性说明
- 响应式设计

## 使用流程

### 首次使用

1. 用户通过邮箱注册/登录
2. 设置 4-6 位数字 PIN
3. PIN 验证器本地存储，PIN 不存储
4. 进入聊天界面，消息开始加密缓存

### 后续使用

1. 用户输入 PIN 解锁
2. 系统恢复加密的聊天历史
3. 用户正常聊天，消息自动加密保存
4. 用户不活动 2 分钟后自动锁定
5. 返回伪装入口页面

### 安全退出

1. 用户点击退出按钮
2. 清除所有本地缓存
3. 清除认证状态
4. 返回伪装入口

## 安全特性

### 1. 本地加密

- 所有敏感数据（消息、PIN 验证器）本地加密存储
- 使用 Web Crypto API 进行强加密
- 加密密钥基于用户 PIN 派生

### 2. 尝试限制

- 连续 5 次错误 PIN 尝试后锁定 30 分钟
- 锁定状态本地持久化
- 防止暴力破解

### 3. 自动清理

- 30 天未使用的缓存自动清理
- 退出时可选清理所有数据
- 定期清理过期数据

### 4. 隐私保护

- PIN 不上传服务器
- 加密消息不上传服务器（除非发送）
- 本地存储的数据无法被其他网站访问

## 测试覆盖

系统包含完整的测试套件：

1. **单元测试**:
   - `crypto.test.ts`: 加密功能测试
   - `storage.test.ts`: 存储功能测试
   - `store.test.ts`: 状态管理测试

2. **集成测试**:
   - `app-flow.test.tsx`: 完整用户流程测试

## 配置选项

### 自动锁定配置

```typescript
const AUTO_LOCK_IDLE_MS = 2 * 60 * 1000; // 2分钟
```

可调整的配置：
- `lockAfterInactivity`: 不活动锁定时间
- `lockOnWindowBlur`: 窗口失去焦点时锁定
- `lockOnTabSwitch`: 标签页切换时锁定
- `lockOnBrowserClose`: 浏览器关闭时锁定

### 存储配置

```typescript
const DEFAULT_OPTIONS = {
  maxMessagesPerConversation: 1000,    // 每个会话最大消息数
  cleanupInterval: 24 * 60 * 60 * 1000, // 清理间隔（24小时）
  encryptionEnabled: true              // 是否启用加密
};
```

## 故障排除

### 常见问题

1. **PIN 验证失败**
   - 检查 PIN 是否正确
   - 检查是否有锁定状态
   - 检查本地存储是否正常

2. **消息恢复失败**
   - 检查 PIN 是否正确
   - 检查加密参数是否匹配
   - 检查本地存储是否损坏

3. **自动锁定不工作**
   - 检查事件监听器是否正常
   - 检查定时器是否正常
   - 检查状态管理是否正确

### 调试方法

1. 检查浏览器开发者工具的 Application → IndexedDB
2. 查看控制台日志
3. 使用测试工具验证加密/解密功能

## 性能考虑

1. **加密性能**: 使用适当的迭代次数平衡安全性和性能
2. **存储限制**: 限制每个会话的消息数量
3. **内存使用**: 定期清理不再需要的数据
4. **响应时间**: 优化消息恢复和保存的性能

## 未来改进

1. **生物识别**: 集成指纹/面部识别
2. **云备份**: 加密的云备份选项
3. **多设备同步**: 安全的跨设备同步
4. **高级加密选项**: 支持硬件安全模块

---

**版本**: 1.0.0  
**最后更新**: 2026-04-10  
**作者**: HideChat 开发团队