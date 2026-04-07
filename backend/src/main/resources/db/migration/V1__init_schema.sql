-- HideChat initial schema migration draft.
-- Source aligned with docs/database/PostgreSQL DDL 建表脚本 v1.0.md.
-- Rollback note: drop schema hidechat cascade;

create schema if not exists hidechat;
set search_path to hidechat;

create table im_user (
    id bigint primary key,
    user_uid varchar(64) not null,
    nickname varchar(64) not null,
    avatar_url varchar(255),
    status smallint not null default 1,
    created_at timestamp not null default now(),
    updated_at timestamp not null default now(),
    constraint uk_im_user_user_uid unique (user_uid),
    constraint ck_im_user_status check (status in (0, 1))
);

comment on table im_user is '用户主表';
comment on column im_user.id is '数据库主键';
comment on column im_user.user_uid is '用户业务唯一ID';
comment on column im_user.nickname is '用户昵称';
comment on column im_user.avatar_url is '头像地址';
comment on column im_user.status is '状态：1正常，0禁用';
comment on column im_user.created_at is '创建时间';
comment on column im_user.updated_at is '更新时间';

create index idx_im_user_status on im_user (status);

create table im_user_auth (
    id bigint primary key,
    user_uid varchar(64) not null,
    auth_type varchar(32) not null,
    auth_identifier varchar(128) not null,
    credential_hash varchar(255),
    verified boolean not null default false,
    created_at timestamp not null default now(),
    updated_at timestamp not null default now(),
    constraint uk_im_user_auth_type_identifier unique (auth_type, auth_identifier),
    constraint ck_im_user_auth_auth_type check (auth_type in ('email_password', 'email_code', 'wechat'))
);

comment on table im_user_auth is '用户认证凭证表';
comment on column im_user_auth.id is '数据库主键';
comment on column im_user_auth.user_uid is '关联用户UID';
comment on column im_user_auth.auth_type is '认证类型：email_password / email_code / wechat';
comment on column im_user_auth.auth_identifier is '认证标识，如邮箱/openid';
comment on column im_user_auth.credential_hash is '密码哈希，验证码登录可为空';
comment on column im_user_auth.verified is '是否已验证';
comment on column im_user_auth.created_at is '创建时间';
comment on column im_user_auth.updated_at is '更新时间';

create index idx_im_user_auth_user_uid on im_user_auth (user_uid);

create table im_email_code (
    id bigint primary key,
    email varchar(128) not null,
    biz_type varchar(32) not null,
    code_hash varchar(255) not null,
    expire_at timestamp not null,
    used boolean not null default false,
    send_count integer not null default 1,
    created_at timestamp not null default now(),
    constraint ck_im_email_code_biz_type check (biz_type in ('register', 'login', 'reset_password'))
);

comment on table im_email_code is '邮箱验证码表';
comment on column im_email_code.id is '数据库主键';
comment on column im_email_code.email is '邮箱';
comment on column im_email_code.biz_type is '业务类型：register / login / reset_password';
comment on column im_email_code.code_hash is '验证码哈希';
comment on column im_email_code.expire_at is '过期时间';
comment on column im_email_code.used is '是否已使用';
comment on column im_email_code.send_count is '发送次数统计';
comment on column im_email_code.created_at is '创建时间';

create index idx_im_email_code_email_biz_type on im_email_code (email, biz_type);
create index idx_im_email_code_expire_at on im_email_code (expire_at);

create table im_refresh_token (
    id bigint primary key,
    user_uid varchar(64) not null,
    token_id varchar(128) not null,
    expire_at timestamp not null,
    revoked boolean not null default false,
    created_at timestamp not null default now(),
    constraint uk_im_refresh_token_token_id unique (token_id)
);

comment on table im_refresh_token is '刷新令牌表';
comment on column im_refresh_token.id is '数据库主键';
comment on column im_refresh_token.user_uid is '用户UID';
comment on column im_refresh_token.token_id is 'Token唯一标识';
comment on column im_refresh_token.expire_at is '过期时间';
comment on column im_refresh_token.revoked is '是否已失效';
comment on column im_refresh_token.created_at is '创建时间';

