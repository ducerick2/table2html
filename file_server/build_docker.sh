#!/bin/bash
echo "Removing any existing table-annotation-backend images..."
docker rmi table-annotation-backend:latest fioresxcat/table2html-annotation:backend || true

echo "Building fresh Docker image with latest code..."
docker build --no-cache -t table-annotation-backend:latest -f Dockerfile .

echo "Tagging and pushing to Docker Hub..."
docker tag table-annotation-backend:latest fioresxcat/table2html-annotation:backend
docker push fioresxcat/table2html-annotation:backend

echo "Backend build and push complete!"