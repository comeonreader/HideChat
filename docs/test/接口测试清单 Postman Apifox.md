# 《接口测试清单（Postman/Apifox）v1.1》

适用范围：

* 后端：Spring Boot
* 协议：REST API + WebSocket
* 用途：接口联调、冒烟测试、回归测试、上线前验收
* 覆盖模块：Auth、User、Contact、Conversation、Message、File、System

---

## 1. 文档目标

本文档定义：

* Postman / Apifox 的测试集合结构
* 每个接口的测试场景
* 关键断言
* 前置条件
* 环境变量建议
* WebSocket 联调验证点

说明：

* 前端当前链路为“幸运数字 -> 认证 -> 直接进入聊天”
* 不存在 PIN 解锁接口测试项

---

## 2. 环境变量建议

| 变量名 | 示例 | 说明 |
| --- | --- | --- |
| `baseUrl` | `http://localhost:8080` | 后端基础地址 |
| `wsUrl` | `ws://localhost:8080/ws/chat` | WebSocket 地址 |
| `accessToken` | `xxx` | 当前用户 access token |
| `refreshToken` | `xxx` | 当前用户 refresh token |
| `userUidA` | `u_1001` | 测试用户 A |
| `userUidB` | `u_1002` | 测试用户 B |
| `conversationId` | `c_1001` | 测试会话 ID |
| `messageId` | `m_1001` | 测试消息 ID |
| `fileId` | `f_1001` | 测试文件 ID |
| `testEmailA` | `alice@example.com` | 测试邮箱 A |
| `testEmailB` | `bob@example.com` | 测试邮箱 B |
| `emailCode` | `123456` | 测试验证码 |
| `peerUid` | `u_1002` | 联系人 UID |

---

## 3. 测试集合结构建议

```text
HideChat API Tests
├── 00. 环境准备
├── 01. Auth
├── 02. User
├── 03. Contact
├── 04. Conversation
├── 05. Message
├── 06. File
├── 07. System
├── 08. WebSocket
└── 99. 清理与回归
```

---

## 4. 通用断言模板

成功接口至少断言：

```javascript
pm.test("HTTP 状态码为 200", function () {
  pm.response.to.have.status(200);
});

pm.test("业务 code 为 0", function () {
  const jsonData = pm.response.json();
  pm.expect(jsonData.code).to.eql(0);
});
```

---

## 5. 关键接口测试项

### 5.1 获取今日运势

`GET {{baseUrl}}/api/system/fortune/today`

断言：

* HTTP 200
* `code = 0`
* `data.title` 不为空

### 5.2 校验幸运数字

`POST {{baseUrl}}/api/system/disguise/verify-lucky-number`

断言：

* 命中时 `code = 0`
* 未命中时返回 `420201`
* 不暴露 PIN 相关语义

### 5.3 认证接口

覆盖：

* 发送邮箱验证码
* 注册
* 密码登录
* 验证码登录
* 重置密码
* 刷新 token
* 退出登录

断言：

* 登录成功返回 token
* 不返回 PIN、解锁材料或本地密钥字段

### 5.4 联系人与会话

覆盖：

* 搜索用户
* 添加联系人
* 联系人列表
* 最近添加
* 创建 / 获取单聊
* 会话列表
* 清空未读

断言：

* 会话列表只返回脱敏预览
* 不返回 `pinVerifierHash`、`pinSalt`、`pinKdfParams`、`encryptedConversationKey`

### 5.5 消息与文件

覆盖：

* 发送文本消息
* 查询历史消息
* 已读回执
* 获取上传签名
* 上传完成回调
* 获取文件信息

### 5.6 WebSocket

覆盖：

* 建连成功
* `CHAT_SEND`
* `CHAT_ACK`
* `CHAT_RECEIVE`
* `CHAT_READ`

---

## 6. 前后端联调关注点

* 认证成功后前端应可直接进入聊天
* 打开会话无需额外解锁
* 刷新后前端恢复依赖本地登录态和消息缓存，不依赖额外后端 PIN 协议

---

## 7. 明确不测项

当前版本不包含以下接口级测试项：

* PIN 设置
* PIN 校验
* PIN 重试锁定
* conversationKey 下发 / 解密
