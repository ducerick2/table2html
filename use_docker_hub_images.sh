#!/bin/bash
# use_docker_hub_images.sh - Script for using pre-built Docker images from Docker Hub

# Text styling
BOLD='\033[1m'
NORMAL='\033[0m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'

REPOSITORY="fioresxcat/table2html-annotation"

echo -e "${BOLD}${GREEN}Setting up Table Annotation Tool with pre-built Docker images${NORMAL}"
echo

# Check if docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker is not installed or not in PATH${NORMAL}"
    exit 1
fi

# Check if docker-compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}Error: docker-compose is not installed or not in PATH${NORMAL}"
    exit 1
fi

# Pull the latest images
echo -e "${BLUE}Pulling latest images from Docker Hub...${NORMAL}"
docker pull ${REPOSITORY}:frontend
docker pull ${REPOSITORY}:backend

# Create or update docker-compose.yml to use the pulled images
echo -e "${BLUE}Updating docker-compose.yml to use Docker Hub images...${NORMAL}"

cat > docker-compose.yml << EOF
version: '3'
services:
  frontend:
    image: ${REPOSITORY}:frontend
    ports:
      - "80:80"
    depends_on:
      - backend
    restart: unless-stopped

  backend:
    image: ${REPOSITORY}:backend
    ports:
      - "5000:5000"
    volumes:
      - \${IMAGES_DIR}:/app/images
      - \${EXCLUDED_DIR:-\${IMAGES_DIR}/excluded}:/app/excluded
    environment:
      - IMAGES_DIR=/app/images
      - EXCLUDED_DIR=/app/excluded
      - PORT=5000
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5000/api/status"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s
EOF

echo -e "${GREEN}Docker Compose configuration updated to use pre-built images.${NORMAL}"
echo
echo -e "${YELLOW}Now run the application using:${NORMAL}"
echo -e "${BOLD}./run.sh --no-build${NORMAL}" 