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

SNAPSHOT_FILE="${1:-.openclaw/state/latest_snapshot.md}"
if [[ ! -f "$SNAPSHOT_FILE" ]]; then
  echo "找不到状态快照: $SNAPSHOT_FILE"
  exit 1
fi

PROMPT=$(cat <<EOF2
请先读取本仓库的 agents.md 和 docs 目录。

以下是上一轮状态快照：

$(cat "$SNAPSHOT_FILE")

要求：
1. 严格遵守 agents.md
2. 不重复生成已有代码
3. 不做大范围重构
4. 优先继续未完成项

请先输出：
1. 你对当前工程状态的理解
2. 当前代码中已存在的关键模块
3. 下一步最合理的开发计划

不要直接写代码。
EOF2
)

$CODEX_CMD exec "$PROMPT"
