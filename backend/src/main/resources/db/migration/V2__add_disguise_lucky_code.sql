-- Add disguise lucky code source table for backend-only validation.
-- Rollback note: drop table hidechat.im_disguise_lucky_code;

create table if not exists im_disguise_lucky_code (
    id bigint primary key,
    code_value varchar(32) not null,
    status varchar(16) not null,
    effective_start_at timestamp,
    effective_end_at timestamp,
    remark varchar(255),
    created_at timestamp not null default now(),
    updated_at timestamp not null default now(),
    constraint ck_im_disguise_lucky_code_status check (status in ('active', 'inactive'))
);

comment on table im_disguise_lucky_code is '伪装入口幸运码表';
comment on column im_disguise_lucky_code.id is '数据库主键';
comment on column im_disguise_lucky_code.code_value is '幸运码明文，仅后端校验使用';
comment on column im_disguise_lucky_code.status is '状态：active / inactive';
comment on column im_disguise_lucky_code.effective_start_at is '生效开始时间';
comment on column im_disguise_lucky_code.effective_end_at is '生效结束时间';
comment on column im_disguise_lucky_code.remark is '备注';
comment on column im_disguise_lucky_code.created_at is '创建时间';
comment on column im_disguise_lucky_code.updated_at is '更新时间';

create index if not exists idx_im_disguise_lucky_code_status
    on im_disguise_lucky_code (status);

create index if not exists idx_im_disguise_lucky_code_effective_time
    on im_disguise_lucky_code (effective_start_at, effective_end_at);

insert into im_disguise_lucky_code (
    id,
    code_value,
    status,
    effective_start_at,
    effective_end_at,
    remark,
    created_at,
    updated_at
)
select
    202604100001,
    '2468',
    'active',
    null,
    null,
    'default development lucky code',
    now(),
    now()
where not exists (
    select 1
    from im_disguise_lucky_code
    where code_value = '2468'
      and status = 'active'
);
