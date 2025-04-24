@echo off
REM push_to_docker_hub.bat - Script for pushing Docker images to Docker Hub (Windows version)

echo [92m[1mPushing Table Annotation Tool images to Docker Hub[0m
echo.

REM Check if docker is installed
where docker >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [91mError: Docker is not installed or not in PATH[0m
    exit /b 1
)

REM Check if user is logged in to Docker Hub
echo [94mChecking Docker Hub login status...[0m
docker info | findstr Username >nul
if %ERRORLEVEL% NEQ 0 (
    echo [93mYou are not logged in to Docker Hub. Please login:[0m
    docker login
    
    REM Verify login was successful
    if %ERRORLEVEL% NEQ 0 (
        echo [91mDocker Hub login failed. Aborting.[0m
        exit /b 1
    )
)

set REPOSITORY=fioresxcat/table2html-annotation

REM Build the images first
echo [94mBuilding Docker images...[0m
docker-compose build

REM Tag the images
echo [94mTagging images with Docker Hub repository name...[0m
for /f "tokens=*" %%i in ('docker-compose config --services') do (
    if "%%i"=="frontend" (
        docker tag table-annotation_frontend %REPOSITORY%:frontend
    )
    if "%%i"=="backend" (
        docker tag table-annotation_backend %REPOSITORY%:backend
    )
)

REM Push the images
echo [94mPushing frontend image to Docker Hub...[0m
docker push %REPOSITORY%:frontend

echo [94mPushing backend image to Docker Hub...[0m
docker push %REPOSITORY%:backend

echo.
echo [92m[1mSuccess![0m Images have been pushed to Docker Hub repository: [1m%REPOSITORY%[0m
echo.
echo Team members can now pull these images using:
echo [93mdocker pull %REPOSITORY%:frontend[0m
echo [93mdocker pull %REPOSITORY%:backend[0m
echo.
echo They should also use [1mrun.bat --no-build[0m to use the pre-built images. 