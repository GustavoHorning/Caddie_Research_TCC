param location string = resourceGroup().location

resource appServicePlan 'Microsoft.Web/serverfarms@2024-11-01' = {
  name: 'ASP-rgcaddieresearch-92b0'
  location: 'Brazil South'
  sku: {
    name: 'B1'
    tier: 'Basic'
  }
  kind: 'linux'
  properties: { reserved: true }
}

resource apiApp 'Microsoft.Web/sites@2024-11-01' = {
  name: 'caddieresearch-api'
  location: 'Brazil South'
  kind: 'app,linux'
  properties: {
    serverFarmId: appServicePlan.id
    httpsOnly: true
    siteConfig: {
      linuxFxVersion: 'DOTNETCORE|8.0'
      alwaysOn: false
    }
  }
}


resource staticWebApp 'Microsoft.Web/staticSites@2024-11-01' = {
  name: 'caddieresearch-web'
  location: 'centralus'
  sku: {
    name: 'Free'
    tier: 'Free'
  }
  properties: { provider: 'GitHub' }
}

resource sqlServer 'Microsoft.Sql/servers@2026-08-01-preview' = {
  name: 'srv-caddie-horning'
  location: location
  properties: {
    administratorLogin: 'CaddieAdmin'
    version: '12.0'
    publicNetworkAccess: 'Enabled'
  }
}

resource sqlDb 'Microsoft.Sql/servers/databases@2026-08-01-preview' = {
  parent: sqlServer
  name: 'db-caddie-research'
  location: location
  sku: {
    name: 'GP_S_Gen5_2'
    tier: 'GeneralPurpose'
  }
  properties: {
    zoneRedundant: false
    autoPauseDelay: 60
  }
}

resource storageAccount 'Microsoft.Storage/storageAccounts@2026-06-01' = {
  name: 'caddiestorage2026'
  location: location
  sku: {
    name: 'Standard_LRS'
  }
  kind: 'StorageV2'
  properties: {
    allowBlobPublicAccess: true
    supportsHttpsTrafficOnly: true
  }
}

resource blobServices 'Microsoft.Storage/storageAccounts/blobServices@2026-06-01' = {
  parent: storageAccount
  name: 'default'
}

resource containerFotos 'Microsoft.Storage/storageAccounts/blobServices/containers@2026-06-01' = {
  parent: blobServices
  name: 'fotos-perfil'
  properties: { publicAccess: 'Blob' }
}

resource containerRelatorios 'Microsoft.Storage/storageAccounts/blobServices/containers@2026-06-01' = {
  parent: blobServices
  name: 'relatorios-pdfs'
  properties: { publicAccess: 'None' }
}

resource appInsights 'microsoft.insights/components@2020-02-02' = {
  name: 'caddie-research-insights'
  location: 'mexicocentral' 
  kind: 'web'
  properties: {
    Application_Type: 'web'
  }
}
