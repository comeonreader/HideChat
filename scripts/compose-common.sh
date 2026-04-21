#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${ROOT_DIR}/.env"

if [[ ! -f "${ENV_FILE}" ]]; then
  ENV_FILE="${ROOT_DIR}/.env.example"
fi

resolve_gateway_mode() {
  local mode="${1:-${HIDECHAT_GATEWAY_MODE:-bridge}}"
  case "${mode}" in
    bridge|host)
      printf '%s\n' "${mode}"
      ;;
    *)
      echo "Unsupported gateway mode: ${mode}. Expected bridge or host." >&2
      exit 1
      ;;
  esac
}

compose_file_args() {
  local mode
  mode="$(resolve_gateway_mode "${1:-}")"

  local args=(
    --env-file "${ENV_FILE}"
    -f "${ROOT_DIR}/docker-compose.yml"
  )

  if [[ "${mode}" == "bridge" ]]; then
    args+=(-f "${ROOT_DIR}/docker-compose.bridge-network.yml")
  else
    args+=(-f "${ROOT_DIR}/docker-compose.host-network.yml")
  fi

  printf '%s\n' "${args[@]}"
}
