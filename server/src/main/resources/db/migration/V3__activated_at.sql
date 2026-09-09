-- v1.2：接收方"回复激活"销毁计时（附录 B3）
-- 打开会话仅置 viewed_at（已读回执）；本会话首次回复时批量置 activated_at，activated+TTL 后销毁
ALTER TABLE messages ADD COLUMN activated_at TIMESTAMPTZ;
CREATE INDEX ix_messages_activated ON messages (activated_at);
