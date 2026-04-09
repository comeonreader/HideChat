#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="${ROOT_DIR}/backend"
LOG_DIR="${BACKEND_DIR}/target"
LOG_FILE="${LOG_DIR}/integration-tests.log"

mkdir -p "${LOG_DIR}"

cd "${BACKEND_DIR}"

echo "Running backend integration tests with Testcontainers..."

if mvn -B -Dtest='*IntegrationTest' test | tee "${LOG_FILE}"; then
  echo "Integration tests passed. Log: ${LOG_FILE}"
else
  echo "Integration tests failed. Log: ${LOG_FILE}" >&2
  exit 1
fi
