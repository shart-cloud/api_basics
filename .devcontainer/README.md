# Dev Container Setup

This directory contains the configuration for a complete development environment using VS Code Dev Containers. The container includes everything you need to work on the API Basics project and build Terraform providers.

## What's Included

### Languages & Runtimes
- **Node.js 20** - For Cloudflare Workers and Wrangler
- **Go 1.21.6** - For building Terraform providers
- **Terraform 1.7.0** - For testing the provider

### Tools Pre-installed
- **Wrangler** - Cloudflare Workers CLI
- **gopls** - Go language server
- **delve** - Go debugger
- **staticcheck** - Go linter
- **golangci-lint** - Meta-linter for Go
- **git** - Version control
- **jq** - JSON processor
- **curl** - API testing

### VS Code Extensions
The container automatically installs:
- Go extension (golang.go)
- Terraform extension (hashicorp.terraform)
- REST Client (humao.rest-client)
- Prettier (code formatting)
- Markdown All in One
- GitLens
- Docker extension

## Prerequisites

1. **Install Docker Desktop**
   - Windows/Mac: https://www.docker.com/products/docker-desktop
   - Linux: Install Docker Engine

2. **Install VS Code**
   - Download from: https://code.visualstudio.com/

3. **Install Dev Containers Extension**
   - Open VS Code
   - Go to Extensions (Ctrl+Shift+X / Cmd+Shift+X)
   - Search for "Dev Containers"
   - Install "Dev Containers" by Microsoft

## Getting Started

### Option 1: Open in Container (Recommended)

1. **Open the project folder in VS Code**
   ```bash
   code /path/to/api-basics
   ```

2. **Reopen in Container**
   - VS Code will detect the dev container configuration
   - Click "Reopen in Container" when prompted
   - OR: Press F1 → "Dev Containers: Reopen in Container"

3. **Wait for setup**
   - First time: Downloads base image (~5-10 minutes)
   - Runs post-create script (installs dependencies)
   - Subsequent opens are much faster (~30 seconds)

### Option 2: Clone in Container

1. **Open VS Code**

2. **Clone Repository in Container**
   - Press F1
   - Type "Dev Containers: Clone Repository in Container Volume"
   - Enter the repository URL
   - Wait for setup to complete

## What Happens During Setup

### Build Phase (First Time Only)
1. Downloads Node.js 20 base image
2. Installs system packages (git, curl, etc.)
3. Downloads and installs Go 1.21.6
4. Downloads and installs Terraform 1.7.0
5. Installs Go development tools
6. Creates non-root user (vscode)
7. Installs Wrangler globally

**Time:** ~5-10 minutes (first time only)

### Post-Create Phase (Every Rebuild)
1. Runs `npm install` to install Node.js dependencies
2. Downloads Go modules for the Terraform provider
3. Creates Terraform plugin directory
4. Creates `.env.example` template
5. Sets up git configuration

**Time:** ~1-2 minutes

### Post-Start Phase (Every Container Start)
1. Fixes file permissions if needed
2. Displays helpful information and commands

**Time:** ~5 seconds

## Configuration Details

### Environment Variables

The container sets:
- `GO111MODULE=on` - Enable Go modules
- `GOPATH=/go` - Go workspace location
- `PATH` includes Go and Terraform binaries

### Port Forwarding

Port 8787 is forwarded for the Wrangler dev server.

When you run `npm run dev`, you can access the API at:
- http://localhost:8787

### Persistent Volumes

These are preserved between container rebuilds:
- **Bash history** - Your command history is saved
- **Go module cache** - Faster builds after first time
- **Terraform plugins** - Provider cache preserved

### File Mounts

- Workspace is mounted at `/workspace`
- All your code changes are immediately reflected
- No need to rebuild for code changes

## Using the Container

### Start the API Server

```bash
# Install dependencies (if not done automatically)
npm install

# Run database migrations
npm run db:migrate:local

# Start development server
npm run dev
```

Visit: http://localhost:8787

### Build the Terraform Provider

```bash
# Navigate to provider directory
cd terraform-provider-apibasics

# Download dependencies
go mod download

# Build the provider
go build -o terraform-provider-apibasics

# Install locally
mkdir -p ~/.terraform.d/plugins/api-basics/apibasics/1.0.0/linux_amd64/
cp terraform-provider-apibasics ~/.terraform.d/plugins/api-basics/apibasics/1.0.0/linux_amd64/
```

### Test the Provider

```bash
# Navigate to examples
cd terraform-provider-apibasics/examples

# Set credentials
export APIBASICS_EMAIL="your-email@example.com"
export APIBASICS_PASSWORD="your-password"

# Initialize Terraform
terraform init

# Plan changes
terraform plan

# Apply changes
terraform apply
```

### Run Tests

```bash
# Run Go tests
cd terraform-provider-apibasics
go test ./...

# Run Node.js tests (if any)
cd /workspace
npm test
```

## Customization

### Adding More VS Code Extensions

Edit `.devcontainer/devcontainer.json`:

```json
"extensions": [
  "golang.go",
  "hashicorp.terraform",
  "your-extension-id"
]
```

### Installing Additional Tools

Edit `.devcontainer/Dockerfile` and add to the RUN commands:

```dockerfile
RUN apt-get install -y your-package
```

Or add to `.devcontainer/post-create.sh`:

```bash
npm install -g your-tool
```

### Changing Go or Terraform Versions

