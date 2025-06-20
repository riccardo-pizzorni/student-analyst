#!/bin/bash

echo ""
echo "========================================"
echo "  STUDENT ANALYST - CORS PROXY SERVER"
echo "========================================"
echo ""

# Change to script directory
cd "$(dirname "$0")"

echo "[1/4] Checking if server directory exists..."
if [ ! -d "server" ]; then
    echo "ERROR: Server directory not found!"
    echo "Please make sure you're running this from the project root."
    exit 1
fi

echo "[2/4] Navigating to server directory..."
cd server

echo "[3/4] Installing dependencies..."
if [ ! -d "node_modules" ]; then
    echo "Installing npm dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "ERROR: Failed to install dependencies!"
        exit 1
    fi
else
    echo "Dependencies already installed."
fi

echo "[4/4] Starting CORS Proxy Server..."
echo ""
echo "Server will start on: http://localhost:10000"
echo "Health check: http://localhost:10000/health"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

npm start 