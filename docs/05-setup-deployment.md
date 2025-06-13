# Cài đặt và Triển khai

## Yêu cầu hệ thống

### Development Environment
- **Go**: 1.19 hoặc cao hơn
- **Node.js**: 16.x hoặc cao hơn
- **PostgreSQL**: 14.x hoặc cao hơn
- **Redis**: 6.x hoặc cao hơn
- **Docker**: 20.x hoặc cao hơn
- **Docker Compose**: 2.x hoặc cao hơn

### Production Environment
- **CPU**: 4 cores minimum (8 cores recommended)
- **RAM**: 8GB minimum (16GB recommended)
- **Storage**: 100GB SSD minimum
- **Network**: 1Gbps bandwidth

## Cài đặt Development Environment

### 1. Clone Repository
```bash
git clone https://github.com/ilmsadmin/golang_saas.git
cd golang_saas
```

### 2. Setup Backend (Fiber Go)

#### Cài đặt Dependencies
```bash
cd backend
go mod init golang_saas
go get github.com/gofiber/fiber/v2
go get gorm.io/gorm
go get gorm.io/driver/postgres
go get github.com/go-redis/redis/v8
go get github.com/golang-jwt/jwt/v4
go get github.com/joho/godotenv
go get github.com/google/uuid
```

#### Environment Configuration
```bash
# Tạo file .env trong thư mục backend
cp .env.example .env
```

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=password
DB_NAME=golang_saas
DB_SSL_MODE=disable

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE_HOURS=24

# App Configuration
APP_ENV=development
APP_PORT=3000
APP_DOMAIN=localhost:3000

# Email (optional for development)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

#### Database Setup
```bash
# Tạo database
createdb golang_saas

# Chạy migrations (tự động khi start app)
go run main.go migrate
```

### 3. Setup Frontend (Next.js)

#### Cài đặt Dependencies
```bash
cd frontend
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"

# Additional dependencies
npm install axios
npm install @types/js-cookie js-cookie
npm install @headlessui/react @heroicons/react
npm install react-hook-form @hookform/resolvers zod
npm install next-auth
npm install @tanstack/react-query
```

#### Environment Configuration
```bash
# Tạo file .env.local trong thư mục frontend
cp .env.example .env.local
```

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_MAIN_DOMAIN=localhost:3000

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3001
NEXTAUTH_SECRET=your-nextauth-secret

# Environment
NODE_ENV=development
```

### 4. Docker Setup

#### Docker Compose cho Development
```yaml
# docker-compose.dev.yml
version: '3.8'

services:
  postgres:
    image: postgres:14
    environment:
      POSTGRES_DB: golang_saas
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./scripts/init-db.sql:/docker-entrypoint-initdb.d/init-db.sql

  redis:
    image: redis:6-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  backend:
    build: ./backend
    ports:
      - "3000:3000"
    environment:
      - DB_HOST=postgres
      - REDIS_HOST=redis
    depends_on:
      - postgres
      - redis
    volumes:
      - ./backend:/app
    command: air # Hot reload

  frontend:
    build: ./frontend
    ports:
      - "3001:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://backend:3000/api
    depends_on:
      - backend
    volumes:
      - ./frontend:/app
      - /app/node_modules

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/dev.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
    depends_on:
      - backend
      - frontend

volumes:
  postgres_data:
  redis_data:
```

#### Database Initialization Script
```sql
-- scripts/init-db.sql
-- Create system-wide tables
CREATE SCHEMA IF NOT EXISTS public;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create initial tables (will be handled by GORM migrations)
```

#### Nginx Configuration cho Development
```nginx
# nginx/dev.conf
events {
    worker_connections 1024;
}

