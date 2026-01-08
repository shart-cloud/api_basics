#!/bin/bash
set -e

# This script runs every time the container starts

# Ensure proper permissions
if [ -d "node_modules" ]; then
    sudo chown -R vscode:vscode node_modules 2>/dev/null || true
fi

if [ -d "terraform-provider-apibasics" ]; then
    sudo chown -R vscode:vscode terraform-provider-apibasics 2>/dev/null || true
fi

# Check if user has configured their credentials
if [ ! -f ".env" ]; then
    echo "⚠️  Warning: .env file not found. Copy .env.example to .env and configure your credentials."
fi

# Display helpful information
echo "📚 Useful commands:"
echo "  npm run dev                    - Start API development server"
echo "  npm run db:migrate:local       - Run database migrations"
echo "  cd terraform-provider-apibasics && go build  - Build Terraform provider"
echo ""
echo "📖 Documentation:"
echo "  README.md       - API documentation"
echo "  COURSE.md       - Complete API course"
echo "  CHEATSHEET.md   - Quick reference"
echo "  HASHICUPS.md    - Terraform provider guide"
echo ""
