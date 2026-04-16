#!/bin/bash
# 局域网访问诊断脚本
# 在其他机器上运行

SERVER="192.168.209.157"
PORTS="5173 80 18081 8080 8025"

echo "=== HideChat 局域网访问诊断 ==="
echo "服务器: $SERVER"
echo "时间: $(date)"
echo ""

# 检查命令是否存在
check_cmd() {
    command -v $1 >/dev/null 2>&1
}

# 测试连接
test_port() {
    local port=$1
    local service=$2
    
    if check_cmd nc; then
        if nc -z -w 2 $SERVER $port 2>/dev/null; then
            echo "✅ 端口 $port ($service): 开放"
            return 0
        else
            echo "❌ 端口 $port ($service): 关闭"
            return 1
        fi
    elif check_cmd telnet; then
        if timeout 2 telnet $SERVER $port 2>/dev/null | grep -q "Connected"; then
            echo "✅ 端口 $port ($service): 开放"
            return 0
        else
            echo "❌ 端口 $port ($service): 关闭"
            return 1
        fi
    else
        echo "⚠️  无法测试端口 $port (需要 nc 或 telnet)"
        return 2
    fi
}

# 测试所有端口
echo "测试端口连接:"
test_port 5173 "前端(原始)"
test_port 80 "Nginx网关"
test_port 18081 "前端(新配置)"
test_port 8080 "后端API"
test_port 8025 "邮件测试"

echo ""
echo "=== 建议访问地址 ==="
echo "1. http://$SERVER:18081  (新配置，推荐)"
echo "2. http://$SERVER:5173   (原始配置)"
echo "3. http://$SERVER:80     (Nginx网关)"

echo ""
echo "=== 如果都无法访问 ==="
echo "1. 检查路由器设置:"
echo "   - 禁用 'AP隔离' 或 '客户端隔离'"
echo "   - 确保所有设备在同一子网"
echo ""
echo "2. 检查防火墙:"
echo "   - Windows: 控制面板 → Windows Defender 防火墙"
echo "   - Mac: 系统设置 → 安全性与隐私 → 防火墙"
echo ""
echo "3. 临时解决方案:"
echo "   - 使用手机热点测试"
echo "   - 连接同一WiFi的不同频段(2.4G/5G)"

echo ""
echo "=== 网络诊断 ==="
if check_cmd ping; then
    echo "Ping测试:"
    if ping -c 2 -W 1 $SERVER >/dev/null 2>&1; then
        echo "✅ 可以ping通服务器"
    else
        echo "❌ 无法ping通服务器"
        echo "   检查网络连接和IP地址"
    fi
fi

echo ""
echo "诊断完成。"