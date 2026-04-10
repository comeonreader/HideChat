#!/bin/bash

echo "=== 验证 HideChat 项目环境 ==="
echo "当前目录: $(pwd)"
echo ""

# 检查是否在 HideChat 目录
if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    echo "错误: 请在 HideChat 项目根目录运行此脚本"
    echo "当前目录内容:"
    ls -la
    exit 1
fi

# 1. 检查基本工具
echo "1. 检查基本工具:"
echo "   git: $(which git) ($(git --version | cut -d' ' -f3))"
echo "   rg: $(which rg) ($(rg --version | head -1 | cut -d' ' -f2))"
echo "   mvn: $(which mvn) ($(mvn --version | head -1 | cut -d' ' -f3))"
echo "   npm: $(which npm) (v$(npm --version))"
echo "   node: $(which node) (v$(node --version))"
echo ""

# 2. 检查项目结构
echo "2. 检查项目结构:"
if [ -d "backend" ]; then
    echo "   ✓ backend 目录存在"
    if [ -f "backend/pom.xml" ]; then
        echo "   ✓ backend/pom.xml 存在"
    else
        echo "   ✗ backend/pom.xml 不存在"
    fi
else
    echo "   ✗ backend 目录不存在"
fi

if [ -d "frontend" ]; then
    echo "   ✓ frontend 目录存在"
    if [ -f "frontend/package.json" ]; then
        echo "   ✓ frontend/package.json 存在"
    else
        echo "   ✗ frontend/package.json 不存在"
    fi
else
    echo "   ✗ frontend 目录不存在"
fi
echo ""

# 3. 测试 git 命令
echo "3. 测试 git 命令:"
git status --short | head -10
echo ""

# 4. 测试 rg 命令
echo "4. 测试 rg 命令:"
rg --files --max-depth=3 | wc -l | xargs echo "   文件总数 (深度3):"
echo "   示例文件:"
rg --files --max-depth=3 | head -5
echo ""

# 5. 测试前端构建
echo "5. 测试前端构建:"
cd frontend
echo "   TypeScript 版本: $(npx tsc --version 2>/dev/null || echo '未安装')"
echo "   Vite 版本: $(npx vite --version 2>/dev/null || echo '未安装')"
cd ..
echo ""

# 6. 测试后端构建
echo "6. 测试后端构建:"
cd backend
mvn --version | head -1
cd ..
echo ""

# 7. 测试前端测试
echo "7. 测试前端测试:"
cd frontend
if [ -f "node_modules/.bin/vitest" ]; then
    echo "   Vitest 已安装"
    echo "   运行测试检查..."
    npm run test -- --version 2>&1 | tail -5
else
    echo "   Vitest 未安装，运行 npm install"
fi
cd ..
echo ""

# 8. 测试后端测试（跳过实际运行）
echo "8. 测试后端测试:"
cd backend
mvn test -DskipTests=true 2>&1 | tail -5
cd ..
echo ""

echo "=== 环境验证完成 ==="
echo ""
echo "可用命令:"
echo "  git status          - 查看 git 状态"
echo "  rg --files          - 列出所有文件"
echo "  cd frontend && npm run test - 运行前端测试"
echo "  cd backend && mvn test      - 运行后端测试"
echo "  cd frontend && npm run build - 构建前端"
echo "  cd backend && mvn compile   - 编译后端"