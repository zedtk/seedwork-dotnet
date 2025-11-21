# Nx NuGet Publish Plugin

Automatically create NuGet publish targets for packable .NET projects in Nx monorepos.

## Installation
```bash
npm install --save-dev @your-org/nx-dotnet-publish
```

## Quick Start

### 1. Configure NuGet Sources
```bash
# Add sources
dotnet nuget add source https://api.nuget.org/v3/index.json --name nuget.org
dotnet nuget add source ./local-feed --name local-feed

# Set API keys
dotnet nuget setapikey YOUR_API_KEY --source nuget.org
```

### 2. Enable Plugin

Add to your `nx.json`:
```json
{
  "plugins": [
    {
      "plugin": "@your-org/nx-dotnet-publish",
      "options": {
        "sourceName": "local-feed"
      }
    }
  ]
}
```

### 3. Mark Projects as Packable

In your `.csproj` files:
```xml
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <IsPackable>true</IsPackable>
  </PropertyGroup>
</Project>
```

## Usage
```bash
nx release

# Publish specific project
nx run my-lib:nx-release-publish
```

## Configuration

### Plugin Options

| Option | Default | Description |
|--------|---------|-------------|
| `targetName` | `'nx-release-publish'` | Name of the generated target |
| `packTargetName` | `'pack'` | Pack target dependency |
| `buildConfiguration` | `'Release'` | Build configuration directory |
| `sourceName` | `'nuget.org'` | Default NuGet source |

### Environment Variable

Set `NUGET_SOURCE_NAME` to override the source:
```bash
export NUGET_SOURCE_NAME=local-feed
nx reset  # Required: clears graph cache
nx release
```

**Note:** The environment variable is read when Nx generates the project graph (not at task execution). You must run `nx reset` after changing it for local development.

## CI/CD Example
```yaml
# GitHub Actions
- name: Setup NuGet
  run: |
    dotnet nuget add source https://api.nuget.org/v3/index.json --name nuget.org
    dotnet nuget setapikey ${{ secrets.NUGET_API_KEY }} --source nuget.org

- name: Publish
  run: nx release -y
```

## Troubleshooting

### Unauthorized Errors
```bash
# Verify sources and credentials
dotnet nuget list source

# Re-set API key if needed
dotnet nuget setapikey YOUR_KEY --source nuget.org
```

### Source Not Found

Ensure the source name in your configuration matches:
```bash
dotnet nuget list source
# Check that 'nuget.org' (or your source name) appears in the list
```

### Environment Variable Not Working

The environment variable is cached in the project graph:
```bash
export NUGET_SOURCE_NAME=new-source
nx reset  # Clear graph cache
nx release
```

### Packages Not Found

Verify the pack target ran and check the output directory:
```bash
nx run my-lib:pack
ls packages/my-lib/bin/Release/*.nupkg
```

## How It Works

The plugin:

1. Scans for `.csproj` files with `<IsPackable>true</IsPackable>`
2. Creates an `nx-release-publish` target for each packable project
3. Target depends on `pack` to ensure packages are built first
4. Runs `dotnet nuget push` with configured source and `--skip-duplicate` flag
5. Uses API keys configured via `dotnet nuget setapikey` (stored securely by .NET SDK)
