# Terraform Provider for API Basics

This is a Terraform provider for the [API Basics](https://api-basics.sharted.workers.dev) educational REST API. It demonstrates how to build a Terraform provider that manages resources via a REST API with OAuth 2.0 authentication.

## Purpose

This provider is an educational tool designed for students who have completed the API Basics course. It provides hands-on experience with:

- Terraform provider development
- Mapping REST API CRUD operations to Terraform resources
- Implementing OAuth 2.0 authentication in providers
- Managing resource lifecycle (Create, Read, Update, Delete)
- Handling API errors and state management

## Prerequisites

Before using this provider, you should:

1. ✅ Complete the API Basics course (see `COURSE.md`)
2. ✅ Have a registered account on the API Basics service
3. ✅ Understand HTTP methods, CRUD operations, and OAuth 2.0
4. ✅ Have Terraform installed (version 1.0+)
5. ✅ Have Go installed (version 1.21+) if building from source

## Quick Start

### 1. Register an Account

First, create an account on the API Basics service:

```bash
curl -X POST https://api-basics.sharted.workers.dev/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@example.com",
    "password": "SecurePassword123",
    "name": "Your Name"
  }'
```

### 2. Set Environment Variables

```bash
export APIBASICS_EMAIL="your-email@example.com"
export APIBASICS_PASSWORD="SecurePassword123"
```

### 3. Build the Provider (Local Development)

```bash
# Clone and build
cd terraform-provider-apibasics
go mod download
go build -o terraform-provider-apibasics

# Create local provider directory
mkdir -p ~/.terraform.d/plugins/api-basics/apibasics/1.0.0/linux_amd64/
cp terraform-provider-apibasics ~/.terraform.d/plugins/api-basics/apibasics/1.0.0/linux_amd64/

# Note: Adjust the path based on your OS:
# - macOS: darwin_amd64 or darwin_arm64
# - Windows: windows_amd64
# - Linux: linux_amd64
```

### 4. Create a Terraform Configuration

Create a file called `main.tf`:

```hcl
terraform {
  required_providers {
    apibasics = {
      source = "api-basics/apibasics"
      version = "1.0.0"
    }
  }
}

provider "apibasics" {
  # Email and password are read from environment variables:
  # APIBASICS_EMAIL and APIBASICS_PASSWORD
}

resource "apibasics_todo" "example" {
  title       = "Learn Terraform Providers"
  description = "Build a custom provider for API Basics"
  completed   = false
}

output "todo_id" {
  value = apibasics_todo.example.id
}
```

### 5. Initialize and Apply

```bash
# Initialize Terraform
terraform init

# Preview changes
terraform plan

# Apply changes
terraform apply

# Verify the todo was created
curl https://api-basics.sharted.workers.dev/todos \
  -H "Authorization: Bearer $(curl -s -X POST https://api-basics.sharted.workers.dev/token \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$APIBASICS_EMAIL\",\"password\":\"$APIBASICS_PASSWORD\"}" | \
    grep -o '"access_token":"[^"]*' | cut -d'"' -f4)"

# Update the todo (change completed to true)
# Edit main.tf: completed = true
terraform apply

# Destroy the resource
terraform destroy
```

## Provider Configuration

The provider supports both explicit configuration and environment variables.

### Explicit Configuration

```hcl
provider "apibasics" {
  endpoint = "https://api-basics.sharted.workers.dev"
  email    = "your-email@example.com"
  password = "your-password"
}
```

### Environment Variables (Recommended)

```bash
export APIBASICS_ENDPOINT="https://api-basics.sharted.workers.dev"
export APIBASICS_EMAIL="your-email@example.com"
export APIBASICS_PASSWORD="your-password"
```

Then in Terraform:

```hcl
provider "apibasics" {
  # Configuration read from environment variables
}
```

### Using Terraform Variables

```hcl
variable "api_email" {
  type      = string
  sensitive = true
}

variable "api_password" {
  type      = string
  sensitive = true
}

provider "apibasics" {
  email    = var.api_email
  password = var.api_password
}
```

Then run:

```bash
terraform apply -var="api_email=your@email.com" -var="api_password=yourpass"
```

## Resources

### apibasics_todo

Manages a todo item in the API Basics service.

#### Example Usage

```hcl
resource "apibasics_todo" "example" {
  title       = "My Todo"
  description = "Todo description"
  completed   = false
}
```

#### Argument Reference

- `title` - (Required) The title of the todo.
- `description` - (Optional) The description of the todo. Defaults to empty string.
- `completed` - (Optional) Whether the todo is completed. Defaults to `false`.

#### Attributes Reference

- `id` - The UUID of the todo.
- `user_id` - The UUID of the user who owns this todo.
- `created_at` - Timestamp when the todo was created.
- `updated_at` - Timestamp when the todo was last updated.

#### Import

Todos can be imported using the ID:

```bash
terraform import apibasics_todo.example a0ba571e-28f5-4a63-8d9c-3535ae80ba23
```

## Examples

See the `examples/` directory for complete working examples:

- `main.tf` - Basic usage
- `complete-example.tf` - All features demonstrated
- `variables.tf` - Using variables for sensitive data

## How It Works

This provider demonstrates the complete Terraform provider lifecycle:

### 1. Provider Configuration & Authentication

```go
// Provider authenticates using OAuth 2.0 password grant
func (p *apibasicsProvider) Configure(ctx context.Context, req provider.ConfigureRequest, resp *provider.ConfigureResponse) {
    // Create API client
    apiClient := client.NewClient(endpoint, email, password)

    // POST /token to get access token
    if err := apiClient.Authenticate(); err != nil {
        resp.Diagnostics.AddError("Unable to Authenticate", err.Error())
        return
    }
}
```

### 2. Resource Creation (POST)

```go
func (r *todoResource) Create(ctx context.Context, req resource.CreateRequest, resp *resource.CreateResponse) {
    // POST /todos
    todo, err := r.client.CreateTodo(title, description, completed)

    // Save ID and attributes to state
    plan.ID = types.StringValue(todo.ID)
}
```

### 3. Resource Read (GET)

```go
func (r *todoResource) Read(ctx context.Context, req resource.ReadRequest, resp *resource.ReadResponse) {
    // GET /todos/:id
    todo, err := r.client.GetTodo(state.ID.ValueString())

    // Update state with current values
    state.Title = types.StringValue(todo.Title)
}
```

### 4. Resource Update (PUT)

```go
func (r *todoResource) Update(ctx context.Context, req resource.UpdateRequest, resp *resource.UpdateResponse) {
    // PUT /todos/:id
    todo, err := r.client.UpdateTodo(id, &title, &description, &completed)

    // Update state
}
```

### 5. Resource Delete (DELETE)

```go
func (r *todoResource) Delete(ctx context.Context, req resource.DeleteRequest, resp *resource.DeleteResponse) {
    // DELETE /todos/:id
    err := r.client.DeleteTodo(state.ID.ValueString())
}
```

## Architecture

```
terraform-provider-apibasics/
├── main.go                          # Provider entry point
├── go.mod                           # Go module dependencies
├── internal/
│   ├── client/
│   │   └── client.go               # API client (OAuth, HTTP requests)
│   └── provider/
│       ├── provider.go             # Provider configuration
│       └── todo_resource.go        # Todo resource CRUD
└── examples/
    ├── main.tf                     # Basic example
    └── complete-example.tf         # Full feature example
```

### Key Components

**1. API Client (`internal/client/client.go`)**
- Handles OAuth 2.0 authentication (POST /token)
- Makes authenticated HTTP requests
- Implements CRUD operations for todos
- Manages token refresh on 401 errors

**2. Provider (`internal/provider/provider.go`)**
- Configures authentication
- Creates API client instance
- Makes client available to resources

**3. Todo Resource (`internal/provider/todo_resource.go`)**
- Implements Create, Read, Update, Delete operations
- Maps API responses to Terraform state
- Handles errors and resource not found scenarios

## Learning Objectives

By examining and using this provider, you'll learn:

### 1. API-to-Terraform Mapping

| API Operation | Terraform Command | HTTP Method |
|---------------|------------------|-------------|
| Create todo | `terraform apply` (new) | POST /todos |
| Read todo | `terraform refresh` | GET /todos/:id |
| Update todo | `terraform apply` (change) | PUT /todos/:id |
| Delete todo | `terraform destroy` | DELETE /todos/:id |

### 2. Authentication Flow

```
terraform init
    ↓
Provider Configure()
    ↓
POST /token → Get access_token
    ↓
Store token in client
    ↓
Use token for all resource operations
    ↓
Auto-refresh on 401 Unauthorized
```

### 3. State Management

Terraform tracks resources using the state file:

```json
{
  "resources": [
    {
      "type": "apibasics_todo",
      "name": "example",
      "instances": [
        {
          "attributes": {
            "id": "a0ba571e-28f5-4a63-8d9c-3535ae80ba23",
            "title": "Learn Terraform",
            "completed": false
          }
        }
      ]
    }
  ]
}
```

The ID (UUID from API) is the key that links Terraform state to API resources.

### 4. Error Handling

```go
// Handle 404 - resource deleted outside Terraform
if err.Error() == "todo not found" {
    resp.State.RemoveResource(ctx)  // Remove from state
    return
}

// Handle 401 - token expired
if resp.StatusCode == http.StatusUnauthorized {
    c.Authenticate()  // Re-authenticate
    return c.DoRequest(method, path, body)  // Retry
}
```

## Common Workflows

### Creating Multiple Todos

```hcl
resource "apibasics_todo" "tasks" {
  for_each = {
    "http"      = "Learn HTTP Methods"
    "auth"      = "Understand OAuth 2.0"
    "terraform" = "Build Terraform Providers"
  }

  title       = each.value
  description = "API Basics course: ${each.key}"
  completed   = false
}
```

### Marking Todo Complete

```hcl
# Initial state
resource "apibasics_todo" "learn" {
  title     = "Learn REST APIs"
  completed = false
}

# Update to mark complete
resource "apibasics_todo" "learn" {
  title     = "Learn REST APIs"
  completed = true  # Changed
}
```

Run `terraform apply` and Terraform will:
1. Detect the change (completed: false → true)
2. Call Update() in the provider
3. Send PUT /todos/:id with completed=true
4. Update state with new values

### Importing Existing Todos

If you created a todo via curl and want Terraform to manage it:

```bash
# Get the todo ID from the API
curl https://api-basics.sharted.workers.dev/todos \
  -H "Authorization: Bearer $ACCESS_TOKEN"

# Import into Terraform
terraform import apibasics_todo.existing a0ba571e-28f5-4a63-8d9c-3535ae80ba23
```

Then add the resource to your configuration:

```hcl
resource "apibasics_todo" "existing" {
  title       = "Existing Todo"
  description = "This was imported"
  completed   = false
}
```

## Development

### Building

```bash
go build -o terraform-provider-apibasics
```

### Testing

```bash
# Run Go tests
go test ./...

# Test with Terraform
cd examples
terraform init
terraform plan
terraform apply
```

### Debugging

Set the `-debug` flag to run the provider with debugging support:

```bash
go build -o terraform-provider-apibasics
./terraform-provider-apibasics -debug
```

Then use the provided environment variables in your Terraform commands.

## Troubleshooting

### Authentication Errors

```
Error: Unable to Authenticate with API
```

**Solution:** Check your credentials:
- Verify email and password are correct
- Ensure you've registered an account
- Check environment variables are set

### Resource Not Found After Creation

```
Error: Todo not found
```

**Solution:** This happens if:
- The todo was deleted outside Terraform
- The user doesn't own the todo
- The API is unavailable

Run `terraform refresh` to sync state with the API.

### Provider Not Found

```
Error: Failed to query available provider packages
```

**Solution:** Ensure the provider is installed:
```bash
mkdir -p ~/.terraform.d/plugins/api-basics/apibasics/1.0.0/$(go env GOOS)_$(go env GOARCH)/
cp terraform-provider-apibasics ~/.terraform.d/plugins/api-basics/apibasics/1.0.0/$(go env GOOS)_$(go env GOARCH)/
```

## Next Steps

After using this provider, continue your learning journey:

1. **Study the Code**
   - Read `internal/client/client.go` to understand API communication
   - Examine `internal/provider/todo_resource.go` for CRUD implementation
   - Trace the flow from `terraform apply` to API calls

2. **Extend the Provider**
   - Add a `apibasics_profile` resource for managing profiles
   - Implement a data source for reading todos
   - Add support for listing all todos

3. **Learn HashiCups**
   - Follow the official HashiCups tutorial
   - Build the HashiCups provider step-by-step
   - Compare patterns between this provider and HashiCups

4. **Build Your Own Provider**
   - Choose an API you use regularly
   - Design the Terraform resources
   - Implement using this provider as a template

## Resources

**API Basics Course:**
- Course material: `COURSE.md`
- Cheat sheet: `CHEATSHEET.md`
- HashiCups guide: `HASHICUPS.md`

**Terraform Provider Development:**
- [Terraform Plugin Framework](https://developer.hashicorp.com/terraform/plugin/framework)
- [HashiCups Tutorial](https://developer.hashicorp.com/terraform/tutorials/providers-plugin-framework)
- [Provider Best Practices](https://developer.hashicorp.com/terraform/plugin/best-practices)

**API Basics API:**
- Endpoint: https://api-basics.sharted.workers.dev
- Documentation: `README.md`

## License

This is educational software provided as-is for learning purposes. Use it to understand Terraform provider development and apply those lessons to your own projects.

## Contributing

This provider is an educational tool. Students are encouraged to:
- Study the code
- Experiment with modifications
- Build their own providers based on this template
- Share learnings with other students

## Support

For questions about:
- **The provider code**: Read the inline comments and trace the execution
- **Terraform provider concepts**: See HASHICUPS.md and official Terraform docs
- **The API Basics API**: See README.md and COURSE.md
- **OAuth 2.0 and HTTP**: Review COURSE.md modules 4-6

Happy coding, and welcome to the world of Terraform provider development!
