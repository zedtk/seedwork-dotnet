#!/usr/bin/env pwsh

param(
    [Parameter(Mandatory=$true)]
    [string]$ProjectPath,
    
    [string]$Configuration = "Release"
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

Write-Host "Building $ProjectPath version $version in $Configuration mode..."

# Build the project
dotnet build $ProjectPath `
    --configuration $Configuration `
    /p:Version=$version `
    /p:AssemblyVersion=$version `
    /p:FileVersion=$version `
    /p:InformationalVersion=$version

if ($LASTEXITCODE -ne 0) {
    Write-Error "Build failed"
    exit $LASTEXITCODE
}

Write-Host "Build completed successfully"
