# Config Server

Central Configuration Server for E-Commerce Microservices - Similar to Spring Cloud Config Server but built for Node.js.

## Overview

The Config Server provides centralized configuration management for all microservices in the e-commerce system. It supports:

- Environment-specific configurations (dev, prod, default)
- Service-specific configurations
- Configuration merging (default + profile)
- REST API for configuration retrieval
- Spring Cloud Config compatible format

## Features

- ✅ **Centralized Configuration** - Single source of truth for all service configs
- ✅ **Environment Profiles** - Support for dev, prod, and default profiles
- ✅ **Configuration Merging** - Profile configs merge with default configs
- ✅ **REST API** - Simple HTTP endpoints for config retrieval
- ✅ **Spring Cloud Compatible** - Returns config in Spring Cloud Config format
- ✅ **Auto-initialization** - Creates default configs on startup

## Architecture

```
config-server/
├── src/
│   ├── services/
│   │   └── configService.js    # Core config loading logic
│   ├── controllers/
│   │   └── configController.js  # API endpoints
│   ├── routes/
│   │   └── configRoutes.js      # Route definitions
│   └── index.js                 # Server entry point
└── config-repo/                 # Configuration files (created at runtime)
    ├── api-gateway/
    │   ├── api-gateway.json
    │   └── api-gateway-dev.json
    ├── user-service/
    │   ├── user-service.json
    │   └── user-service-dev.json
    └── ...
```

## API Endpoints

### Get Configuration

**Spring Cloud Config Format:**
```bash
GET /api/config/{serviceName}/{profile}
```

**Simple Format:**
```bash
GET /api/config/{serviceName}/{profile}/simple
```

**Default Profile:**
```bash
GET /api/config/{serviceName}
```

### List Services

```bash
GET /api/config/services
```

### List Profiles for a Service

```bash
GET /api/config/{serviceName}/profiles
```

### Health Check

```bash
GET /health
GET /actuator/health
```

## Example Usage

### Get User Service Configuration (Dev Profile)

```bash
curl http://localhost:8888/api/config/user-service/dev
```

**Response (Spring Cloud Format):**
```json
{
  "name": "user-service",
  "profiles": ["dev"],
  "label": null,
  "version": null,
  "state": null,
  "propertySources": [
    {
      "name": "user-service-dev.json",
      "source": {
        "server": { "port": 3001 },
        "database": {
          "host": "localhost",
          "port": 5432,
          "name": "userdb",
          "user": "postgres",
          "password": "postgres"
        },
        "kafka": {
          "broker": "localhost:9092"
        },
        "jwt": {
          "secret": "your-super-secret-jwt-key-change-in-production",
          "expiresIn": "24h"
        },
        "environment": "development",
        "logging": {
          "level": "debug"
        }
      }
    }
  ]
}
```

### Get Simple Format

```bash
curl http://localhost:8888/api/config/user-service/dev/simple
```

**Response:**
```json
{
  "service": "user-service",
  "profile": "dev",
  "config": {
    "server": { "port": 3001 },
    "database": { ... },
    ...
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Configuration File Structure

Configuration files are stored in JSON format:

### Default Configuration
`config-repo/{service-name}/{service-name}.json`

### Profile-Specific Configuration
`config-repo/{service-name}/{service-name}-{profile}.json`

### Configuration Merging

When requesting a profile, the Config Server:
1. Loads the default configuration
2. Merges the profile-specific configuration on top
3. Returns the merged result

## Using Config Server in Services

### Option 1: Fetch on Startup

```javascript
const axios = require('axios');

const fetchConfig = async () => {
  const profile = process.env.NODE_ENV === 'production' ? 'prod' : 'dev';
  const response = await axios.get(
    `http://config-server:8888/api/config/user-service/${profile}/simple`
  );
  return response.data.config;
};

// On service startup
const config = await fetchConfig();
```

### Option 2: Use Environment Variables (Current Approach)

Services can continue using environment variables, which is simpler for Docker Compose.

### Option 3: Hybrid Approach

Use Config Server for non-sensitive configs and environment variables for secrets.

## Configuration Profiles

### Default Profile
- Production-ready defaults
- Docker service names
- Standard ports

### Dev Profile
- Development overrides
- Localhost connections
- Debug logging
- Development-specific settings

### Prod Profile (Future)
- Production-specific settings
- Production database URLs
- Production Kafka brokers
- Optimized settings

## Benefits

1. **Centralized Management** - All configs in one place
2. **Environment Separation** - Easy switching between environments
3. **Version Control** - Configs can be versioned in Git
4. **Dynamic Updates** - Configs can be updated without redeploying services
5. **Consistency** - Ensures all services use consistent configuration patterns

## Future Enhancements

- [ ] Git backend for configuration storage
- [ ] Database backend for configuration storage
- [ ] Configuration encryption for sensitive data
- [ ] Configuration refresh endpoint
- [ ] Configuration validation
- [ ] Web UI for configuration management
- [ ] Configuration change notifications
- [ ] Support for YAML configuration files

## Port

Default port: **8888** (same as Spring Cloud Config Server)

## Docker

The Config Server is included in `docker-compose.yml` and starts automatically with all services.

```bash
docker-compose up config-server
```

## Notes

- Configuration files are created automatically on first startup
- Configs are stored in a Docker volume (`config-repo-data`)
- Services can fetch configs at startup or use environment variables
- The Config Server is optional - services can still use environment variables

