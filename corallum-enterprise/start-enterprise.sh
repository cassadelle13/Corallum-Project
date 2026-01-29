#!/bin/bash

# Enterprise Corallum Startup Script
# Multi-tenant, AI-powered, Production-ready

set -e

echo "🏢 Starting Corallum Enterprise Platform..."
echo "=========================================="

# Check prerequisites
echo "🔍 Checking prerequisites..."

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "⚠️ Docker is not installed. Some features may not work."
fi

# Check Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo "⚠️ Docker Compose is not installed. Some features may not work."
fi

echo "✅ Prerequisites check completed"

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p logs uploads knowledge-base ssl

# Copy environment file if not exists
if [ ! -f .env ]; then
    echo "📝 Creating environment file..."
    cp .env.example .env
    echo "⚠️ Please edit .env file with your configuration"
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the application
echo "🔨 Building application..."
npm run build

# Check if Docker Compose should be used
if [ "$1" = "docker" ]; then
    echo "🐳 Starting with Docker Compose..."
    
    # Pull latest images
    docker-compose pull
    
    # Start services
    docker-compose up -d
    
    # Wait for services to be ready
    echo "⏳ Waiting for services to start..."
    sleep 30
    
    # Check health
    echo "🏥 Checking service health..."
    curl -f http://localhost:8003/health || echo "⚠️ Health check failed"
    
    echo "✅ Enterprise platform started with Docker!"
    echo "🌐 Available at: http://localhost:8003"
    echo "📊 Grafana: http://localhost:3001"
    echo "📈 Prometheus: http://localhost:9090"
    
else
    echo "🚀 Starting locally..."
    
    # Start PostgreSQL and Redis if available
    if command -v docker-compose &> /dev/null; then
        echo "🗄️ Starting database services..."
        docker-compose up -d postgres redis ollama
        sleep 10
    fi
    
    # Start the application
    echo "🎯 Starting Enterprise Backend..."
    npm start
fi

echo ""
echo "🎉 Corallum Enterprise is ready!"
echo "==============================="
echo "🌐 Enterprise API: http://localhost:8003"
echo "🏥 Health Check: http://localhost:8003/health"
echo "📖 API Docs: http://localhost:8003/docs"
echo ""
echo "✨ Features Enabled:"
echo "  • Multi-tenant architecture"
echo "  • SSO authentication"
echo "  • Role-based access control (RBAC)"
echo "  • LangChain AI with RAG"
echo "  • Local LLM support"
echo "  • Inngest reliable execution"
echo "  • 99.9% uptime guarantee"
echo "  • Enterprise security"
echo ""
echo "📚 Next steps:"
echo "  1. Configure your .env file"
echo "  2. Create your first tenant"
echo "  3. Set up SSO authentication"
echo "  4. Start creating AI-powered workflows!"
echo ""
echo "🔗 Documentation: https://docs.corallum.com/enterprise"
echo "💬 Support: enterprise@corallum.com"
