# 清语 Qingyu（工程代号 HideChat）

自托管 · 微信风格 · 短暂消息自动销毁的一对一即时通讯（Web 版）。
**实现已完成并通过端到端验证**，完整方案见 [docs/DESIGN.md](docs/DESIGN.md)。
**服务器快速部署**：见 [docs/DEPLOY.md](docs/DEPLOY.md)（10 分钟部署指南，含备份/HTTPS/排查）。

## 功能

- Docker 一键部署；手机/电脑浏览器均可访问（PWA 可添加到主屏幕）
- 微信风格 UI：文字/图片/视频/**语音（按住说话）**、送达/已读对勾、撤回、未读红点
- WebSocket 实时收发（登录即连，断线自动重连+心跳）
- 免验证码注册（用户名+密码+确认密码）；搜索/申请/同意/删除好友
- 头像上传/更换/删除：展示于**左上角昵称旁、消息列表、聊天页（双方气泡旁）、通讯录、新的朋友、我**，圆角方形；好友端实时同步
- **消息销毁（双向计时）**：
  - 发送方：消息发出 20 分钟后自己不可见（气泡旁倒计时）
  - 接收方：打开会话只算已读（不销毁）；**回复对方后才开始计时**，20 分钟后销毁对方消息；
    未回复前消息一直等待，不会提前销毁
  - 服务器物理删除消息与媒体文件；未回复消息超 30 天兜底清理（可配）
- 图片灯箱预览、视频在线播放（支持拖动 Range）
- 登录：有效期 7 天（可勾选"保持登录"；不勾选=关闭浏览器即退出），登录页有友好提示

## 一键部署

    cp docker/.env.example .env      # 修改 DB_PASSWORD 与 JWT_SECRET（必改！）
    docker compose up -d --build
    # 浏览器访问 http://<服务器IP>:8080

升级：git pull && docker compose up -d --build（数据在 volume 中不丢失）
查看日志：docker compose logs -f app

## 配置项（.env）

| 变量 | 默认 | 说明 |
|---|---|---|
| DB_PASSWORD | （必改） | PostgreSQL 密码 |
| JWT_SECRET | （必改） | JWT 签名密钥，建议 openssl rand -hex 32 |
| APP_PORT | 8080 | 对外端口 |
| JWT_DAYS | 7 | 登录有效期（天） |
| MSG_TTL_MINUTES | 20 | 消息销毁时长（分钟） |
| RECALL_WINDOW_MINUTES | 2 | 撤回窗口 |
| UNREAD_MAX_DAYS | 30 | 未回复消息最长保留天数（兜底清理） |
| REGISTER_RATE_LIMIT | 10 | 每 IP 每小时注册上限（免验证码的防滥用） |

## 备份

    docker compose exec db pg_dump -U hidechat hidechat > backup.sql
    # 另需备份两个 volume：uploads（媒体）、avatars（头像）
    docker run --rm -v hidechat_uploads:/d -v $PWD:/b alpine tar czf /b/uploads.tgz -C /d .
    docker run --rm -v hidechat_avatars:/d -v $PWD:/b alpine tar czf /b/avatars.tgz -C /d .

## 开发

    # 依赖：JDK17+ / Node 20+ / Docker
    bash scripts/dev-db.sh            # 本机 PostgreSQL（127.0.0.1:5434）
    cd server && mvn spring-boot:run  # 后端 :8080
    cd web && npm i && npm run dev    # 前端 :5173（代理到 8080）

测试：server 集成测试（真 PG）：cd server && mvn test
浏览器端到端（真实 Chromium，位于 web/）：e2e-m2（好友聊天）、e2e-avatar（头像点位/圆角/实时同步）、
e2e-media、e2e-voice、e2e-layout（输入栏双端固定）、e2e-brand、e2e-destroy（TTL=1 需 MSG_TTL_MINUTES=1）

## 代码结构

    server/   Spring Boot 3：auth/user/friend/chat/ws/media/sweep + Flyway（V1-V3）
    web/      Vue 3 + Pinia + TS（微信风 UI，双端响应式）
    Dockerfile / docker-compose.yml / docker/.env.example
    docs/DESIGN.md   完整设计文档（v1.2 变更见附录 B）