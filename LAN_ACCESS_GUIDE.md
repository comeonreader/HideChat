# HideChat 局域网访问指南

## 服务器信息
- **服务器IP**: 192.168.209.157
- **操作系统**: Linux
- **部署目录**: /home/reader/HideChat

## 可用服务

### 1. 前端应用
- **地址**: http://192.168.209.157:5173
- **备用地址**: http://192.168.209.157:80
- **说明**: HideChat主界面

### 2. 后端API
- **地址**: http://192.168.209.157:8080
- **说明**: Spring Boot后端服务

### 3. 邮件测试界面
- **地址**: http://192.168.209.157:8025
- **说明**: Mailpit邮件测试工具

### 4. 数据库服务
- **PostgreSQL**: 192.168.209.157:5432
- **Redis**: 192.168.209.157:6379

## 在其他机器上测试连接

### Linux/Mac 用户
```bash
# 下载测试脚本
curl -O http://192.168.209.157:8080/test-lan-access.sh
chmod +x test-lan-access.sh
./test-lan-access.sh

# 或手动测试
ping 192.168.209.157
curl http://192.168.209.157:5173
```

### Windows 用户
1. 下载 `test-lan-access.bat`
2. 双击运行
3. 或手动测试：
   ```cmd
   ping 192.168.209.157
   start http://192.168.209.157:5173
   ```

## 故障排除

### 如果无法访问

#### 1. 检查网络连通性
```bash
# 在客户端机器上执行
ping 192.168.209.157

# 如果ping不通，检查：
# - 是否在同一局域网
# - 路由器客户端隔离设置
# - 防火墙设置
```

#### 2. 检查端口访问
```bash
# Linux/Mac
telnet 192.168.209.157 5173
nc -zv 192.168.209.157 5173

# Windows
Test-NetConnection 192.168.209.157 -Port 5173
```

#### 3. 服务器端检查
```bash
# 在服务器上执行
sudo docker compose ps
sudo netstat -tlnp | grep :5173
sudo ufw status
```

#### 4. 常见问题解决

**问题1**: 可以ping通但无法访问网页
- **原因**: 防火墙阻止了端口
- **解决**: 在服务器上检查防火墙规则

**问题2**: 完全无法连接
- **原因**: 路由器启用了客户端隔离
- **解决**: 登录路由器管理界面，禁用"AP隔离"或"客户端隔离"

**问题3**: 只有某些机器无法访问
- **原因**: 客户端防火墙阻止
- **解决**: 检查客户端防火墙设置

## 服务器管理命令

```bash
# 查看服务状态
sudo docker compose ps

# 查看日志
sudo docker compose logs -f
sudo docker compose logs -f backend
sudo docker compose logs -f nginx

# 重启服务
sudo docker compose restart

# 停止服务
sudo docker compose down

# 启动服务
sudo docker compose up -d
```

## 网络配置验证

服务器已确认配置：
- ✅ 服务绑定到 0.0.0.0 (所有网络接口)
- ✅ 防火墙未启用 (ufw status: inactive)
- ✅ Docker端口映射正确
- ✅ 本机可通过局域网IP访问

## 联系支持

如果以上步骤都无法解决问题，请提供：
1. 客户端操作系统
2. 错误信息截图
3. 测试命令输出
4. 网络拓扑信息

---
*最后更新: 2026-04-15*
*服务器IP: 192.168.209.157*