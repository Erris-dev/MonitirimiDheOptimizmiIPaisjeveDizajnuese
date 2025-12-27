-- +goose Up
CREATE UNIQUE INDEX idx_users_email ON users(email);
CREATE UNIQUE INDEX idx_users_oauth ON users(oauth_provider, oauth_provider_id);
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE UNIQUE INDEX idx_sessions_refresh_token ON sessions(refresh_token);
CREATE INDEX idx_devices_user_id ON devices(user_id);
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role_id ON user_roles(role_id);

-- +goose Down
DROP INDEX IF EXISTS idx_users_email;
DROP INDEX IF EXISTS idx_users_oauth;
DROP INDEX IF EXISTS idx_users_created_at;
DROP INDEX IF EXISTS idx_sessions_user_id;
DROP INDEX IF EXISTS idx_sessions_refresh_token;
DROP INDEX IF EXISTS idx_devices_user_id;
DROP INDEX IF EXISTS idx_user_roles_user_id;
DROP INDEX IF EXISTS idx_user_roles_role_id;
