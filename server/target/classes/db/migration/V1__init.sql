-- HideChat schema v1 (design doc section 5)
CREATE TABLE users (
    id             BIGSERIAL PRIMARY KEY,
    username       VARCHAR(20)  NOT NULL,
    password_hash  VARCHAR(100) NOT NULL,
    nickname       VARCHAR(30)  NOT NULL DEFAULT '',
    avatar_ext     VARCHAR(8),
    avatar_version INTEGER      NOT NULL DEFAULT 0,
    token_version  INTEGER      NOT NULL DEFAULT 0,
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),
    last_login_at  TIMESTAMPTZ
);
CREATE UNIQUE INDEX uq_users_username ON users (username);

CREATE TABLE friendships (
    id         BIGSERIAL PRIMARY KEY,
    user_a     BIGINT      NOT NULL REFERENCES users(id),
    user_b     BIGINT      NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_friendships_pair UNIQUE (user_a, user_b),
    CONSTRAINT ck_friendships_order CHECK (user_a < user_b)
);
CREATE INDEX ix_friendships_b ON friendships (user_b);

CREATE TABLE friend_requests (
    id           BIGSERIAL PRIMARY KEY,
    from_user    BIGINT      NOT NULL REFERENCES users(id),
    to_user      BIGINT      NOT NULL REFERENCES users(id),
    message      VARCHAR(200),
    status       SMALLINT    NOT NULL DEFAULT 0,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    responded_at TIMESTAMPTZ,
    CONSTRAINT ck_friend_requests_status CHECK (status IN (0, 1, 2, 3)),
    CONSTRAINT ck_friend_requests_no_self CHECK (from_user <> to_user)
);
CREATE UNIQUE INDEX uq_friend_requests_pending ON friend_requests (from_user, to_user) WHERE status = 0;
CREATE INDEX ix_friend_requests_to ON friend_requests (to_user) WHERE status = 0;

CREATE TABLE conversations (
    id            BIGSERIAL PRIMARY KEY,
    user_a        BIGINT      NOT NULL REFERENCES users(id),
    user_b        BIGINT      NOT NULL REFERENCES users(id),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_msg_at   TIMESTAMPTZ,
    CONSTRAINT uq_conversations_pair UNIQUE (user_a, user_b),
    CONSTRAINT ck_conversations_order CHECK (user_a < user_b)
);

CREATE TABLE messages (
    id                 BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    conv_id            BIGINT      NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id          BIGINT      NOT NULL REFERENCES users(id),
    kind               SMALLINT    NOT NULL,
    text_body          VARCHAR(2000),
    media_key          UUID,
    media_meta         JSONB,
    send_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    viewed_at          TIMESTAMPTZ,
    recalled_at        TIMESTAMPTZ,
    recall_by          BIGINT,
    expire_notified_at TIMESTAMPTZ,
    CONSTRAINT ck_messages_kind CHECK (kind BETWEEN 1 AND 5)
);
CREATE INDEX ix_messages_conv ON messages (conv_id, id DESC);
CREATE INDEX ix_messages_viewed ON messages (viewed_at);
CREATE INDEX ix_messages_send ON messages (send_at);
