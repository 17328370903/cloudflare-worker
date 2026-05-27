-- 用户表
DROP TABLE IF EXISTS users;
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    nickname TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 用户表索引
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 示例数据（可选）
-- INSERT INTO users (email, password, nickname) VALUES ('test@example.com', 'hashed_password', '测试用户');
