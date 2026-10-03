$ErrorActionPreference = 'Stop'
Push-Location (Split-Path $PSScriptRoot -Parent)
try {
  # Resolve the project and origin list from the same files used by the frontend.
  $configJson = node scripts/backend-config.mjs
  if ($LASTEXITCODE -ne 0) { throw 'Cannot resolve Supabase project and APP_ORIGIN' }
  $backendConfig = $configJson | ConvertFrom-Json
  npx --yes supabase secrets set "APP_ORIGIN=$($backendConfig.origins)" --project-ref $backendConfig.projectRef
  if ($LASTEXITCODE -ne 0) { throw 'APP_ORIGIN sync failed' }
  npx --yes supabase functions deploy analyze-content --project-ref $backendConfig.projectRef --use-api
  if ($LASTEXITCODE -ne 0) { throw 'Function deployment failed' }
  node scripts/check-origins.mjs
  if ($LASTEXITCODE -ne 0) { throw 'Live origin verification failed' }
} finally {
  Pop-Location
}
