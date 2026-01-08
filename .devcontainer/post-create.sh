#!/bin/bash
set -e

echo "🔧 Running post-create setup..."

# Create directories with proper permissions
echo "📁 Creating plugin directories..."
mkdir -p ~/.terraform.d/plugins
mkdir -p ~/.terraform.d/plugin-cache

# Setup git
if [ -d ".git" ]; then
    echo "🪝 Setting up git..."
    git config --global --add safe.directory /workspace
fi

# Install wrangler globally
echo "☁️  Installing Cloudflare Wrangler..."
npm install -g wrangler --silent

# Install Go tools in background (non-blocking)
echo "🔧 Installing Go tools in background..."
{
    go install golang.org/x/tools/gopls@latest 2>&1 | grep -v "go: downloading" || true
    go install github.com/go-delve/delve/cmd/dlv@latest 2>&1 | grep -v "go: downloading" || true
    go install honnef.co/go/tools/cmd/staticcheck@latest 2>&1 | grep -v "go: downloading" || true
    echo "   ✓ Go tools installed"
} &

# Install Node.js dependencies
if [ -f "package.json" ]; then
    echo "📦 Installing Node.js dependencies..."
    npm install || echo "⚠️  npm install failed (this is okay if package.json is missing)"
fi

# Setup Go modules for the Terraform provider
if [ -d "terraform-provider-apibasics" ]; then
    echo "🔨 Setting up Terraform provider..."
    cd terraform-provider-apibasics
    go mod download || echo "⚠️  go mod download failed"
    go mod tidy || echo "⚠️  go mod tidy failed"
    cd ..
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

# Wait for background jobs to complete
wait

echo ""
echo "✅ Post-create setup complete!"
echo ""
echo "Installed tools:"
echo "  - Node.js: $(node --version)"
echo "  - Go: $(go version | cut -d' ' -f3)"
echo "  - Terraform: $(terraform version -json | jq -r .terraform_version)"
echo "  - Wrangler: $(wrangler --version)"
echo ""
echo "Next steps:"
echo "  1. Copy .env.example to .env and configure your credentials"
echo "  2. Run 'npm run dev' to start the API server"
echo "  3. Run 'cd terraform-provider-apibasics && go build' to build the provider"
echo ""
