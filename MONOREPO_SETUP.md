# Monorepo Setup Guide

This project uses a monorepo strategy with a shared `@ecommerce/config-client` package.

## Structure

```
e-commerce-microservices/
├── shared/
│   └── config-client/          # Shared ConfigClient package
│       ├── package.json
│       └── index.js
├── user-service/
│   ├── package.json           # References shared package
│   └── Dockerfile
└── ... (other services)
```

## Local Development

1. **Install dependencies in shared package:**
   ```bash
   cd shared/config-client
   npm install
   ```

2. **Install dependencies in services:**
   ```bash
   cd user-service
   npm install
   ```
   
   This will automatically link `@ecommerce/config-client` via the `file:../shared/config-client` reference.

## Docker Builds

### Option 1: Build from Root (Recommended)

Build services from the root directory with proper context:

```bash
# Build user-service
docker build -f user-service/Dockerfile -t user-service .

# Or use docker-compose (update build context in docker-compose.yml)
```

Update `docker-compose.yml` to set build context:

```yaml
user-service:
  build:
    context: .  # Root directory
    dockerfile: user-service/Dockerfile
```

### Option 2: Copy Shared Package During Build

Alternatively, copy the shared package into each service before building:

```bash
# Before building
cp -r shared/config-client user-service/shared/config-client

# Build
docker build -t user-service user-service/

# Cleanup
rm -rf user-service/shared
```

### Option 3: Multi-Stage Build

Use a multi-stage build to handle the shared dependency more elegantly.

## Using the Shared Package

In any service:

```javascript
const ConfigClient = require('@ecommerce/config-client');

const configClient = new ConfigClient();
const config = await configClient.getConfig('user-service', 'dev');
```

## Benefits

✅ **Single Source of Truth** - Update ConfigClient once, all services benefit  
✅ **No Code Duplication** - No copying code to each service  
✅ **Easy Updates** - Change shared package, all services get updates  
✅ **Works with npm** - Standard npm file: protocol  

## Troubleshooting

### Issue: `Cannot find module '@ecommerce/config-client'`

**Solution:** Run `npm install` in the service directory to link the shared package.

### Issue: Docker build fails with "shared/config-client not found"

**Solution:** Build from root directory with `context: .` or copy shared package into service directory before building.

### Issue: Changes to shared package not reflected

**Solution:** Re-run `npm install` in services after updating shared package, or use `npm link` for development.

