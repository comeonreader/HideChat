#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

if [[ -f .openclaw.env ]]; then
  # shellcheck disable=SC1091
  source .openclaw.env
else
  # shellcheck disable=SC1091
  source config/project.env.example
fi

mkdir -p "$STATE_DIR" "$LOG_DIR"

# 检查 codex 命令是否可用
if ! command -v "$CODEX_CMD" &> /dev/null; then
  echo "错误: $CODEX_CMD 命令未找到"
  echo "请安装 Codex 或检查 PATH 环境变量"
  exit 1
fi

echo "开始执行所有阶段..."
echo "Codex 命令: $CODEX_CMD"
echo "项目根目录: $ROOT_DIR"
echo ""

while IFS='|' read -r PHASE_ID PHASE_NAME PROMPT_FILE VERIFY_PROFILE; do
  [[ -z "$PHASE_ID" || "$PHASE_ID" =~ ^# ]] && continue
  
  echo "\n=============================="
  echo "执行阶段: $PHASE_ID - $PHASE_NAME"
  echo "=============================="

  # 检查 prompt 文件是否存在
  if [[ ! -f "$PROMPT_FILE" ]]; then
    echo "警告: prompt 文件不存在: $PROMPT_FILE"
    echo "跳过此阶段"
    continue
  fi

  # 执行阶段，添加超时处理
  echo "执行阶段脚本..."
  if timeout 300 bash scripts/run_phase.sh "$PHASE_ID"; then
    echo "阶段执行成功"
  else
    EXIT_CODE=$?
    if [[ $EXIT_CODE -eq 124 ]]; then
      echo "错误: 阶段执行超时 (5分钟)"
    else
      echo "错误: 阶段执行失败，退出码: $EXIT_CODE"
    fi
    echo "跳过后续阶段"
    exit 1
  fi

  echo "\n==> 开始阶段验证: $PHASE_ID"
  if [[ "$VERIFY_PROFILE" != "none" ]]; then
    if bash scripts/verify.sh "$VERIFY_PROFILE"; then
      echo "验证成功"
    else
      echo "\n阶段验证失败: $PHASE_ID"
      echo "请检查日志并决定是否进入修复轮。"
      exit 1
    fi
  else
    echo "跳过验证 (profile: none)"
  fi

done < config/phases.conf

echo "\n所有阶段执行完成。请检查 .openclaw/state/latest_snapshot.md 和日志目录。"
echo "完成时间: $(date)"