# Use Node Alpine for small image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install dependencies for live dev
RUN npm install -g ts-node typescript nodemon

# Copy package files
COPY package*.json ./

# Install local dependencies
RUN npm install

# Copy source code
COPY . .

# Expose API port
EXPOSE 5000

# Use nodemon or ts-node-dev for live reload (like air for Go)
CMD ["npx", "ts-node-dev", "--respawn", "--transpile-only", "src/server.ts"]
