# Structure du Projet Seedwork .NET

## Vue d'ensemble

```
seedwork-dotnet/
├── 📁 .github/
│   └── workflows/
│       └── ci-cd.yml              # Pipeline GitHub Actions (build, test, publish)
│
├── 📁 .nuget/
│   └── README.md                  # Guide de configuration NuGet
│
├── 📁 packages/                   # 📦 Packages .NET
│   └── core/                      # Package exemple : Seedwork.Core
│       ├── src/                   # Code source
│       │   ├── Seedwork.Core.csproj
│       │   ├── Entity.cs          # Classe de base Entity<TId>
│       │   └── README.md          # Documentation du package
│       ├── test/                  # Tests unitaires
│       │   ├── Seedwork.Core.Tests.csproj
│       │   └── EntityTests.cs
│       └── project.json           # Configuration Nx du projet
│
├── 📁 scripts/
│   └── README.md                  # Documentation des scripts PowerShell
│
├── 📁 tools/                      # 🔧 Scripts de build
│   ├── build.ps1                  # Compile un projet .NET
│   ├── test.ps1                   # Exécute les tests
│   ├── pack.ps1                   # Crée les packages NuGet
│   └── publish.ps1                # Publie sur NuGet
│
├── 📁 dist/                       # 📦 Packages générés (gitignored)
│   └── packages/
│       ├── Seedwork.Core.0.0.1.nupkg
│       └── Seedwork.Core.0.0.1.snupkg
│
├── 📄 Directory.Build.props       # Propriétés communes à tous les projets .NET
├── 📄 GitVersion.yml              # Configuration du versioning sémantique
├── 📄 global.json                 # Version du SDK .NET
├── 📄 SeedworkDotnet.sln         # Solution .NET
├── 📄 nx.json                     # Configuration Nx
├── 📄 package.json                # Dépendances npm et scripts
├── 📄 .gitignore                  # Fichiers ignorés par Git
├── 📄 README.md                   # Documentation principale
└── 📄 GETTING_STARTED.md          # Guide de démarrage détaillé
```

## 🔑 Fichiers clés

### Configuration Nx

**`nx.json`** - Configuration globale Nx

- Définit les targets par défaut (build, test, pack, publish)
- Configure le cache et les dépendances entre projets
- Gère les inputs pour optimiser le cache

**`packages/*/project.json`** - Configuration par projet

- Définit les executors Nx pour chaque target
- Configure les dépendances entre targets (dependsOn)
- Spécifie les tags pour l'organisation

### Configuration .NET

**`Directory.Build.props`** - Propriétés communes

- Version du langage C# (latest)
- Nullable reference types activé
- Métadonnées NuGet (auteur, licence, copyright)
- SourceLink pour le debugging
- Configuration des symboles (.snupkg)

**`global.json`** - Version du SDK

- Spécifie .NET 9.0 comme version du SDK
- Configure le rollForward pour compatibilité

**`GitVersion.yml`** - Versioning sémantique

- Définit les règles de versioning par branche
- Configure les tags de pré-release (alpha, beta)
- Gère les incréments de version

### Scripts PowerShell

**`tools/build.ps1`**

- Compile un projet avec dotnet build
- Applique la version de GitVersion
- Configure Release/Debug

**`tools/test.ps1`**

- Exécute les tests avec dotnet test
- Génère les rapports de couverture
- Produit les fichiers .trx

**`tools/pack.ps1`**

- Crée les packages NuGet
- Applique le versioning automatique
- Génère .nupkg et .snupkg

**`tools/publish.ps1`**

- Publie sur NuGet.org ou feed privé
- Utilise la variable NUGET_API_KEY
- Skip les duplicatas

## 🎯 Targets Nx disponibles

Pour chaque projet (ex: `core`), les targets suivants sont disponibles :

### `build`

Compile le projet .NET

```bash
npx nx build core
```

- Dépend de : rien (ou `^build` pour les dépendances)
- Cache : oui
- Inputs : fichiers source production

### `test`

Exécute les tests unitaires

```bash
npx nx test core
```

- Dépend de : `build`
- Cache : oui
- Inputs : tous les fichiers (source + tests)
- Outputs : rapports de test, couverture

### `pack`

Crée le package NuGet

```bash
npx nx pack core
```

- Dépend de : `build`, `test`
- Cache : oui
- Inputs : fichiers source production
- Outputs : .nupkg, .snupkg dans dist/packages/

### `publish`

Publie le package sur NuGet

```bash
npx nx publish core
```

- Dépend de : `pack`
- Cache : non (opération non reproductible)
- Nécessite : variable NUGET_API_KEY

## 📦 Anatomie d'un package

### Structure d'un package

```
packages/mypackage/
├── src/                           # Code source
│   ├── MyPackage.csproj          # Fichier de projet
│   │   ├── <PackageId>           # Nom du package sur NuGet
│   │   ├── <Title>               # Titre affiché
│   │   ├── <Description>         # Description
│   │   ├── <PackageTags>         # Tags pour la recherche
│   │   └── <IsPackable>true      # Indique que c'est un package
│   ├── README.md                  # Documentation (incluse dans le .nupkg)
│   └── *.cs                       # Fichiers source
│
├── test/                          # Tests unitaires
│   ├── MyPackage.Tests.csproj    # Projet de tests
│   │   ├── <IsPackable>false     # N'est pas un package
│   │   ├── <IsTestProject>true   # Projet de tests
│   │   └── <ProjectReference>     # Référence au projet source
│   └── *Tests.cs                  # Fichiers de tests
│
└── project.json                   # Configuration Nx
    ├── name                       # Nom du projet dans Nx
    ├── sourceRoot                 # Dossier source
    ├── targets                    # Définition des targets
    └── tags                       # Tags d'organisation
```

