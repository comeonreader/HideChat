-- JPA 实体 int 映射对齐（校验要求）：状态/类型列 smallint -> integer
ALTER TABLE friend_requests ALTER COLUMN status TYPE INTEGER;
ALTER TABLE messages ALTER COLUMN kind TYPE INTEGER;
