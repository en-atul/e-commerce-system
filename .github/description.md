# E-Commerce Order Management System - Microservices Architecture

A production-ready Node.js microservices-based E-Commerce Order Management System featuring distributed transactions, event-driven architecture, and comprehensive order processing capabilities.

## 🎯 Project Overview

This project demonstrates a complete **microservices architecture** for an e-commerce order management system. It implements industry-standard patterns including:

- **SAGA Choreography Pattern** - Distributed transaction management with automatic compensation
- **API Gateway Pattern** - Single entry point with JWT authentication and rate limiting
- **Event-Driven Architecture** - Services communicate via Apache Kafka
- **Database per Service** - Each microservice has its own PostgreSQL database
- **Centralized Configuration** - Config Server for managing service configurations

## 🏗️ Architecture

The system consists of 6 core microservices:
- **API Gateway** - Central entry point with authentication and routing
- **Config Server** - Centralized configuration management
- **User Service** - User management, authentication, and RBAC
- **Product Service** - Product catalog management
- **Order Service** - Order management with SAGA pattern
- **Payment Service** - Payment processing
- **Notification Service** - Event-driven notifications

## 🛠️ Tech Stack

- **Backend**: Node.js 18+, Express.js
- **Database**: PostgreSQL 15
- **Message Broker**: Apache Kafka 3.5
- **Containerization**: Docker & Docker Compose
- **Security**: JWT, bcrypt, RBAC
- **Monitoring**: Kafka UI, Kafdrop

## 🚀 Key Features

✅ Distributed transaction management with SAGA pattern  
✅ Event-driven communication via Kafka  
✅ JWT-based authentication with RBAC  
✅ API Gateway with rate limiting  
✅ Database per service pattern  
✅ Automatic failure compensation  
✅ Centralized configuration management  
✅ Dockerized microservices  
✅ Kafka monitoring tools  

## 📚 Perfect For

- Learning microservices architecture patterns
- Understanding distributed systems
- Exploring event-driven architecture
- Studying SAGA pattern implementation
- Building production-ready microservices

## 🎓 Learning Resources

This project demonstrates:
- Microservices communication patterns
- Distributed transaction management
- Event-driven architecture
- Service-to-service authentication
- Failure handling and compensation
- Docker containerization
- Kafka event streaming

---

**Built with Node.js, PostgreSQL, Kafka, and Docker**

