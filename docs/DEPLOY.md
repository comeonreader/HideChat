# 清语 Qingyu 服务器部署指南

本文档面向服务器管理员，目标：**10 分钟内在一台干净的 Linux 服务器上完成部署**。
示例系统 Ubuntu 22.04/24.04（Debian 12 同样适用）。命令以 # 开头的注释可直接复制。

---

## 1. 前置条件

| 项目 | 要求 |
|---|---|
| 服务器 | 1 核 CPU / 1 GB 内存 / 5 GB 空闲磁盘（建议 2C2G，头像与媒体走 volume 磁盘） |
| 系统 | Ubuntu 20.04+ / Debian 11+ / 其它 Linux（x86_64 或 arm64） |
| Docker | 24+ 与 Compose v2（docker compose version 有输出即可） |
| 网络 | 能访问 Docker Hub（拉取 postgres/node/eclipse-temurin 基础镜像）；国内服务器可配镜像加速，见 7.3 |
| 时钟 | 服务器时间必须准确（销毁计时以服务器时间为准），见 7.5 |

首次安装 Docker（Ubuntu）：

    apt install -y ca-certificates curl
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" > /etc/apt/sources.list.d/docker.list
    apt update && apt install -y docker-ce docker-compose-plugin
    systemctl enable --now docker

---

## 2. 三步快速部署

### 2.1 获取代码

    # 方式 A：git 部署（推荐，便于升级）
    git clone <你的仓库地址> qingyu && cd qingyu

    # 方式 B：本地打包上传
    # tar czf qingyu.tgz --exclude='.git' --exclude='server/target' --exclude='web/node_modules' --exclude='web/dist' --exclude='.env' .
    # scp qingyu.tgz user@服务器:/opt/ && ssh user@服务器 'cd /opt && tar xzf qingyu.tgz && cd qingyu'

### 2.2 生成配置（.env）

    cp docker/.env.example .env
    # 生成两个强随机密钥（必做！不要使用示例值）
    sed -i "s/^DB_PASSWORD=.*/DB_PASSWORD=$(openssl rand -hex 16)/" .env
    sed -i "s/^JWT_SECRET=.*/JWT_SECRET=$(openssl rand -hex 32)/" .env
    chmod 600 .env
    # 如需修改对外端口：编辑 .env 的 APP_PORT（默认 8080）
    # 可选参数：MSG_TTL_MINUTES(默认20) RECALL_WINDOW_MINUTES(2) UNREAD_MAX_DAYS(30)
    #          JWT_DAYS(7) REGISTER_RATE_LIMIT(10，每IP每小时注册上限)
    cat .env

### 2.3 启动（首次构建约 3-10 分钟，视网络）

    docker compose up -d --build
    docker compose ps          # 等 db 显示 healthy、app 显示 healthy/Up
    # 就绪后访问：http://<服务器IP>:8080

验证是否就绪（API 返回 400 即服务正常，因为缺少登录参数）：

    curl -s -o /dev/null -w '%{http_code}\n' -X POST http://127.0.0.1:8080/api/auth/login -H 'Content-Type: application/json' -d '{}'
    # 期望输出：400

浏览器打开后：先注册第一个账号（用户名+密码+确认密码，免验证码），
再让朋友注册第二个账号并把你的用户名告诉 ta，在「通讯录」搜索添加即可开始聊天。

### 2.4 升级 / 回滚

    # 升级（数据库迁移由 Flyway 自动执行，数据在 volume 中不受影响）
    git pull
    docker compose up -d --build
    docker compose logs -f app        # 观察迁移与启动日志

    # 回滚到上一个版本
    git checkout <上一个提交号>
    docker compose up -d --build

---

## 3. 安全建议

1. 密钥：.env 中 DB_PASSWORD / JWT_SECRET 必须使用随机值（2.2），勿提交到 git。
2. 登录有效期：默认 7 天（JWT_DAYS=7）；用户可在登录页不勾选"保持登录"实现关浏览器即退出。
3. 公网必须 HTTPS：见第 4 节；手机端 PWA"添加到主屏幕"、麦克风录音等能力在 HTTPS 下才完整可用。
4. 防滥用：注册无验证码，默认每 IP 每小时限 10 次注册（REGISTER_RATE_LIMIT）。
   若仍被垃圾注册骚扰：调低该值，或改为仅内网/VPN 访问（第 5 节）。
5. 不要用 root 运行业务容器：镜像内已以 hidechat 非 root 用户运行（docker compose exec app id 可查看）。
6. 定期备份（第 6 节），并关注磁盘水位（uploads/avatars 与 pgdata 会随使用增长；
   超过销毁期的消息与媒体由清扫器自动物理删除，见 docs/DESIGN.md）。

---

## 4. HTTPS（公网部署）

推荐宿主机 Caddy 2 反向代理（自动申请/续期证书，自动透传 WebSocket）。

### 4.1 让 app 只监听本机回环

编辑 docker-compose.yml 的 app.ports：

    ports:
      - "127.0.0.1:8080:8080"     # 只允许本机 Caddy 访问，不再直接对外

然后 docker compose up -d 使其生效。

### 4.2 安装 Caddy 并编写配置

    apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
    apt update && apt install -y caddy

