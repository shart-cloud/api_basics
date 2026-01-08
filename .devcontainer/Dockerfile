# Use official Node.js image as base (for Cloudflare Workers / Wrangler)
FROM node:20-bullseye

# Avoid warnings by switching to noninteractive
ENV DEBIAN_FRONTEND=noninteractive

# Define versions
ARG GO_VERSION=1.21.6
ARG TERRAFORM_VERSION=1.7.0

# Configure apt and install packages
RUN apt-get update \
    && apt-get -y install --no-install-recommends \
    apt-utils \
    dialog \
    2>&1 \
    #
    # Install git, process tools, lsb-release (useful for CLI installs)
    && apt-get -y install \
    git \
    openssh-client \
    less \
    iproute2 \
    procps \
    lsb-release \
    curl \
    wget \
    unzip \
    ca-certificates \
    gnupg2 \
    jq \
    vim \
    nano \
    #
    # Clean up
    && apt-get autoremove -y \
    && apt-get clean -y \
    && rm -rf /var/lib/apt/lists/*

# Install Go
RUN wget -O go.tar.gz "https://golang.org/dl/go${GO_VERSION}.linux-amd64.tar.gz" \
    && tar -C /usr/local -xzf go.tar.gz \
    && rm go.tar.gz

# Set Go environment variables
ENV GOPATH=/go
ENV PATH=$GOPATH/bin:/usr/local/go/bin:$PATH

# Create Go workspace
RUN mkdir -p "$GOPATH/src" "$GOPATH/bin" && chmod -R 777 "$GOPATH"

# Install Go tools
RUN go install golang.org/x/tools/gopls@latest \
    && go install github.com/go-delve/delve/cmd/dlv@latest \
    && go install honnef.co/go/tools/cmd/staticcheck@latest \
    && go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest

# Install Terraform
RUN wget -O terraform.zip "https://releases.hashicorp.com/terraform/${TERRAFORM_VERSION}/terraform_${TERRAFORM_VERSION}_linux_amd64.zip" \
    && unzip terraform.zip -d /usr/local/bin/ \
    && rm terraform.zip \
    && chmod +x /usr/local/bin/terraform

# Verify installations
RUN go version && terraform version && node --version && npm --version

# Create a non-root user to use
ARG USERNAME=vscode
ARG USER_UID=1000
ARG USER_GID=$USER_UID

RUN groupadd --gid $USER_GID $USERNAME \
    && useradd --uid $USER_UID --gid $USER_GID -m $USERNAME -s /bin/bash \
    #
    # Add sudo support
    && apt-get update \
    && apt-get install -y sudo \
    && echo $USERNAME ALL=\(root\) NOPASSWD:ALL > /etc/sudoers.d/$USERNAME \
    && chmod 0440 /etc/sudoers.d/$USERNAME \
    #
    # Clean up
    && apt-get autoremove -y \
    && apt-get clean -y \
    && rm -rf /var/lib/apt/lists/*

# Set ownership of Go workspace
RUN chown -R $USERNAME:$USERNAME $GOPATH

# Switch back to dialog for any ad-hoc use of apt-get
ENV DEBIAN_FRONTEND=dialog

# Set the default user
USER $USERNAME

# Set working directory
WORKDIR /workspace

# Install global npm packages (as vscode user)
RUN npm install -g wrangler

# Display welcome message
RUN echo 'echo ""' >> ~/.bashrc \
    && echo 'echo "🚀 API Basics Development Container"' >> ~/.bashrc \
    && echo 'echo "=================================="' >> ~/.bashrc \
    && echo 'echo ""' >> ~/.bashrc \
    && echo 'echo "Installed tools:"' >> ~/.bashrc \
    && echo 'echo "  - Node.js $(node --version)"' >> ~/.bashrc \
    && echo 'echo "  - Go $(go version | cut -d\" \" -f3)"' >> ~/.bashrc \
    && echo 'echo "  - Terraform $(terraform version | head -n1 | cut -d\" \" -f2)"' >> ~/.bashrc \
    && echo 'echo "  - Wrangler $(wrangler --version)"' >> ~/.bashrc \
    && echo 'echo ""' >> ~/.bashrc \
    && echo 'echo "Quick start:"' >> ~/.bashrc \
    && echo 'echo "  npm install                 # Install dependencies"' >> ~/.bashrc \
    && echo 'echo "  npm run dev                 # Start API dev server"' >> ~/.bashrc \
    && echo 'echo "  cd terraform-provider-apibasics && go build  # Build provider"' >> ~/.bashrc \
    && echo 'echo ""' >> ~/.bashrc

# Default command
CMD ["/bin/bash"]
