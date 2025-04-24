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
    echo [1mTable Annotation Tool - Usage[0m
    echo.
    echo Options:
    echo   --no-build       Skip rebuilding Docker images, use existing ones
    echo   -d, --detach     Run containers in detached mode (background)
    echo   --help           Display this help message
    echo.
    exit /b 0
)

echo [91mUnknown option: %~1[0m
echo Use [1mrun.bat --help[0m for available options
exit /b 1

:done_args

echo [92m[1mStarting Table Annotation Tool...[0m
echo.

REM Prompt for images directory
set /p IMAGES_DIR=[94mEnter the full path to your images directory: [0m

REM Validate directory exists
if not exist "%IMAGES_DIR%" (
    echo [93mWarning: Directory '%IMAGES_DIR%' doesn't exist. Creating it now...[0m
    mkdir "%IMAGES_DIR%"
)

REM Set excluded directory
set /p EXCLUDED_DIR=[94mEnter the full path for excluded images (or press Enter to use default: %IMAGES_DIR%\excluded): [0m

if "%EXCLUDED_DIR%"=="" (
    set EXCLUDED_DIR=%IMAGES_DIR%\excluded
    echo Using default excluded directory: %EXCLUDED_DIR%
)

REM Set environment variables
set IMAGES_DIR=%IMAGES_DIR%
set EXCLUDED_DIR=%EXCLUDED_DIR%

echo.
echo [92mStarting containers with:[0m
echo   - Images directory: [1m%IMAGES_DIR%[0m
echo   - Excluded directory: [1m%EXCLUDED_DIR%[0m
if "%REBUILD%"=="false" (
    echo   - [93mUsing existing Docker images (not rebuilding)[0m
)
echo.
echo [93mOnce running, access the application at: [1mhttp://localhost[0m
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