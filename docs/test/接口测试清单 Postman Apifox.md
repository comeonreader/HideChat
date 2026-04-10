# 《接口测试清单（Postman/Apifox）v1.0》

适用范围：

* 后端：Spring Boot
* 协议：REST API + WebSocket
* 用途：接口联调、冒烟测试、回归测试、上线前验收
* 覆盖模块：

  * Auth
  * User
  * Contact
  * Conversation
  * Message
  * File
  * System

---

# 1. 文档目标

本文档定义：

* Postman / Apifox 的测试集合结构
* 每个接口的测试场景
* 关键断言
* 前置条件
* 测试数据建议
* 环境变量建议
* WebSocket 联调验证点

目标是让测试同学、后端、前端都能直接按清单执行。

---

# 2. 环境变量建议

建议在 Postman / Apifox 中配置以下环境变量：

| 变量名              | 示例                            | 说明                 |
| ---------------- | ----------------------------- | ------------------ |
| `baseUrl`        | `http://localhost:8080`       | 后端基础地址             |
| `wsUrl`          | `ws://localhost:8080/ws/chat` | WebSocket 地址       |
| `accessToken`    | `xxx`                         | 当前用户 access token  |
| `refreshToken`   | `xxx`                         | 当前用户 refresh token |
| `userUidA`       | `u_1001`                      | 测试用户 A             |
| `userUidB`       | `u_1002`                      | 测试用户 B             |
| `conversationId` | `c_1001`                      | 测试会话 ID            |
| `messageId`      | `m_1001`                      | 测试消息 ID            |
| `fileId`         | `f_1001`                      | 测试文件 ID            |
| `testEmailA`     | `alice@example.com`           | 测试邮箱 A             |
| `testEmailB`     | `bob@example.com`             | 测试邮箱 B             |
| `emailCode`      | `123456`                      | 测试验证码              |
| `peerUid`        | `u_1002`                      | 联系人 UID            |

---

# 3. 测试集合结构建议

建议按下面目录组织：

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

# 4. 通用断言模板

建议每个成功接口至少断言：

```javascript
pm.test("HTTP 状态码为 200", function () {
    pm.response.to.have.status(200);
});

pm.test("业务 code 为 0", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData.code).to.eql(0);
});
```

失败接口断言示例：

```javascript
pm.test("业务 code 非 0", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData.code).to.not.eql(0);
});
```

鉴权接口断言：

```javascript
pm.test("返回未授权", function () {
    pm.expect([401, 200]).to.include(pm.response.code);
    const jsonData = pm.response.json();
    pm.expect(jsonData.code).to.eql(401001);
});
```

---

# 5. 00. 环境准备

---

## 5.1 获取今日运势

### 请求

`GET {{baseUrl}}/api/system/fortune/today`

### 目的

* 校验服务可用
* 校验匿名接口可用

### 断言

* HTTP 200
* `code = 0`
* `data.title` 不为空

---

## 5.2 发送注册验证码（用户 A）

### 请求

`POST {{baseUrl}}/api/auth/email/send-code`

### Body

```json
{
  "email": "{{testEmailA}}",
  "bizType": "register"
}
```

### 断言

* `code = 0`

### 备注

测试环境建议支持读取固定验证码，或由测试库直接查验证码。

---

## 5.3 注册用户 A

### 请求

`POST {{baseUrl}}/api/auth/email/register`

### Body

```json
{
  "email": "{{testEmailA}}",
  "password": "Abcd1234",
  "emailCode": "{{emailCode}}",
  "nickname": "Alice"
}
```

### 断言

* `code = 0`
* `data.userUid` 存在

### Postman 脚本

```javascript
const jsonData = pm.response.json();
if (jsonData.code === 0) {
    pm.environment.set("userUidA", jsonData.data.userUid);
}
```

---

## 5.4 发送注册验证码（用户 B）

同上，邮箱使用 `{{testEmailB}}`

---

## 5.5 注册用户 B

同上，昵称使用 `Bob`

---

# 6. 01. Auth 模块

---

## 6.1 发送邮箱验证码 - register

### 接口

`POST /api/auth/email/send-code`

### 用例

* 正常发送
* 非法邮箱
* 非法 bizType
* 短时间重复发送

### 正常请求

```json
{
  "email": "{{testEmailA}}",
  "bizType": "register"
}
```

### 关键断言

* 成功时 `code = 0`
* 非法邮箱时 `code != 0`
* 频控时返回 `429001` 或业务限流码

---

## 6.2 邮箱注册

### 接口

`POST /api/auth/email/register`

### 用例

* 正常注册
* 已注册邮箱重复注册
* 错误验证码
* 过期验证码
* 弱密码
* 昵称缺失

### 关键断言

* 成功时 `data.userUid` 存在
* 重复注册时返回 `410101`

