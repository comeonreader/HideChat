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

PHASE_ID="${1:-}"
if [[ -z "$PHASE_ID" ]]; then
  echo "用法: bash scripts/run_phase.sh <phase_id>"
  exit 1
fi

mkdir -p "$STATE_DIR" "$LOG_DIR"

PHASE_LINE=$(grep -E "^${PHASE_ID}\|" config/phases.conf || true)
if [[ -z "$PHASE_LINE" ]]; then
  echo "未找到阶段: $PHASE_ID"
  exit 1
fi

IFS='|' read -r _ PHASE_NAME PROMPT_FILE VERIFY_PROFILE <<< "$PHASE_LINE"
PROMPT_PATH="$ROOT_DIR/$PROMPT_FILE"
GUARDRAILS_PATH="$ROOT_DIR/prompts/common_guardrails.txt"
LOG_FILE="$LOG_DIR/${PHASE_ID}.log"
SNAPSHOT_FILE="$STATE_DIR/${PHASE_ID}_snapshot.md"

if [[ ! -f "$PROMPT_PATH" ]]; then
  echo "缺少 prompt 文件: $PROMPT_PATH"
  exit 1
fi

echo "==> 执行阶段: $PHASE_ID ($PHASE_NAME)"

echo "# 阶段: $PHASE_NAME" > "$LOG_FILE"
echo >> "$LOG_FILE"
cat "$GUARDRAILS_PATH" >> "$LOG_FILE"
echo >> "$LOG_FILE"
cat "$PROMPT_PATH" >> "$LOG_FILE"

PROMPT_CONTENT=$(cat "$GUARDRAILS_PATH"; echo; cat "$PROMPT_PATH")

# 添加超时处理
echo "调用 Codex 执行分析..."
# 直接使用管道传递输入给 Codex
if echo "$PROMPT_CONTENT" | timeout 300 $CODEX_CMD exec 2>&1 | tee -a "$LOG_FILE"; then
  echo "Codex 执行完成"
else
  EXIT_CODE=$?
  if [[ $EXIT_CODE -eq 124 ]]; then
    echo "警告: Codex 执行超时 (5分钟)" | tee -a "$LOG_FILE"
    echo "超时，继续处理已有输出..." | tee -a "$LOG_FILE"
  else
    echo "错误: Codex 执行失败，退出码: $EXIT_CODE" | tee -a "$LOG_FILE"
    exit $EXIT_CODE
  fi
fi

# 提取状态快照
awk '/状态快照|【状态快照】/{flag=1} flag{print}' "$LOG_FILE" > "$SNAPSHOT_FILE" || true
if [[ ! -s "$SNAPSHOT_FILE" ]]; then
  echo "# 状态快照" > "$SNAPSHOT_FILE"
  echo "未从日志中提取到标准状态快照，请人工检查 $LOG_FILE" >> "$SNAPSHOT_FILE"
fi

cp "$SNAPSHOT_FILE" "$STATE_DIR/latest_snapshot.md"

echo "==> 阶段日志: $LOG_FILE"
echo "==> 状态快照: $SNAPSHOT_FILE"

echo "$VERIFY_PROFILE" > "$STATE_DIR/.last_verify_profile"