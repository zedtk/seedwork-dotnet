#!/usr/bin/env pwsh

param(
    [Parameter(Mandatory=$true)]
    [string]$ProjectPath,
    
    [string]$OutputPath = "dist/packages"
)

$ErrorActionPreference = "Stop"

# Get version from GitVersion
$version = "0.0.1"
try {
    $versionJson = dotnet-gitversion /output json 2>$null | ConvertFrom-Json
    if ($versionJson) {
        $version = $versionJson.NuGetVersionV2
    }
} catch {
    Write-Host "Warning: GitVersion not available, using default version $version"
}

Write-Host "Packing $ProjectPath version $version..."

# Ensure output directory exists
New-Item -ItemType Directory -Force -Path $OutputPath | Out-Null

# Pack the project
dotnet pack $ProjectPath `
    --configuration Release `
    --output $OutputPath `
    --no-build `
    /p:PackageVersion=$version `
    /p:Version=$version

if ($LASTEXITCODE -ne 0) {
    Write-Error "Pack failed"
    exit $LASTEXITCODE
}

Write-Host "Package created successfully in $OutputPath"
