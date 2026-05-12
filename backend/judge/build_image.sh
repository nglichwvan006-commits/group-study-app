#!/bin/bash
# Script hỗ trợ build Docker image cho Judge Sandbox

echo "Đang build Docker Image: judge-sandbox:latest..."
docker build -t judge-sandbox:latest .

echo "Hoàn tất!"
