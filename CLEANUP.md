# Docker Cleanup Guide

## Common Issues and Solutions

### Container Name Conflicts

If you see errors like:
```
Error response from daemon: Conflict. The container name "/zookeeper" is already in use
```

**Solution:**
```bash
# Remove all old containers
docker rm -f zookeeper kafka kafka-ui kafdrop postgres

# Or remove all stopped containers
docker container prune -f

# Or remove all containers (careful!)
docker rm -f $(docker ps -aq)
```

### Port Conflicts

If ports are already in use:

**Check what's using the ports:**
```bash
# Check specific ports
lsof -i :5432  # PostgreSQL
lsof -i :9092  # Kafka
lsof -i :2181  # Zookeeper
lsof -i :8080  # Kafka UI
lsof -i :9000  # Kafdrop
```

**Solutions:**

1. **Stop conflicting containers:**
```bash
# Find and stop the conflicting container
docker ps | grep postgres
docker stop <container-id>
```

2. **Change ports in docker-compose.yml:**
```yaml
services:
  postgres:
    ports:
      - "5433:5432"  # Use 5433 instead of 5432
```

3. **Use different ports for development:**
Update `docker-compose.dev.yml` to use different ports that don't conflict.

### Clean Up Everything

**Remove all containers, networks, and volumes:**
```bash
# Stop and remove all containers
docker-compose -f docker-compose.yml -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.yml -f docker-compose.prod.yml down -v

# Remove all unused containers, networks, images
docker system prune -a

# Remove specific volumes
docker volume ls
docker volume rm <volume-name>
```

### Fresh Start

**Complete cleanup and restart:**
```bash
# 1. Stop and remove everything
docker-compose -f docker-compose.yml -f docker-compose.dev.yml down -v

# 2. Remove old containers
docker rm -f $(docker ps -aq --filter "name=zookeeper|kafka|postgres|kafka-ui|kafdrop") 2>/dev/null || true

# 3. Start fresh
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

### Check Container Status

```bash
# List all containers
docker ps -a

# Check specific service
docker-compose -f docker-compose.yml -f docker-compose.dev.yml ps

# View logs
docker-compose -f docker-compose.yml -f docker-compose.dev.yml logs -f
```

