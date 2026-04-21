#!/usr/bin/env bash

set -euo pipefail

source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/compose-common.sh"

MODE="$(resolve_gateway_mode "${1:-}")"
mapfile -t COMPOSE_ARGS < <(compose_file_args "${MODE}")

echo "Using env file: ${ENV_FILE}"
echo "Gateway mode: ${MODE}"
docker compose "${COMPOSE_ARGS[@]}" down --remove-orphans
