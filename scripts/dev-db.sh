#!/usr/bin/env bash
# 开发用 PostgreSQL 16（本机 5434 端口，与其它项目 5432/5433 隔离）
set -e
NAME=hidechat-dev-pg
if ! docker ps -a --format '{{.Names}}' | grep -q "^${NAME}$"; then
  docker run -d --name ${NAME} \
    -e POSTGRES_USER=hidechat -e POSTGRES_PASSWORD=hidechat -e POSTGRES_DB=hidechat \
    -p 127.0.0.1:5434:5432 -v hidechat-dev-pgdata:/var/lib/postgresql/data \
    postgres:16-alpine
fi
for i in $(seq 1 30); do
  docker exec ${NAME} pg_isready -U hidechat >/dev/null 2>&1 && break
  sleep 1
done
docker exec ${NAME} psql -U hidechat -tc "SELECT 1 FROM pg_database WHERE datname='hidechat_test'" | grep -q 1 || \
  docker exec ${NAME} createdb -U hidechat hidechat_test
echo "dev db ready on 127.0.0.1:5434 (hidechat / hidechat_test)"
