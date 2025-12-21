FROM node:18-alpine

WORKDIR /app

# Copy shared package (monorepo dependency)
# Note: This Dockerfile should be built from the root directory with context: .
# Example: docker build -f user-service/Dockerfile -t user-service .
COPY shared/config-client ./shared/config-client

# Copy service package files
COPY user-service/package*.json ./

# Install dependencies (this will link the shared package via file: reference)
RUN npm ci --only=production

# Copy service source code
COPY user-service/ .

EXPOSE 3001

CMD ["node", "src/index.js"]

