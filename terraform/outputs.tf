output "resource_group_name" {
  description = "Name of the resource group"
  value       = azurerm_resource_group.ecommerce.name
}

output "aks_cluster_name" {
  description = "Name of the AKS cluster"
  value       = azurerm_kubernetes_cluster.aks.name
}

output "aks_cluster_id" {
  description = "ID of the AKS cluster"
  value       = azurerm_kubernetes_cluster.aks.id
}

output "aks_kube_config" {
  description = "Kubernetes configuration for AKS"
  value       = azurerm_kubernetes_cluster.aks.kube_config_raw
  sensitive   = true
}

output "postgres_server_fqdn" {
  description = "FQDN of PostgreSQL server"
  value       = azurerm_postgresql_flexible_server.postgres.fqdn
}

output "postgres_database_name" {
  description = "Name of PostgreSQL database"
  value       = azurerm_postgresql_flexible_server_database.auth_db.name
}

output "cosmos_db_endpoint" {
  description = "Cosmos DB endpoint"
  value       = azurerm_cosmosdb_account.cosmos.endpoint
}

output "cosmos_db_primary_key" {
  description = "Cosmos DB primary key"
  value       = azurerm_cosmosdb_account.cosmos.primary_key
  sensitive   = true
}

output "cosmos_db_database_name" {
  description = "Cosmos DB database name"
  value       = azurerm_cosmosdb_sql_database.orders_db.name
}

output "redis_hostname" {
  description = "Redis hostname"
  value       = azurerm_redis_cache.redis.hostname
}

output "redis_primary_key" {
  description = "Redis primary access key"
  value       = azurerm_redis_cache.redis.primary_access_key
  sensitive   = true
}

output "acr_login_server" {
  description = "ACR login server URL"
  value       = azurerm_container_registry.acr.login_server
}

output "acr_admin_username" {
  description = "ACR admin username"
  value       = azurerm_container_registry.acr.admin_username
  sensitive   = true
}

output "acr_admin_password" {
  description = "ACR admin password"
  value       = azurerm_container_registry.acr.admin_password
  sensitive   = true
}

output "payment_function_url" {
  description = "Payment processor function URL"
  value       = "https://${azurerm_linux_function_app.payment_processor.default_hostname}/api/process-payment"
}

output "email_function_url" {
  description = "Email notification function URL"
  value       = "https://${azurerm_linux_function_app.email_notification.default_hostname}/api/send-email"
}

output "application_insights_instrumentation_key" {
  description = "Application Insights instrumentation key"
  value       = azurerm_application_insights.appinsights.instrumentation_key
  sensitive   = true
}

output "synapse_workspace_name" {
  description = "Synapse workspace name"
  value       = azurerm_synapse_workspace.synapse.name
}

output "synapse_sql_pool_name" {
  description = "Synapse SQL pool name"
  value       = azurerm_synapse_sql_pool.pool.name
}

output "data_factory_name" {
  description = "Data Factory name"
  value       = azurerm_data_factory.adf.name
}
