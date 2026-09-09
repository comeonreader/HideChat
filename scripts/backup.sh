#!/usr/bin/env bash
# 清语 Qingyu 一键备份：数据库 + uploads/avatars 数据卷
# 用法：./scripts/backup.sh （在部署目录执行；支持 COMPOSE_PROJECT_NAME 覆盖）
set -euo pipefail
cd "$(dirname "$0")/.."

PROJ="${COMPOSE_PROJECT_NAME:-qingyu}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETENTION="${RETENTION:-7}"
STAMP="$(date +%F_%H%M%S)"

mkdir -p "${BACKUP_DIR}"
echo "[backup] project=${PROJ} start ${STAMP}"

docker compose -p "${PROJ}" exec -T db pg_dump -U hidechat hidechat | gzip > "${BACKUP_DIR}/db_${STAMP}.sql.gz"
echo "[backup] db ok"

for vol in uploads avatars; do
  docker compose -p "${PROJ}" run --rm -v "${PROJ}_${vol}:/d" -v "${BACKUP_DIR}:/b" alpine \
    tar czf "/b/${vol}_${STAMP}.tgz" -C /d . 2>/dev/null || echo "[backup] warn: ${vol} volume empty/missing"
  echo "[backup] ${vol} ok"
done

find "${BACKUP_DIR}" -type f -mtime "+${RETENTION}" -delete
echo "[backup] done -> ${BACKUP_DIR}"
