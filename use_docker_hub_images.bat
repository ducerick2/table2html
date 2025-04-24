@echo off
REM use_docker_hub_images.bat - Script for using pre-built Docker images from Docker Hub (Windows version)

echo [92m[1mSetting up Table Annotation Tool with pre-built Docker images[0m
echo.

REM Check if docker is installed
where docker >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [91mError: Docker is not installed or not in PATH[0m
    exit /b 1
)

REM Check if docker-compose is installed
where docker-compose >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [91mError: docker-compose is not installed or not in PATH[0m
    exit /b 1
)

set REPOSITORY=fioresxcat/table2html-annotation

REM Pull the latest images
echo [94mPulling latest images from Docker Hub...[0m
docker pull %REPOSITORY%:frontend
docker pull %REPOSITORY%:backend

REM Create or update docker-compose.yml to use the pulled images
echo [94mUpdating docker-compose.yml to use Docker Hub images...[0m

(
echo version: '3'
echo services:
echo   frontend:
echo     image: %REPOSITORY%:frontend
echo     ports:
echo       - "80:80"
echo     depends_on:
echo       - backend
echo     restart: unless-stopped
echo.
echo   backend:
echo     image: %REPOSITORY%:backend
echo     ports:
echo       - "5000:5000"
echo     volumes:
echo       - ${IMAGES_DIR}:/app/images
echo       - ${EXCLUDED_DIR:-${IMAGES_DIR}/excluded}:/app/excluded
echo     environment:
echo       - IMAGES_DIR=/app/images
echo       - EXCLUDED_DIR=/app/excluded
echo       - PORT=5000
echo     restart: unless-stopped
echo     healthcheck:
echo       test: ["CMD", "curl", "-f", "http://localhost:5000/api/status"]
echo       interval: 30s
echo       timeout: 10s
echo       retries: 3
echo       start_period: 10s
) > docker-compose.yml

echo [92mDocker Compose configuration updated to use pre-built images.[0m
echo.
echo [93mNow run the application using:[0m
echo [1mrun.bat --no-build[0m 