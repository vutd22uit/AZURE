terraform {
  required_version = ">= 1.0"
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
  }
}

provider "azurerm" {
  features {}
}

# Resource Group
resource "azurerm_resource_group" "ecommerce" {
  name     = var.resource_group_name
  location = var.location

  tags = {
    Environment = var.environment
    Project     = "E-commerce-Cloud-Native"
  }
}

# Azure Kubernetes Service (AKS)
resource "azurerm_kubernetes_cluster" "aks" {
  name                = "${var.project_name}-aks"
  location            = azurerm_resource_group.ecommerce.location
  resource_group_name = azurerm_resource_group.ecommerce.name
  dns_prefix          = "${var.project_name}-aks"

  default_node_pool {
    name       = "default"
    node_count = var.aks_node_count
    vm_size    = var.aks_vm_size

    upgrade_settings {
      max_surge = "10%"
    }
  }

  identity {
    type = "SystemAssigned"
  }

  network_profile {
    network_plugin    = "azure"
    load_balancer_sku = "standard"
  }

  tags = {
    Environment = var.environment
  }
}

# Azure Database for PostgreSQL
resource "azurerm_postgresql_flexible_server" "postgres" {
  name                   = "${var.project_name}-postgres"
  resource_group_name    = azurerm_resource_group.ecommerce.name
  location               = azurerm_resource_group.ecommerce.location
  version                = "14"
  administrator_login    = var.postgres_admin_username
  administrator_password = var.postgres_admin_password

  storage_mb = 32768
  sku_name   = "GP_Standard_D2s_v3"

  backup_retention_days        = 7
  geo_redundant_backup_enabled = false

  tags = {
    Environment = var.environment
  }
}

resource "azurerm_postgresql_flexible_server_database" "auth_db" {
  name      = "authdb"
  server_id = azurerm_postgresql_flexible_server.postgres.id
  charset   = "UTF8"
  collation = "en_US.utf8"
}

resource "azurerm_postgresql_flexible_server_firewall_rule" "allow_azure_services" {
  name             = "allow-azure-services"
  server_id        = azurerm_postgresql_flexible_server.postgres.id
  start_ip_address = "0.0.0.0"
  end_ip_address   = "0.0.0.0"
}

# Cosmos DB Account
resource "azurerm_cosmosdb_account" "cosmos" {
  name                = "${var.project_name}-cosmos"
  location            = azurerm_resource_group.ecommerce.location
  resource_group_name = azurerm_resource_group.ecommerce.name
  offer_type          = "Standard"
  kind                = "GlobalDocumentDB"

  consistency_policy {
    consistency_level = "Session"
  }

  geo_location {
    location          = azurerm_resource_group.ecommerce.location
    failover_priority = 0
  }

  capabilities {
    name = "EnableServerless"
  }

  tags = {
    Environment = var.environment
  }
}

resource "azurerm_cosmosdb_sql_database" "orders_db" {
  name                = "ordersdb"
  resource_group_name = azurerm_resource_group.ecommerce.name
  account_name        = azurerm_cosmosdb_account.cosmos.name
}

resource "azurerm_cosmosdb_sql_container" "products" {
  name                = "products"
  resource_group_name = azurerm_resource_group.ecommerce.name
  account_name        = azurerm_cosmosdb_account.cosmos.name
  database_name       = azurerm_cosmosdb_sql_database.orders_db.name
  partition_key_path  = "/category"

  indexing_policy {
    indexing_mode = "consistent"

    included_path {
      path = "/*"
    }
  }
}

resource "azurerm_cosmosdb_sql_container" "orders" {
  name                = "orders"
  resource_group_name = azurerm_resource_group.ecommerce.name
  account_name        = azurerm_cosmosdb_account.cosmos.name
  database_name       = azurerm_cosmosdb_sql_database.orders_db.name
  partition_key_path  = "/userId"

  indexing_policy {
    indexing_mode = "consistent"

    included_path {
      path = "/*"
    }
  }
}

resource "azurerm_cosmosdb_sql_container" "cart" {
  name                = "cart"
  resource_group_name = azurerm_resource_group.ecommerce.name
  account_name        = azurerm_cosmosdb_account.cosmos.name
  database_name       = azurerm_cosmosdb_sql_database.orders_db.name
  partition_key_path  = "/userId"

  indexing_policy {
    indexing_mode = "consistent"

    included_path {
      path = "/*"
    }
  }
}

# Azure Cache for Redis
resource "azurerm_redis_cache" "redis" {
  name                = "${var.project_name}-redis"
  location            = azurerm_resource_group.ecommerce.location
  resource_group_name = azurerm_resource_group.ecommerce.name
  capacity            = 1
  family              = "C"
  sku_name            = "Standard"
  enable_non_ssl_port = false
  minimum_tls_version = "1.2"

  redis_configuration {
  }

  tags = {
    Environment = var.environment
  }
}

# Storage Account for Functions
resource "azurerm_storage_account" "functions" {
  name                     = "${replace(var.project_name, "-", "")}funcsa"
  resource_group_name      = azurerm_resource_group.ecommerce.name
  location                 = azurerm_resource_group.ecommerce.location
  account_tier             = "Standard"
  account_replication_type = "LRS"

  tags = {
    Environment = var.environment
  }
}

# App Service Plan for Functions
resource "azurerm_service_plan" "functions" {
  name                = "${var.project_name}-functions-plan"
  resource_group_name = azurerm_resource_group.ecommerce.name
  location            = azurerm_resource_group.ecommerce.location
  os_type             = "Linux"
  sku_name            = "Y1"

  tags = {
    Environment = var.environment
  }
}

