#!/usr/bin/env pwsh

param(
    [Parameter(Mandatory=$true)]
    [string]$ProjectPath
)

$ErrorActionPreference = "Stop"

Write-Host "Running tests for $ProjectPath..."

# Build and run tests
dotnet test $ProjectPath `
    --configuration Release `
    --logger "trx;LogFileName=test-results.trx" `
    --collect:"XPlat Code Coverage" `
    -- DataCollectionRunSettings.DataCollectors.DataCollector.Configuration.Format=opencover

if ($LASTEXITCODE -ne 0) {
    Write-Error "Tests failed"
    exit $LASTEXITCODE
}

Write-Host "Tests completed successfully"