create index idx_im_refresh_token_user_uid on im_refresh_token (user_uid);
create index idx_im_refresh_token_expire_at on im_refresh_token (expire_at);

create table im_contact (
    id bigint primary key,
    owner_uid varchar(64) not null,
    peer_uid varchar(64) not null,
    remark_name varchar(64),
    pinned boolean not null default false,
    last_message_at timestamp,
    created_at timestamp not null default now(),
    updated_at timestamp not null default now(),
    constraint uk_im_contact_owner_peer unique (owner_uid, peer_uid)
);

comment on table im_contact is '联系人关系表（用户视角）';
comment on column im_contact.id is '数据库主键';
comment on column im_contact.owner_uid is '当前用户UID';
comment on column im_contact.peer_uid is '联系人UID';
comment on column im_contact.remark_name is '备注名';
comment on column im_contact.pinned is '是否置顶';
comment on column im_contact.last_message_at is '最后互动时间';
comment on column im_contact.created_at is '创建时间';
comment on column im_contact.updated_at is '更新时间';

create index idx_im_contact_owner_uid on im_contact (owner_uid);
create index idx_im_contact_owner_uid_last_message_at on im_contact (owner_uid, last_message_at desc);

create table im_conversation (
    id bigint primary key,
    conversation_id varchar(64) not null,
    user_a_uid varchar(64) not null,
    user_b_uid varchar(64) not null,
    last_message_id varchar(64),
    last_message_type varchar(32),
    last_message_preview varchar(255),
    last_message_at timestamp,
    created_at timestamp not null default now(),
    updated_at timestamp not null default now(),
    constraint uk_im_conversation_conversation_id unique (conversation_id),
    constraint uk_im_conversation_user_pair unique (user_a_uid, user_b_uid)
);

comment on table im_conversation is '1V1会话表';
comment on column im_conversation.id is '数据库主键';
comment on column im_conversation.conversation_id is '会话唯一ID';
comment on column im_conversation.user_a_uid is '参与方A UID';
comment on column im_conversation.user_b_uid is '参与方B UID';
comment on column im_conversation.last_message_id is '最后一条消息ID';
comment on column im_conversation.last_message_type is '最后消息类型';
comment on column im_conversation.last_message_preview is '最后消息摘要，建议只存占位文本';
comment on column im_conversation.last_message_at is '最后消息时间';
comment on column im_conversation.created_at is '创建时间';
comment on column im_conversation.updated_at is '更新时间';

create index idx_im_conversation_user_a_uid on im_conversation (user_a_uid);
create index idx_im_conversation_user_b_uid on im_conversation (user_b_uid);
create index idx_im_conversation_last_message_at on im_conversation (last_message_at desc);

create table im_file (
    id bigint primary key,
    file_id varchar(64) not null,
    uploader_uid varchar(64) not null,
    file_name varchar(255),
    mime_type varchar(128) not null,
    file_size bigint not null default 0,
    storage_key varchar(255) not null,
    access_url varchar(255),
    encrypt_flag boolean not null default true,
    created_at timestamp not null default now(),
    constraint uk_im_file_file_id unique (file_id)
);

comment on table im_file is '文件元数据表';
comment on column im_file.id is '数据库主键';
comment on column im_file.file_id is '文件唯一ID';
comment on column im_file.uploader_uid is '上传者UID';
comment on column im_file.file_name is '原始文件名';
comment on column im_file.mime_type is 'MIME类型';
comment on column im_file.file_size is '文件大小，字节';
comment on column im_file.storage_key is '对象存储key';
comment on column im_file.access_url is '访问地址';
comment on column im_file.encrypt_flag is '是否加密上传';
comment on column im_file.created_at is '创建时间';

create index idx_im_file_uploader_uid on im_file (uploader_uid);
create index idx_im_file_created_at on im_file (created_at desc);

