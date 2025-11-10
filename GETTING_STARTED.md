# Guide de démarrage - Seedwork .NET

Ce guide vous aidera à créer et déployer vos premières bibliothèques .NET dans ce workspace Nx.

## ✅ Vérification de l'installation

Vérifiez que tout fonctionne correctement :

```powershell
# Compiler tous les projets
npm run build

# Exécuter tous les tests
npm run test

# Créer les packages NuGet
npm run pack

# Les packages sont dans dist/packages/
ls dist/packages/
```

Vous devriez voir :

- `Seedwork.Core.0.0.1.nupkg`
- `Seedwork.Core.0.0.1.snupkg` (symboles de debug)

## 🎯 Workflow de développement

### 1. Créer une nouvelle fonctionnalité

```powershell
# Créer une branche feature
git checkout -b feature/ma-nouvelle-fonctionnalite

# Faire vos modifications dans packages/core/src/

# Compiler et tester en continu
npx nx build core
npx nx test core
```

### 2. Commits conventionnels

Utilisez le format de commits conventionnels pour le versioning automatique :

```bash
# Nouvelle fonctionnalité (incrémente version mineure: 1.0.0 → 1.1.0)
git commit -m "feat: ajout de la classe AggregateRoot"

# Correction de bug (incrémente patch: 1.0.0 → 1.0.1)
git commit -m "fix: correction de la comparaison d'entités"

# Breaking change (incrémente version majeure: 1.0.0 → 2.0.0)
git commit -m "feat: refonte de l'Entity

BREAKING CHANGE: la signature du constructeur a changé"

# Documentation (pas de changement de version)
git commit -m "docs: mise à jour du README"

# Refactoring (pas de changement de version)
git commit -m "refactor: amélioration du code Entity"
```

### 3. Tester localement

```powershell
# Build
npx nx build core

# Tests unitaires
npx nx test core

# Créer le package
npx nx pack core

# Tester le package localement
dotnet add package Seedwork.Core --source ./dist/packages
```

## 📦 Créer une nouvelle bibliothèque

### Exemple : Créer une bibliothèque pour les Value Objects

```powershell
# 1. Créer les projets .NET
dotnet new classlib -n Seedwork.ValueObjects -o packages/valueobjects/src -f net9.0
dotnet new xunit -n Seedwork.ValueObjects.Tests -o packages/valueobjects/test -f net9.0

# 2. Ajouter la référence au projet de tests
cd packages/valueobjects/test
dotnet add reference ../src/Seedwork.ValueObjects.csproj

# 3. Ajouter à la solution
cd ../../..
dotnet sln add packages/valueobjects/src/Seedwork.ValueObjects.csproj
dotnet sln add packages/valueobjects/test/Seedwork.ValueObjects.Tests.csproj
```

### 4. Configurer le .csproj

Éditez `packages/valueobjects/src/Seedwork.ValueObjects.csproj` :

```xml
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>net9.0</TargetFramework>
    <ImplicitUsings>enable</ImplicitUsings>
    <Nullable>enable</Nullable>

    <!-- NuGet Package Metadata -->
    <PackageId>Seedwork.ValueObjects</PackageId>
    <Title>Seedwork Value Objects Library</Title>
    <Description>Base classes and utilities for implementing Value Objects in DDD</Description>
    <PackageTags>ddd;value-objects;seedwork;patterns</PackageTags>
    <IsPackable>true</IsPackable>
  </PropertyGroup>

  <ItemGroup>
    <None Include="README.md" Pack="true" PackagePath="\" />
  </ItemGroup>

  <!-- Référence à d'autres packages du workspace -->
  <ItemGroup>
    <ProjectReference Include="../../core/src/Seedwork.Core.csproj" />
  </ItemGroup>
</Project>
```

### 5. Créer la configuration Nx

Créez `packages/valueobjects/project.json` :

```json
{
  "name": "valueobjects",
  "$schema": "../../node_modules/nx/schemas/project-schema.json",
  "projectType": "library",
  "sourceRoot": "packages/valueobjects/src",
  "targets": {
    "build": {
      "executor": "nx:run-commands",
      "options": {
        "command": "pwsh -File tools/build.ps1 -ProjectPath packages/valueobjects/src/Seedwork.ValueObjects.csproj -Configuration Release",
        "cwd": "{workspaceRoot}"
      },
      "dependsOn": ["^build"]
    },
    "test": {
      "executor": "nx:run-commands",
      "options": {
        "command": "pwsh -File tools/test.ps1 -ProjectPath packages/valueobjects/test/Seedwork.ValueObjects.Tests.csproj",
        "cwd": "{workspaceRoot}"
      },
      "dependsOn": ["build"]
    },
    "pack": {
      "executor": "nx:run-commands",
      "options": {
        "command": "pwsh -File tools/pack.ps1 -ProjectPath packages/valueobjects/src/Seedwork.ValueObjects.csproj -OutputPath dist/packages",
        "cwd": "{workspaceRoot}"
      },
      "dependsOn": ["build", "test"]
    },
    "publish": {
      "executor": "nx:run-commands",
      "options": {
        "command": "pwsh -File tools/publish.ps1 -PackagePath dist/packages",
        "cwd": "{workspaceRoot}"
      },
      "dependsOn": ["pack"]
    }
  },
  "tags": ["type:library", "scope:valueobjects"]
}
```

