-- name: FindUserByEmail :one
SELECT * FROM users WHERE email = $1;

-- name: CreateUser :one
INSERT INTO users (email, password_hash, oauth_provider, oauth_provider_id, mfa_enabled)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;

-- name: FindRoleByName :one
SELECT id, name, description, created_at
FROM roles
WHERE name = $1
LIMIT 1;

-- name: CreateRole :one
INSERT INTO roles (
    name,
    description
) VALUES (
    $1, $2
)
RETURNING id, name, description, created_at;

-- name: CreateUserRole :one
INSERT INTO user_roles (
    user_id,
    role_id
) VALUES (
    $1, $2
)
RETURNING id, user_id, role_id, assigned_at;

-- name: CreateSession :one
INSERT INTO sessions (
    user_id,
    refresh_token,
    expires_at
) VALUES (
    $1, $2, $3
)
RETURNING id, user_id, refresh_token, expires_at, created_at, updated_at;

-- name: CreateDevice :one
INSERT INTO devices (
    user_id,
    device_name,
    device_type,
    ip_address,
    last_seen
) VALUES (
    $1, $2, $3, $4, $5
)
RETURNING id, user_id, device_name, device_type, ip_address, last_seen, created_at;

-- name: FindDeviceByUserAndIP :one
SELECT id FROM devices 
WHERE user_id = $1 AND ip_address = $2;

-- name: UpdateDeviceLastSeen :exec
UPDATE devices 
SET last_seen = $2 
WHERE id = $1;

-- name: FindUserByOauthProvider :one
SELECT * FROM users 
WHERE oauth_provider = $1 AND oauth_provider_id = $2;