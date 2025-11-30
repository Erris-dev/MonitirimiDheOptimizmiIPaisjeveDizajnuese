# -----------------------
# 1. Build Stage
# -----------------------

FROM golang:1.23 AS builder

WORKDIR /app

# Download modules before copying
COPY go.mod go.sum ./
RUN go mod download

# Copy the source code 
COPY . .

# Build the Go binary
RUN CGO_ENABLED=0 GOOS=linux go build -o auth-service ./cmd/server.go

# -----------------------
# 2. Runtime Stage
# -----------------------

FROM alpine:latest

# Install certificates + dockerize
RUN apk --no-cache add ca-certificates \
    && wget -qO /usr/local/bin/dockerize \
           https://github.com/jwilder/dockerize/releases/download/v0.6.1/dockerize-linux-amd64-v0.6.1.tar.gz \
    && tar -C /usr/local/bin -xzvf /usr/local/bin/dockerize \
    && chmod +x /usr/local/bin/dockerize

WORKDIR /app

# Copy binary from builder
COPY --from=builder /app/auth-service .

# -----------------
# START COMMAND WITH DEPENDENCY WAITING
# -----------------
    
CMD ["dockerize", "-wait", "tcp://auth-db:5432", "-timeout", "60s", "./auth-service"]