# 🛒 E-Commerce Order Management System - Microservices Architecture

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.18+-blue.svg)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue.svg)](https://www.postgresql.org/)
[![Kafka](https://img.shields.io/badge/Apache%20Kafka-3.5-orange.svg)](https://kafka.apache.org/)
[![Docker](https://img.shields.io/badge/Docker-Compose-blue.svg)](https://www.docker.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> A production-ready Node.js microservices-based E-Commerce Order Management System, featuring distributed transactions, event-driven architecture, and comprehensive order processing capabilities.

## 📋 Description

This project demonstrates a complete **microservices architecture** for an e-commerce order management system. It implements industry-standard patterns including SAGA Choreography, API Gateway, Database per Service, and Event-Driven Architecture using Kafka. The system handles the complete order lifecycle from creation to payment processing with automatic failure compensation.

**Perfect for learning microservices patterns, distributed systems, and event-driven architecture!**

## 🏗️ Architecture Overview

This project follows a microservices architecture with the following services:

### Core Services

- **API Gateway** (Port: 3000) - Central entry point with JWT authentication, rate limiting, and routing
- **Config Server** (Port: 8888) - Centralized configuration management for all microservices
- **User Service** (Port: 3001) - User management, authentication, and RBAC (Role-Based Access Control)
- **Product Service** (Port: 3002) - Product catalog management
- **Order Service** (Port: 3003) - Order management with SAGA Choreography pattern
- **Payment Service** (Port: 3004) - Payment processing
- **Notification Service** (Port: 3005) - Event-driven notifications via Kafka

### Infrastructure

- **PostgreSQL** - Separate database per service (Database per Service pattern)
- **Kafka** - Event-driven communication and SAGA pattern implementation
- **Zookeeper** - Required for Kafka coordination

## 🚀 Key Features

- ✅ **API Gateway Pattern** - Single entry point for all client requests
- ✅ **JWT-based Authentication** - Secure token-based authentication
- ✅ **Event-driven Architecture** - Services communicate via Kafka events
- ✅ **Database per Service** - Each service has its own PostgreSQL database
- ✅ **SAGA Choreography Pattern** - Distributed transaction management
- ✅ **Failure Handling & Retries** - Automatic compensation on failures
- ✅ **Service-to-Service Communication** - REST APIs and Kafka events
- ✅ **Dockerized Microservices** - All services containerized
- ✅ **Rate Limiting** - API Gateway implements rate limiting
- ✅ **Role-Based Access Control (RBAC)** - Admin and User roles
- ✅ **Centralized Configuration** - Config Server for managing service configurations

## 📁 Project Structure

```
ecommerce-microservices/
├── api-gateway/          # API Gateway service
├── config-server/         # Centralized configuration server
├── user-service/         # User management and authentication
├── product-service/      # Product catalog management
├── order-service/        # Order management with SAGA
├── payment-service/      # Payment processing
├── notification-service/ # Event-driven notifications
├── docker-compose.yml    # Docker orchestration
└── README.md            # This file
```

## 🔄 SAGA Choreography Pattern

The system implements the SAGA Choreography pattern for distributed transactions. Here's how it works:

### Order Flow (Happy Path)

1. **Order Created** → Order Service creates order with `PENDING` status and publishes `order-created` event
2. **Product Reserved** → Product Service listens to `order-created`, reserves stock, and publishes `product-reserved` event
3. **Payment Processed** → Payment Service listens to `order-products-reserved`, processes payment, and publishes `payment-processed` event
4. **Order Confirmed** → Order Service listens to `payment-processed`, updates order status to `CONFIRMED`, and publishes `order-confirmed` event
5. **Notifications Sent** → Notification Service sends confirmation emails/notifications

### Compensation Flow (Failure Handling)

If any step fails, the system automatically triggers compensation:

- **Product Reservation Failed** → Order marked as `FAILED`, no compensation needed
- **Payment Failed** → Product Service releases reserved stock, Order marked as `FAILED`
- **Any Failure** → All previous steps are compensated in reverse order

### Event Topics

- `order-events` - Order lifecycle events
- `product-events` - Product reservation and stock events
- `payment-events` - Payment processing events
- `user-events` - User account events

## 🛠️ Technology Stack

### Backend

- **Runtime**: Node.js 18+
- **Framework**: Express.js 4.18+
- **Language**: JavaScript (ES6+)

### Database

- **Primary Database**: PostgreSQL 15
- **Pattern**: Database per Service

### Message Broker & Event Streaming

- **Apache Kafka** 3.5 (Bitnami)
- **Zookeeper** (for Kafka coordination)
- **Kafka UI** & **Kafdrop** (monitoring tools)

### Infrastructure & DevOps

- **Docker** & **Docker Compose**
- **Containerization**: All services containerized

### Security & Authentication

- **JWT** (JSON Web Tokens) for authentication
- **bcryptjs** for password hashing
- **express-rate-limit** for API rate limiting
- **RBAC** (Role-Based Access Control)

### Architecture Patterns

- **Microservices Architecture**
- **API Gateway Pattern**
- **SAGA Choreography Pattern**
- **Event-Driven Architecture**
- **Database per Service**
- **Centralized Configuration**

### Key Libraries

- **kafkajs** - Kafka client for Node.js
- **pg** - PostgreSQL client
- **jsonwebtoken** - JWT implementation
- **http-proxy-middleware** - API Gateway routing
- **axios** - HTTP client for service-to-service communication

## 📋 Prerequisites

- Docker and Docker Compose installed
- Node.js 18+ (for local development)
- Git

## 🚀 Quick Start

### Development Environment (Recommended for Development)

In development, you'll run services manually for hot-reloading and debugging. Only infrastructure runs in Docker.

#### 1. Start Infrastructure Services

```bash
# Start PostgreSQL, Kafka, Zookeeper, and monitoring tools
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

This starts:

- PostgreSQL (port 5433 on host, 5432 in container)
- Zookeeper (port 2181)
- Kafka (port 9092)
- Kafka UI (port 8080)
- Kafdrop (port 9000)

#### 2. Run Services Manually

In separate terminals, start each service:

```bash
# Config Server (optional)
cd config-server && npm install && npm run dev

# User Service
cd user-service && npm install && npm run dev

# Product Service
cd product-service && npm install && npm run dev

# Order Service
cd order-service && npm install && npm run dev

# Payment Service
cd payment-service && npm install && npm run dev

# Notification Service
cd notification-service && npm install && npm run dev

# API Gateway
cd api-gateway && npm install && npm run dev
```

**Note**: Services should use `localhost` for database and Kafka connections in development.

### Production Environment (All Services Containerized)

#### 1. Start All Services

```bash
# Start everything (infrastructure + all microservices)
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

This starts all infrastructure services plus all 6 microservices.

#### 2. Wait for Services to Initialize

Wait about 30-60 seconds for all services to start and initialize their databases.

**📖 For detailed instructions, see [DOCKER_COMPOSE_GUIDE.md](DOCKER_COMPOSE_GUIDE.md)**

### 4. Verify Services

Check service health:

```bash
# Config Server
curl http://localhost:8888/health

# API Gateway
curl http://localhost:3000/health

# User Service
curl http://localhost:3001/health

# Product Service
curl http://localhost:3002/health

# Order Service
curl http://localhost:3003/health

# Payment Service
curl http://localhost:3004/health

# Notification Service
curl http://localhost:3005/health
```

## 📚 API Documentation

### Base URL

All requests go through the API Gateway: `http://localhost:3000`

### Authentication

Most endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### API Endpoints

#### User Service (via API Gateway)

**Public Endpoints:**

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login and get JWT token

**Protected Endpoints:**

- `GET /api/auth/profile` - Get current user profile
- `GET /api/users` - List all users (Admin only)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user (Admin only)

#### Product Service (via API Gateway)

**Public Endpoints:**

- `GET /api/products` - List products (with filters: category, minPrice, maxPrice, inStock)
- `GET /api/products/:id` - Get product by ID

**Admin Endpoints:**

- `POST /api/admin/products` - Create product
- `PUT /api/admin/products/:id` - Update product
- `DELETE /api/admin/products/:id` - Delete product

#### Order Service (via API Gateway)

**Protected Endpoints:**

- `POST /api/orders` - Create order (triggers SAGA)
- `GET /api/orders/my-orders` - Get current user's orders
- `GET /api/orders/:id` - Get order by ID
- `GET /api/orders/all` - Get all orders (Admin only)

#### Payment Service (via API Gateway)

**Protected Endpoints:**

- `GET /api/payments/order/:orderId` - Get payment by order ID
- `GET /api/payments/my-payments` - Get current user's payments
- `GET /api/payments/:id` - Get payment by ID

## 🧪 Example Usage

### 1. Register a User

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

### 2. Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

Save the `token` from the response.

### 3. Create a Product (Admin)

```bash
curl -X POST http://localhost:3000/api/admin/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin-token>" \
  -d '{
    "name": "Laptop",
    "description": "High-performance laptop",
    "price": 999.99,
    "stock": 10,
    "category": "ELECTRONICS"
  }'
```

### 4. List Products

```bash
curl http://localhost:3000/api/products
```

### 5. Create an Order

```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <user-token>" \
  -d '{
    "items": [
      {
        "productId": 1,
        "quantity": 2,
        "price": 999.99
      }
    ],
    "totalAmount": 1999.98
  }'
```

This will trigger the SAGA pattern:

1. Order created with PENDING status
2. Products reserved
3. Payment processed
4. Order confirmed
5. Notifications sent

### 6. Check Order Status

```bash
curl http://localhost:3000/api/orders/1 \
  -H "Authorization: Bearer <user-token>"
```

## 🔐 Role-Based Access Control (RBAC)

### User Roles

- **USER** - Regular customer, can:

  - View products
  - Create orders
  - View own orders and payments
  - Update own profile

- **ADMIN** - Administrator, can:
  - All USER permissions
  - Create/update/delete products
  - View all orders
  - Manage users

### Creating an Admin User

To create an admin user, you can either:

1. Manually insert into the database with role='ADMIN'
2. Use the user service directly (bypassing API Gateway) to create an admin

## 🐳 Docker Services

### Development Environment

```bash
# View logs
docker-compose -f docker-compose.yml -f docker-compose.dev.yml logs -f

# Stop infrastructure
docker-compose -f docker-compose.yml -f docker-compose.dev.yml down
```

### Production Environment

```bash
# View logs
docker-compose -f docker-compose.yml -f docker-compose.prod.yml logs -f

# View specific service logs
docker-compose -f docker-compose.yml -f docker-compose.prod.yml logs -f api-gateway
docker-compose -f docker-compose.yml -f docker-compose.prod.yml logs -f order-service

# Stop all services
docker-compose -f docker-compose.yml -f docker-compose.prod.yml down

# Stop and remove volumes (careful - deletes data!)
docker-compose -f docker-compose.yml -f docker-compose.prod.yml down -v
```

**📖 For detailed Docker Compose usage, see [DOCKER_COMPOSE_GUIDE.md](DOCKER_COMPOSE_GUIDE.md)**

## 🔍 Monitoring and Debugging

### Kafka Monitoring Tools

The system includes two web-based Kafka management tools:

**Kafka UI** (Port 8080):

- Access at: `http://localhost:8080`
- Modern web interface for Kafka cluster management
- View topics, messages, consumers, and producers
- Real-time monitoring and management

**Kafdrop** (Port 9000):

- Access at: `http://localhost:9000`
- Alternative Kafka web UI
- Browse topics and messages
- View consumer groups and offsets

### Check Kafka Topics (CLI)

```bash
# Enter Kafka container
docker exec -it kafka bash

# List topics
kafka-topics.sh --bootstrap-server localhost:29092 --list

# Consume messages from a topic
kafka-console-consumer.sh --bootstrap-server localhost:29092 --topic order-events --from-beginning
```

### Database Access

All services use a single PostgreSQL instance with separate databases:

- **Host**: `localhost:5433` (or `postgres` from within Docker network)
- **User**: `postgres`
- **Password**: `postgres`
- **Databases**:
  - `userdb` - User Service database
  - `productdb` - Product Service database
  - `orderdb` - Order Service database
  - `paymentdb` - Payment Service database

Connect to a specific database:

```bash
psql -h localhost -p 5433 -U postgres -d userdb
```

**Note**: PostgreSQL is mapped to port 5433 on the host to avoid conflicts with other PostgreSQL instances.

## 🏗️ Architecture Patterns

### 1. API Gateway Pattern

- Single entry point for all client requests
- Handles authentication, rate limiting, and routing
- Reduces client complexity

### 2. Database per Service

- Each microservice has its own database
- Ensures service independence and data isolation
- Allows independent scaling

### 3. Event-Driven Architecture

- Services communicate via Kafka events
- Loose coupling between services
- Asynchronous processing

### 4. SAGA Choreography Pattern

- Distributed transaction management
- Each service knows what to do next
- Automatic compensation on failures

### 5. Circuit Breaker Pattern

- Implemented in service-to-service calls
- Prevents cascading failures

### 6. Centralized Configuration Pattern

- Config Server provides centralized configuration management
- Environment-specific configurations (dev, prod, default)
- Services can fetch configs at startup or use environment variables
- Supports configuration merging and versioning

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting on API Gateway
- Role-based access control
- Input validation

## 📝 Configuration Management

### Config Server

The system includes a **Config Server** (port 8888) for centralized configuration management:

- **Get Configuration**: `GET http://localhost:8888/api/config/{serviceName}/{profile}`
- **List Services**: `GET http://localhost:8888/api/config/services`
- **List Profiles**: `GET http://localhost:8888/api/config/{serviceName}/profiles`

Example:

```bash
# Get user service dev configuration
curl http://localhost:8888/api/config/user-service/dev
```

See [config-server/README.md](config-server/README.md) for detailed documentation.

### Environment Variables

Services can also use environment variables for configuration (current approach). Key variables:

- `JWT_SECRET` - Secret key for JWT tokens
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` - Database configuration
- `KAFKA_BROKER` - Kafka broker address
- `PORT` - Service port
- `CONFIG_SERVER_URL` - Config Server URL (optional)

<!-- ## 🚧 Future Enhancements

- [ ] Add Redis for caching
- [ ] Implement service discovery (Consul/Eureka)
- [ ] Add distributed tracing (Jaeger/Zipkin)
- [ ] Implement API versioning
- [ ] Add comprehensive logging (ELK stack)
- [ ] Add monitoring and alerting (Prometheus/Grafana)
- [ ] Implement idempotency keys
- [ ] Add request/response logging
- [ ] Implement health checks with dependencies
- [ ] Add API documentation (Swagger/OpenAPI) -->

## 🐛 Troubleshooting

### Services not starting

- Check Docker logs: `docker-compose logs`
- Ensure ports are not already in use
- Wait for databases to be ready before services start

### Database connection errors

- Verify PostgreSQL containers are running: `docker ps`
- Check database health: `docker-compose ps`

### Kafka connection errors

- Ensure Zookeeper is running before Kafka
- Check Kafka logs: `docker-compose logs kafka`
- Verify Kafka health: `docker-compose ps kafka`
- Access Kafka UI at `http://localhost:8080` to inspect topics and messages

### Order not processing

- Check Kafka topics for events
- Verify all services are running
- Check service logs for errors

## 📄 License

This project is for educational purposes.

## 👥 Contributing

This is a learning project. Feel free to fork and enhance!