## 🔄 Flux de travail typique

### 1. Développement d'une fonctionnalité

```
Developer
    ↓
[Créer branche feature/*]
    ↓
[Modifier le code]
    ↓
[npx nx build core] ← Compile
    ↓
[npx nx test core]  ← Tests
    ↓
[Commit avec message conventionnel]
    ↓
[Push + Pull Request]
```

### 2. Intégration Continue (CI)

```
GitHub Push/PR
    ↓
[GitHub Actions: ci-cd.yml]
    ↓
[Checkout code]
    ↓
[Setup .NET + Node.js]
    ↓
[Install GitVersion]
    ↓
[Determine Version] ← GitVersion
    ↓
[npm ci] ← Install deps
    ↓
[npm run build] ← Build all
    ↓
[npm run test]  ← Test all
    ↓
[npm run pack]  ← Create packages
    ↓
[Upload artifacts]
```

### 3. Déploiement (CD)

```
[Merge to main] ou [Create Release]
    ↓
[GitHub Actions: publish job]
    ↓
[Download artifacts]
    ↓
[npm run publish] → NuGet.org
    ↓
[Packages disponibles publiquement]
```

## 🏗️ Architecture du cache Nx

Nx optimise les builds avec un système de cache intelligent :

### Quand le cache est utilisé

- ✅ **Build** : Si les fichiers source n'ont pas changé
- ✅ **Test** : Si le code et les tests n'ont pas changé
- ✅ **Pack** : Si le build et les tests sont identiques
- ❌ **Publish** : Jamais mis en cache (opération externe)

### Invalidation du cache

Le cache est invalidé si :

- Les fichiers source changent
- Les dépendances changent
- Les fichiers de configuration changent (Directory.Build.props, GitVersion.yml)

### Réinitialiser le cache

```bash
npx nx reset
```

## 🔗 Gestion des dépendances

### Dépendances entre packages

Dans le `.csproj` :

```xml
<ItemGroup>
  <ProjectReference Include="../../core/src/Seedwork.Core.csproj" />
</ItemGroup>
```

Dans le `project.json` :

```json
{
  "targets": {
    "build": {
      "dependsOn": ["^build"] // ← Le ^ signifie "build les dépendances d'abord"
    }
  }
}
```

Nx construit automatiquement dans le bon ordre :

```
core → valueobjects → aggregates
  ↓         ↓              ↓
 build → build        → build
```

## 📊 Commandes utiles

### Visualisation

```bash
# Graphe de dépendances
npx nx graph

# Projets affectés par les changements
npx nx affected:graph

# Liste tous les projets
npx nx show projects
```

### Exécution

```bash
# Build tous les projets
npm run build
# ou
npx nx run-many --target=build --all

# Test tous les projets
npm run test

# Build uniquement les projets affectés
npx nx affected --target=build

# Exécution parallèle (3 projets en même temps)
npx nx run-many --target=build --all --parallel=3
```

### Diagnostic

```bash
# Voir les détails d'une commande
npx nx build core --verbose

# Dry run (voir ce qui serait exécuté)
npx nx build core --dry-run

# Ignorer le cache
npx nx build core --skip-nx-cache
```

## 🎨 Conventions

### Nommage

- **Packages** : `Seedwork.*` (ex: Seedwork.Core, Seedwork.ValueObjects)
- **Namespaces** : Identiques aux noms de packages
- **Dossiers** : lowercase (ex: packages/core/src)
- **Projets Nx** : lowercase (ex: "core", "valueobjects")

### Organisation du code

```
packages/
├── core/           # Building blocks de base (Entity, ValueObject)
├── domain/         # Patterns de domaine (AggregateRoot, DomainEvent)
├── application/    # Patterns d'application (Commands, Queries)
└── infrastructure/ # Implémentations techniques
```

### Tests

- Un fichier de test par classe : `EntityTests.cs` pour `Entity.cs`
- Nomenclature : `MethodName_Scenario_ExpectedResult`
- Arrange-Act-Assert pattern

## 🚀 Prochaines étapes

1. **Ajouter plus de building blocks** : ValueObject, AggregateRoot, DomainEvent
2. **Configurer GitHub** : Secrets, branch protection
3. **Ajouter des analyseurs** : StyleCop, Roslynator
4. **Mettre en place la couverture de code** : Codecov, Coveralls
5. **Documentation** : DocFX pour générer la documentation API

## 📚 Ressources supplémentaires

- [Nx Documentation](https://nx.dev)
- [.NET CLI](https://docs.microsoft.com/dotnet/core/tools/)
- [NuGet Package Explorer](https://github.com/NuGetPackageExplorer/NuGetPackageExplorer)
- [GitVersion Calculator](https://gitversion.net/docs/)
