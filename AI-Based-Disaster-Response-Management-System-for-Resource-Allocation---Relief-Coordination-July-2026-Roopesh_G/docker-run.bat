@echo off
REM =========================================================================
REM ReliefOS AI - Build & Run Docker Container Helper (Windows)
REM =========================================================================

echo [1/3] Checking Docker daemon status...
docker info >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Docker daemon is not running!
    echo Please make sure Docker Desktop is launched and running, then re-run this script.
    pause
    exit /b 1
)

echo [2/3] Building unified Docker image 'reliefos-app:latest'...
docker build -t reliefos-app:latest .
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Docker build failed!
    pause
    exit /b 1
)

echo [3/3] Stopping existing container if running...
docker stop reliefos-app >nul 2>&1
docker rm reliefos-app >nul 2>&1

echo Starting container 'reliefos-app' on port 5000...
docker run -d ^
    --name reliefos-app ^
    --restart unless-stopped ^
    -p 5000:5000 ^
    -e NODE_ENV=production ^
    -e PORT=5000 ^
    -e DEMO_MODE=true ^
    -e CORS_ORIGIN=* ^
    reliefos-app:latest

echo.
echo =========================================================================
echo ReliefOS container is running!
echo URL: http://localhost:5000
echo Health Check: http://localhost:5000/api/health
echo Container Logs: docker logs -f reliefos-app
echo Stop Container: docker stop reliefos-app
echo =========================================================================
pause
