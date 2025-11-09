#!/bin/bash

# Kill any process running on port 3000
echo "Killing processes on port 3000..."
lsof -ti :3000 | xargs kill -9 2>/dev/null || true

# Clean Next.js cache and dependencies
echo "Cleaning Next.js cache..."
rm -rf .next
rm -rf node_modules/.cache

# Remove lock files
echo "Removing lock files..."
rm -f package-lock.json
rm -f yarn.lock

# Clear npm cache
echo "Clearing npm cache..."
npm cache clean --force

# Reinstall dependencies
echo "Reinstalling dependencies..."
npm install

# Start development server
echo "Starting development server..."
npm run dev