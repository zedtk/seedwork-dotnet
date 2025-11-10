# Migration vers le plugin @nx/dotnet

Ce document récapitule la migration des scripts PowerShell manuels vers le plugin officiel `@nx/dotnet`.

## ✅ Ce qui a été fait

### 1. Installation du plugin

```bash
npx nx add @nx/dotnet
```

Le plugin a automatiquement :

- Ajouté `@nx/dotnet` à `nx.json` dans la section `plugins`
- Détecté les projets `.csproj` existants
- Inféré les targets `build`, `test`, `pack`, `publish`, `restore`, `clean`

### 2. Suppression des fichiers obsolètes

- ✅ Supprimé `tools/` (scripts PowerShell : build.ps1, test.ps1, pack.ps1, publish.ps1)
- ✅ Supprimé `packages/core/project.json` (configuration manuelle Nx)

### 3. Mise à jour de la documentation

- ✅ `README.md` : Ajout des commandes Nx avec le plugin
- ✅ `.github/workflows/ci-cd.yml` : Utilisation de `npx nx run-many` au lieu des scripts PowerShell
- ✅ Version .NET mise à jour de 8.0 à 9.0

## 🎯 Avantages du plugin @nx/dotnet

### Détection automatique

Le plugin analyse le workspace via MSBuild et détecte automatiquement :

- Tous les fichiers `.csproj`
- Les dépendances via `<ProjectReference>`
- La structure du projet

**Plus besoin de fichier `project.json` !**

### Cache intelligent

Le plugin configure automatiquement le cache basé sur :

- Les fichiers sources (`**/*.cs`)
- Les fichiers projet (`**/*.csproj`)
- Les références entre projets
- Les packages NuGet restaurés

### Targets automatiques

Le plugin infère automatiquement les targets suivants :

| Target    | Commande dotnet  | Options                                                |
| --------- | ---------------- | ------------------------------------------------------ |
| `build`   | `dotnet build`   | `--no-restore --no-dependencies`                       |
| `test`    | `dotnet test`    | `--no-build --no-restore`                              |
| `pack`    | `dotnet pack`    | `--no-dependencies --no-build --configuration Release` |
| `publish` | `dotnet publish` | `--no-build --configuration Release`                   |
| `restore` | `dotnet restore` | -                                                      |
| `clean`   | `dotnet clean`   | -                                                      |

### Dépendances automatiques

Le plugin configure automatiquement les dépendances entre targets :

- `test` dépend de `build`
- `pack` dépend de `build`
- Plus besoin de configuration `dependsOn` manuelle !

## 📝 Nouveaux workflows

### Développement local

```bash
# Build un projet spécifique
npx nx build Seedwork.Core

# Tester un projet spécifique
npx nx test Seedwork.Core.Tests

# Build tous les projets
npx nx run-many --target=build --all

# Test tous les projets
npx nx run-many --target=test --all

# Pack tous les projets packageables
npx nx run-many --target=pack --all
```

### Utilisation du cache

```bash
# Première exécution : build réel
npx nx build Seedwork.Core
# > nx run Seedwork.Core:build
# > dotnet build --no-restore --no-dependencies
# Build succeeded.

# Deuxième exécution : cache hit
npx nx build Seedwork.Core
# > nx run Seedwork.Core:build [existing outputs match the cache, left as is]
# Nx read the output from the cache instead of running the command for 1 out of 1 tasks.
```

### Projets affectés

```bash
# Build uniquement les projets modifiés
npx nx affected --target=build

# Test uniquement les projets affectés par les changements
npx nx affected --target=test

# Visualiser les projets affectés
npx nx affected:graph
```

## 🔧 Ajouter un nouveau projet

### Avant (avec scripts PowerShell)

1. Créer le projet .NET
2. Créer `project.json` avec la configuration complète
3. Définir manuellement les targets `build`, `test`, `pack`, `publish`
4. Configurer les dépendances entre targets
5. Configurer le cache manuellement

### Maintenant (avec @nx/dotnet)

1. Créer le projet .NET

```bash
dotnet new classlib -n Seedwork.NewLib -o packages/newlib/src -f net9.0
dotnet new xunit -n Seedwork.NewLib.Tests -o packages/newlib/test -f net9.0
```

2. **C'est tout !** Le plugin détecte automatiquement le nouveau projet.

Vérifiez :

```bash
npx nx show projects
# Seedwork.Core
# Seedwork.Core.Tests
# Seedwork.NewLib          ← Nouveau projet détecté !
# Seedwork.NewLib.Tests    ← Nouveau projet détecté !
```

## 📊 Résultats des tests

### Validation du workflow complet

```bash
# Build
npx nx run-many --target=build --all
# ✓ Successfully ran target build for 2 projects (124ms)
# ✓ Cache: 2/2 tasks from cache

# Test
npx nx run-many --target=test --all
# ✓ Successfully ran target test for project Seedwork.Core.Tests and 2 tasks it depends on (135ms)
# ✓ Cache: 3/3 tasks from cache

# Pack
npx nx run-many --target=pack --all
# ✓ Successfully ran target pack for project Seedwork.Core and 1 task it depends on (98ms)
# ✓ Cache: 2/2 tasks from cache
```

### Packages créés

```
packages/core/src/bin/Release/
├── Seedwork.Core.1.0.0.nupkg   (5.6 KB)
└── Seedwork.Core.1.0.0.snupkg  (8.4 KB)
```

## 🎉 Conclusion

La migration vers `@nx/dotnet` a simplifié considérablement la configuration :

| Aspect             | Avant                                  | Maintenant                 |
| ------------------ | -------------------------------------- | -------------------------- |
| Fichiers de config | `project.json` par projet              | Aucun (détection auto)     |
| Scripts            | 4 PowerShell (build/test/pack/publish) | Aucun (plugin intégré)     |
| Dépendances        | Manuelles dans `project.json`          | Automatiques via MSBuild   |
| Cache              | Configuration manuelle                 | Automatique                |
| Nouveaux projets   | 5+ étapes                              | 1 étape (créer le .csproj) |

**Le plugin @nx/dotnet offre une expérience "zero-config" tout en gardant la puissance de Nx !**
