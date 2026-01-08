# Complete example showing all todo attributes

terraform {
  required_providers {
    apibasics = {
      source = "api-basics/apibasics"
    }
  }
}

provider "apibasics" {
  # Using environment variables for security
  # Set these before running:
  # export APIBASICS_EMAIL="your-email@example.com"
  # export APIBASICS_PASSWORD="your-password"
}

# Create a simple todo (minimal configuration)
resource "apibasics_todo" "simple" {
  title = "Simple Todo"
  # description and completed have defaults
}

# Create a detailed todo
resource "apibasics_todo" "detailed" {
  title       = "Learn HTTP Methods"
  description = "Master GET, POST, PUT, DELETE operations"
  completed   = false
}

# Create a completed todo
resource "apibasics_todo" "done" {
  title       = "Register for API Basics"
  description = "Create an account and get access tokens"
  completed   = true
}

# Mark a todo as completed by updating it
resource "apibasics_todo" "in_progress" {
  title       = "Study OAuth 2.0"
  description = "Understand password grant flow, tokens, and refresh"
  completed   = false

  # Later, change completed to true to mark it done
  # completed = true
}

# Outputs showing computed attributes
output "simple_todo" {
  description = "Simple todo details"
  value = {
    id         = apibasics_todo.simple.id
    title      = apibasics_todo.simple.title
    user_id    = apibasics_todo.simple.user_id
    created_at = apibasics_todo.simple.created_at
  }
}

output "detailed_todo" {
  description = "Detailed todo with all attributes"
  value = {
    id          = apibasics_todo.detailed.id
    title       = apibasics_todo.detailed.title
    description = apibasics_todo.detailed.description
    completed   = apibasics_todo.detailed.completed
    user_id     = apibasics_todo.detailed.user_id
    created_at  = apibasics_todo.detailed.created_at
    updated_at  = apibasics_todo.detailed.updated_at
  }
}

# Demonstrate computed values
output "all_todo_ids" {
  description = "All todo UUIDs"
  value = [
    apibasics_todo.simple.id,
    apibasics_todo.detailed.id,
    apibasics_todo.done.id,
    apibasics_todo.in_progress.id,
  ]
}
