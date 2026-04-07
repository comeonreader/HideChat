# 《Spring Boot 实体类与 MyBatis-Plus Mapper 设计文档 v1.0》

适用范围：

* 后端框架：Spring Boot 3.x
* ORM：MyBatis-Plus
* 数据库：PostgreSQL
* 架构风格：单体模块化
* 目标：支撑当前版本的 Web 隐私聊天系统

---

# 1. 文档目标

本文档定义：

* Spring Boot 后端实体类设计
* MyBatis-Plus Mapper 设计
* 包结构建议
* 通用基类设计
* 枚举类设计
* DO / DTO / VO 分层建议
* Mapper 接口职责
* 推荐实现规范

目标是让你可以直接开始：

* 建工程
* 建实体
* 建 Mapper
* 建 Service

---

# 2. 总体设计原则

## 2.1 分层清晰

建议采用：

* Entity：数据库实体
* Mapper：数据库访问层
* Service：业务逻辑层
* DTO：接口请求/响应传输对象
* VO：前端展示对象

---

## 2.2 实体只映射数据库

Entity 只负责：

* 表结构映射
* 不承担复杂业务逻辑
* 不直接暴露给前端

---

## 2.3 Mapper 保持“薄”

Mapper 负责：

* 单表 CRUD
* 简单查询
* 少量明确的联表 SQL

不要把复杂业务堆在 Mapper 里。

---

## 2.4 尽量避免直接返回 Entity

Controller 不要直接返回 Entity，建议通过 VO 输出。

---

# 3. 推荐工程包结构

```text
com.hidechat
├── HideChatApplication.java
├── common
│   ├── base
│   │   ├── BaseEntity.java
│   │   ├── BaseMapperExt.java
│   │   └── BasePageQuery.java
│   ├── config
│   ├── constant
│   ├── enums
│   ├── exception
│   ├── response
│   └── util
├── modules
│   ├── auth
│   │   ├── controller
│   │   ├── dto
│   │   ├── service
│   │   ├── service.impl
│   │   └── vo
│   ├── user
│   │   ├── controller
│   │   ├── dto
│   │   ├── service
│   │   ├── service.impl
│   │   └── vo
│   ├── contact
│   ├── conversation
│   ├── message
│   ├── file
│   └── disguise
├── persistence
│   ├── entity
│   ├── mapper
│   └── xml
└── websocket
    ├── dto
    ├── handler
    └── session
```


