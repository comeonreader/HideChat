#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${ROOT_DIR}/.env"

if [[ ! -f "${ENV_FILE}" ]]; then
  ENV_FILE="${ROOT_DIR}/.env.example"
fi

echo "Using env file: ${ENV_FILE}"
docker compose --env-file "${ENV_FILE}" -f "${ROOT_DIR}/docker-compose.yml" up -d --build
