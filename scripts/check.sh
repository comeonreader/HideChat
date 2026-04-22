#!/usr/bin/env bash

set -euo pipefail

source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/compose-common.sh"

MODE="$(resolve_gateway_mode "${1:-}")"
mapfile -t COMPOSE_ARGS < <(compose_file_args "${MODE}")

set -a
source "${ENV_FILE}"
set +a

echo "Gateway mode: ${MODE}"

detect_lan_ip() {
  hostname -I 2>/dev/null | awk '{print $1}'
}

wait_for_http() {
  local url="$1"
  local output_file="$2"
  local attempts="${3:-20}"
  local sleep_seconds="${4:-2}"

  local i
  for ((i = 1; i <= attempts; i++)); do
    if curl --fail --silent --show-error "${url}" >"${output_file}"; then
      return 0
    fi
    sleep "${sleep_seconds}"
  done

  return 1
}

echo "== docker compose ps =="
docker compose "${COMPOSE_ARGS[@]}" ps

echo
echo "== backend =="
wait_for_http "http://127.0.0.1:${BACKEND_PORT}/api/system/fortune/today" /tmp/hidechat-backend-check.json
cat /tmp/hidechat-backend-check.json

echo
echo "== frontend =="
if [[ "${MODE}" == "host" ]]; then
  wait_for_http "http://127.0.0.1:${FRONTEND_PORT}/" /tmp/hidechat-frontend-check.html
else
  docker compose "${COMPOSE_ARGS[@]}" exec -T frontend sh -lc 'wget -qO- http://127.0.0.1/' >/tmp/hidechat-frontend-check.html
fi
grep -q "HideChat" /tmp/hidechat-frontend-check.html
echo "frontend ok"

echo
echo "== gateway =="
wait_for_http "http://127.0.0.1:${GATEWAY_PORT}/" /tmp/hidechat-gateway-check.html
grep -q "HideChat" /tmp/hidechat-gateway-check.html
echo "gateway ok"

LAN_IP="$(detect_lan_ip || true)"
if [[ -n "${LAN_IP}" ]]; then
  echo
  echo "== gateway (lan: ${LAN_IP}) =="
  wait_for_http "http://${LAN_IP}:${GATEWAY_PORT}/" /tmp/hidechat-gateway-lan-check.html
  grep -q "HideChat" /tmp/hidechat-gateway-lan-check.html
  echo "gateway lan ok"
fi

echo
echo "== postgres =="
docker compose "${COMPOSE_ARGS[@]}" exec -T postgres pg_isready -U "${POSTGRES_USER}" -d "${POSTGRES_DB}"
docker compose "${COMPOSE_ARGS[@]}" exec -T postgres psql -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" -c "select schema_name from information_schema.schemata where schema_name = '${POSTGRES_SCHEMA}';"

echo
echo "== redis =="
docker compose "${COMPOSE_ARGS[@]}" exec -T redis redis-cli ping
