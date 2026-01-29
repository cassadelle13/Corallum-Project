#!/bin/bash

# Corallum Enterprise Production Startup Script
# One-click deployment for production environment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

# Check if Docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    print_status "Docker and Docker Compose are installed"
}

# Check environment variables
check_env() {
    if [ ! -f .env ]; then
        print_warning ".env file not found. Creating from template..."
        cp .env.example .env
        print_warning "Please edit .env file with your configuration before continuing."
        print_warning "Press Enter to continue or Ctrl+C to exit..."
        read
    fi
    
    # Load environment variables
    source .env
    
    # Check required variables
    required_vars=("DB_PASSWORD" "JWT_SECRET" "INNGEST_API_KEY" "REDIS_PASSWORD" "GRAFANA_PASSWORD")
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            print_error "Environment variable $var is not set in .env file"
            exit 1
        fi
    done
    
    print_status "Environment variables are configured"
}

# Create necessary directories
create_directories() {
    print_status "Creating necessary directories..."
    
    mkdir -p logs/{nginx,app}
    mkdir -p uploads
    mkdir -p knowledge-base
    mkdir -p backups
    mkdir -p database
    mkdir -p monitoring/{grafana/dashboards,grafana/datasources}
    mkdir -p scripts
    
    print_status "Directories created"
}

# Generate SSL certificates (self-signed for development)
generate_ssl() {
    if [ ! -f nginx/ssl/cert.pem ]; then
        print_status "Generating self-signed SSL certificates..."
        
        mkdir -p nginx/ssl
        
        # Generate private key
        openssl genrsa -out nginx/ssl/key.pem 2048
        
        # Generate certificate
        openssl req -new -x509 -key nginx/ssl/key.pem -out nginx/ssl/cert.pem -days 365 \
            -subj "/C=US/ST=State/L=City/O=Corallum/OU=Enterprise/CN=localhost"
        
        print_status "SSL certificates generated"
    else
        print_status "SSL certificates already exist"
    fi
}

# Create database initialization script
create_db_init() {
    if [ ! -f database/init.sql ]; then
        print_status "Creating database initialization script..."
        
        cat > database/init.sql << 'EOF'
-- Corallum Enterprise Database Initialization
-- Creates necessary tables and indexes

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    tenant_id UUID NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'user',
    permissions TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true
);

-- Create tenants table
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    settings JSONB DEFAULT '{}'
);

-- Create workflows table
CREATE TABLE IF NOT EXISTS workflows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    definition JSONB NOT NULL,
    tenant_id UUID NOT NULL,
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- Create workflow executions table
CREATE TABLE IF NOT EXISTS workflow_executions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id UUID NOT NULL,
    status VARCHAR(50) NOT NULL,
    input JSONB,
    output JSONB,
    error_message TEXT,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 5,
    tenant_id UUID NOT NULL
);

-- Create audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID,
    user_id UUID,
    action VARCHAR(255) NOT NULL,
    resource_type VARCHAR(100),
    resource_id VARCHAR(255),
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_workflows_tenant_id ON workflows(tenant_id);
CREATE INDEX IF NOT EXISTS idx_workflows_created_by ON workflows(created_by);
CREATE INDEX IF NOT EXISTS idx_executions_workflow_id ON workflow_executions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_executions_tenant_id ON workflow_executions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_id ON audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- Create default admin tenant
INSERT INTO tenants (id, name, slug, settings) 
VALUES ('00000000-0000-0000-0000-000000000001', 'System', 'system', '{"is_system": true}')
ON CONFLICT (id) DO NOTHING;

-- Create default admin user
INSERT INTO users (id, email, name, password_hash, tenant_id, role, permissions)
VALUES (
    '00000000-0000-0000-0000-000000000001', 
    'admin@corallum.com', 
    'System Admin',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6QJw/2Ej7W',
    '00000000-0000-0000-0000-000000000001',
    'admin',
    ARRAY['admin', 'system']
)
ON CONFLICT (id) DO NOTHING;

