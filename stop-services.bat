@echo off
echo ========================================
echo RavenSync - Stopping Services
echo ========================================
echo.

docker-compose stop

echo.
echo Services stopped successfully!
echo.
echo To start again: docker-compose start
echo To remove all:  docker-compose down
echo ========================================
pause
