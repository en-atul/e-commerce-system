# Config Client - Shared Package

Shared configuration client utility for all microservices in the e-commerce monorepo.

## Installation

This package is part of the monorepo and can be used by any service via:

```json
{
  "dependencies": {
    "@ecommerce/config-client": "file:../shared/config-client"
  }
}
```

## Usage

```javascript
const ConfigClient = require('@ecommerce/config-client');

// Initialize client
const configClient = new ConfigClient();

// Fetch configuration
const config = await configClient.getConfig('user-service', 'dev');

// Use config
const port = config.server.port;
const dbHost = config.database.host;
```

## Features

- Automatic environment detection (dev vs production)
- Config caching (5 minute TTL)
- Fallback to environment variables
- Service-specific default values

## Configuration

The client automatically determines the config server URL:
- **Development**: `http://localhost:8888`
- **Production**: `http://config-server:8888`
- **Custom**: Set `CONFIG_SERVER_URL` environment variable

