# Docker Compose Configuration Guide

This project uses separate Docker Compose files for different environments to support both development and production workflows.

## 📁 File Structure

- **`docker-compose.yml`** - Base configuration with infrastructure services (PostgreSQL, Kafka, Zookeeper, monitoring tools)
- **`docker-compose.dev.yml`** - Development environment (extends base, adds optional Config Server)
- **`docker-compose.prod.yml`** - Production environment (extends base, adds all microservices)

## 🛠️ Development Environment

In development, you'll run services manually using `npm run dev` for hot-reloading and debugging. Only infrastructure services run in Docker.

### Start Infrastructure Only

```bash
# Start infrastructure services (PostgreSQL, Kafka, Zookeeper, monitoring tools)
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# Or simply (dev.yml extends base automatically)
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

This starts:
- ✅ PostgreSQL (port 5433 on host, 5432 in container)
- ✅ Zookeeper (port 2181)
- ✅ Kafka (port 9092)
- ✅ Kafka UI (port 8080)
- ✅ Kafdrop (port 9000)

### Run Services Manually

After infrastructure is running, start each service manually:

```bash
# Terminal 1 - Config Server (optional)
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

### Development Environment Variables

When running services manually, use these connection strings:

```bash
# Database (Note: PostgreSQL is on port 5433 to avoid conflicts)
DB_HOST=localhost
DB_PORT=5433

# Kafka
KAFKA_BROKER=localhost:9092

# Service URLs (for service-to-service communication)
USER_SERVICE_URL=http://localhost:3001
PRODUCT_SERVICE_URL=http://localhost:3002
ORDER_SERVICE_URL=http://localhost:3003
PAYMENT_SERVICE_URL=http://localhost:3004
```

### Stop Infrastructure

```bash
docker-compose -f docker-compose.yml -f docker-compose.dev.yml down
```

## 🚀 Production Environment

In production, all services are containerized and run via Docker Compose.

### Start All Services

```bash
# Start everything (infrastructure + all microservices)
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.yml -f docker-compose.prod.yml logs -f

# Check status
docker-compose -f docker-compose.yml -f docker-compose.prod.yml ps
```

This starts:
- ✅ All infrastructure services
- ✅ Config Server
- ✅ API Gateway
- ✅ User Service
- ✅ Product Service
- ✅ Order Service
- ✅ Payment Service
- ✅ Notification Service

### Production Environment Variables

For production, you can override environment variables using a `.env` file:

```bash
# .env file
JWT_SECRET=your-production-secret-key
DB_PASSWORD=your-production-password
```

Then run:
```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml --env-file .env up -d
```

### Stop All Services

```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml down

# Remove volumes (careful - deletes data!)
docker-compose -f docker-compose.yml -f docker-compose.prod.yml down -v
```

## 🔄 Quick Reference

### Development Workflow

```bash
# 1. Start infrastructure
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# 2. Wait for services to be ready
docker-compose -f docker-compose.yml -f docker-compose.dev.yml ps

# 3. Run services manually in separate terminals
# (see "Run Services Manually" section above)

# 4. Stop infrastructure when done
docker-compose -f docker-compose.yml -f docker-compose.dev.yml down
```

### Production Workflow

```bash
# 1. Start everything
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# 2. Check logs
docker-compose -f docker-compose.yml -f docker-compose.prod.yml logs -f

# 3. Stop everything
docker-compose -f docker-compose.yml -f docker-compose.prod.yml down
```

## 📝 Notes

- **Development**: Services run locally for hot-reloading and debugging
- **Production**: All services containerized for consistency and deployment
- **Base file**: Contains shared infrastructure configuration
- **Override files**: Add environment-specific services and configurations

## 🐛 Troubleshooting

### Port Conflicts

If ports are already in use:
```bash
# Check what's using the port
lsof -i :5432  # PostgreSQL
lsof -i :9092  # Kafka
lsof -i :3000  # API Gateway
```

### Services Not Connecting

In development, ensure:
- Infrastructure is running: `docker-compose ps`
- Services use `localhost` instead of service names
- Kafka broker is `localhost:9092` (not `kafka:29092`)

### Database Connection Issues

```bash
# Check PostgreSQL is running
docker-compose ps postgres

# Check database exists
docker exec -it postgres psql -U postgres -l
```

## 🔐 Security Notes

- **Development**: Uses default passwords (OK for local dev)
- **Production**: Change all default passwords and secrets
- Use environment variables or secrets management in production
- Never commit `.env` files with production secrets

