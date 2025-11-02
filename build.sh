#!/bin/bash
set -e

echo "🚀 Starting Hostinger deployment build..."
echo "Node.js version: $(node -v)"
echo "npm version: $(npm -v)"

echo "📦 Installing dependencies..."
npm ci --production=false

echo "🔨 Building for production..."
npm run build

echo "✅ Build completed successfully!"
echo "📁 Build output in: dist/"
ls -lah dist/
