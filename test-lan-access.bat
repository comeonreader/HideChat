@echo off
chcp 65001 >nul
echo ========================================
echo      HideChat 局域网访问测试 (Windows)
echo ========================================
echo.
set SERVER_IP=192.168.209.157
set TIMEOUT_MS=2000

echo 服务器IP: %SERVER_IP%
echo 测试时间: %date% %time%
echo.

echo 1. 测试网络连通性:
ping -n 2 -w 1000 %SERVER_IP% >nul 2>&1
if %errorlevel% equ 0 (
    echo   可以ping通服务器 %SERVER_IP%
) else (
    echo   无法ping通服务器 %SERVER_IP%
    echo   请检查网络连接
    pause
    exit /b 1
)

echo.
echo 2. 测试服务端口:
echo.

REM 测试端口 5173 (前端)
powershell -Command "$tcp = New-Object System.Net.Sockets.TcpClient; try { $tcp.Connect('%SERVER_IP%', 5173); $tcp.Close(); echo '   端口 5173 (前端): 开放'; echo '      访问地址: http://%SERVER_IP%:5173' } catch { echo '   端口 5173 (前端): 关闭或无法访问' }" 2>nul

REM 测试端口 80 (Nginx)
powershell -Command "$tcp = New-Object System.Net.Sockets.TcpClient; try { $tcp.Connect('%SERVER_IP%', 80); $tcp.Close(); echo '   端口 80 (Nginx网关): 开放'; echo '      访问地址: http://%SERVER_IP%:80' } catch { echo '   端口 80 (Nginx网关): 关闭或无法访问' }" 2>nul

REM 测试端口 8025 (邮件界面)
powershell -Command "$tcp = New-Object System.Net.Sockets.TcpClient; try { $tcp.Connect('%SERVER_IP%', 8025); $tcp.Close(); echo '   端口 8025 (邮件测试): 开放'; echo '      访问地址: http://%SERVER_IP%:8025' } catch { echo '   端口 8025 (邮件测试): 关闭或无法访问' }" 2>nul

echo.
echo 3. 快速访问链接:
echo.
echo   前端应用: http://%SERVER_IP%:5173
echo   Nginx网关: http://%SERVER_IP%:80
echo   邮件测试: http://%SERVER_IP%:8025
echo   后端API: http://%SERVER_IP%:8080
echo.
echo ========================================
echo.
echo 如果无法访问，请检查:
echo 1. Windows防火墙设置
echo 2. 路由器客户端隔离设置
echo 3. 确保在同一局域网
echo.
echo 按任意键退出...
pause >nul