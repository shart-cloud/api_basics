terraform {
  required_providers {
    apibasics = {
      source = "api-basics/apibasics"
    }
  }
}

# Configure the API Basics Provider
provider "apibasics" {
  endpoint = "https://api-basics.sharted.workers.dev"
  email    = "your-email@example.com"
  password = "your-password"

  # Alternatively, use environment variables:
  # export APIBASICS_ENDPOINT="https://api-basics.sharted.workers.dev"
  # export APIBASICS_EMAIL="your-email@example.com"
  # export APIBASICS_PASSWORD="your-password"
}

# Create a todo
resource "apibasics_todo" "learn_terraform" {
  title       = "Learn Terraform Providers"
  description = "Complete the HashiCups tutorial"
  completed   = false
}

# Create another todo
resource "apibasics_todo" "build_provider" {
  title       = "Build API Basics Provider"
  description = "Apply HashiCups knowledge to API Basics"
  completed   = false
}

# Output the todo IDs
output "learn_terraform_id" {
  value = apibasics_todo.learn_terraform.id
}

output "build_provider_id" {
  value = apibasics_todo.build_provider.id
}
