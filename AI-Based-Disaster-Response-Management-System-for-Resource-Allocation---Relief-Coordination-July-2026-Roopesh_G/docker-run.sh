#!/usr/bin/env bash
# =========================================================================
# ReliefOS AI - Build & Run Docker Container Helper (Linux / macOS / Jenkins)
# =========================================================================
set -e

echo "===> [1/3] Checking Docker daemon..."
if ! docker info >/dev/null 2>&1; then
    echo "ERROR: Docker daemon is not running."
    exit 1
fi

echo "===> [2/3] Building unified Docker image 'reliefos-app:latest'..."
docker build -t reliefos-app:latest .

echo "===> [3/3] Deploying container 'reliefos-app' on port 5000..."
docker stop reliefos-app >/dev/null 2>&1 || true
docker rm reliefos-app >/dev/null 2>&1 || true

docker run -d \
    --name reliefos-app \
    --restart unless-stopped \
    -p 5000:5000 \
    -e NODE_ENV=production \
    -e PORT=5000 \
    -e DEMO_MODE=true \
    -e CORS_ORIGIN=* \
    reliefos-app:latest

echo ""
echo "========================================================================="
echo "✅ ReliefOS container is up and running!"
echo "   URL: http://localhost:5000"
echo "   Health Check: http://localhost:5000/api/health"
echo "   Logs: docker logs -f reliefos-app"
echo "   Stop: docker stop reliefos-app"
echo "========================================================================="