---

## 6.3 邮箱密码登录

### 接口

`POST /api/auth/email/password-login`

### 正常请求

```json
{
  "email": "{{testEmailA}}",
  "password": "Abcd1234"
}
```

### 关键断言

* `data.accessToken` 存在
* `data.refreshToken` 存在
* `data.userInfo.userUid` 存在

### Postman 脚本

```javascript
const jsonData = pm.response.json();
if (jsonData.code === 0) {
    pm.environment.set("accessToken", jsonData.data.accessToken);
    pm.environment.set("refreshToken", jsonData.data.refreshToken);
    pm.environment.set("userUidA", jsonData.data.userInfo.userUid);
}
```

### 异常用例

* 错误密码
* 不存在邮箱
* 空密码

---

## 6.4 邮箱验证码登录

### 接口

`POST /api/auth/email/code-login`

### 正常请求

```json
{
  "email": "{{testEmailA}}",
  "emailCode": "{{emailCode}}"
}
```

### 断言

* 登录成功返回 token
* 验证码错误返回 `410104`

---

## 6.5 重置密码

### 接口

`POST /api/auth/email/reset-password`

### 正常请求

```json
{
  "email": "{{testEmailA}}",
  "emailCode": "{{emailCode}}",
  "newPassword": "NewPass1234"
}
```

### 用例

* 正常重置
* 错误验证码
* 过期验证码
* 弱密码

### 关键断言

* 成功后旧密码失效
* 新密码可登录

---

## 6.6 刷新 Token

### 接口

`POST /api/auth/refresh-token`

### 请求

```json
{
  "refreshToken": "{{refreshToken}}"
}
```

### 断言

* 返回新的 access token
* 返回新的 refresh token

### 脚本

```javascript
const jsonData = pm.response.json();
if (jsonData.code === 0) {
    pm.environment.set("accessToken", jsonData.data.accessToken);
    pm.environment.set("refreshToken", jsonData.data.refreshToken);
}
```

---

## 6.7 登出

### 接口

`POST /api/auth/logout`

### Header

```text
Authorization: Bearer {{accessToken}}
```

### Body

```json
{
  "refreshToken": "{{refreshToken}}"
}
```

### 断言

* `code = 0`
* 登出后 refresh token 不再可用

---

# 7. 02. User 模块

---

## 7.1 获取当前用户信息

### 接口

`GET /api/user/me`

### Header

```text
Authorization: Bearer {{accessToken}}
```

### 断言

* `code = 0`
* `data.userUid` 不为空
* `data.nickname` 不为空

---

## 7.2 未登录访问当前用户信息

### 接口

同上，不带 token

### 断言

* 返回 `401001`

---

## 7.3 更新用户资料

### 接口

`PUT /api/user/profile`

### Body

```json
{
  "nickname": "Alice Updated",
  "avatarUrl": "https://cdn.example.com/avatar.jpg"
}
```

### 断言

* 更新成功
* 再次查询 `/api/user/me` 时字段生效

---

## 7.4 搜索用户

### 接口

`GET /api/user/search?keyword=Bob`

### 断言

* 返回数组
* 包含 `userUidB`
* 不返回敏感信息，如密码 hash

---

# 8. 03. Contact 模块

---

## 8.1 添加联系人

### 接口

`POST /api/contact/add`

### Body

```json
{
  "peerUid": "{{userUidB}}",
  "remarkName": "Bob"
}
```

### 断言

* `code = 0`

### 幂等验证

重复调用一次，仍应成功或返回可接受幂等结果。

---

## 8.2 添加自己为联系人

### 请求

`peerUid = {{userUidA}}`

### 断言

* 返回业务错误

---

## 8.3 获取联系人列表

### 接口

`GET /api/contact/list`

### 断言

* 返回数组
* 包含联系人 `userUidB`
* `remarkName` 正确

---

## 8.4 更新联系人

### 接口

`PUT /api/contact/update`

### Body

```json
{
  "peerUid": "{{userUidB}}",
  "remarkName": "Bob New",
  "pinned": true
}
```

### 断言

* 修改成功
* 列表中字段变化

---

## 8.5 删除联系人

### 接口

`DELETE /api/contact/{{userUidB}}`

### 断言

* 删除成功
* 再查列表不显示该联系人

---

# 9. 04. Conversation 模块

---

## 9.1 获取或创建 1V1 会话

### 接口

`POST /api/conversation/single`

### Body

```json
{
  "peerUid": "{{userUidB}}"
}
```

### 断言

* 返回 `conversationId`

### 脚本

```javascript
const jsonData = pm.response.json();
if (jsonData.code === 0) {
    pm.environment.set("conversationId", jsonData.data.conversationId);
    pm.environment.set("peerUid", jsonData.data.peerUid);
}
```

