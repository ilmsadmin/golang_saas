#!/bin/bash

# Quick development setup script
# This script helps set up the development environment quickly

set -e

echo "🚀 Setting up GoLang SaaS development environment..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create environment files if they don't exist
if [ ! -f backend/.env ]; then
    echo "📝 Creating backend .env file..."
    cp backend/.env.example backend/.env
fi

if [ ! -f frontend/.env.local ]; then
    echo "📝 Creating frontend .env.local file..."
    cp frontend/.env.example frontend/.env.local
fi

# Add hosts entries (optional, for better local development)
echo "🌐 Setting up local hosts..."
if ! grep -q "zplus.local" /etc/hosts; then
    echo "Adding zplus.local to /etc/hosts (requires sudo)"
    echo "127.0.0.1 zplus.local" | sudo tee -a /etc/hosts
    echo "127.0.0.1 tenant1.zplus.local" | sudo tee -a /etc/hosts
    echo "127.0.0.1 tenant2.zplus.local" | sudo tee -a /etc/hosts
    echo "127.0.0.1 demo.zplus.local" | sudo tee -a /etc/hosts
fi

# Start services
echo "🐳 Starting Docker services..."
docker-compose -f docker-compose.dev.yml up -d

echo "⏳ Waiting for services to start..."
sleep 30

# Check if services are running
echo "🔍 Checking service health..."
if curl -f http://localhost:3000/health > /dev/null 2>&1; then
    echo "✅ Backend is running"
else
    echo "⚠️  Backend might still be starting..."
fi

if curl -f http://localhost:3001 > /dev/null 2>&1; then
    echo "✅ Frontend is running"
else
    echo "⚠️  Frontend might still be starting..."
fi

echo ""
echo "🎉 Development environment setup complete!"
echo ""
echo "📋 Access URLs:"
echo "   System Admin:    http://localhost (or http://zplus.local)"
echo "   Tenant Demo:     http://tenant1.localhost (or http://tenant1.zplus.local)"
echo "   Backend API:     http://localhost:3000"
echo "   Frontend:        http://localhost:3001"
echo ""
echo "📚 Next steps:"
echo "   1. Check the documentation in ./docs/"
echo "   2. Review the API documentation at http://localhost:3000/swagger"
echo "   3. Start developing!"
echo ""
echo "🛠️  Useful commands:"
echo "   View logs:       docker-compose -f docker-compose.dev.yml logs -f"
echo "   Stop services:   docker-compose -f docker-compose.dev.yml down"
echo "   Restart:         docker-compose -f docker-compose.dev.yml restart"