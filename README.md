# Seedwork .NET

[![.NET](https://img.shields.io/badge/.NET-8.0-512BD4?logo=dotnet)](https://dotnet.microsoft.com/)
[![Nx](https://img.shields.io/badge/Nx-22.0-143055?logo=nx)](https://nx.dev/)
[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)

Domain-Driven Design building blocks for .NET managed with Nx.

**Maintained by [Ze Dev ToolKit (ZeDTK)](https://github.com/zedtk)**

**Target Framework:** .NET 8.0 | **SDK:** .NET 9.0

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Build all projects
npm run build

# Run tests
npm run test

# Create a release
npm run release
```

## 📦 Packages

- **ZeDTK.Seedwork.Core** - Base entity and DDD patterns
- **ZeDTK.Seedwork.Domain** - Aggregate roots and value objects

## 🏗️ Adding a New Library

```bash
# Create the library and tests
dotnet new classlib -n Seedwork.NewLib -o packages/newlib/src -f net8.0
dotnet new xunit -n Seedwork.NewLib.Tests -o packages/newlib/test -f net8.0

# Add reference and to solution
cd packages/newlib/test && dotnet add reference ../src/Seedwork.NewLib.csproj
cd ../../.. && dotnet sln add packages/newlib/src/Seedwork.NewLib.csproj
dotnet sln add packages/newlib/test/Seedwork.NewLib.Tests.csproj
```

Configure NuGet metadata in the `.csproj` file, then the `@nx/dotnet` plugin will auto-detect it.

## 🏷️ Versioning

Uses `nx release` with conventional commits:

- `feat:` → minor version (0.1.0 → 0.2.0)
- `fix:` → patch (0.1.0 → 0.1.1)
- `BREAKING CHANGE:` → major (0.1.0 → 1.0.0)

Each package has independent versioning with tags like `Seedwork.Core@v1.0.0`.

## 🔄 CI/CD

GitHub Actions workflows:
- **CI** - Runs on every push (build, test, lint, security scans)
- **Release** - Manual trigger to version and publish to NuGet

Set `NUGET_API_KEY` secret in your repository settings.

## 📄 License

Apache-2.0 - See [LICENSE](LICENSE)
`````
