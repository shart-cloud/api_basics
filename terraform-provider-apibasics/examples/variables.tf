# Example using variables for sensitive data

variable "api_email" {
  description = "Email for API authentication"
  type        = string
  sensitive   = true
}

variable "api_password" {
  description = "Password for API authentication"
  type        = string
  sensitive   = true
}