# Azure Functions App
resource "azurerm_linux_function_app" "payment_processor" {
  name                = "${var.project_name}-payment"
  resource_group_name = azurerm_resource_group.ecommerce.name
  location            = azurerm_resource_group.ecommerce.location

  storage_account_name       = azurerm_storage_account.functions.name
  storage_account_access_key = azurerm_storage_account.functions.primary_access_key
  service_plan_id            = azurerm_service_plan.functions.id

  site_config {
    application_stack {
      node_version = "18"
    }
  }

  app_settings = {
    "COSMOS_DB_ENDPOINT"   = azurerm_cosmosdb_account.cosmos.endpoint
    "COSMOS_DB_KEY"        = azurerm_cosmosdb_account.cosmos.primary_key
    "COSMOS_DB_DATABASE"   = azurerm_cosmosdb_sql_database.orders_db.name
    "COSMOS_DB_CONTAINER"  = "orders"
    "EMAIL_FUNCTION_URL"   = "https://${var.project_name}-email.azurewebsites.net/api/send-email"
  }

  tags = {
    Environment = var.environment
  }
}

resource "azurerm_linux_function_app" "email_notification" {
  name                = "${var.project_name}-email"
  resource_group_name = azurerm_resource_group.ecommerce.name
  location            = azurerm_resource_group.ecommerce.location

  storage_account_name       = azurerm_storage_account.functions.name
  storage_account_access_key = azurerm_storage_account.functions.primary_access_key
  service_plan_id            = azurerm_service_plan.functions.id

  site_config {
    application_stack {
      node_version = "18"
    }
  }

  app_settings = {
    "SENDGRID_API_KEY" = var.sendgrid_api_key
    "FROM_EMAIL"       = var.from_email
  }

  tags = {
    Environment = var.environment
  }
}

# Application Insights
resource "azurerm_application_insights" "appinsights" {
  name                = "${var.project_name}-appinsights"
  location            = azurerm_resource_group.ecommerce.location
  resource_group_name = azurerm_resource_group.ecommerce.name
  application_type    = "web"

  tags = {
    Environment = var.environment
  }
}

# Azure Container Registry
resource "azurerm_container_registry" "acr" {
  name                = "${replace(var.project_name, "-", "")}acr"
  resource_group_name = azurerm_resource_group.ecommerce.name
  location            = azurerm_resource_group.ecommerce.location
  sku                 = "Standard"
  admin_enabled       = true

  tags = {
    Environment = var.environment
  }
}

# Role Assignment for AKS to pull from ACR
resource "azurerm_role_assignment" "aks_acr" {
  principal_id                     = azurerm_kubernetes_cluster.aks.kubelet_identity[0].object_id
  role_definition_name             = "AcrPull"
  scope                            = azurerm_container_registry.acr.id
  skip_service_principal_aad_check = true
}

# Azure Synapse Analytics Workspace
resource "azurerm_storage_account" "synapse" {
  name                     = "${replace(var.project_name, "-", "")}synapse"
  resource_group_name      = azurerm_resource_group.ecommerce.name
  location                 = azurerm_resource_group.ecommerce.location
  account_tier             = "Standard"
  account_replication_type = "LRS"
  account_kind             = "StorageV2"
  is_hns_enabled           = true

  tags = {
    Environment = var.environment
  }
}

resource "azurerm_storage_data_lake_gen2_filesystem" "synapse" {
  name               = "synapsefs"
  storage_account_id = azurerm_storage_account.synapse.id
}

resource "azurerm_synapse_workspace" "synapse" {
  name                                 = "${var.project_name}-synapse"
  resource_group_name                  = azurerm_resource_group.ecommerce.name
  location                             = azurerm_resource_group.ecommerce.location
  storage_data_lake_gen2_filesystem_id = azurerm_storage_data_lake_gen2_filesystem.synapse.id
  sql_administrator_login              = var.synapse_admin_username
  sql_administrator_login_password     = var.synapse_admin_password

  identity {
    type = "SystemAssigned"
  }

  tags = {
    Environment = var.environment
  }
}

resource "azurerm_synapse_firewall_rule" "allow_all" {
  name                 = "AllowAll"
  synapse_workspace_id = azurerm_synapse_workspace.synapse.id
  start_ip_address     = "0.0.0.0"
  end_ip_address       = "255.255.255.255"
}

resource "azurerm_synapse_sql_pool" "pool" {
  name                 = "ecommercedw"
  synapse_workspace_id = azurerm_synapse_workspace.synapse.id
  sku_name             = "DW100c"
  create_mode          = "Default"

  tags = {
    Environment = var.environment
  }
}

# Azure Data Factory
resource "azurerm_data_factory" "adf" {
  name                = "${var.project_name}-adf"
  location            = azurerm_resource_group.ecommerce.location
  resource_group_name = azurerm_resource_group.ecommerce.name

  identity {
    type = "SystemAssigned"
  }

  tags = {
    Environment = var.environment
  }
}

# Data Factory Linked Service for Cosmos DB
resource "azurerm_data_factory_linked_service_cosmosdb" "cosmos" {
  name              = "CosmosDbLinkedService"
  data_factory_id   = azurerm_data_factory.adf.id
  account_endpoint  = azurerm_cosmosdb_account.cosmos.endpoint
  account_key       = azurerm_cosmosdb_account.cosmos.primary_key
  database          = azurerm_cosmosdb_sql_database.orders_db.name
}

# Power BI Embedded Capacity
resource "azurerm_powerbi_embedded" "powerbi" {
  name                = "${var.project_name}-powerbi"
  location            = azurerm_resource_group.ecommerce.location
  resource_group_name = azurerm_resource_group.ecommerce.name
  sku                 = var.powerbi_sku
  administrators      = var.powerbi_admins

  tags = {
    Environment = var.environment
  }
}
