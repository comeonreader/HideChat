# Docker Gateway 两套修复方案

## 背景

当前仓库的网关问题本质上是：

- `nginx` 使用 `network_mode: "host"` 时，不再加入 Compose 默认网络
- 此时 `nginx` 不能依赖 Compose 服务名 DNS 去解析 `backend`、`frontend`
- 如果继续把 upstream 写成 Compose 服务名，就会在启动时报 `host not found in upstream`
- 如果改成固定容器 IP，也会因为容器重建后 IP 漂移而再次失效

本次修复将网关配置改为模板化，并提供两种独立可切换方案。

## 方案 A：Bridge 网络方案

### 适用场景

- 本地开发
- 单机 Docker Compose 联调
- 希望保持 Compose 服务发现能力
- 希望减少端口暴露面

### 原理

- `nginx` 加入 Compose 默认网络
- upstream 直接使用服务名：
  - `backend:8080`
  - `frontend:80`
- 对宿主机只暴露网关端口

### 启动方式

```bash
./scripts/up.sh bridge
```

等价命令：

```bash
docker compose --env-file .env -f docker-compose.yml -f docker-compose.bridge-network.yml up -d --build
```

### 优点

- 结构最稳定，符合 Compose 默认工作方式
- 不依赖容器 IP
- 前端容器不需要额外暴露到宿主机
- 网关配置最接近生产反向代理模型

### 注意点

- `nginx` 必须和 `backend`、`frontend` 在同一个 Compose 网络中
- 如果单独把 nginx 容器拿出 Compose 网络做 `nginx -t`，服务名不会被解析

## 方案 B：Host 网络方案

### 适用场景

- 明确要求 `nginx` 使用宿主机网络
- 需要直接绑定宿主机 80 端口且不想再做额外端口映射
- 某些依赖宿主机网络语义的开发/部署环境

### 原理

- 保留 `nginx` 的 `network_mode: "host"`
- `nginx` upstream 改为宿主机地址：
  - `127.0.0.1:${BACKEND_PORT}`
  - `127.0.0.1:${FRONTEND_PORT}`
- 因为 `frontend` 不再通过 Compose DNS 被 `nginx` 发现，所以额外把前端容器端口发布到宿主机

### 启动方式

```bash
./scripts/up.sh host
```

等价命令：

```bash
docker compose --env-file .env -f docker-compose.yml -f docker-compose.host-network.yml up -d --build
```

### 优点

- 保留 host 网络模式
- 不依赖 Compose DNS
- 容器重建后不会再受固定 IP 漂移影响

### 注意点

- `FRONTEND_PORT` 会被实际占用，默认是 `5173`
- `BACKEND_PORT`、`FRONTEND_PORT`、`GATEWAY_PORT` 不能冲突
- 该方案比 bridge 方案多暴露一个前端端口

## 当前实现

本次实现包含：

- 基础文件：[docker-compose.yml](/home/reader/HideChat/docker-compose.yml)
- bridge 方案 override：[docker-compose.bridge-network.yml](/home/reader/HideChat/docker-compose.bridge-network.yml)
- host 方案 override：[docker-compose.host-network.yml](/home/reader/HideChat/docker-compose.host-network.yml)
- nginx 模板：[docker/nginx/default.conf.template](/home/reader/HideChat/docker/nginx/default.conf.template)
- 启停脚本：
  - [scripts/up.sh](/home/reader/HideChat/scripts/up.sh)
  - [scripts/down.sh](/home/reader/HideChat/scripts/down.sh)
  - [scripts/check.sh](/home/reader/HideChat/scripts/check.sh)
- 配置校验脚本：[scripts/verify-gateway-config.sh](/home/reader/HideChat/scripts/verify-gateway-config.sh)

## 切换建议

- 默认优先使用方案 A `bridge`
- 只有在部署环境明确要求 `network_mode: "host"` 时，再切换到方案 B `host`
