FROM node:18-alpine

WORKDIR /app

# Copy shared package (monorepo dependency)
# Note: This Dockerfile should be built from the root directory with context: .
# Example: docker build -f api-gateway/Dockerfile -t api-gateway .
COPY shared/config-client ./shared/config-client

# Copy service package files
COPY api-gateway/package*.json ./

# Install dependencies (this will link the shared package via file: reference)
RUN npm ci --only=production

# Copy service source code
COPY api-gateway/ .

EXPOSE 3000

CMD ["node", "src/index.js"]