http {
    upstream backend {
        server backend:3000;
    }
    
    upstream frontend {
        server frontend:3000;
    }

    # Main domain - System Admin
    server {
        listen 80;
        server_name localhost zplus.local;
        
        location /api/ {
            proxy_pass http://backend/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        }
        
        location / {
            proxy_pass http://frontend/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }
    }

    # Tenant subdomains
    server {
        listen 80;
        server_name ~^(?<tenant>.+)\.zplus\.local$;
        
        location /api/ {
            proxy_pass http://backend/;
            proxy_set_header Host $host;
            proxy_set_header X-Tenant $tenant;
        }
        
        location / {
            proxy_pass http://frontend/;
            proxy_set_header Host $host;
            proxy_set_header X-Tenant $tenant;
        }
    }
}
```

### 5. Running Development Environment

#### Method 1: Docker Compose (Recommended)
```bash
# Start all services
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Stop services
docker-compose -f docker-compose.dev.yml down
```

#### Method 2: Manual Start
```bash
# Terminal 1: Start PostgreSQL và Redis
docker-compose -f docker-compose.dev.yml up postgres redis -d

# Terminal 2: Start Backend
cd backend
go run main.go

# Terminal 3: Start Frontend
cd frontend
npm run dev

# Terminal 4: Start Nginx (optional)
nginx -c $(pwd)/nginx/dev.conf
```

### 6. Hosts File Configuration
```bash
# Add to /etc/hosts (Linux/Mac) or C:\Windows\System32\drivers\etc\hosts (Windows)
127.0.0.1 zplus.local
127.0.0.1 tenant1.zplus.local
127.0.0.1 tenant2.zplus.local
```

## Production Deployment

### 1. Server Preparation

#### Ubuntu 20.04 LTS Setup
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Nginx
sudo apt install nginx -y

# Install Certbot for SSL
sudo apt install certbot python3-certbot-nginx -y
```

### 2. Production Docker Compose
```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  postgres:
    image: postgres:14
    environment:
      POSTGRES_DB: ${DB_NAME}
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/backups
    restart: unless-stopped
    networks:
      - app-network

  redis:
    image: redis:6-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    restart: unless-stopped
    networks:
      - app-network

  backend:
    build: 
      context: ./backend
      dockerfile: Dockerfile.prod
    environment:
      - DB_HOST=postgres
      - REDIS_HOST=redis
      - APP_ENV=production
    depends_on:
      - postgres
      - redis
    restart: unless-stopped
    networks:
      - app-network

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.prod
    environment:
      - NODE_ENV=production
    restart: unless-stopped
    networks:
      - app-network

networks:
  app-network:
    driver: bridge

volumes:
  postgres_data:
  redis_data:
```

### 3. Production Dockerfiles

#### Backend Dockerfile
```dockerfile
# backend/Dockerfile.prod
FROM golang:1.19-alpine AS builder

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o main .

FROM alpine:latest
RUN apk --no-cache add ca-certificates tzdata
WORKDIR /root/

COPY --from=builder /app/main .
COPY --from=builder /app/.env .

EXPOSE 3000
CMD ["./main"]
```

#### Frontend Dockerfile
```dockerfile
# frontend/Dockerfile.prod
FROM node:16-alpine AS dependencies
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:16-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:16-alpine AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT 3000

CMD ["node", "server.js"]
```

### 4. Production Nginx Configuration
```nginx
# /etc/nginx/sites-available/golang-saas
server {
    listen 80;
    server_name zplus.vn *.zplus.vn;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name zplus.vn;

    ssl_certificate /etc/letsencrypt/live/zplus.vn/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/zplus.vn/privkey.pem;
    
    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # API routes
    location /api/ {
        proxy_pass http://localhost:3000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Frontend
    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Tenant subdomains
server {
    listen 443 ssl http2;
    server_name ~^(?<tenant>.+)\.zplus\.vn$;

    ssl_certificate /etc/letsencrypt/live/zplus.vn/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/zplus.vn/privkey.pem;

    location /api/ {
        proxy_pass http://localhost:3000/;
        proxy_set_header Host $host;
        proxy_set_header X-Tenant $tenant;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Tenant $tenant;
    }
}
```

### 5. SSL Certificate Setup
```bash
# Obtain SSL certificate
sudo certbot --nginx -d zplus.vn -d *.zplus.vn

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### 6. Deployment Script
```bash
#!/bin/bash
# deploy.sh

set -e

echo "Starting deployment..."

# Pull latest code
git pull origin main

# Build and start services
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d

# Wait for services
sleep 30

# Run migrations
docker-compose -f docker-compose.prod.yml exec backend ./main migrate

# Restart Nginx
sudo systemctl reload nginx

echo "Deployment completed successfully!"
```

### 7. Monitoring và Logging

#### Prometheus & Grafana
```yaml
# Add to docker-compose.prod.yml
  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
    networks:
      - app-network

  grafana:
    image: grafana/grafana
    ports:
      - "3002:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana_data:/var/lib/grafana
    networks:
      - app-network
```

#### Log Management
```bash
# Setup log rotation
sudo nano /etc/logrotate.d/golang-saas

/var/log/golang-saas/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 0644 www-data www-data
}
```

## Backup và Restore

### 1. Database Backup
```bash
#!/bin/bash
# scripts/backup.sh

BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Backup PostgreSQL
docker-compose exec postgres pg_dump -U postgres golang_saas > $BACKUP_DIR/postgres_$DATE.sql

# Backup Redis
docker-compose exec redis redis-cli --rdb /data/redis_$DATE.rdb

# Compress và upload to S3 (optional)
tar -czf $BACKUP_DIR/backup_$DATE.tar.gz $BACKUP_DIR/*_$DATE.*
aws s3 cp $BACKUP_DIR/backup_$DATE.tar.gz s3://your-backup-bucket/
```

### 2. Database Restore
```bash
#!/bin/bash
# scripts/restore.sh

BACKUP_FILE=$1

if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: ./restore.sh <backup_file>"
    exit 1
fi

# Restore PostgreSQL
docker-compose exec postgres psql -U postgres -d golang_saas < $BACKUP_FILE
```

## Troubleshooting

### Common Issues

#### 1. Database Connection Failed
```bash
# Check database status
docker-compose logs postgres

# Test connection
docker-compose exec backend ping postgres
```

#### 2. Redis Connection Failed
```bash
# Check Redis status
docker-compose exec redis redis-cli ping
```

#### 3. Nginx Configuration Errors
```bash
# Test configuration
sudo nginx -t

# Reload configuration
sudo systemctl reload nginx
```

#### 4. SSL Certificate Issues
```bash
# Check certificate status
sudo certbot certificates

# Renew certificate
sudo certbot renew --dry-run
```