---

## 9.2 重复获取同一会话

### 断言

* 返回同一个 `conversationId`

---

## 9.3 获取会话列表

### 接口

`GET /api/conversation/list`

### 断言

* 包含当前会话
* `peerUid` 正确
* `lastMessagePreview` 字段存在
* `unreadCount` 字段存在

---

## 9.4 获取会话详情

### 接口

`GET /api/conversation/{{conversationId}}`

### 断言

* `conversationId` 正确
* `peerUid` 正确

---

## 9.5 清空未读数

### 接口

`POST /api/conversation/clear-unread`

### Body

```json
{
  "conversationId": "{{conversationId}}"
}
```

### 断言

* 成功返回
* 列表中 `unreadCount = 0`

---

# 10. 05. Message 模块

---

## 10.1 拉取历史消息（空会话）

### 接口

`GET /api/message/history?conversationId={{conversationId}}&pageSize=20`

### 断言

* `code = 0`
* `data.list` 为数组
* 结构完整

---

## 10.2 标记消息已读（空列表/单条）

### 接口

`POST /api/message/read`

### Body

```json
{
  "conversationId": "{{conversationId}}",
  "messageIds": ["{{messageId}}"]
}
```

### 断言

* 成功返回
* 不因重复已读报错

---

## 10.3 删除消息

### 接口

`DELETE /api/message/{{messageId}}`

### 断言

* 成功返回
* 历史查询中逻辑上不可见或状态变化符合设计

---

## 10.4 获取补偿消息

### 接口

`GET /api/message/pending?since=1712300000000`

### 断言

* 返回数组结构
* 字段完整

---

## 10.5 越权拉取消息

### 方法

* 使用用户 B 的 token 拉取用户 A 不属于自己的会话

### 断言

* 返回权限错误

---

# 11. 06. File 模块

---

## 11.1 获取上传签名

### 接口

`POST /api/file/upload-sign`

### Body

```json
{
  "fileName": "image.jpg",
  "mimeType": "image/jpeg",
  "fileSize": 123456,
  "encryptFlag": true
}
```

### 断言

* 返回 `fileId`
* 返回 `uploadUrl`
* 返回 `storageKey`

### 脚本

```javascript
const jsonData = pm.response.json();
if (jsonData.code === 0) {
    pm.environment.set("fileId", jsonData.data.fileId);
}
```

---

## 11.2 获取上传签名 - 非法文件类型

### Body

```json
{
  "fileName": "test.exe",
  "mimeType": "application/x-msdownload",
  "fileSize": 123456,
  "encryptFlag": true
}
```

### 断言

* 返回业务错误

---

## 11.3 上传完成回调

### 接口

`POST /api/file/complete`

### Body

```json
{
  "fileId": "{{fileId}}",
  "storageKey": "chat/2026/04/06/abc.bin",
  "mimeType": "image/jpeg",
  "fileSize": 123456,
  "encryptFlag": true
}
```

### 断言

* 返回 `accessUrl`

---

## 11.4 获取文件信息

### 接口

`GET /api/file/{{fileId}}`

### 断言

* 返回 fileId 正确
* 返回 `mimeType`
* 返回 `encryptFlag`

---

# 12. 07. System 模块

---

## 12.1 获取今日运势

### 接口

`GET /api/system/fortune/today`

### 断言

* `data.title` 不为空
* `data.summary` 不为空
* 传入 `luckyNumber` 时，返回值与请求一致

---

## 12.2 校验幸运数字

### 接口

`POST /api/system/disguise/verify-lucky-number`

### 成功用例

请求体：

```json
{
  "luckyNumber": "13"
}
```

断言：

* HTTP 200
* `code = 0`
* `data.matched` 为布尔值
* `data.nextAction` 为 `ENTER_HIDDEN_ENTRY` 或 `SHOW_FORTUNE`
* `data.luckyNumber` 等于请求值

### 失败用例 1：参数缺失

请求体：

```json
{}
```

断言：

* `code = 400001`

### 失败用例 2：数据库缺失有效 luckyCode 配置

断言：

* `code = 420202`
* `message` 可识别为配置缺失

### 失败用例 3：校验不命中

断言：

* HTTP 200
* `code = 0`
* `data.matched = false`
* `data.nextAction = SHOW_FORTUNE`

---

## 12.3 获取伪装页配置

### 接口

`GET /api/system/disguise-config`

### 断言

* `siteTitle` 存在
* `theme` 存在

---

# 13. 08. WebSocket 测试清单

Postman 对 WebSocket 支持有限，Apifox 或专用 WebSocket 工具会更方便。这里给你“测试项清单 + 报文样例”。

---

## 13.1 建立连接

### URL

`{{wsUrl}}`

### Header

```text
Authorization: Bearer {{accessToken}}
```

