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

PROFILE="${1:-full}"
mkdir -p "$LOG_DIR"
VERIFY_LOG="$LOG_DIR/verify_${PROFILE}.log"

echo "==> 开始验证: $PROFILE" | tee "$VERIFY_LOG"

run_cmd() {
  local name="$1"
  local cmd="$2"
  echo "\n---- $name ----" | tee -a "$VERIFY_LOG"
  bash -lc "$cmd" | tee -a "$VERIFY_LOG"
}

case "$PROFILE" in
  none)
    echo "跳过验证" | tee -a "$VERIFY_LOG"
    ;;
  backend)
    run_cmd "backend test" "$BACKEND_TEST_CMD"
    ;;
  frontend)
    run_cmd "frontend test/build" "$FRONTEND_TEST_CMD"
    ;;
  full)
    run_cmd "backend test" "$BACKEND_TEST_CMD"
    run_cmd "frontend test/build" "$FRONTEND_TEST_CMD"
    if [[ "$ENABLE_DOCKER_VERIFY" == "true" ]]; then
      run_cmd "docker compose up" "$DOCKER_UP_CMD"
      run_cmd "docker compose ps" "$DOCKER_PS_CMD"
      run_cmd "backend health" "$BACKEND_HEALTH_CMD"
      run_cmd "frontend health" "$FRONTEND_HEALTH_CMD"
    fi
    ;;
  *)
    echo "未知验证类型: $PROFILE" | tee -a "$VERIFY_LOG"
    exit 1
    ;;
esac

echo "==> 验证完成: $VERIFY_LOG"
