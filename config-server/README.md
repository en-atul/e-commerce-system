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
- ✅ **AWS Secrets Manager Integration** - Secure secret management with automatic resolution

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

### Option 3: Hybrid Approach (Recommended)

- **Development profiles** (`-dev.json`): Use plain text values for easy local development (no AWS required)
- **Production profiles** (`.json`): Use AWS Secrets Manager references for secure secret management
- **Non-sensitive configs**: Always stored in config files (ports, URLs, feature flags)

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
- **Plain text secrets** (no AWS Secrets Manager required for local development)

### Default/Production Profile
- Production-ready defaults
- Docker service names
- **AWS Secrets Manager references** for secure secret management
- Production-optimized settings

## Benefits

1. **Centralized Management** - All configs in one place
2. **Environment Separation** - Easy switching between environments
3. **Version Control** - Configs can be versioned in Git
4. **Dynamic Updates** - Configs can be updated without redeploying services
5. **Consistency** - Ensures all services use consistent configuration patterns

## AWS Secrets Manager Integration

The Config Server supports integration with AWS Secrets Manager for secure secret management. Secrets are stored in AWS Secrets Manager and automatically resolved when configurations are requested.

### Setup

1. **Enable AWS Secrets Manager** by setting environment variable:
   ```bash
   USE_AWS_SECRETS=true
   AWS_REGION=us-east-1  # Your AWS region
   ```

2. **Configure AWS Credentials** using one of these methods:
   - **IAM Role** (Recommended for EC2/ECS/Lambda): Attach IAM role with `secretsmanager:GetSecretValue` permission
   - **Environment Variables**:
     ```bash
     AWS_ACCESS_KEY_ID=your-access-key
     AWS_SECRET_ACCESS_KEY=your-secret-key
     AWS_REGION=us-east-1
     ```
   - **AWS Credentials File**: `~/.aws/credentials`
   - **Docker Secrets**: Mount credentials as files

3. **Create Secrets in AWS Secrets Manager**:

   You can store secrets as:
   - **Plain text** (single value)
   - **JSON** (multiple key-value pairs)

   **Example: JSON Secret for Database Password**
   ```bash
   aws secretsmanager create-secret \
     --name ecommerce/database/password \
     --secret-string "your-database-password"
   ```

   **Example: JSON Secret with Multiple Values**
   ```bash
   aws secretsmanager create-secret \
     --name ecommerce/jwt \
     --secret-string '{"secret":"your-jwt-secret-key","expiresIn":"24h"}'
   ```

   **Example: Service-Specific Secrets**
   ```bash
   # User service database credentials
   aws secretsmanager create-secret \
     --name ecommerce/user-service/database \
     --secret-string '{"password":"user-db-password","user":"dbuser"}'
   ```

### Secret Reference Format

In your configuration files, use secret references instead of plain values:

**Format 1: Simple Secret (returns entire secret value)**
```json
{
  "database": {
    "password": "aws-secrets-manager:ecommerce/database/password"
  }
}
```

**Format 2: JSON Secret Key (extracts specific key from JSON secret)**
```json
{
  "jwt": {
    "secret": "aws-secrets-manager:ecommerce/jwt:secret",
    "expiresIn": "aws-secrets-manager:ecommerce/jwt:expiresIn"
  }
}
```

### Secret Reference Syntax

- `aws-secrets-manager:secret-name` - Returns entire secret value
- `aws-secrets-manager:secret-name:key` - Returns specific key from JSON secret

### Example Configuration with Secrets

**Before (Plain Text - Not Secure):**
```json
{
  "database": {
    "password": "my-secret-password"
  },
  "jwt": {
    "secret": "my-jwt-secret"
  }
}
```

**After (Using AWS Secrets Manager):**
```json
{
  "database": {
    "password": "aws-secrets-manager:ecommerce/database/password"
  },
  "jwt": {
    "secret": "aws-secrets-manager:ecommerce/jwt:secret"
  }
}
```

### IAM Permissions Required

The IAM role/user needs the following permission:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue",
        "secretsmanager:DescribeSecret"
      ],
      "Resource": "arn:aws:secretsmanager:*:*:secret:ecommerce/*"
    }
  ]
}
```

### Caching

Secrets are cached for 5 minutes to reduce API calls and improve performance. Cache is automatically refreshed when expired.

### Fallback Behavior

If AWS Secrets Manager is unavailable:
- The config server will log a warning
- Configuration will be returned with unresolved secret references
- Services should handle this gracefully (fail fast or use fallback values)

### Docker Compose Example

```yaml
config-server:
  image: config-server:latest
  environment:
    - USE_AWS_SECRETS=true
    - AWS_REGION=us-east-1
    - AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
    - AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}
  # Or use IAM role if running on ECS
```

### Recommended Secret Naming Convention

```
ecommerce/{service-name}/{secret-type}
ecommerce/{service-name}/{secret-type}/{key}

Examples:
- ecommerce/database/password
- ecommerce/jwt/secret
- ecommerce/user-service/database/password
- ecommerce/payment-service/api-key
```

## Future Enhancements

- [x] AWS Secrets Manager integration
- [ ] Git backend for configuration storage
- [ ] Database backend for configuration storage
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
- **Development configs** (`-dev.json`): Use plain text values for easier local development (no AWS required)
- **Production configs** (`.json`): Use AWS Secrets Manager references for secure secret management
- Set `USE_AWS_SECRETS=true` to enable AWS Secrets Manager resolution (only affects production/default configs)

