#!/bin/bash
set -e

echo "🔧 Running post-create setup..."

# Install Node.js dependencies
echo "📦 Installing Node.js dependencies..."
npm install

# Setup Go modules for the Terraform provider
if [ -d "terraform-provider-apibasics" ]; then
    echo "🔨 Setting up Terraform provider..."
    cd terraform-provider-apibasics
    go mod download
    go mod tidy
    cd ..
fi

# Create local Terraform plugin directory
echo "📁 Creating Terraform plugin directory..."
mkdir -p ~/.terraform.d/plugins

# Setup git hooks if .git exists
if [ -d ".git" ]; then
    echo "🪝 Setting up git hooks..."
    git config --global --add safe.directory /workspace
fi

# Create environment template if it doesn't exist
if [ ! -f ".env.example" ]; then
    echo "📝 Creating .env.example..."
    cat > .env.example << 'EOF'
# API Basics Configuration
APIBASICS_ENDPOINT=https://api-basics.sharted.workers.dev
APIBASICS_EMAIL=your-email@example.com
APIBASICS_PASSWORD=your-password

# JWT Configuration (for local development)
JWT_SECRET=your-secret-key-here
JWT_ACCESS_EXPIRY=3600
JWT_REFRESH_EXPIRY=2592000
EOF
fi

echo "✅ Post-create setup complete!"
echo ""
echo "Next steps:"
echo "  1. Copy .env.example to .env and configure your credentials"
echo "  2. Run 'npm run dev' to start the API server"
echo "  3. Run 'cd terraform-provider-apibasics && go build' to build the provider"
echo ""
