@echo off
echo ========================================
echo RavenSync - Starting Services
echo ========================================
echo.

echo Checking Docker...
docker --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not installed or not running!
    echo Please install Docker Desktop from: https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

echo [OK] Docker is available
echo.

echo Starting MongoDB and Kafka...
docker-compose up -d

echo.
echo Waiting for services to be ready...
timeout /t 10 /nobreak >nul

echo.
echo ========================================
echo Services Status:
echo ========================================
docker-compose ps

echo.
echo ========================================
echo Service URLs:
echo ========================================
echo MongoDB:   mongodb://localhost:27017/ravensync
echo Kafka:     localhost:9092
echo Kafka UI:  http://localhost:8080
echo.
echo ========================================
echo Next Steps:
echo ========================================
echo 1. Open a new terminal
echo 2. cd backend
echo 3. npm run dev
echo.
echo To stop services: docker-compose stop
echo To view logs:     docker-compose logs -f
echo ========================================
pause
