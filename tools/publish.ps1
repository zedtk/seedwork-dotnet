#!/usr/bin/env pwsh

param(
    [Parameter(Mandatory=$true)]
    [string]$PackagePath,
    
    [string]$Source = "https://api.nuget.org/v3/index.json"
)

$ErrorActionPreference = "Stop"

# Get API key from environment variable
$apiKey = $env:NUGET_API_KEY

if ([string]::IsNullOrEmpty($apiKey)) {
    Write-Error "NUGET_API_KEY environment variable is not set"
    exit 1
}

Write-Host "Publishing package: $PackagePath"

# Find all .nupkg files in the package path
$packages = Get-ChildItem -Path $PackagePath -Filter "*.nupkg" -Recurse | Where-Object { $_.Name -notlike "*.symbols.nupkg" }

foreach ($package in $packages) {
    Write-Host "Publishing $($package.Name)..."
    
    dotnet nuget push $package.FullName `
        --api-key $apiKey `
        --source $Source `
        --skip-duplicate
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to publish $($package.Name)"
        exit $LASTEXITCODE
    }
    
    Write-Host "Successfully published $($package.Name)"
}

Write-Host "All packages published successfully"