**Important :** Notez le `"dependsOn": ["^build"]` dans le target build. Le `^` signifie "build toutes les dépendances d'abord".

### 6. Créer le README du package

Créez `packages/valueobjects/src/README.md` :

```markdown
# Seedwork.ValueObjects

Classes de base pour implémenter des Value Objects en Domain-Driven Design.

## Installation

\`\`\`bash
dotnet add package Seedwork.ValueObjects
\`\`\`

## Utilisation

\`\`\`csharp
using Seedwork.ValueObjects;

public class Money : ValueObject
{
public decimal Amount { get; }
public string Currency { get; }

    public Money(decimal amount, string currency)
    {
        Amount = amount;
        Currency = currency;
    }

    protected override IEnumerable<object> GetEqualityComponents()
    {
        yield return Amount;
        yield return Currency;
    }

}
\`\`\`
```

## 🔄 Publication sur NuGet

### Configuration initiale

1. Créer un compte sur [nuget.org](https://www.nuget.org)
2. Générer une clé API avec permissions "Push"
3. Configurer la clé localement :

```powershell
# PowerShell
$env:NUGET_API_KEY = "votre-clé-api"

# Pour persister (ajouter au profil PowerShell)
Add-Content $PROFILE "`n`$env:NUGET_API_KEY = 'votre-clé-api'"
```

### Publication manuelle

```powershell
# Vérifier que tous les tests passent
npm run test

# Créer les packages
npm run pack

# Publier (nécessite NUGET_API_KEY configurée)
npm run publish
```

### Publication automatique via GitHub Actions

Le workflow CI/CD est configuré dans `.github/workflows/ci-cd.yml`.

**Configuration GitHub :**

1. Allez dans Settings > Secrets and variables > Actions
2. Créez un secret `NUGET_API_KEY` avec votre clé API NuGet

**Déclenchement automatique :**

- **Sur push vers `main`** : Build, test, et publication sur NuGet
- **Sur pull request** : Build et test uniquement
- **Sur création de release** : Build, test, et publication avec version finale

## 🏷️ Gestion des versions

### Versioning automatique avec GitVersion

Les versions sont calculées automatiquement selon :

- **Branche `main`** → versions stables (1.0.0, 1.0.1)
- **Branche `develop`** → versions alpha (1.1.0-alpha.1)
- **Branches `feature/*`** → versions de développement (1.1.0-alpha.feature-name.1)
- **Branches `release/*`** → versions beta (1.1.0-beta.1)

### Vérifier la version actuelle

```powershell
# Installer GitVersion Tool (une seule fois)
dotnet tool install --global GitVersion.Tool

# Voir la version actuelle
dotnet-gitversion

# Voir uniquement le numéro de version
dotnet-gitversion /showvariable NuGetVersionV2
```

### Forcer une version spécifique

Créez un tag Git :

```powershell
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0
```

## 🧪 Tests et qualité

### Exécuter les tests

```powershell
# Tous les tests
npm run test

# Un projet spécifique
npx nx test core

# Avec couverture de code
npx nx test core --coverage
```

### Analyse de dépendances

```powershell
# Visualiser le graphe de dépendances
npx nx graph

# Voir les projets affectés par des changements
npx nx affected:graph
```

### Cache Nx

```powershell
# Réinitialiser le cache (en cas de problème)
npx nx reset

# Voir les statistiques du cache
npx nx show projects
```

## 🐛 Dépannage

### Erreur "GitVersion not available"

C'est normal en développement local. Le versioning utilise "0.0.1" par défaut.

Pour installer GitVersion :

```powershell
dotnet tool install --global GitVersion.Tool
```

### Erreur de compilation

```powershell
# Nettoyer et rebuild
dotnet clean
npx nx reset
npx nx build core
```

### Les tests ne passent pas

```powershell
# Vérifier que le build est à jour
npx nx build core
npx nx test core --verbose
```

### Package non créé

```powershell
# Vérifier le fichier .csproj
# Assurez-vous que <IsPackable>true</IsPackable> est présent

# Créer manuellement
cd packages/core/src
dotnet pack -o ../../../dist/packages
```

## 📚 Ressources

- [Documentation Nx](https://nx.dev)
- [Documentation GitVersion](https://gitversion.net/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [NuGet Best Practices](https://docs.microsoft.com/nuget/create-packages/package-authoring-best-practices)
- [Domain-Driven Design](https://martinfowler.com/tags/domain%20driven%20design.html)

## 💡 Conseils

1. **Commits fréquents** : Committez souvent avec des messages clairs
2. **Tests d'abord** : Écrivez les tests avant le code (TDD)
3. **Documentation** : Maintenez les README à jour
4. **Revue de code** : Utilisez les pull requests pour la revue de code
5. **Versioning sémantique** : Respectez les conventions de commits
6. **Cache Nx** : Profitez du cache pour accélérer les builds

Bon développement ! 🚀
