# From API Basics to Terraform Providers
## Why Your API Knowledge Matters for Infrastructure as Code

Now that you understand REST APIs, HTTP methods, OAuth 2.0, and CRUD operations, you're ready to learn how these concepts power one of the most important tools in modern infrastructure management: **Terraform**.

This guide connects what you've just learned to **Terraform provider development** and introduces you to **HashiCups**, HashiCorp's educational platform for building custom Terraform providers.

---

## Table of Contents

1. [What is Terraform?](#what-is-terraform)
2. [What are Terraform Providers?](#what-are-terraform-providers)
3. [Why CRUD Operations Matter for Terraform](#why-crud-operations-matter-for-terraform)
4. [Mapping API Concepts to Terraform](#mapping-api-concepts-to-terraform)
5. [Parallel Example: Todos vs Coffee Orders](#parallel-example-todos-vs-coffee-orders)
6. [Why Your API Course Prepared You](#why-your-api-course-prepared-you)
7. [Hands-On: Use the API Basics Provider](#hands-on-use-the-api-basics-provider)
8. [Next Steps: HashiCups Tutorial](#next-steps-hashicups-tutorial)

---

## What is Terraform?

**Terraform** is an Infrastructure as Code (IaC) tool that lets you define and manage infrastructure using declarative configuration files instead of manual processes.

### The Problem Terraform Solves

**Without Terraform:**
```bash
# Manual process - error-prone, not repeatable
1. Log into AWS console
2. Click through UI to create EC2 instance
3. Manually configure security groups
4. Set up load balancer by hand
5. Hope you remember all steps next time
```

**With Terraform:**
```hcl
# Declarative configuration - repeatable, version-controlled
resource "aws_instance" "web" {
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = "t2.micro"

  tags = {
    Name = "WebServer"
  }
}
```

Run `terraform apply` and Terraform:
1. Creates the infrastructure
2. Tracks the state
3. Can update or destroy it later
4. Makes infrastructure reproducible

**Key Concepts:**
- **Declarative**: You describe what you want, not how to get it
- **State Management**: Terraform tracks what exists
- **Plan & Apply**: Preview changes before executing
- **Infrastructure as Code**: Version control your infrastructure

---

## What are Terraform Providers?

**Providers** are plugins that enable Terraform to interact with APIs. Each provider knows how to:
- **Authenticate** with an API (OAuth, API keys, etc.)
- **Translate** Terraform configuration to API calls
- **Map** API resources to Terraform resources
- **Handle** the complete CRUD lifecycle

### Official Providers

HashiCorp and the community maintain thousands of providers:
- **AWS Provider**: Manages AWS resources (EC2, S3, RDS, etc.)
- **Azure Provider**: Manages Azure resources
- **Kubernetes Provider**: Manages K8s resources
- **GitHub Provider**: Manages repositories, teams, etc.

### Why Build Custom Providers?

You might need a custom provider when:
- Your company has internal APIs for infrastructure
- You want to manage SaaS products via Terraform
- No existing provider exists for your platform
- You need to extend Terraform's capabilities

**This is where your API knowledge becomes critical.**

---

## Why CRUD Operations Matter for Terraform

Terraform's entire resource lifecycle maps directly to CRUD operations:

| Terraform Action | HTTP Method | What Happens |
|------------------|-------------|--------------|
| `terraform apply` (create) | **POST** | Create new resource via API |
| `terraform refresh` / read | **GET** | Read current state from API |
| `terraform apply` (update) | **PUT/PATCH** | Update existing resource via API |
| `terraform destroy` | **DELETE** | Delete resource via API |

### Example: Managing a Todo with Terraform

If we built a Terraform provider for the API Basics service, it would look like this:

**Terraform Configuration:**
```hcl
resource "apibasics_todo" "my_task" {
  title       = "Learn Terraform Providers"
  description = "Build a custom provider"
  completed   = false
}
```

**What happens behind the scenes:**

**1. Create (`terraform apply` - first time):**
```bash
# Provider executes:
POST /todos
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Learn Terraform Providers",
  "description": "Build a custom provider",
  "completed": false
}

# API returns:
{
  "id": "a0ba571e-28f5-4a63-8d9c-3535ae80ba23",
  "title": "Learn Terraform Providers",
  ...
}

# Terraform saves ID in state file
```

**2. Read (terraform refresh):**
```bash
# Provider executes:
GET /todos/a0ba571e-28f5-4a63-8d9c-3535ae80ba23
Authorization: Bearer <token>

# Verifies resource still exists and matches state
```

**3. Update (`terraform apply` - after config change):**
```hcl
resource "apibasics_todo" "my_task" {
  title       = "Learn Terraform Providers"
  description = "Build a custom provider"
  completed   = true  # Changed!
}
```

```bash
# Provider executes:
PUT /todos/a0ba571e-28f5-4a63-8d9c-3535ae80ba23
Authorization: Bearer <token>
Content-Type: application/json

{
  "completed": true
}
```

**4. Delete (`terraform destroy`):**
```bash
# Provider executes:
DELETE /todos/a0ba571e-28f5-4a63-8d9c-3535ae80ba23
Authorization: Bearer <token>

# Removes resource from state
```

**See the connection?** Everything you learned about CRUD operations directly applies to Terraform provider development!

---

## Mapping API Concepts to Terraform

### 1. Authentication & Tokens

**What you learned:**
- OAuth 2.0 password grant flow
- Access tokens and refresh tokens
- Bearer token authentication

**In Terraform providers:**
```hcl
provider "apibasics" {
  email    = "user@example.com"
  password = "secret"  # Or use environment variables
}

# Provider handles:
# 1. POST /token to get access token
# 2. Storing token for subsequent requests
# 3. Auto-refreshing when expired
# 4. Adding Authorization: Bearer <token> to all requests
```

Providers typically support multiple authentication methods:
- API keys
- OAuth tokens
- Service account credentials
- Environment variables

### 2. HTTP Methods & Idempotency

**What you learned:**
- GET is idempotent and safe
- POST creates resources (not idempotent)
- PUT updates resources (idempotent)
- DELETE removes resources (idempotent)

**Why this matters for Terraform:**
- Terraform relies on idempotency for `terraform apply`
- Running apply twice shouldn't create duplicate resources
- Providers must handle idempotent operations correctly
- Failed operations must be recoverable

**Example scenario:**
```bash
# First apply - creates todo
terraform apply  # POST /todos → creates resource

# Second apply (no changes) - should be no-op
terraform apply  # GET /todos/:id → resource exists, no changes needed

# Not: POST /todos again (would create duplicate!)
```

### 3. Resource Identification (UUIDs)

**What you learned:**
- UUIDs prevent enumeration attacks
- Resource IDs must be unique and stable
- IDs are returned by the API, not chosen by client

**In Terraform:**
```hcl
resource "apibasics_todo" "task1" {
  # You don't specify the ID
  title = "My Task"
}

# After creation, Terraform stores:
# ID: a0ba571e-28f5-4a63-8d9c-3535ae80ba23

# Terraform uses this ID for:
# - State tracking (knows which API resource belongs to which config)
# - Updates (PUT /todos/a0ba571e-28f5-4a63-8d9c-3535ae80ba23)
# - Deletion (DELETE /todos/a0ba571e-28f5-4a63-8d9c-3535ae80ba23)
```

**Why UUIDs are perfect for Terraform:**
- **Globally unique**: No collisions across environments
- **Non-sequential**: Can't guess other resource IDs
- **Stable**: ID never changes after creation
- **State management**: Terraform tracks resources by ID

### 4. Error Handling & Status Codes

**What you learned:**
- 200 OK - Success
- 201 Created - Resource created
- 400 Bad Request - Validation error
- 401 Unauthorized - Auth problem
- 404 Not Found - Resource doesn't exist
- 409 Conflict - Resource already exists

**In Terraform providers:**
```go
// Pseudo-code showing provider error handling
func CreateTodo(d *schema.ResourceData) error {
    resp, err := client.Post("/todos", data)

    switch resp.StatusCode {
    case 201:
        // Success - set ID and return
        d.SetId(resp.ID)
        return nil
    case 400:
        // Validation error - return error to user
        return fmt.Errorf("Invalid todo: %s", resp.Error)
    case 401:
        // Auth error - credentials invalid
        return fmt.Errorf("Authentication failed")
    case 409:
        // Resource exists - try to import instead?
        return fmt.Errorf("Todo already exists")
    default:
        return fmt.Errorf("Unexpected error: %d", resp.StatusCode)
    }
}
```

### 5. State Management & Eventual Consistency

**What you learned:**
- REST APIs are stateless
- Each request is independent
- Server doesn't remember previous requests

**Terraform's state file bridges this gap:**
```json
{
  "version": 4,
  "terraform_version": "1.5.0",
  "resources": [
    {
      "type": "apibasics_todo",
      "name": "my_task",
      "provider": "provider[\"apibasics\"]",
      "instances": [
        {
          "attributes": {
            "id": "a0ba571e-28f5-4a63-8d9c-3535ae80ba23",
            "title": "Learn Terraform Providers",
            "completed": false
          }
        }
      ]
    }
  ]
}
```

**State file contains:**
- Resource IDs (UUIDs from API)
- Current attribute values
- Metadata for tracking changes

**Why this matters:**
- Terraform knows which API resources it manages
- Can detect drift (changes made outside Terraform)
- Enables planning (preview changes before applying)

---

## Parallel Example: Todos vs Coffee Orders

Let's compare your API Basics todos with HashiCups coffee orders to show the parallel structure.

### Your API Basics - Todos

**API Endpoint:**
```
POST   /todos      # Create todo
GET    /todos      # List todos
GET    /todos/:id  # Get specific todo
PUT    /todos/:id  # Update todo
DELETE /todos/:id  # Delete todo
```

**Example API Request:**
```bash
curl -X POST https://api-basics.sharted.workers.dev/todos \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Buy coffee",
    "description": "Visit HashiCups",
    "completed": false
  }'
```

**Response:**
```json
{
  "id": "a0ba571e-28f5-4a63-8d9c-3535ae80ba23",
  "userId": "5b6d8fd7-0c83-4e85-b604-39ee43af55eb",
  "title": "Buy coffee",
  "description": "Visit HashiCups",
  "completed": false,
  "createdAt": "2026-01-08T18:00:00Z",
  "updatedAt": "2026-01-08T18:00:00Z"
}
```

**Hypothetical Terraform Resource:**
```hcl
resource "apibasics_todo" "buy_coffee" {
  title       = "Buy coffee"
  description = "Visit HashiCups"
  completed   = false
}
```

### HashiCups - Coffee Orders

**API Endpoint:**
```
POST   /orders      # Create order
GET    /orders      # List orders
GET    /orders/:id  # Get specific order
PATCH  /orders/:id  # Update order
DELETE /orders/:id  # Delete order
```

**Example API Request:**
```bash
curl -X POST https://api.hashicups.com/orders \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "coffee_id": 1,
        "quantity": 2
      }
    ]
  }'
```

**Response:**
```json
{
  "id": 1,
  "items": [
    {
      "coffee": {
        "id": 1,
        "name": "Packer Spiced Latte",
        "price": 4.99
      },
      "quantity": 2
    }
  ],
  "status": "pending"
}
```

**Terraform Resource:**
```hcl
resource "hashicups_order" "order" {
  items = [
    {
      coffee_id = 1
      quantity  = 2
    }
  ]
}
```

### Side-by-Side Comparison

| Aspect | API Basics (Todos) | HashiCups (Coffee Orders) |
|--------|-------------------|---------------------------|
| **Resource** | Todo | Coffee Order |
| **Create** | POST /todos | POST /orders |
| **Read** | GET /todos/:id | GET /orders/:id |
| **Update** | PUT /todos/:id | PATCH /orders/:id |
| **Delete** | DELETE /todos/:id | DELETE /orders/:id |
| **Auth** | Bearer token (OAuth 2.0) | Bearer token |
| **ID Format** | UUID | Integer (educational simplification) |
| **Terraform Type** | apibasics_todo | hashicups_order |

**Key Insight:** The pattern is identical! Once you understand how to work with one REST API, you can work with any REST API - and build Terraform providers for them.

### Complete Lifecycle Example

**Scenario: Manage a coffee order through Terraform**

**1. Define in Terraform:**
```hcl
resource "hashicups_order" "morning_coffee" {
  items = [
    {
      coffee_id = 1
      quantity  = 2
    }
  ]
}
```

**2. Create (`terraform apply`):**
```bash
# Terraform calls provider
# Provider executes: POST /orders
# Returns: {"id": 123, "status": "pending"}
# Terraform saves ID=123 in state
```

**3. Update order:**
```hcl
resource "hashicups_order" "morning_coffee" {
  items = [
    {
      coffee_id = 1
      quantity  = 3  # Changed from 2 to 3
    }
  ]
}
```

```bash
# terraform apply
# Provider executes: PATCH /orders/123
# Updates quantity to 3
```

**4. Destroy (`terraform destroy`):**
```bash
# Provider executes: DELETE /orders/123
# Order cancelled
# Terraform removes from state
```

**This is exactly like your todos API!** The only difference is:
- Todos API manages tasks
- HashiCups API manages coffee orders

The underlying CRUD pattern is the same.

---

## Why Your API Course Prepared You

Now you understand why the API Basics course was essential preparation for Terraform provider development.

### What You Mastered

#### 1. HTTP Fundamentals
**What you learned:**
- HTTP request/response cycle
- Request methods (GET, POST, PUT, DELETE)
- Headers (Content-Type, Authorization)
- Status codes (200, 201, 400, 401, 404, 409, 500)

**Why it matters:**
- Providers make HTTP requests to APIs
- Must handle all HTTP methods correctly
- Must interpret status codes properly
- Must set appropriate headers

#### 2. CRUD Operations
**What you learned:**
- Create resources with POST
- Read resources with GET
- Update resources with PUT
- Delete resources with DELETE
- Idempotency and when it matters

**Why it matters:**
- Terraform resource lifecycle = CRUD operations
- terraform apply (create) → POST
- terraform refresh → GET
- terraform apply (update) → PUT/PATCH
- terraform destroy → DELETE

#### 3. Authentication & Authorization
**What you learned:**
- OAuth 2.0 password grant flow
- Access tokens (short-lived, JWT)
- Refresh tokens (long-lived, stored)
- Token lifecycle management
- Bearer token authentication

**Why it matters:**
- Providers must authenticate with APIs
- Must handle token expiration and refresh
- Must secure credential storage
- Must support multiple auth methods

#### 4. JSON & Data Structures
**What you learned:**
- Sending JSON in request bodies
- Parsing JSON responses
- Nested JSON objects (preferences)
- Content-Type negotiation

**Why it matters:**
- Most APIs use JSON
- Providers must serialize Terraform config to JSON
- Must deserialize API responses to Terraform state
- Must handle complex nested structures

#### 5. Error Handling
**What you learned:**
- Reading error messages
- Handling 400, 401, 404, 409, 500 errors
- Debugging with verbose mode
- Retry logic for transient failures

**Why it matters:**
- Providers must handle API errors gracefully
- Must translate API errors to Terraform errors
- Must implement retry logic for reliability
- Must provide helpful error messages to users

#### 6. Resource Management
**What you learned:**
- UUIDs for resource identification
- Resource ownership (userId)
- Preventing unauthorized access
- Data isolation between users

**Why it matters:**
- Terraform tracks resources by ID
- Must ensure correct resource identification
- Must handle resource not found scenarios
- Must prevent accidental resource conflicts

#### 7. API Design Patterns
**What you learned:**
- RESTful URL design
- Resource-based endpoints
- Stateless requests
- Consistent response formats
- Content negotiation

**Why it matters:**
- Understand API design helps build better providers
- Can anticipate API behavior
- Can handle edge cases
- Can design provider schemas that match API structure

---

## Hands-On: Use the API Basics Provider

Before jumping into building providers from scratch with HashiCups, let's get hands-on experience using a complete Terraform provider. We've included a fully functional provider for the API Basics service in this repository!

### Why Start Here?

1. **See a working provider** - Examine real provider code that works with your API
2. **Use before building** - Understand the user experience before becoming a developer
3. **Connect concepts** - See how your curl commands translate to Terraform resources
4. **Practice workflow** - Learn terraform init, plan, apply, destroy with a familiar API

### Prerequisites

Before building the provider, ensure you have the required tools installed:

```bash
# Check Go version (1.21+ required)
go version
# Expected: go version go1.21.x or higher

# Check Terraform version (1.0+ required)
terraform version
# Expected: Terraform v1.x.x

# If Go is not installed, install it:
# Linux: sudo apt install golang-go
# macOS: brew install go
# Windows: Download from https://go.dev/dl/
```

### Step 1: Register an Account on API Basics

First, you need an account on the API Basics service. If you completed the course, you already have one. If not:

```bash
curl -X POST https://api-basics.sharted.workers.dev/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@example.com",
    "password": "YourSecurePassword123",
    "name": "Your Name"
  }'
```

**Expected response:**
```json
{
  "id": "uuid-here",
  "email": "your-email@example.com",
  "name": "Your Name",
  "access_token": "eyJhbG...",
  "refresh_token": "eyJhbG..."
}
```

### Step 2: Test Your Credentials

Verify your credentials work by getting a token:

```bash
curl -X POST https://api-basics.sharted.workers.dev/token \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@example.com",
    "password": "YourSecurePassword123"
  }'
```

**Expected response:**
```json
{
  "access_token": "eyJhbG...",
  "refresh_token": "eyJhbG...",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

Save the access token to test API access:
```bash
export ACCESS_TOKEN="<paste-your-access-token-here>"

# Test that you can access the API
curl https://api-basics.sharted.workers.dev/todos \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### Step 3: Navigate to the Provider Directory

```bash
cd terraform-provider-apibasics
```

### Step 4: Download Dependencies and Build

```bash
# Download Go module dependencies
go mod download

# Build the provider binary
go build -o terraform-provider-apibasics

# Verify the build succeeded
ls -la terraform-provider-apibasics
# Should show the executable file
```

**Troubleshooting build issues:**
```bash
# If you get module errors, try:
go mod tidy
go build -o terraform-provider-apibasics

# If you get permission errors on the output:
chmod +x terraform-provider-apibasics
```

### Step 5: Install the Provider Locally

Terraform needs to find the provider in a specific location. Install it based on your operating system:

```bash
# Determine your OS and architecture automatically
OS=$(go env GOOS)
ARCH=$(go env GOARCH)

# Create the local provider directory
mkdir -p ~/.terraform.d/plugins/api-basics/apibasics/1.0.0/${OS}_${ARCH}/

# Copy the provider binary
cp terraform-provider-apibasics ~/.terraform.d/plugins/api-basics/apibasics/1.0.0/${OS}_${ARCH}/

# Verify installation
ls -la ~/.terraform.d/plugins/api-basics/apibasics/1.0.0/${OS}_${ARCH}/
```

**Platform-specific paths:**

| Platform | Path |
|----------|------|
| Linux (AMD64) | `~/.terraform.d/plugins/api-basics/apibasics/1.0.0/linux_amd64/` |
| Linux (ARM64) | `~/.terraform.d/plugins/api-basics/apibasics/1.0.0/linux_arm64/` |
| macOS (Intel) | `~/.terraform.d/plugins/api-basics/apibasics/1.0.0/darwin_amd64/` |
| macOS (Apple Silicon) | `~/.terraform.d/plugins/api-basics/apibasics/1.0.0/darwin_arm64/` |
| Windows | `%APPDATA%\terraform.d\plugins\api-basics\apibasics\1.0.0\windows_amd64\` |

### Step 6: Configure Authentication

The provider reads credentials from environment variables. Set them in your terminal:

```bash
# Set your API Basics credentials
export APIBASICS_EMAIL="your-email@example.com"
export APIBASICS_PASSWORD="YourSecurePassword123"

# Optional: Set a custom endpoint (defaults to production API)
# export APIBASICS_ENDPOINT="https://api-basics.sharted.workers.dev"

# Verify the variables are set
echo "Email: $APIBASICS_EMAIL"
echo "Password is set: $([ -n "$APIBASICS_PASSWORD" ] && echo 'yes' || echo 'no')"
```

**For persistent configuration**, add these to your shell profile:
```bash
# Add to ~/.bashrc, ~/.zshrc, or equivalent
echo 'export APIBASICS_EMAIL="your-email@example.com"' >> ~/.bashrc
echo 'export APIBASICS_PASSWORD="YourSecurePassword123"' >> ~/.bashrc
source ~/.bashrc
```

### Step 7: Initialize and Run Examples

```bash
# Navigate to the examples directory
cd examples

# Initialize Terraform (loads the provider)
terraform init

# Preview what Terraform will do
terraform plan

# Apply the configuration (creates resources via API)
terraform apply
# Type 'yes' when prompted

# View the created resources
terraform show
```

### Step 8: Verify with curl

Confirm Terraform created the todo by checking the API directly:

```bash
# Get a fresh token
export ACCESS_TOKEN=$(curl -s -X POST https://api-basics.sharted.workers.dev/token \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$APIBASICS_EMAIL\",\"password\":\"$APIBASICS_PASSWORD\"}" | \
  grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

# List your todos - you should see the one Terraform created
curl -s https://api-basics.sharted.workers.dev/todos \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq
```

### Step 9: Update a Resource

Modify the Terraform configuration to see an update in action:

```bash
# Edit examples/main.tf - change completed from false to true
# Or change the title

# Preview the changes
terraform plan
# Shows: completed: false → true

# Apply the update (sends PUT request to API)
terraform apply
```

### Step 10: Destroy Resources

Clean up by destroying the resources:

```bash
# Destroy all resources managed by Terraform
terraform destroy
# Type 'yes' when prompted

# Verify with curl - the todo should be gone
curl -s https://api-basics.sharted.workers.dev/todos \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq
```

### Understanding the Authentication Flow

When you run `terraform apply`, here's what happens internally:

```
terraform init
    ↓
Load provider binary from ~/.terraform.d/plugins/
    ↓
terraform apply
    ↓
Provider Configure() called
    ↓
POST /token with APIBASICS_EMAIL and APIBASICS_PASSWORD
    ↓
Receive: {"access_token": "eyJhbG...", "refresh_token": "..."}
    ↓
Store tokens in provider client
    ↓
For each resource operation:
    └─→ Add "Authorization: Bearer <access_token>" header
    └─→ Make API request (POST, GET, PUT, DELETE)
    └─→ On 401 error: Use refresh_token to get new access_token
```

### Troubleshooting

**Provider not found:**
```bash
# Error: Failed to query available provider packages

# Verify the provider is installed
ls -la ~/.terraform.d/plugins/api-basics/apibasics/1.0.0/

# Ensure it matches your OS/architecture
go env GOOS GOARCH

# Remove cached terraform files and reinitialize
rm -rf .terraform .terraform.lock.hcl
terraform init
```

**Authentication errors:**
```bash
# Error: Unable to Authenticate with API

# Test your credentials directly
curl -X POST https://api-basics.sharted.workers.dev/token \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$APIBASICS_EMAIL\",\"password\":\"$APIBASICS_PASSWORD\"}"

# Check environment variables are set correctly
echo "Email: $APIBASICS_EMAIL"
echo "Password length: ${#APIBASICS_PASSWORD}"
```

**Build errors:**
```bash
# Error: go: command not found
# Install Go: https://go.dev/dl/

# Error: module not found
go mod tidy
go mod download

# Error: permission denied
chmod +x terraform-provider-apibasics
```

### What You Just Accomplished

By completing these steps, you've:

✅ **Registered/verified API credentials** - Confirmed authentication works
✅ **Built a provider from source** - Compiled Go code to a binary
✅ **Installed locally** - Placed provider where Terraform can find it
✅ **Configured authentication** - Set environment variables for credentials
✅ **Used the provider** - Created, read, updated, and destroyed resources
✅ **Verified with curl** - Confirmed API state matches Terraform state

This is the exact workflow for developing any Terraform provider!

### What Just Happened?

Compare what you did with curl vs Terraform:

**Before (with curl):**
```bash
# 1. Get access token
curl -X POST https://api-basics.sharted.workers.dev/token \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"pass"}'

# 2. Create todo
curl -X POST https://api-basics.sharted.workers.dev/todos \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"My Todo","completed":false}'

# 3. Update todo
curl -X PUT https://api-basics.sharted.workers.dev/todos/UUID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"completed":true}'

# 4. Delete todo
curl -X DELETE https://api-basics.sharted.workers.dev/todos/UUID \
  -H "Authorization: Bearer $TOKEN"
```

**Now (with Terraform):**
```hcl
# 1. Provider handles authentication automatically
provider "apibasics" {
  # Reads APIBASICS_EMAIL and APIBASICS_PASSWORD
}

# 2. Declare desired state
resource "apibasics_todo" "my_task" {
  title     = "My Todo"
  completed = false
}

# Terraform handles: create, update, delete based on desired state
# Just run: terraform apply
```

### Explore the Provider Code

Now let's peek under the hood to see how it works.

**1. Authentication (`internal/client/client.go`)**

Look at the `Authenticate()` function:
```go
func (c *Client) Authenticate() error {
    // POST /token with email and password
    resp, err := client.Post("/token", loginData)

    // Parse response and store access_token
    c.AccessToken = tokenResp.AccessToken
    c.RefreshToken = tokenResp.RefreshToken

    return nil
}
```

**This is exactly what you did with curl in the course!** The provider just automates it.

**2. Create Resource (`internal/provider/todo_resource.go`)**

Look at the `Create()` function:
```go
func (r *todoResource) Create(ctx context.Context, req resource.CreateRequest, resp *resource.CreateResponse) {
    // 1. Get values from Terraform config
    title := plan.Title.ValueString()
    completed := plan.Completed.ValueBool()

    // 2. POST /todos
    todo, err := r.client.CreateTodo(title, description, completed)

    // 3. Save ID to state so Terraform can track it
    plan.ID = types.StringValue(todo.ID)

    // 4. Return the full resource
    resp.State.Set(ctx, plan)
}
```

**See the pattern?**
- Terraform config → API request body
- API response → Terraform state
- The provider is just a translator!

**3. Update Resource**

Look at the `Update()` function:
```go
func (r *todoResource) Update(ctx context.Context, req resource.UpdateRequest, resp *resource.UpdateResponse) {
    // 1. Terraform detected a change in your config
    // 2. PUT /todos/:id with the changes
    todo, err := r.client.UpdateTodo(id, &title, &description, &completed)

    // 3. Update state with new values
    resp.State.Set(ctx, plan)
}
```

**This is your PUT request from Module 8!** When you change `completed = true` in your .tf file and run `terraform apply`, this function runs.

### Experiment Time

Try these exercises to understand provider behavior:

**Exercise 1: Create and Destroy**
```hcl
resource "apibasics_todo" "test" {
  title = "Test Todo"
}
```

```bash
terraform apply   # Creates the todo (POST)
terraform destroy # Deletes the todo (DELETE)
```

Verify with curl:
```bash
curl https://api-basics.sharted.workers.dev/todos \
  -H "Authorization: Bearer $TOKEN"
```

**Exercise 2: Update Detection**
```hcl
resource "apibasics_todo" "test" {
  title     = "Original Title"
  completed = false
}
```

```bash
terraform apply  # Creates

# Now edit the file:
# completed = true

terraform plan   # Shows: completed: false → true
terraform apply  # Updates (PUT)
```

Terraform detected the change and knows to call Update()!

**Exercise 3: Import Existing Resource**

Create a todo with curl:
```bash
curl -X POST https://api-basics.sharted.workers.dev/todos \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Created via curl"}'
# Note the returned ID: a0ba571e-28f5-4a63-8d9c-3535ae80ba23
```

Import it into Terraform:
```bash
terraform import apibasics_todo.imported a0ba571e-28f5-4a63-8d9c-3535ae80ba23
```

Add to your .tf file:
```hcl
resource "apibasics_todo" "imported" {
  title = "Created via curl"
}
```

Now Terraform manages a resource you created manually!

### Key Insights

**1. State Management**

After `terraform apply`, check the state:
```bash
terraform show
```

You'll see:
```hcl
resource "apibasics_todo" "test" {
    id         = "a0ba571e-28f5-4a63-8d9c-3535ae80ba23"
    title      = "Test Todo"
    completed  = false
    created_at = "2026-01-08T18:00:00Z"
    # ... etc
}
```

**The ID is the UUID from your API!** This is how Terraform tracks which API resource corresponds to which Terraform resource.

**2. Declarative vs Imperative**

**Imperative (curl):**
```bash
# You tell it HOW to do things, step by step
curl -X POST ...  # Create
curl -X PUT ...   # Update
curl -X DELETE... # Delete
```

**Declarative (Terraform):**
```hcl
# You tell it WHAT you want, it figures out HOW
resource "apibasics_todo" "task" {
  title = "My Task"
}
# Terraform figures out if it needs to create, update, or do nothing
```

**3. Idempotency in Action**

Run `terraform apply` twice:
```bash
terraform apply  # Creates the resource
terraform apply  # No changes - idempotent!
```

The second apply doesn't create a duplicate. Terraform:
1. Reads current state (GET /todos/:id)
2. Compares to desired state (.tf file)
3. Sees they match
4. Does nothing

This is the power of idempotent operations you learned about!

### Challenge Exercises

**Challenge 1: Manage Multiple Todos**

Create 5 todos with different attributes. Use `for_each` or `count`.

**Challenge 2: Add a Profile Resource**

The API has a `/profile` endpoint (GET and PUT). Try implementing a `apibasics_profile` resource by:
1. Adding `internal/provider/profile_resource.go`
2. Implementing CRUD (no Create or Delete, just Read and Update)
3. Registering it in `provider.go`

**Challenge 3: Add a Data Source**

Data sources are read-only. Create a `apibasics_todos` data source that lists all todos:
```hcl
data "apibasics_todos" "all" {}

output "todo_count" {
  value = length(data.apibasics_todos.all.todos)
}
```

### What You've Learned

By using this provider, you now understand:

✅ **Provider architecture** - Where authentication, resources, and API calls live
✅ **Resource lifecycle** - How Create, Read, Update, Delete map to API calls
✅ **State management** - How Terraform tracks resources using IDs
✅ **Declarative infrastructure** - Describe what you want, not how to get it
✅ **Idempotency** - Why running apply twice is safe
✅ **Error handling** - What happens when APIs return errors
✅ **Import workflow** - Bringing existing resources under Terraform management

**Most importantly:** You see the direct connection between your API knowledge and Terraform providers.

Every curl command you learned → Every provider function
Every HTTP method → Every CRUD operation
Every OAuth token → Provider authentication

---

## Next Steps: HashiCups Tutorial

You're now ready to learn Terraform provider development with **HashiCups**!

### What is HashiCups?

**HashiCups** is HashiCorp's educational platform for learning to build Terraform providers. It's a fictional coffee shop with:
- A real working API (coffee orders, products, etc.)
- Complete tutorial for building a Terraform provider
- Step-by-step guidance from HashiCorp
- Production-ready patterns and best practices

**URL:** https://developer.hashicorp.com/terraform/tutorials/providers-plugin-framework

### Why HashiCups After This Course?

1. **You understand the API side** - You know what the provider is talking to
2. **You know CRUD** - You understand the operations providers must implement
3. **You know authentication** - You can implement provider auth
4. **You know error handling** - You can handle API failures
5. **You think in REST** - You understand the resource model

### What You'll Learn in HashiCups Tutorial

**Tutorial Modules:**

1. **Setup & Prerequisites**
   - Install Go (providers are written in Go)
   - Set up Terraform Plugin Framework
   - Configure development environment

2. **Provider Basics**
   - Initialize a new provider
   - Configure provider authentication
   - Implement the provider schema

3. **Implement CRUD Resources**
   - **Create**: Map terraform apply → POST /orders
   - **Read**: Map terraform refresh → GET /orders/:id
   - **Update**: Map terraform apply → PATCH /orders/:id
   - **Delete**: Map terraform destroy → DELETE /orders/:id

4. **Data Sources**
   - Read-only resources
   - Example: hashicups_coffees (list available coffees)
   - Querying API without managing resources

5. **Testing**
   - Write acceptance tests
   - Test CRUD operations
   - Verify error handling

6. **Documentation**
   - Generate provider documentation
   - Write examples
   - Publish to Terraform Registry

### Your Advantage

Most people starting the HashiCups tutorial struggle with:
- ❌ "What's a REST API?"
- ❌ "What's a POST vs PUT?"
- ❌ "Why do I need authentication?"
- ❌ "What are these status codes?"

**You already know all of this!** You'll breeze through the API concepts and focus on the Terraform-specific parts.

### Recommended Learning Path

**1. Review Your API Basics Knowledge**
- Make sure you're comfortable with curl
- Review CRUD operations
- Understand OAuth 2.0 flow
- Practice error handling

**2. Use the API Basics Provider (see section above)**
- Build and install the local provider
- Run the examples
- Experiment with creating, updating, deleting todos
- Examine the provider code to understand the structure
- Try the challenge exercises

**3. Learn Go Basics** (if needed)
- Terraform providers are written in Go
- You don't need to be a Go expert
- Focus on: structs, interfaces, error handling
- Resource: https://go.dev/tour/

**4. Start HashiCups Tutorial**
- Follow the official tutorial
- Build the HashiCups provider step-by-step
- Map what you learned in API Basics to provider code
- Compare HashiCups patterns to the API Basics provider

**5. Extend Your Knowledge**
- Add a profile resource to the API Basics provider
- Implement data sources
- Write tests for your resources
- Experiment with more complex scenarios

### Comparing the Learning Journey

**What you just completed:**
```
API Basics Course
└── Learn REST API concepts (client side)
    ├── HTTP fundamentals
    ├── CRUD operations
    ├── Authentication (OAuth 2.0)
    ├── Using curl to make requests
    └── Understanding API responses
```

**What's next with HashiCups:**
```
HashiCups Tutorial
└── Build Terraform providers (automation layer)
    ├── Map REST APIs to Terraform resources
    ├── Implement CRUD in Go
    ├── Handle authentication in provider
    ├── Manage Terraform state
    └── Publish providers to registry
```

**Together:** You'll understand the full stack from HTTP requests to infrastructure automation.

---

## Bonus: Build a Provider for API Basics

Want a challenge? Try building a Terraform provider for the API Basics service you just learned!

### Example Provider

**What it would look like:**

```hcl
# Configure the API Basics provider
provider "apibasics" {
  endpoint = "https://api-basics.sharted.workers.dev"
  email    = "user@example.com"
  password = var.password  # Use variables for secrets
}

# Manage your profile
resource "apibasics_profile" "me" {
  name = "Terraform User"
  bio  = "Managing my profile with IaC"

  preferences = {
    theme         = "dark"
    notifications = true
  }
}

# Create a todo
resource "apibasics_todo" "learn_providers" {
  title       = "Learn Terraform Providers"
  description = "Complete HashiCups tutorial"
  completed   = false
}

# Create another todo
resource "apibasics_todo" "build_provider" {
  title       = "Build API Basics Provider"
  description = "Apply HashiCups knowledge to API Basics"
  completed   = false
}

# Data source to read todos
data "apibasics_todos" "all" {}

output "todo_count" {
  value = length(data.apibasics_todos.all.todos)
}
```

### What You'd Need to Implement

**1. Provider Configuration**
```go
type apiBasicsProvider struct {
    client *apiBasicsClient
}

func (p *apiBasicsProvider) Configure(ctx context.Context, req ConfigureRequest) {
    // Get email/password from config
    // POST /token to get access token
    // Store token for API requests
}
```

**2. Todo Resource (CRUD)**
```go
func (r *todoResource) Create(ctx context.Context, req CreateRequest) {
    // POST /todos
    // Save ID to state
}

func (r *todoResource) Read(ctx context.Context, req ReadRequest) {
    // GET /todos/:id
    // Update state with current values
}

func (r *todoResource) Update(ctx context.Context, req UpdateRequest) {
    // PUT /todos/:id
    // Update state
}

func (r *todoResource) Delete(ctx context.Context, req DeleteRequest) {
    // DELETE /todos/:id
}
```

**3. Profile Resource**
```go
// Similar CRUD for profile management
// GET/PUT /profile
```

**4. Todos Data Source**
```go
func (d *todosDataSource) Read(ctx context.Context, req ReadRequest) {
    // GET /todos
    // Return list of todos (read-only)
}
```

This would be a perfect project to apply what you learn in HashiCups!

---

## Key Takeaways

### The Big Picture

```
HTTP/REST APIs (what you learned)
        ↓
Terraform Providers (what you'll learn)
        ↓
Infrastructure as Code
        ↓
Automated, Repeatable, Version-Controlled Infrastructure
```

### Why This Progression Makes Sense

1. **APIs are the foundation**
   - Everything talks via APIs
   - Infrastructure platforms expose APIs
   - Terraform providers consume these APIs

2. **CRUD is universal**
   - Same pattern everywhere
   - Once you understand CRUD, you understand all APIs
   - Terraform just automates CRUD operations

3. **Declarative > Imperative**
   - Instead of: "Make these 10 API calls in this order"
   - You write: "I want these resources to exist"
   - Terraform figures out the API calls

4. **API knowledge is transferable**
   - AWS, Azure, GCP all use REST APIs
   - Understanding one helps you understand all
   - Provider development is the same pattern everywhere

### Your Advantage Moving Forward

**You now understand:**
- ✅ How APIs work at a fundamental level
- ✅ Why CRUD operations are critical
- ✅ How authentication flows work
- ✅ Why idempotency matters
- ✅ How to handle errors gracefully
- ✅ Why UUIDs are better than sequential IDs
- ✅ How state is managed across stateless requests

**This puts you ahead of most developers** who jump straight into Terraform providers without understanding the underlying APIs.

---

## Resources

### Official Documentation

**HashiCups:**
- Tutorial: https://developer.hashicorp.com/terraform/tutorials/providers-plugin-framework
- Source Code: https://github.com/hashicorp/terraform-provider-hashicups

**Terraform Providers:**
- Plugin Framework: https://developer.hashicorp.com/terraform/plugin/framework
- Provider Design: https://developer.hashicorp.com/terraform/plugin/best-practices/hashicorp-provider-design-principles
- Testing Guide: https://developer.hashicorp.com/terraform/plugin/framework/acctests

### Related Learning

**Go Language:**
- Go Tour: https://go.dev/tour/
- Go by Example: https://gobyexample.com/
- Effective Go: https://go.dev/doc/effective_go

**Terraform:**
- Terraform Registry: https://registry.terraform.io/
- Provider Development: https://developer.hashicorp.com/terraform/plugin
- Best Practices: https://developer.hashicorp.com/terraform/cloud-docs/recommended-practices

### Community

**HashiCorp:**
- Discuss: https://discuss.hashicorp.com/c/terraform-providers/
- Community Providers: https://registry.terraform.io/browse/providers

**API Basics:**
- This course: Review COURSE.md and CHEATSHEET.md anytime
- Practice: Keep using the API to stay sharp

---

## Final Thoughts

Congratulations on completing the API Basics course! You now have a solid foundation in:
- REST API design and consumption
- HTTP protocol and methods
- OAuth 2.0 authentication
- CRUD operations and lifecycle management

These skills are directly applicable to Terraform provider development. When you start the HashiCups tutorial, you'll see how everything you learned maps to provider code.

**Your journey:**
1. ✅ **Learned REST APIs** - You understand the client side
2. 🎯 **Learn Terraform Providers** - You'll automate the client side
3. 🚀 **Build Custom Providers** - You'll extend Terraform for your needs

The path from understanding APIs to building Terraform providers is clear. You're ready for the next step.

**Happy coding, and welcome to the world of Infrastructure as Code!**

---

## Quick Reference: API Basics → HashiCups Mapping

| Concept | API Basics | HashiCups | Terraform Provider |
|---------|-----------|-----------|-------------------|
| **Resource** | Todo | Coffee Order | hashicups_order |
| **Create** | POST /todos | POST /orders | terraform apply (new) |
| **Read** | GET /todos/:id | GET /orders/:id | terraform refresh |
| **Update** | PUT /todos/:id | PATCH /orders/:id | terraform apply (change) |
| **Delete** | DELETE /todos/:id | DELETE /orders/:id | terraform destroy |
| **Auth** | OAuth 2.0 Bearer | Bearer Token | Provider config |
| **ID** | UUID | Integer | Resource ID |
| **State** | Stateless API | Stateless API | Terraform state file |
| **Tool** | curl | curl | Terraform CLI |

Print this table and keep it handy during the HashiCups tutorial!