create table im_message (
    id bigint primary key,
    message_id varchar(64) not null,
    conversation_id varchar(64) not null,
    sender_uid varchar(64) not null,
    receiver_uid varchar(64) not null,
    message_type varchar(16) not null,
    payload_type varchar(16) not null,
    payload text,
    file_id varchar(64),
    server_status varchar(16) not null,
    client_msg_time bigint,
    server_msg_time timestamp not null default now(),
    deleted boolean not null default false,
    constraint uk_im_message_message_id unique (message_id),
    constraint ck_im_message_message_type check (message_type in ('text', 'image', 'system')),
    constraint ck_im_message_payload_type check (payload_type in ('plain', 'ref', 'encrypted')),
    constraint ck_im_message_server_status check (server_status in ('server_received', 'delivered', 'read'))
);

comment on table im_message is '消息表';
comment on column im_message.id is '数据库主键';
comment on column im_message.message_id is '消息唯一ID';
comment on column im_message.conversation_id is '所属会话ID';
comment on column im_message.sender_uid is '发送者UID';
comment on column im_message.receiver_uid is '接收者UID';
comment on column im_message.message_type is '消息类型：text / image / system';
comment on column im_message.payload_type is '负载类型：plain / ref / encrypted';
comment on column im_message.payload is '消息内容或引用数据';
comment on column im_message.file_id is '图片文件ID';
comment on column im_message.server_status is '服务端状态：server_received / delivered / read';
comment on column im_message.client_msg_time is '客户端毫秒时间戳';
comment on column im_message.server_msg_time is '服务端接收时间';
comment on column im_message.deleted is '逻辑删除';

create index idx_im_message_conversation_id_server_msg_time on im_message (conversation_id, server_msg_time desc);
create index idx_im_message_sender_uid on im_message (sender_uid);
create index idx_im_message_receiver_uid on im_message (receiver_uid);
create index idx_im_message_file_id on im_message (file_id);
create index idx_im_message_server_status on im_message (server_status);

create table im_unread_counter (
    id bigint primary key,
    owner_uid varchar(64) not null,
    conversation_id varchar(64) not null,
    unread_count integer not null default 0,
    updated_at timestamp not null default now(),
    constraint uk_im_unread_counter_owner_conversation unique (owner_uid, conversation_id)
);

comment on table im_unread_counter is '未读计数表';
comment on column im_unread_counter.id is '数据库主键';
comment on column im_unread_counter.owner_uid is '未读归属用户UID';
comment on column im_unread_counter.conversation_id is '会话ID';
comment on column im_unread_counter.unread_count is '未读数';
comment on column im_unread_counter.updated_at is '更新时间';

create index idx_im_unread_counter_owner_uid on im_unread_counter (owner_uid);

create table im_message_read_receipt (
    id bigint primary key,
    message_id varchar(64) not null,
    reader_uid varchar(64) not null,
    read_at timestamp not null default now(),
    constraint uk_im_message_read_receipt_message_reader unique (message_id, reader_uid)
);

comment on table im_message_read_receipt is '消息已读回执表';
comment on column im_message_read_receipt.id is '数据库主键';
comment on column im_message_read_receipt.message_id is '消息ID';
comment on column im_message_read_receipt.reader_uid is '已读用户UID';
comment on column im_message_read_receipt.read_at is '已读时间';

create index idx_im_message_read_receipt_reader_uid on im_message_read_receipt (reader_uid);
create index idx_im_message_read_receipt_message_id on im_message_read_receipt (message_id);

create or replace function set_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

create trigger trg_im_user_updated_at
before update on im_user
for each row
execute function set_updated_at();

create trigger trg_im_user_auth_updated_at
before update on im_user_auth
for each row
execute function set_updated_at();

create trigger trg_im_contact_updated_at
before update on im_contact
for each row
execute function set_updated_at();

create trigger trg_im_conversation_updated_at
before update on im_conversation
for each row
execute function set_updated_at();
