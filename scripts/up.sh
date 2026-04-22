#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
source "${SCRIPT_DIR}/compose-common.sh"

MODE="${1:-${HIDECHAT_GATEWAY_MODE:-bridge}}"

if [[ "${MODE}" == "lan" ]]; then
  COMPOSE_ARGS=(--env-file "${ENV_FILE}" -f "${ROOT_DIR}/docker-compose.lan.yml")
else
  MODE="$(resolve_gateway_mode "${MODE}")"
  mapfile -t COMPOSE_ARGS < <(compose_file_args "${MODE}")
fi

set -a
source "${ENV_FILE}"
set +a

echo "Using env file: ${ENV_FILE}"
echo "Gateway mode: ${MODE}"
docker compose "${COMPOSE_ARGS[@]}" up -d --build

detect_lan_ip() {
  hostname -I 2>/dev/null | awk '{print $1}'
}

LAN_IP="$(detect_lan_ip || true)"

echo
echo "Access URLs:"
if [[ "${MODE}" == "lan" ]]; then
  echo "  frontend(local): http://127.0.0.1:${LAN_FRONTEND_PORT:-18081}"
  echo "  backend(local):  http://127.0.0.1:${LAN_BACKEND_PORT:-18080}"
  if [[ -n "${LAN_IP}" ]]; then
    echo "  frontend(lan):   http://${LAN_IP}:${LAN_FRONTEND_PORT:-18081}"
    echo "  backend(lan):    http://${LAN_IP}:${LAN_BACKEND_PORT:-18080}"
  fi
else
  echo "  gateway(local):  http://127.0.0.1:${GATEWAY_PORT:-80}"
  if [[ -n "${LAN_IP}" ]]; then
    echo "  gateway(lan):    http://${LAN_IP}:${GATEWAY_PORT:-80}"
  fi
fi
