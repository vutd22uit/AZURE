variable "project_name" {
  description = "Project name prefix for all resources"
  type        = string
  default     = "ecommerce-cloud"
}

variable "resource_group_name" {
  description = "Name of the resource group"
  type        = string
  default     = "ecommerce-cloud-rg"
}

variable "location" {
  description = "Azure region for resources"
  type        = string
  default     = "Southeast Asia"
}

variable "environment" {
  description = "Environment name (dev/staging/prod)"
  type        = string
  default     = "dev"
}

variable "aks_node_count" {
  description = "Number of nodes in AKS cluster"
  type        = number
  default     = 2
}

variable "aks_vm_size" {
  description = "VM size for AKS nodes"
  type        = string
  default     = "Standard_D2s_v3"
}

variable "postgres_admin_username" {
  description = "PostgreSQL administrator username"
  type        = string
  default     = "pgadmin"
  sensitive   = true
}

variable "postgres_admin_password" {
  description = "PostgreSQL administrator password"
  type        = string
  sensitive   = true
}

variable "synapse_admin_username" {
  description = "Synapse administrator username"
  type        = string
  default     = "synapseadmin"
  sensitive   = true
}

variable "synapse_admin_password" {
  description = "Synapse administrator password (min 8 characters, must contain uppercase, lowercase, number, and special character)"
  type        = string
  sensitive   = true

  validation {
    condition     = length(var.synapse_admin_password) >= 8
    error_message = "Synapse administrator password must be at least 8 characters long."
  }

  validation {
    condition     = can(regex("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&].{7,}$", var.synapse_admin_password))
    error_message = "Synapse administrator password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)."
  }
}

variable "sendgrid_api_key" {
  description = "SendGrid API key for email notifications"
  type        = string
  default     = "mock-sendgrid-key"
  sensitive   = true
}

variable "from_email" {
  description = "From email address for notifications"
  type        = string
  default     = "noreply@ecommerce.com"
}

variable "powerbi_sku" {
  description = "Power BI Embedded SKU (A1, A2, A3, A4, A5, A6)"
  type        = string
  default     = "A1"
}

variable "powerbi_admins" {
  description = "List of Power BI administrator email addresses"
  type        = list(string)
  default     = []
}
