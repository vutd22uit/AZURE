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
  description = "Synapse administrator password"
  type        = string
  sensitive   = true
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
