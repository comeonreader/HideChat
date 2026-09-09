p='/home/reader/HideChat/docs/DEPLOY.md'
s=open(p,encoding='utf-8').read()
s=s.replace('    # 如需修改对外端口：编辑 .env 的 APP_PORT（默认 8080）',
 '    # 数据卷前缀由 COMPOSE_PROJECT_NAME 决定（默认 qingyu，勿随意改动，改=换一套数据）
    # 如需修改对外端口：编辑 .env 的 APP_PORT（默认 8080）')
s=s.replace('hidechat_uploads','qingyu_uploads').replace('hidechat_avatars','qingyu_avatars')
open(p,'w',encoding='utf-8').write(s)
print('DEPLOY synced')