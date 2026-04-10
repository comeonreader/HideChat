#!/bin/bash
# 测试 HideChat 邮箱验证码功能

echo "=== HideChat 邮箱验证码功能测试 ==="
echo ""

# 1. 检查配置文件
echo "1. 检查后端配置..."
if grep -q "HIDECHAT_MAIL_ENABLED:true" backend/src/main/resources/application.yml; then
    echo "   ✓ 邮件功能已启用 (HIDECHAT_MAIL_ENABLED:true)"
else
    echo "   ✗ 邮件功能未启用"
fi

# 2. 检查前端提示
echo ""
echo "2. 检查前端提示信息..."
if grep -q "验证码已发送，请查看测试邮件服务" frontend/src/app/App.tsx; then
    echo "   ✓ 前端提示已更新为测试邮件服务"
else
    echo "   ✗ 前端提示未更新"
fi

# 3. 检查 docker-compose 配置
echo ""
echo "3. 检查 docker-compose 配置..."
if grep -q "mailpit" docker-compose.yml; then
    echo "   ✓ MailPit 服务已添加到 docker-compose"
else
    echo "   ✗ MailPit 服务未添加"
fi

# 4. 检查环境变量示例
echo ""
echo "4. 检查环境变量配置..."
if grep -q "MAILPIT" .env.example; then
    echo "   ✓ 邮件环境变量已添加到 .env.example"
else
    echo "   ✗ 邮件环境变量未添加"
fi

# 5. 检查 LoggingEmailCodeSender 改进
echo ""
echo "5. 检查 LoggingEmailCodeSender 改进..."
if grep -q "开发提示：如需真实发送邮件" backend/src/main/java/com/hidechat/modules/auth/service/impl/LoggingEmailCodeSender.java; then
    echo "   ✓ LoggingEmailCodeSender 已添加开发提示"
else
    echo "   ✗ LoggingEmailCodeSender 未改进"
fi

echo ""
echo "=== 测试完成 ==="
echo ""
echo "启动说明："
echo "1. 复制 .env.example 为 .env"
echo "2. 启动服务: docker-compose up -d"
echo "3. 访问 MailPit 界面: http://localhost:8025"
echo "4. 访问前端: http://localhost:5173"
echo "5. 输入幸运数字进入隐藏入口"
echo "6. 在登录页面输入邮箱，点击发送验证码"
echo "7. 在 MailPit 界面查看收到的验证码"