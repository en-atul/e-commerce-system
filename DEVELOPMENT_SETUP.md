# Development Setup Guide

## Quick Start

### 1. Start Infrastructure

```bash
# Start PostgreSQL, Kafka, Zookeeper, and monitoring tools
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

### 2. Verify Databases Exist

```bash
# Check if databases were created
docker exec postgres psql -U postgres -c "\l"

# If databases don't exist, create them manually:
docker exec postgres psql -U postgres -c "CREATE DATABASE userdb;"
docker exec postgres psql -U postgres -c "CREATE DATABASE productdb;"
docker exec postgres psql -U postgres -c "CREATE DATABASE orderdb;"
docker exec postgres psql -U postgres -c "CREATE DATABASE paymentdb;"
```

### 3. Configure Environment Variables

**Important**: PostgreSQL is running on port **5433** (not 5432) to avoid conflicts.

Create `.env` files in each service directory with the correct port:

#### User Service (.env)
```bash
DB_HOST=localhost
DB_PORT=5433
DB_NAME=userdb
DB_USER=postgres
DB_PASSWORD=postgres
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=24h
KAFKA_BROKER=localhost:9092
PORT=3001
NODE_ENV=development
```

#### Product Service (.env)
```bash
DB_HOST=localhost
DB_PORT=5433
DB_NAME=productdb
DB_USER=postgres
DB_PASSWORD=postgres
KAFKA_BROKER=localhost:9092
PORT=3002
NODE_ENV=development
```

#### Order Service (.env)
```bash
DB_HOST=localhost
DB_PORT=5433
DB_NAME=orderdb
DB_USER=postgres
DB_PASSWORD=postgres
USER_SERVICE_URL=http://localhost:3001
PRODUCT_SERVICE_URL=http://localhost:3002
PAYMENT_SERVICE_URL=http://localhost:3004
KAFKA_BROKER=localhost:9092
PORT=3003
NODE_ENV=development
```

#### Payment Service (.env)
```bash
DB_HOST=localhost
DB_PORT=5433
DB_NAME=paymentdb
DB_USER=postgres
DB_PASSWORD=postgres
KAFKA_BROKER=localhost:9092
PORT=3004
NODE_ENV=development
```

#### Notification Service (.env)
```bash
KAFKA_BROKER=localhost:9092
PORT=3005
NODE_ENV=development
```

#### API Gateway (.env)
```bash
PORT=3000
JWT_SECRET=your-super-secret-jwt-key-change-in-production
USER_SERVICE_URL=http://localhost:3001
PRODUCT_SERVICE_URL=http://localhost:3002
ORDER_SERVICE_URL=http://localhost:3003
PAYMENT_SERVICE_URL=http://localhost:3004
NODE_ENV=development
```

#### Config Server (.env)
```bash
PORT=8888
CONFIG_DIR=./config-repo
NODE_ENV=development
```

### 4. Install Dependencies and Run Services

In separate terminals:

```bash
# Terminal 1 - Config Server
cd config-server
npm install
npm run dev

# Terminal 2 - User Service
cd user-service
npm install
npm run dev

# Terminal 3 - Product Service
cd product-service
npm install
npm run dev

# Terminal 4 - Order Service
cd order-service
npm install
npm run dev

# Terminal 5 - Payment Service
cd payment-service
npm install
npm run dev

# Terminal 6 - Notification Service
cd notification-service
npm install
npm run dev

# Terminal 7 - API Gateway
cd api-gateway
npm install
npm run dev
```

## Common Issues

### Database Connection Error: "database does not exist"

**Solution**: The databases might not have been created. Run:

```bash
docker exec postgres psql -U postgres -c "CREATE DATABASE userdb;"
docker exec postgres psql -U postgres -c "CREATE DATABASE productdb;"
docker exec postgres psql -U postgres -c "CREATE DATABASE orderdb;"
docker exec postgres psql -U postgres -c "CREATE DATABASE paymentdb;"
```

### Database Connection Error: "Connection refused"

**Solution**: Check that:
1. PostgreSQL is running: `docker ps | grep postgres`
2. You're using the correct port: `DB_PORT=5433` (not 5432)
3. You're using `localhost` (not `postgres`) when running services manually

### Port Already in Use

**Solution**: 
```bash
# Find what's using the port
lsof -i :3001

# Kill the process or use a different port
```

## Quick Reference

- **PostgreSQL**: `localhost:5433` (from host), `postgres:5432` (from Docker)
- **Kafka**: `localhost:9092` (from host), `kafka:29092` (from Docker)
- **Kafka UI**: `http://localhost:8080`
- **Kafdrop**: `http://localhost:9000`