EOF
        
        print_status "Database initialization script created"
    else
        print_status "Database initialization script already exists"
    fi
}

# Create backup script
create_backup_script() {
    if [ ! -f scripts/backup.sh ]; then
        print_status "Creating backup script..."
        
        cat > scripts/backup.sh << 'EOF'
#!/bin/bash

# Backup script for Corallum Enterprise
# Runs daily backups of database and uploads

BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="corallum_production"
DB_USER="corallum"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
echo "Creating database backup..."
pg_dump -h postgres -U $DB_USER -d $DB_NAME > $BACKUP_DIR/db_backup_$DATE.sql

# Backup uploads
echo "Creating uploads backup..."
tar -czf $BACKUP_DIR/uploads_backup_$DATE.tar.gz /app/uploads

# Clean old backups (keep last 7 days)
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
EOF
        
        chmod +x scripts/backup.sh
        print_status "Backup script created"
    else
        print_status "Backup script already exists"
    fi
}

# Build and start services
start_services() {
    print_header "Starting Corallum Enterprise Services"
    
    print_status "Building Docker images..."
    docker-compose -f docker-compose.production.yml build
    
    print_status "Starting services..."
    docker-compose -f docker-compose.production.yml up -d
    
    print_status "Waiting for services to be ready..."
    sleep 30
    
    # Check if services are running
    if docker-compose -f docker-compose.production.yml ps | grep -q "Up"; then
        print_status "Services are starting up..."
    else
        print_error "Failed to start services"
        exit 1
    fi
}

# Wait for health checks
wait_for_health() {
    print_status "Waiting for services to be healthy..."
    
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f http://localhost:8003/health > /dev/null 2>&1; then
            print_status "All services are healthy!"
            break
        fi
        
        print_warning "Attempt $attempt/$max_attempts: Services not ready yet..."
        sleep 10
        ((attempt++))
    done
    
    if [ $attempt -gt $max_attempts ]; then
        print_error "Services failed to become healthy within expected time"
        print_error "Check logs with: docker-compose -f docker-compose.production.yml logs"
        exit 1
    fi
}

# Display deployment information
show_info() {
    print_header "🎉 Corallum Enterprise is Ready!"
    
    echo ""
    echo "🌐 Application URLs:"
    echo "   Main API:        http://localhost:8003"
    echo "   Health Check:    http://localhost:8003/health"
    echo "   Metrics:         http://localhost:8003/metrics"
    echo ""
    echo "📊 Monitoring URLs:"
    echo "   Grafana:         http://localhost:3001 (admin/${GRAFANA_PASSWORD})"
    echo "   Prometheus:      http://localhost:9090"
    echo "   Loki:            http://localhost:3100"
    echo ""
    echo "🔧 Management Commands:"
    echo "   View logs:       docker-compose -f docker-compose.production.yml logs -f"
    echo "   Stop services:   docker-compose -f docker-compose.production.yml down"
    echo "   Restart:         docker-compose -f docker-compose.production.yml restart"
    echo "   Backup:          docker-compose -f docker-compose.production.yml exec backup /backup.sh"
    echo ""
    echo "📁 Important Directories:"
    echo "   Logs:            ./logs/"
    echo "   Uploads:         ./uploads/"
    echo "   Backups:         ./backups/"
    echo "   Knowledge Base:  ./knowledge-base/"
    echo ""
    echo "🔑 Default Credentials:"
    echo "   Admin Email:     admin@corallum.com"
    echo "   Admin Password:  admin123"
    echo ""
    print_status "Deployment completed successfully!"
}

# Main execution
main() {
    print_header "🚀 Starting Corallum Enterprise Production Deployment"
    
    check_docker
    check_env
    create_directories
    generate_ssl
    create_db_init
    create_backup_script
    start_services
    wait_for_health
    show_info
    
    print_header "✅ Deployment Complete!"
}

# Handle script interruption
trap 'print_error "Deployment interrupted"; exit 1' INT TERM

# Run main function
main "$@"
