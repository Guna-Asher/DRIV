# DRIV - Digital Rights Inheritance Vault
# Docker Quick Start Guide

## Prerequisites
- Docker Engine 20.10+
- Docker Compose 2.0+
- 8GB RAM (recommended)
- 10GB free disk space

## Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/driv.git
cd driv

# 2. Build and start all services
docker-compose up --build -d

# 3. Check service status
docker-compose ps

# 4. View logs (optional)
docker-compose logs -f

# 5. Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:8001
# API Docs: http://localhost:8001/docs
```

## Service Management

```bash
# Stop all services
docker-compose down

# Restart specific service
docker-compose restart backend
docker-compose restart frontend

# View service logs
docker-compose logs backend
docker-compose logs frontend

# Execute commands in container
docker-compose exec backend bash
docker-compose exec mongodb mongosh

# Remove all containers and volumes
docker-compose down -v
```

## Environment Variables

All environment variables are configured in `docker-compose.yml`. For production, update:

- `JWT_SECRET_KEY`: Use a strong random key
- `ENCRYPTION_KEY`: 32-byte AES-256 encryption key
- MongoDB credentials (MONGO_INITDB_ROOT_USERNAME/PASSWORD)

## Troubleshooting

### MongoDB Connection Issues
```bash
# Check MongoDB status
docker-compose logs mongodb

# Access MongoDB shell
docker-compose exec mongodb mongosh -u admin -p admin123
```

### Port Already in Use
```bash
# Find process using port
lsof -i :3000  # or :8001

# Kill process
kill -9 <PID>

# Or modify port in docker-compose.yml
```

### Reset Everything
```bash
# Stop and remove all containers, volumes, and networks
docker-compose down -v

# Remove images (optional)
docker rmi $(docker images 'driv*' -q)

# Start fresh
docker-compose up --build -d
```

## Health Checks

All services have health checks configured:

```bash
# Check health status
docker-compose ps

# View health check logs
docker inspect --format='{{json .State.Health}}' driv-backend
```

## Production Deployment

For production deployment:

1. Update environment variables in `.env` files
2. Remove volume mounts for hot-reload
3. Build optimized production images
4. Use proper secrets management
5. Configure HTTPS/SSL certificates
6. Set up monitoring and logging

See `README.md` for full documentation.