/etc/caddy/Caddyfile：

    chat.example.com {
        encode gzip
        reverse_proxy 127.0.0.1:8080
    }

    systemctl enable --now caddy

（将 chat.example.com 的 A/AAAA 记录指向服务器；Caddy 自动签发证书并处理 WebSocket 升级。）

访问 https://chat.example.com 验证。防火墙仅放行 80/443：

    ufw allow 80/tcp && ufw allow 443/tcp && ufw allow OpenSSH && ufw enable

---

## 5. 网络与访问场景

- 家庭/内网自用（无公网）：直接 http://服务器IP:8080，手机电脑同网段即可；
  PWA 可手动添加到主屏幕。建议在防火墙仅放行可信来源。
- 仅限少数人使用（推荐做法）：用防火墙把 8080 限制为内网/白名单 IP，
  或走 WireGuard/Tailscale 组网后仅内网访问。

---

## 6. 备份与恢复

仓库提供一键备份脚本（pg_dump + uploads/avatars 两个数据卷），建议 cron 每日执行：

    chmod +x scripts/backup.sh
    ./scripts/backup.sh
    # crontab -e  加入：
    30 3 * * * /opt/qingyu/scripts/backup.sh >> /var/log/qingyu-backup.log 2>&1

手动备份等价命令：

    docker compose exec -T db pg_dump -U hidechat hidechat | gzip > backup_$(date +%F).sql.gz
    docker run --rm -v hidechat_uploads:/d -v "$PWD":/b alpine tar czf /b/uploads_$(date +%F).tgz -C /d .
    docker run --rm -v hidechat_avatars:/d -v "$PWD":/b alpine tar czf /b/avatars_$(date +%F).tgz -C /d .

恢复：

    # 1) 恢复数据库（会覆盖当前数据，先停止 app）
    docker compose stop app
    gunzip -c backup_XXXX.sql.gz | docker compose exec -T db psql -U hidechat -d hidechat
    # 2) 恢复两个数据卷
    docker run --rm -v hidechat_uploads:/d -v "$PWD":/b alpine tar xzf /b/uploads_XXXX.tgz -C /d
    docker run --rm -v hidechat_avatars:/d -v "$PWD":/b alpine tar xzf /b/avatars_XXXX.tgz -C /d
    docker compose start app

注意：备份中会包含尚未销毁的消息，属运维侧留存（与"运行期到期物理删除"并存）。

---

## 7. 常见问题排查

### 7.1 状态怎么看？
    docker compose ps                      # 服务状态
    docker compose logs -f app             # 应用日志（含清扫器记录：sweeper deleted ...）
    docker compose logs db | tail -30      # 数据库日志
    docker compose stats                   # 资源占用
    docker compose exec db psql -U hidechat -d hidechat -c '\\dt'   # 直连数据库

### 7.2 app 长时间显示 starting（不 healthy）
健康检查用 java -version 探活（最多约 150 秒内转 healthy）。若一直未就绪，看日志：
    docker compose logs app | tail -50
常见原因：数据库未就绪重试、.env 密钥缺失导致启动失败（日志含 DB_PASSWORD 提示时先检查 .env）。

### 7.3 构建时拉取镜像超时（国内网络）
为 Docker 配置镜像加速（编辑 /etc/docker/daemon.json）：

    { "registry-mirrors": ["https://docker.m.daocloud.io"] }
    systemctl restart docker

再重新 docker compose up -d --build。基础镜像只需首次拉取一次。

### 7.4 头像/图片上传后无法显示
先确认目录与文件：
    docker compose exec app ls -la /data/uploads /data/avatars
若 404 且文件不存在，多为磁盘/挂载异常，查看 app 日志；正常到期消息的媒体会被清扫器删除（预期 404）。

### 7.5 消息销毁时间与预期不符
销毁计时以服务器时间为准（不是用户手机）。校准服务器时间：
    timedatectl set-ntp true && timedatectl status

### 7.6 忘记密码 / 账号被登录锁定
本产品按设计不提供找回/重置密码（隐私优先）。登录失败 5 次会锁定该账号 15 分钟，请稍后再试；
管理员如需干预，只能在数据库层面处理（谨慎操作）：
    docker compose exec db psql -U hidechat -d hidechat -c "update users set ... where username='xxx';"

### 7.7 其它
- 端口被占用：修改 .env 的 APP_PORT 后 docker compose up -d。
- 换机器迁移：停服后按第 6 节备份，新机器按第 2 节部署后执行恢复。
- 手机无法访问：确认与服务器同网段/防火墙放行，浏览器用 http://IP:8080（勿用 https 直连非 TLS 端口）。

---

## 8. 上线检查单

- [ ] .env 使用随机 DB_PASSWORD / JWT_SECRET，且 chmod 600
- [ ] docker compose ps 两个服务 healthy
- [ ] 服务器时间已同步（timedatectl）
- [ ] 防火墙仅放行必要端口（内网使用建议收紧）
- [ ] 公网使用 HTTPS（Caddy 示例见第 4 节）
- [ ] 配置每日备份 cron（第 6 节）
- [ ] 把访问地址与使用说明交给使用者（见 README.md）
