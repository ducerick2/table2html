@echo off
REM run.bat - Launcher script for Table Annotation Tool (Windows version)

REM Default values
set REBUILD=true
set DETACHED=false

REM Parse command-line arguments
:parse_args
if "%~1"=="" goto :done_args
if "%~1"=="--no-build" (
    set REBUILD=false
    shift
    goto :parse_args
)
if "%~1"=="-d" (
    set DETACHED=true
    shift
    goto :parse_args
)
if "%~1"=="--detach" (
    set DETACHED=true
    shift
    goto :parse_args
)
if "%~1"=="--help" (
    echo Table Annotation Tool - Usage
    echo.
    echo Options:
    echo   --no-build       Skip rebuilding Docker images, use existing ones
    echo   -d, --detach     Run containers in detached mode (background)
    echo   --help           Display this help message
    echo.
    exit /b 0
)

echo Unknown option: %~1
echo Use run.bat --help for available options
exit /b 1

:done_args

echo Starting Table Annotation Tool...
echo.

REM Prompt for images directory
set /p IMAGES_DIR=Enter the full path to your images directory: 

REM Validate directory exists
if not exist "%IMAGES_DIR%" (
    echo Warning: Directory '%IMAGES_DIR%' doesn't exist. Creating it now...
    mkdir "%IMAGES_DIR%"
)

REM Set excluded directory
set /p EXCLUDED_DIR=Enter the full path for excluded images (or press Enter to use default: %IMAGES_DIR%\excluded): 

if "%EXCLUDED_DIR%"=="" (
    set EXCLUDED_DIR=%IMAGES_DIR%\excluded
    echo Using default excluded directory: %EXCLUDED_DIR%
)

REM Set environment variables
set IMAGES_DIR=%IMAGES_DIR%
set EXCLUDED_DIR=%EXCLUDED_DIR%

echo.
echo Starting containers with:
echo   - Images directory: %IMAGES_DIR%
echo   - Excluded directory: %EXCLUDED_DIR%
if "%REBUILD%"=="false" (
    echo   - Using existing Docker images (not rebuilding)
)
echo.
echo Once running, access the application at: http://localhost
echo.

REM Start Docker Compose with appropriate options
if "%REBUILD%"=="false" (
    if "%DETACHED%"=="true" (
        docker-compose up -d --no-build
    ) else (
        docker-compose up --no-build
    )
) else (
    if "%DETACHED%"=="true" (
        docker-compose up -d
    ) else (
        docker-compose up
    )
) 