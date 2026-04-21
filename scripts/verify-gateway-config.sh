#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "${ROOT_DIR}/scripts/compose-common.sh"

check_mode() {
  local mode="$1"
  local output_file
  output_file="$(mktemp)"

  mapfile -t compose_args < <(compose_file_args "${mode}")

  echo "==> docker compose config (${mode})"
  docker compose "${compose_args[@]}" config >"${output_file}"

  if [[ "${mode}" == "bridge" ]]; then
    grep -q 'NGINX_BACKEND_HOST: backend' "${output_file}"
    grep -q 'NGINX_FRONTEND_HOST: frontend' "${output_file}"
  else
    grep -q 'network_mode: host' "${output_file}"
    grep -q 'NGINX_BACKEND_HOST: 127.0.0.1' "${output_file}"
    grep -q 'NGINX_FRONTEND_HOST: 127.0.0.1' "${output_file}"
    grep -q 'published: "5173"' "${output_file}"
  fi

  rm -f "${output_file}"
}

check_nginx_template() {
  local mode="$1"

  if [[ "${mode}" == "bridge" ]]; then
    docker run --rm \
      --add-host backend:127.0.0.1 \
      --add-host frontend:127.0.0.1 \
      -e NGINX_LISTEN_PORT=80 \
      -e NGINX_BACKEND_HOST=backend \
      -e NGINX_BACKEND_PORT=8080 \
      -e NGINX_FRONTEND_HOST=frontend \
      -e NGINX_FRONTEND_PORT=80 \
      -v "${ROOT_DIR}/docker/nginx/default.conf.template:/etc/nginx/templates/default.conf.template:ro" \
      nginx:1.27-alpine nginx -t >/dev/null
  else
    docker run --rm \
      -e NGINX_LISTEN_PORT=80 \
      -e NGINX_BACKEND_HOST=127.0.0.1 \
      -e NGINX_BACKEND_PORT=8080 \
      -e NGINX_FRONTEND_HOST=127.0.0.1 \
      -e NGINX_FRONTEND_PORT=5173 \
      -v "${ROOT_DIR}/docker/nginx/default.conf.template:/etc/nginx/templates/default.conf.template:ro" \
      nginx:1.27-alpine nginx -t >/dev/null
  fi
}

check_mode bridge
check_mode host
echo "==> nginx template syntax (bridge)"
check_nginx_template bridge
echo "==> nginx template syntax (host)"
check_nginx_template host

echo "Gateway compose configurations verified."