Edit the ARG lines in `.devcontainer/Dockerfile`:

```dockerfile
ARG GO_VERSION=1.21.6       # Change this
ARG TERRAFORM_VERSION=1.7.0 # Change this
```

Then rebuild: F1 → "Dev Containers: Rebuild Container"

## Troubleshooting

### Container Won't Start

**Problem:** "Error: container failed to start"

**Solution:**
1. Check Docker is running: `docker ps`
2. Check Docker has enough resources (4GB RAM minimum)
3. Try rebuilding: F1 → "Dev Containers: Rebuild Container"
4. Check logs: F1 → "Dev Containers: Show Container Log"

### Port Already in Use

**Problem:** "Port 8787 is already in use"

**Solution:**
1. Stop other Wrangler instances
2. Or change the port in `wrangler.toml`
3. Update `.devcontainer/devcontainer.json` forwardPorts

### npm install Fails

**Problem:** "Permission denied" or "EACCES"

**Solution:**
1. Rebuild container: F1 → "Dev Containers: Rebuild Container"
2. Or manually fix permissions:
   ```bash
   sudo chown -R vscode:vscode /workspace/node_modules
   ```

### Go Modules Not Downloading

**Problem:** "cannot find module"

**Solution:**
1. Ensure you're in the right directory
2. Run manually:
   ```bash
   cd terraform-provider-apibasics
   go mod download
   go mod tidy
   ```

### Extensions Not Working

**Problem:** Go or Terraform extension not working

**Solution:**
1. Reload window: F1 → "Developer: Reload Window"
2. Check extension is installed: View → Extensions
3. Check language server is running in Output panel

## Performance Tips

### First Build
The first build takes 5-10 minutes. Be patient! Subsequent builds are much faster.

### Rebuilding
Only rebuild when you:
- Change Dockerfile or devcontainer.json
- Need to update Go/Terraform versions
- Experience persistent issues

Don't rebuild for:
- Code changes (reflected immediately)
- Installing npm packages (run npm install)
- Configuration changes (reload window)

### Docker Resources
For best performance, allocate to Docker:
- **CPU:** 2+ cores
- **Memory:** 4+ GB
- **Disk:** 20+ GB

Settings → Resources in Docker Desktop

## Container Lifecycle Commands

### Reopen in Container
F1 → "Dev Containers: Reopen in Container"
- Starts existing container or creates new one
- Runs post-start script
- Fast (~30 seconds)

### Rebuild Container
F1 → "Dev Containers: Rebuild Container"
- Rebuilds image from Dockerfile
- Runs post-create and post-start scripts
- Slow (5-10 minutes first time)
- Use when: Dockerfile or devcontainer.json changes

### Reopen Locally
F1 → "Dev Containers: Reopen Folder Locally"
- Closes container and opens locally
- Container keeps running in background
- Can reopen quickly later

## Working with Git

### Git Configuration

Set your identity (if not already):

```bash
git config --global user.name "Your Name"
git config --global user.email "your@email.com"
```

### SSH Keys

To use SSH keys with Git:

1. **Copy SSH keys into container:**
   ```bash
   # On host
   cat ~/.ssh/id_rsa.pub

   # In container
   mkdir -p ~/.ssh
   nano ~/.ssh/id_rsa.pub  # Paste and save
   ```

2. **Or mount SSH directory:**
   Add to `devcontainer.json` mounts:
   ```json
   "source=${localEnv:HOME}${localEnv:USERPROFILE}/.ssh,target=/home/vscode/.ssh,type=bind,readonly"
   ```

## Advanced: Multiple Containers

Running multiple containers from the same image:

1. Each window gets its own container
2. Changes to code are shared (same mounted directory)
3. Each has its own dev server on different ports

## FAQ

**Q: Do I need to install Go and Terraform on my host?**
A: No! Everything runs inside the container.

**Q: Can I use this on Windows?**
A: Yes! Works on Windows, Mac, and Linux.

**Q: Will my changes persist?**
A: Yes! Your code is mounted from the host filesystem.

**Q: Can I use my normal terminal?**
A: Yes, but you'll need Go and Terraform installed locally. The integrated terminal in VS Code runs inside the container.

**Q: How much disk space does this use?**
A: Initial image: ~2GB. With dependencies: ~3-4GB.

**Q: Can I customize the container?**
A: Yes! Edit the Dockerfile and devcontainer.json.

**Q: Is this the same as a virtual machine?**
A: No, containers are more lightweight than VMs.

## Resources

- [VS Code Dev Containers Documentation](https://code.visualstudio.com/docs/devcontainers/containers)
- [Dev Container Specification](https://containers.dev/)
- [Docker Documentation](https://docs.docker.com/)
- [Go in VS Code](https://code.visualstudio.com/docs/languages/go)
- [Terraform in VS Code](https://marketplace.visualstudio.com/items?itemName=HashiCorp.terraform)

## Getting Help

If you encounter issues:

1. Check this README
2. Check container logs: F1 → "Dev Containers: Show Container Log"
3. Try rebuilding: F1 → "Dev Containers: Rebuild Container"
4. Check Docker is running and has resources
5. Search for error messages in VS Code docs

## Summary

The dev container provides a complete, isolated development environment with:
- ✅ All tools pre-installed (Go, Terraform, Node.js)
- ✅ VS Code extensions configured
- ✅ Consistent environment across all machines
- ✅ No conflicts with host system
- ✅ Easy to share with other developers

Just open in container and start coding!
