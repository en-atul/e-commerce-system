FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY config-server/package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY config-server/ .

EXPOSE 8888

CMD ["node", "src/index.js"]

