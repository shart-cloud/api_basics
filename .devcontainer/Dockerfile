# Use official Node.js image as base
FROM node:20-bullseye

# Avoid warnings by switching to noninteractive
ENV DEBIAN_FRONTEND=noninteractive

# Define versions
ARG GO_VERSION=1.21.6
ARG TERRAFORM_VERSION=1.7.0

# Install base packages
RUN apt-get update && apt-get -y install --no-install-recommends \
    git \
    openssh-client \
    less \
    curl \
    wget \
    unzip \
    ca-certificates \
    jq \
    vim \
    nano \
    sudo \
    && apt-get autoremove -y \
    && apt-get clean -y \
    && rm -rf /var/lib/apt/lists/*

# Install Go
RUN wget -q -O go.tar.gz "https://golang.org/dl/go${GO_VERSION}.linux-amd64.tar.gz" \
    && tar -C /usr/local -xzf go.tar.gz \
    && rm go.tar.gz

# Set Go environment variables
ENV GOPATH=/go
ENV PATH=$GOPATH/bin:/usr/local/go/bin:$PATH

# Create Go workspace
RUN mkdir -p "$GOPATH/src" "$GOPATH/bin" && chmod -R 777 "$GOPATH"

# Install Terraform
RUN wget -q -O terraform.zip "https://releases.hashicorp.com/terraform/${TERRAFORM_VERSION}/terraform_${TERRAFORM_VERSION}_linux_amd64.zip" \
    && unzip terraform.zip -d /usr/local/bin/ \
    && rm terraform.zip \
    && chmod +x /usr/local/bin/terraform

# Create non-root user
ARG USERNAME=vscode
ARG USER_UID=1000
ARG USER_GID=$USER_UID

RUN groupadd --gid $USER_GID $USERNAME \
    && useradd --uid $USER_UID --gid $USER_GID -m $USERNAME -s /bin/bash \
    && echo $USERNAME ALL=\(root\) NOPASSWD:ALL > /etc/sudoers.d/$USERNAME \
    && chmod 0440 /etc/sudoers.d/$USERNAME

# Set ownership of Go workspace
RUN chown -R $USERNAME:$USERNAME $GOPATH

# Switch to non-root user
USER $USERNAME

# Set working directory
WORKDIR /workspace

# Install global npm packages
RUN npm install -g wrangler

# Install Go tools (as vscode user)
RUN go install golang.org/x/tools/gopls@latest \
    && go install github.com/go-delve/delve/cmd/dlv@latest \
    && go install honnef.co/go/tools/cmd/staticcheck@latest

# Add welcome message to bashrc
RUN echo '' >> ~/.bashrc \
    && echo 'echo "🚀 API Basics Development Container"' >> ~/.bashrc \
    && echo 'echo "=================================="' >> ~/.bashrc \
    && echo 'echo ""' >> ~/.bashrc \
    && echo 'echo "Installed tools:"' >> ~/.bashrc \
    && echo 'echo "  - Node.js: $(node --version)"' >> ~/.bashrc \
    && echo 'echo "  - Go: $(go version | cut -d\" \" -f3)"' >> ~/.bashrc \
    && echo 'echo "  - Terraform: $(terraform version -json | jq -r .terraform_version)"' >> ~/.bashrc \
    && echo 'echo "  - Wrangler: $(wrangler --version)"' >> ~/.bashrc \
    && echo 'echo ""' >> ~/.bashrc

# Switch back to dialog
ENV DEBIAN_FRONTEND=dialog

CMD ["/bin/bash"]
