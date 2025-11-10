# Scripts PowerShell pour le versioning et le déploiement

## Get-Version.ps1

# Récupère la version depuis GitVersion

param(
[string]$Format = "NuGetVersionV2"
)

try { # Vérifie si GitVersion est installé
$gitVersionCmd = Get-Command dotnet-gitversion -ErrorAction SilentlyContinue

    if (-not $gitVersionCmd) {
        Write-Host "GitVersion n'est pas installé. Installation en cours..."
        dotnet tool install --global GitVersion.Tool
    }

    # Exécute GitVersion
    $versionJson = dotnet-gitversion /output json | ConvertFrom-Json

    switch ($Format) {
        "SemVer" { return $versionJson.SemVer }
        "NuGetVersionV2" { return $versionJson.NuGetVersionV2 }
        "InformationalVersion" { return $versionJson.InformationalVersion }
        "FullSemVer" { return $versionJson.FullSemVer }
        default { return $versionJson.NuGetVersionV2 }
    }

}
catch {
Write-Error "Erreur lors de la récupération de la version: $\_"
return "0.0.1-dev"
}

## Build-Package.ps1

# Construit et package un projet .NET

param(
[Parameter(Mandatory=$true)]
[string]$ProjectPath,

    [string]$Configuration = "Release",

    [string]$OutputPath = ".\artifacts"

)

$version = & "$PSScriptRoot\Get-Version.ps1"
Write-Host "Building version: $version"

# Restaure les dépendances

dotnet restore $ProjectPath

# Compile

dotnet build $ProjectPath `
    --configuration $Configuration `
    /p:Version=$version `
--no-restore

# Crée le package NuGet

dotnet pack $ProjectPath `
    --configuration $Configuration `
    --output $OutputPath `
    /p:PackageVersion=$version `
--no-build

Write-Host "Package créé avec succès: $OutputPath"

## Publish-Package.ps1

# Publie un package sur NuGet

param(
[Parameter(Mandatory=$true)]
[string]$PackagePath,

    [Parameter(Mandatory=$true)]
    [string]$ApiKey,

    [string]$Source = "https://api.nuget.org/v3/index.json"

)

Write-Host "Publication du package: $PackagePath"

dotnet nuget push $PackagePath `    --api-key $ApiKey`
--source $Source `
--skip-duplicate

if ($LASTEXITCODE -eq 0) {
Write-Host "Package publié avec succès!"
}
else {
Write-Error "Échec de la publication du package"
exit 1
}
