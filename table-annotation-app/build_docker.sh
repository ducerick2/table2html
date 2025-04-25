#!/bin/bash
echo "Removing any existing table-annotation-frontend images..."
docker rmi table-annotation-frontend:latest fioresxcat/table2html-annotation:frontend || true

echo "Building fresh Docker image with latest code..."
docker build --no-cache -t table-annotation-frontend:latest -f Dockerfile .

echo "Tagging and pushing to Docker Hub..."
docker tag table-annotation-frontend:latest fioresxcat/table2html-annotation:frontend
docker push fioresxcat/table2html-annotation:frontend

echo "Build and push complete!"