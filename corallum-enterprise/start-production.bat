@echo off
REM Corallum Enterprise Production Startup Script for Windows
REM One-click deployment for production environment

setlocal enabledelayedexpansion

echo ========================================
echo 🚀 Starting Corallum Enterprise
echo ========================================
echo.

REM Check if Docker is installed
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker is not installed. Please install Docker Desktop first.
    pause
    exit /b 1
)

docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker Compose is not installed. Please install Docker Compose first.
    pause
    exit /b 1
)

echo [INFO] Docker and Docker Compose are installed

REM Check environment file
if not exist .env (
    echo [WARN] .env file not found. Creating from template...
    copy .env.example .env >nul
    echo [WARN] Please edit .env file with your configuration before continuing.
    echo [WARN] Press Enter to continue or Ctrl+C to exit...
    pause
)

REM Create necessary directories
echo [INFO] Creating necessary directories...
if not exist logs mkdir logs
if not exist logs\nginx mkdir logs\nginx
if not exist logs\app mkdir logs\app
if not exist uploads mkdir uploads
if not exist knowledge-base mkdir knowledge-base
if not exist backups mkdir backups
if not exist database mkdir database
if not exist monitoring mkdir monitoring
if not exist monitoring\grafana mkdir monitoring\grafana
if not exist monitoring\grafana\dashboards mkdir monitoring\grafana\dashboards
if not exist monitoring\grafana\datasources mkdir monitoring\grafana\datasources
if not exist scripts mkdir scripts
if not exist nginx\ssl mkdir nginx\ssl

echo [INFO] Directories created

REM Generate SSL certificates (if not exist)
if not exist nginx\ssl\cert.pem (
    echo [INFO] Generating self-signed SSL certificates...
    
    REM Generate private key
    openssl genrsa -out nginx\ssl\key.pem 2048
    
    REM Generate certificate
    openssl req -new -x509 -key nginx\ssl\key.pem -out nginx\ssl\cert.pem -days 365 -subj "/C=US/ST=State/L=City/O=Corallum/OU=Enterprise/CN=localhost"
    
    echo [INFO] SSL certificates generated
) else (
    echo [INFO] SSL certificates already exist
)

REM Create database initialization script
if not exist database\init.sql (
    echo [INFO] Creating database initialization script...
    
    echo -- Corallum Enterprise Database Initialization > database\init.sql
    echo -- Creates necessary tables and indexes >> database\init.sql
    echo. >> database\init.sql
    echo -- Enable UUID extension >> database\init.sql
    echo CREATE EXTENSION IF NOT EXISTS "uuid-ossp"; >> database\init.sql
    echo. >> database\init.sql
    echo -- Create users table >> database\init.sql
    echo CREATE TABLE IF NOT EXISTS users ^( >> database\init.sql
    echo     id UUID PRIMARY KEY DEFAULT uuid_generate_v4^(^), >> database\init.sql
    echo     email VARCHAR^(255^) UNIQUE NOT NULL, >> database\init.sql
    echo     name VARCHAR^(255^) NOT NULL, >> database\init.sql
    echo     password_hash VARCHAR^(255^) NOT NULL, >> database\init.sql
    echo     tenant_id UUID NOT NULL, >> database\init.sql
    echo     role VARCHAR^(50^) NOT NULL DEFAULT 'user', >> database\init.sql
    echo     permissions TEXT[] DEFAULT '{}', >> database\init.sql
    echo     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW^(^), >> database\init.sql
    echo     last_login TIMESTAMP WITH TIME ZONE, >> database\init.sql
    echo     is_active BOOLEAN DEFAULT true >> database\init.sql
    echo ^); >> database\init.sql
    
    echo [INFO] Database initialization script created
) else (
    echo [INFO] Database initialization script already exists
)

echo.
echo ========================================
echo 🏗️  Building and Starting Services
echo ========================================

echo [INFO] Building Docker images...
docker-compose -f docker-compose.production.yml build
if %errorlevel% neq 0 (
    echo [ERROR] Failed to build Docker images
    pause
    exit /b 1
)

echo [INFO] Starting services...
docker-compose -f docker-compose.production.yml up -d
if %errorlevel% neq 0 (
    echo [ERROR] Failed to start services
    pause
    exit /b 1
)

echo [INFO] Waiting for services to start...
timeout /t 30 /nobreak >nul

REM Wait for health check
set /a max_attempts=30
set /a attempt=1

:health_check
echo [INFO] Checking service health ^(attempt !attempt!/%max_attempts%^^...
curl -f http://localhost:8003/health >nul 2>&1
if %errorlevel% equ 0 (
    echo [INFO] All services are healthy!
    goto :show_info
)

if !attempt! geq %max_attempts% (
    echo [ERROR] Services failed to become healthy within expected time
    echo [ERROR] Check logs with: docker-compose -f docker-compose.production.yml logs
    pause
    exit /b 1
)

echo [WARN] Services not ready yet, waiting...
timeout /t 10 /nobreak >nul
set /a attempt+=1
goto :health_check

:show_info
echo.
echo ========================================
echo 🎉 Corallum Enterprise is Ready!
echo ========================================
echo.
echo 🌐 Application URLs:
echo    Main API:        http://localhost:8003
echo    Health Check:    http://localhost:8003/health
echo    Metrics:         http://localhost:8003/metrics
echo.
echo 📊 Monitoring URLs:
echo    Grafana:         http://localhost:3001
echo    Prometheus:      http://localhost:9090
echo    Loki:            http://localhost:3100
echo.
echo 🔧 Management Commands:
echo    View logs:       docker-compose -f docker-compose.production.yml logs -f
echo    Stop services:   docker-compose -f docker-compose.production.yml down
echo    Restart:         docker-compose -f docker-compose.production.yml restart
echo.
echo 📁 Important Directories:
echo    Logs:            ./logs/
echo    Uploads:         ./uploads/
echo    Backups:         ./backups/
echo    Knowledge Base:  ./knowledge-base/
echo.
echo 🔑 Default Credentials:
echo    Admin Email:     admin@corallum.com
echo    Admin Password:  admin123
echo.
echo [INFO] Deployment completed successfully!
echo.
echo Press any key to open the application in your browser...
pause >nul
start http://localhost:8003/health

echo.
echo ========================================
echo ✅ Deployment Complete!
echo ========================================
pause
