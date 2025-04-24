#!/bin/bash
# run.sh - Launcher script for Table Annotation Tool

# Text styling
BOLD='\033[1m'
NORMAL='\033[0m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'

# Default values
REBUILD=true
DETACHED=false

# Parse command-line arguments
while [[ $# -gt 0 ]]; do
  case "$1" in
    --no-build)
      REBUILD=false
      shift
      ;;
    -d|--detach)
      DETACHED=true
      shift
      ;;
    --help)
      echo -e "${BOLD}Table Annotation Tool - Usage${NORMAL}"
      echo
      echo -e "Options:"
      echo -e "  --no-build       Skip rebuilding Docker images, use existing ones"
      echo -e "  -d, --detach     Run containers in detached mode (background)"
      echo -e "  --help           Display this help message"
      echo
      exit 0
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NORMAL}" >&2
      echo -e "Use ${BOLD}./run.sh --help${NORMAL} for available options"
      exit 1
      ;;
  esac
done

echo -e "${BOLD}${GREEN}Starting Table Annotation Tool...${NORMAL}"
echo

# Prompt for images directory
echo -e "${BLUE}Enter the full path to your images directory:${NORMAL}"
read IMAGES_DIR

# Validate directory exists
if [ ! -d "$IMAGES_DIR" ]; then
    echo -e "${YELLOW}Warning: Directory '$IMAGES_DIR' doesn't exist. Creating it now...${NORMAL}"
    mkdir -p "$IMAGES_DIR"
fi

# Set excluded directory
echo -e "${BLUE}Enter the full path for excluded images (or press Enter to use default: $IMAGES_DIR/excluded):${NORMAL}"
read EXCLUDED_DIR

if [ -z "$EXCLUDED_DIR" ]; then
    EXCLUDED_DIR="${IMAGES_DIR}/excluded"
    echo -e "Using default excluded directory: ${EXCLUDED_DIR}"
fi

# Set environment variables
export IMAGES_DIR="$IMAGES_DIR"
export EXCLUDED_DIR="$EXCLUDED_DIR"

echo
echo -e "${GREEN}Starting containers with:${NORMAL}"
echo -e "  - Images directory: ${BOLD}$IMAGES_DIR${NORMAL}"
echo -e "  - Excluded directory: ${BOLD}$EXCLUDED_DIR${NORMAL}"
if [ "$REBUILD" = false ]; then
    echo -e "  - ${YELLOW}Using existing Docker images (not rebuilding)${NORMAL}"
fi
echo
echo -e "${YELLOW}Once running, access the application at: ${BOLD}http://localhost${NORMAL}"
echo

# Start Docker Compose with appropriate options
if [ "$REBUILD" = false ] && [ "$DETACHED" = true ]; then
    docker-compose up -d --no-build
elif [ "$REBUILD" = false ]; then
    docker-compose up --no-build
elif [ "$DETACHED" = true ]; then
    docker-compose up -d
else
    docker-compose up
fi