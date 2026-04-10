# 《PostgreSQL DDL 建表脚本 v1.1》

说明：

* 适用于 **PostgreSQL 15+**
* 面向当前系统后端表
* 前端本地表（IndexedDB）不属于 PostgreSQL DDL 范围
* 本轮不涉及 schema 变更，仅同步去除 PIN 相关文档描述

---

## 一、建库前约定

如需独立 schema，可先执行：

```sql
create schema if not exists hidechat;
set search_path to hidechat;
```

---

## 二、后端 DDL 范围

当前后端 DDL 仍覆盖以下核心表：

* `im_user`
* `im_user_auth`
* `im_email_code`
* `im_refresh_token`
* `im_contact`
* `im_conversation`
* `im_message`
* `im_file`
* `im_disguise_lucky_code`
* `im_unread_counter`

说明：

* 本轮“去除 PIN 解锁流程”不要求新增、删除或修改任何后端表
* 因此前端去除 PIN 后，不需要新增 migration

---

## 三、后端约束提醒

* `im_conversation` 仍应保证 1V1 用户对唯一
* `last_message_preview` 仍只允许脱敏占位
* 文件访问仍需校验会话归属

---

## 四、前端本地表定义建议（非 PostgreSQL，仅供实现）

前端 IndexedDB 建议维护以下 object store：

### 4.1 `app_meta`

* `key`
* `value`

保存：

* `disguiseConfig`
* `lastInputLuckyNumber`

### 4.2 `conversation_index_local`

* `conversation_id`
* `peer_uid`
* `peer_nickname`
* `peer_avatar`
* `last_message_at`
* `unread_count`
* `preview_strategy`

### 4.3 `message_local`

* `message_id`
* `conversation_id`
* `sender_uid`
* `receiver_uid`
* `message_type`
* `payload`
* `created_at`
* `local_status`

### 4.4 `file_cache`

* `file_id`
* `conversation_id`
* `mime_type`
* `created_at`

当前版本明确不采用：

* `pin_salt`
* `pin_verifier_hash`
* `pin_kdf_params`
* `encrypted_conversation_key`
* `locked`