### 验证点

* token 正确时建连成功
* token 错误时建连失败

---

## 13.2 发送文本消息

### 报文

```json
{
  "type": "CHAT_SEND",
  "data": {
    "messageId": "m_ws_1001",
    "conversationId": "{{conversationId}}",
    "receiverUid": "{{userUidB}}",
    "messageType": "text",
    "payloadType": "encrypted",
    "payload": "ciphertext_sample",
    "fileId": null,
    "clientMsgTime": 1712300000000
  }
}
```

### 验证点

* 发送后收到 `CHAT_ACK`
* 对端收到 `CHAT_RECEIVE`

---

## 13.3 发送图片消息

### 报文

```json
{
  "type": "CHAT_SEND",
  "data": {
    "messageId": "m_ws_1002",
    "conversationId": "{{conversationId}}",
    "receiverUid": "{{userUidB}}",
    "messageType": "image",
    "payloadType": "ref",
    "payload": "{\"fileId\":\"{{fileId}}\"}",
    "fileId": "{{fileId}}",
    "clientMsgTime": 1712300001000
  }
}
```

### 验证点

* ACK 正常
* 对端收到消息
* 文件 ID 正确透传

---

## 13.4 已读通知

### 报文

```json
{
  "type": "CHAT_READ",
  "data": {
    "conversationId": "{{conversationId}}",
    "messageIds": ["m_ws_1001"],
    "readerUid": "{{userUidA}}",
    "readAt": 1712300005000
  }
}
```

### 验证点

* 服务端可接收
* 对端可收到已读事件

---

## 13.5 幂等验证

### 方法

使用相同 `messageId` 连续发两次相同消息。

### 验证点

* 服务端不应重复落库
* 对端不应重复展示两次

---

## 13.6 断线重连

### 方法

* 断开 WebSocket
* 重新建立连接
* 调用 `/api/message/pending`

### 验证点

* 未送达消息可补偿

---

# 14. 99. 清理与回归

---

## 14.1 清理测试联系人

如果后端提供测试清理接口，可在这里放。

如果没有，建议通过测试数据库脚本清理。

---

## 14.2 回归测试建议顺序

每次版本回归至少执行：

1. 获取运势页
2. 发送验证码
3. 登录
4. 获取当前用户信息
5. 搜索用户
6. 添加联系人
7. 创建会话
8. 获取会话列表
9. 获取上传签名
10. 文件 complete
11. WebSocket 发文本消息
12. WebSocket 发图片消息
13. 拉取历史消息
14. 标记已读
15. 刷新 token
16. 登出

---

# 15. Apifox / Postman 断言建议

---

## 15.1 登录接口自动提取 token

```javascript
const jsonData = pm.response.json();
pm.test("登录成功", function () {
    pm.expect(jsonData.code).to.eql(0);
    pm.expect(jsonData.data.accessToken).to.exist;
});

pm.environment.set("accessToken", jsonData.data.accessToken);
pm.environment.set("refreshToken", jsonData.data.refreshToken);
pm.environment.set("userUidA", jsonData.data.userInfo.userUid);
```

---

## 15.2 创建会话自动提取 conversationId

```javascript
const jsonData = pm.response.json();
pm.test("创建/获取会话成功", function () {
    pm.expect(jsonData.code).to.eql(0);
    pm.expect(jsonData.data.conversationId).to.exist;
});

pm.environment.set("conversationId", jsonData.data.conversationId);
```

---

## 15.3 获取上传签名自动提取 fileId

```javascript
const jsonData = pm.response.json();
pm.test("获取上传签名成功", function () {
    pm.expect(jsonData.code).to.eql(0);
    pm.expect(jsonData.data.fileId).to.exist;
});

pm.environment.set("fileId", jsonData.data.fileId);
```

---

# 16. 最小冒烟测试集

如果只跑一轮最小冒烟，建议保留以下 12 个接口/动作：

1. `GET /api/system/fortune/today`
2. `POST /api/system/disguise/verify-lucky-number`
3. `POST /api/auth/email/send-code`
4. `POST /api/auth/email/password-login`
5. `GET /api/user/me`
6. `GET /api/user/search`
7. `POST /api/contact/add`
8. `POST /api/conversation/single`
9. `GET /api/conversation/list`
10. `POST /api/file/upload-sign`
11. WebSocket 发送文本消息
12. `GET /api/message/history`

这 12 项通过，基本能证明主链路是通的。

---

# 17. 验收口径

这份接口测试清单执行后，若满足以下标准，可视为“接口层通过”：

* Auth 接口通过率 100%
* Contact / Conversation / Message / File 核心接口通过率 100%
* WebSocket 文本消息、图片消息、ACK、重连补偿均通过
* 所有越权测试均被正确拦截
* 上传限制与频控符合预期

