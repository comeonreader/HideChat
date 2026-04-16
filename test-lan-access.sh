#!/bin/bash

# HideChat 局域网访问测试脚本
# 在其他Linux机器上运行此脚本测试连接

SERVER_IP="192.168.209.157"
PORTS=("5173" "80" "8080" "8025")

echo "=== HideChat 局域网访问测试 ==="
echo "服务器IP: $SERVER_IP"
echo "测试时间: $(date)"
echo ""

# 测试网络连通性
echo "1. 测试网络连通性:"
if ping -c 2 -W 1 $SERVER_IP > /dev/null 2>&1; then
    echo "   ✅ 可以ping通服务器 $SERVER_IP"
else
    echo "   ❌ 无法ping通服务器 $SERVER_IP"
    echo "   请检查网络连接或防火墙设置"
    exit 1
fi

echo ""
echo "2. 测试服务端口:"

for port in "${PORTS[@]}"; do
    case $port in
        5173)
            service_name="前端 (Nginx代理)"
            ;;
        80)
            service_name="Nginx网关"
            ;;
        8080)
            service_name="后端API"
            ;;
        8025)
            service_name="邮件测试界面"
            ;;
        *)
            service_name="未知服务"
            ;;
    esac
    
    if timeout 2 bash -c "cat < /dev/null > /dev/tcp/$SERVER_IP/$port" 2>/dev/null; then
        echo "   ✅ 端口 $port ($service_name): 开放"
        echo "     访问地址: http://$SERVER_IP:$port"
    else
        echo "   ❌ 端口 $port ($service_name): 关闭或无法访问"
    fi
done

echo ""
echo "3. 测试HTTP访问:"

# 测试前端访问
echo "   测试前端访问 (端口 5173):"
http_code=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 http://$SERVER_IP:5173 2>/dev/null || echo "000")
if [[ $http_code =~ ^[2-3] ]]; then
    echo "   ✅ HTTP状态码: $http_code - 可以正常访问"
    echo "      请在浏览器打开: http://$SERVER_IP:5173"
else
    echo "   ❌ HTTP状态码: $http_code - 访问失败"
fi

echo ""
echo "=== 测试完成 ==="
echo ""
echo "如果无法访问，请检查:"
echo "1. 服务器防火墙: sudo ufw status"
echo "2. 路由器客户端隔离设置"
echo "3. 其他机器的防火墙设置"
echo ""
echo "服务器上的服务状态:"
echo "sudo docker compose ps"
echo "sudo docker compose logs"