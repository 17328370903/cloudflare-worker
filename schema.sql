-- 用户表
DROP TABLE IF EXISTS users;
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email VARCHAR(50) UNIQUE,               -- 邮箱登录
  password VARCHAR(255),                   -- 加密密码
  name VARCHAR(50) NOT NULL,              -- 用户名
  github_id INTEGER UNIQUE,           -- GitHub 登录唯一ID
  last_login_at INTEGER,           -- 最后登录时间（时间戳）
  last_login_ip VARCHAR(20),              -- 最后登录IP
  avatar_url VARCHAR(255),              -- 头像URL
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER DEFAULT (strftime('%s', 'now'))
);

CREATE INDEX idx_email ON users(email);
CREATE INDEX idx_github_id ON users(github_id);
