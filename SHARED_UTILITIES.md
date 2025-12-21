# Shared Utilities Guide

This document explains the shared utilities available to all services in the monorepo.

## Available Shared Packages

### 1. `@ecommerce/config-client`
**Location:** `shared/config-client/`

Fetches configuration from config-server.

**Usage:**
```javascript
const ConfigClient = require('@ecommerce/config-client');
const client = new ConfigClient();
const config = await client.getConfig('user-service', 'dev');
```

### 2. `@ecommerce/db-utils`
**Location:** `shared/db-utils/`

Database utilities for PostgreSQL.

**Functions:**
- `ensureDatabaseExists(dbConfig)` - Creates database if it doesn't exist
- `createPool(dbConfig)` - Creates a PostgreSQL connection pool

**Usage:**
```javascript
const { ensureDatabaseExists, createPool } = require('@ecommerce/db-utils');

// Ensure database exists
await ensureDatabaseExists(config.database);

// Create pool
const pool = createPool(config.database);
```

### 3. `@ecommerce/service-config`
**Location:** `shared/service-config/`

Shared configuration module for storing config and pool.

**Usage:**
```javascript
const configModule = require('@ecommerce/service-config');

// Store config
configModule.setConfig(config);
configModule.setPool(pool);

// Retrieve config
const config = configModule.getConfig();
const pool = configModule.getPool();
```

## Example: Simplified Service Initialization

**Before (repetitive code in each service):**
```javascript
// 50+ lines of initialization code repeated in each service
const ensureDatabaseExists = async (dbConfig) => { /* ... */ };
const { Pool } = require('pg');
const pool = new Pool({ /* ... */ });
// etc.
```

**After (using shared utilities):**
```javascript
const ConfigClient = require('@ecommerce/config-client');
const configModule = require('@ecommerce/service-config');
const { ensureDatabaseExists, createPool } = require('@ecommerce/db-utils');

const initializeService = async () => {
  const configClient = new ConfigClient();
  const config = await configClient.getConfig('user-service', 'dev');
  
  configModule.setConfig(config);
  await ensureDatabaseExists(config.database);
  const pool = createPool(config.database);
  configModule.setPool(pool);
  
  // Start your service...
};
```

## Benefits

✅ **No Code Duplication** - Write once, use everywhere  
✅ **Consistent Behavior** - All services use same logic  
✅ **Easy Updates** - Fix bugs once, all services benefit  
✅ **Smaller Service Code** - Services focus on business logic  

## Adding to Your Service

In your service's `package.json`:
```json
{
  "dependencies": {
    "@ecommerce/config-client": "file:../shared/config-client",
    "@ecommerce/db-utils": "file:../shared/db-utils",
    "@ecommerce/service-config": "file:../shared/service-config"
  }
}
```

Then run `npm install` in your service directory.

