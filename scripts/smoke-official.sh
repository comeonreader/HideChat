#!/usr/bin/env bash
set -u
for i in $(seq 1 25); do
  st=$(docker inspect -f '{{.State.Health.Status}}' hidechat-official-app-1 2>/dev/null)
  echo "t${i}: ${st}"
  [ "${st}" = "healthy" ] && break
  sleep 6
done
B=http://127.0.0.1:18081
echo "== 冒烟 =="
curl -s ${B}/ | grep -o '隐聊 HideChat' | head -1
T1=$(curl -s -X POST ${B}/api/auth/login -H 'Content-Type: application/json' -d '{"username":"of_a","password":"secret123"}' | python3 -c 'import sys,json;print(json.load(sys.stdin)["token"])')
echo "token len: ${#T1}"
python3 - <<'PY'
import base64
open('/tmp/of.png','wb').write(base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='))
PY
UP=$(curl -s -X POST ${B}/api/upload -H "Authorization: Bearer ${T1}" -F kind=image -F file=@/tmp/of.png)
echo "upload: ${UP}"
KEY=$(echo "${UP}" | python3 -c 'import sys,json;print(json.load(sys.stdin)["key"])')
CODE=$(curl -s -o /dev/null -w '%{http_code}' ${B}/api/media-url/${KEY} -H "Authorization: Bearer ${T1}")
echo "未成消息文件 media-url(404 预期): ${CODE}"
curl -s ${B}/api/init -H "Authorization: Bearer ${T1}" | python3 -c 'import sys,json;d=json.load(sys.stdin);print("friends:",len(d["friends"]),"ttl:",d["ttl_minutes"])'
echo OFFICIAL_SMOKE_OK
