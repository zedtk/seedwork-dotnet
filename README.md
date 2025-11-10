# Seedwork .NET - Nx Monorepo

[![.NET](https://img.shields.io/badge/.NET-9.0-512BD4?logo=dotnet)](https://dotnet.microsoft.com/)
[![Nx](https://img.shields.io/badge/Nx-22.0-143055?logo=nx)](https://nx.dev/)
[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)

Workspace Nx moderne pour créer des bibliothèques .NET réutilisables avec versioning sémantique automatique et déploiement sur NuGet.

**Maintenu par [Ze Dev ToolKit (ZeDTK)](https://github.com/zedtk)**

## 🎯 ObjectifsWorkspace Nx moderne pour créer des bibliothèques .NET réutilisables avec versioning sémantique automatique et déploiement sur NuGet.[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)Workspace Nx pour bibliothèques .NET avec versioning sémantique automatique et déploiement sur NuGet.<a alt="Nx logo" href="https://nx.dev" target="_blank" rel="noreferrer"><img src="https://raw.githubusercontent.com/nrwl/nx/master/images/nx-logo.png" width="45"></a>

- **Monorepo Nx avec plugin @nx/dotnet** : Gestion intelligente des projets .NET avec détection automatique## 🎯 ObjectifsWorkspace Nx moderne pour créer des bibliothèques .NET réutilisables avec versioning sémantique automatique et déploiement sur NuGet.

- **Cache intelligent** : Réutilisation des résultats de build avec le système de cache Nx

- **Versionnement automatique** : nx release avec conventional commits- **Monorepo Nx avec plugin @nx/dotnet** : Gestion intelligente des projets .NET avec détection automatique---## 📋 Prérequis✨ Your new, shiny [Nx workspace](https://nx.dev) is ready ✨.

- **Versionnement indépendant** : Chaque package a sa propre version (tags `{project}@v{version}`)

- **Publication automatisée** : Pipeline CI/CD pour publier sur NuGet- **Cache intelligent** : Réutilisation des résultats de build avec le système de cache Nx

- **Tests automatisés** : Exécution des tests unitaires sur chaque commit

- **Versionnement automatique** : GitVersion pour le versionnement sémantique basé sur les commits## 📚 Documentation

## 📦 Packages

- **Publication automatisée** : Pipeline CI/CD pour publier sur NuGet

### Seedwork.Core

- **Tests automatisés** : Exécution des tests unitaires sur chaque commit| Guide | Description |- [.NET SDK 8.0+](https://dotnet.microsoft.com/download)[Learn more about this workspace setup and its capabilities](https://nx.dev/getting-started/intro#learn-nx?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) or run `npx nx graph` to visually explore what was created. Now, let's get you up to speed!

Bibliothèque de base contenant les abstractions et patterns fondamentaux.

## 📦 Packages|-------|-------------|

**Localisation** : `packages/core/`

### Seedwork.Core| **[🚀 Getting Started](GETTING_STARTED.md)** | Guide complet pour démarrer et créer vos bibliothèques |- [Node.js 20+](https://nodejs.org/)

**Contenu** :

- `Entity<TId>` : Classe de base pour les entités DDD avec identité typéeBibliothèque de base contenant les abstractions et patterns fondamentaux.| **[🏗️ Project Structure](PROJECT_STRUCTURE.md)** | Architecture détaillée du workspace |

- _(autres composants à venir)_

**Localisation** : `packages/core/`| **[✨ Best Practices](BEST_PRACTICES.md)** | Standards de code et conventions |- [GitVersion Tool](https://gitversion.net/) (optionnel, installé automatiquement)## Run tasks

### Seedwork.Domain

**Contenu** :| **[🎉 Setup Complete](SETUP_COMPLETE.md)** | Récapitulatif de la configuration |

Bibliothèque de patterns Domain-Driven Design.

- `Entity<TId>` : Classe de base pour les entités DDD avec identité typée

**Localisation** : `packages/domain/`

- _(autres composants à venir)_---

**Contenu** :

- `AggregateRoot<TId>` : Classe de base pour les aggregate roots DDD## 🏗️ Structure du projet## 🚀 Démarrage rapideTo run tasks with Nx use:

- `ValueObject` : Classe de base pour les value objects

- _(autres composants à venir)_`````## ⚡ Démarrage rapide

## 🏗️ Structure du projetseedwork-dotnet/

```├── packages/ # Packages .NET````bash

seedwork-dotnet/

├── packages/ # Packages .NET│ └── core/ # Seedwork.Core

│ ├── core/ # Seedwork.Core

│ │ ├── src/ # Code source│ ├── src/ # Code source# Installer les dépendances### Installation```sh

│ │ │ ├── Seedwork.Core.csproj

│ │ │ └── Entity.cs│ │ ├── Seedwork.Core.csproj

│ │ └── test/ # Tests unitaires

│ │ ├── Seedwork.Core.Tests.csproj│ │ └── Entity.csnpm install

│ │ └── EntityTests.cs

│ └── domain/ # Seedwork.Domain│ └── test/ # Tests unitaires

│ └── src/ # Code source

│ ├── Seedwork.Domain.csproj│ ├── Seedwork.Core.Tests.csprojnpx nx <target> <project-name>

│ ├── AggregateRoot.cs

│ └── ValueObject.cs│ └── EntityTests.cs

├── .github/workflows/ # CI/CD

│ └── ci-cd.yml # Pipeline GitHub Actions├── .github/workflows/ # CI/CD# Compiler tous les projets

├── Directory.Build.props # Propriétés MSBuild partagées

├── global.json # Version du SDK .NET│ └── ci-cd.yml # Pipeline GitHub Actions

├── nx.json # Configuration Nx (avec plugin @nx/dotnet et nx release)

└── package.json # Dépendances npm et scripts├── Directory.Build.props # Propriétés MSBuild partagéesnpm run build`bash`

````

├── GitVersion.yml             # Configuration du versionnement

## 🚀 Utilisation

├── global.json                # Version du SDK .NET

### Commandes principales

├── nx.json                    # Configuration Nx (avec plugin @nx/dotnet)

```bash

# Build tous les projets└── package.json               # Dépendances npm et scripts# Exécuter tous les testsnpm install

npm run build

````

# Exécuter tous les tests

npm run testnpm run test

# Créer une release (version + changelog + tags Git)## 🚀 Utilisation

npm run release

````For example:

# Publier sur NuGet

npm run release:publish### Commandes principales

```

# Créer les packages NuGet

### Commandes Nx avec plugin @nx/dotnet

```bash

Le plugin `@nx/dotnet` détecte automatiquement les projets `.csproj` et infère les targets via MSBuild :

# Build tous les projetsnpm run pack

```bash

# Build un package spécifiquenpm run build

npx nx build Seedwork.Core

````

# Tester un package

npx nx test Seedwork.Core.Tests# Exécuter tous les tests

# Build tous les projets affectés par les changementsnpm run test### Installer GitVersion (optionnel pour le développement local)```sh

npx nx affected --target=build

# Créer les packages NuGetLes packages sont générés dans `dist/packages/`.

# Voir le graphe de dépendances

npx nx graphnpm run pack

```

npx nx build myproject

**Le plugin gère automatiquement** :

- ✅ Détection des projets et leurs dépendances via `ProjectReference`# Publier sur NuGet (nécessite NUGET_API_KEY)

- ✅ Cache intelligent basé sur les inputs (fichiers sources, références)

- ✅ Exécution des targets avec les bonnes options `dotnet` (--no-build, --no-restore, etc.)npm run publish---

- ✅ Parallélisation optimale des tâches indépendantes

```

### Workflow de release avec nx release

`bash`

````bash

# 1. Faire des commits conventionnels### Commandes Nx avec plugin @nx/dotnet

git commit -m "feat(core): add new feature"

git commit -m "fix(domain): correct bug"## 🎯 Fonctionnalités principales



# 2. Preview la releaseLe plugin `@nx/dotnet` détecte automatiquement les projets `.csproj` et infère les targets via MSBuild :

npx nx release --dry-run

dotnet tool install --global GitVersion.Tool

# 3. Créer la release (version + changelog + tags)

npx nx release --skip-publish```bash



# 4. Récupérer la version du tag pour le build# Build un package spécifique### ✅ Workspace Nx

$version = (git describe --tags --abbrev=0 | sed 's/.*@v//')

npx nx build Seedwork.Core

# 5. Build avec la version

dotnet build -p:Version=$version- **Cache intelligent** : Builds incrémentaux ultra-rapides```These targets are either [inferred automatically](https://nx.dev/concepts/inferred-tasks?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) or defined in the `project.json`or`package.json` files.



# 6. Pack les packages# Tester un package spécifique

dotnet pack -p:Version=$version --no-build -c Release

npx nx test Seedwork.Core.Tests- **Graphe de dépendances** : Visualisation et gestion automatique

# 7. Publier sur NuGet

dotnet nuget push "packages/**/bin/Release/*.nupkg" \

  --api-key $NUGET_API_KEY \

  --source https://api.nuget.org/v3/index.json \# Créer le package NuGet pour un projet- **Exécution parallèle** : Build et test de plusieurs projets simultanément

  --skip-duplicate

```npx nx pack Seedwork.Core



## 🏷️ Versioning sémantique- **Affected commands** : Ne rebuild que ce qui a changé



Le versioning est géré par **nx release** avec conventional commits et tags Git :# Publier un package spécifique



### Format des commitsnpx nx publish Seedwork.Core## 📦 Structure du projet[More about running tasks in the docs &raquo;](https://nx.dev/features/run-tasks?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)



```bash

# Nouvelle fonctionnalité → version mineure (0.1.0 → 0.2.0)

git commit -m "feat(domain): add ValueObject base class"# Build tous les packages affectés par les changements### 📦 Gestion de packages



# Correction de bug → patch (0.1.0 → 0.1.1)npx nx affected --target=build

git commit -m "fix(core): correct Entity equality"

- **Versioning automatique** : GitVersion + Conventional Commits

# Breaking change → version majeure (0.1.0 → 1.0.0)

git commit -m "feat(core): redesign Entity API# Voir le graphe de dépendances



BREAKING CHANGE: constructor signature changed"npx nx graph- **NuGet prêt** : Métadonnées et symboles configurés

````

```````

### Versionnement indépendant

- **Multi-targeting** : Support .NET 9.0 (configurable)```## Add new projects

Chaque projet a sa propre version et ses propres tags :

**Le plugin gère automatiquement** :

- `Seedwork.Core@v1.0.0`, `Seedwork.Core@v1.0.1`, etc.

- `Seedwork.Domain@v0.1.0`, `Seedwork.Domain@v0.1.1`, etc.- ✅ Détection des projets et leurs dépendances via `ProjectReference`- **Documentation** : Génération automatique de XML docs



**nx release détecte automatiquement** quels projets ont changé et ne version que ceux-ci.- ✅ Cache intelligent basé sur les inputs (fichiers sources, références)



### Vérifier la version actuelle- ✅ Exécution des targets avec les bonnes options `dotnet` (--no-build, --no-restore, etc.)seedwork-dotnet/



```bash- ✅ Parallélisation optimale des tâches indépendantes

# Voir tous les tags

git tag -l### 🚀 CI/CD



# Voir le dernier tag d'un projet## 🔧 Ajouter une nouvelle bibliothèque

git describe --tags --match="Seedwork.Core@*" --abbrev=0

```- **GitHub Actions** : Workflow complet préconfigur├── packages/ # Bibliothèques .NETWhile you could add new projects to your workspace manually, you might want to leverage [Nx plugins](https://nx.dev/concepts/nx-plugins?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) and their [code generation](https://nx.dev/features/generate-code?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) feature.



## 🔧 Ajouter une nouvelle bibliothèque### 1. Créer les projets .NET



### 1. Créer le projet .NET- **Tests automatiques** : Exécution sur chaque commit



```bash`````bash

# Créer la bibliothèque

dotnet new classlib -n Seedwork.NewLib -o packages/newlib/src -f net9.0# Créer la bibliothèque- **Publication automatique** : Déploiement sur NuGet.org│ └── core/ # Package exemple



# Créer les testsdotnet new classlib -n Seedwork.NewLib -o packages/newlib/src -f net9.0

dotnet new xunit -n Seedwork.NewLib.Tests -o packages/newlib/test -f net9.0

- **Artefacts** : Packages sauvegardés pour chaque build

# Ajouter la référence aux tests

cd packages/newlib/test# Créer les tests

dotnet add reference ../src/Seedwork.NewLib.csproj

dotnet new xunit -n Seedwork.NewLib.Tests -o packages/newlib/test -f net9.0│ ├── src/ # Code sourceTo install a new plugin you can use the `nx add` command. Here's an example of adding the React plugin:

# Ajouter à la solution

cd ../../..

dotnet sln add packages/newlib/src/Seedwork.NewLib.csproj

dotnet sln add packages/newlib/test/Seedwork.NewLib.Tests.csproj# Ajouter la référence au projet de tests### 🎨 Developer Experience

```

cd packages/newlib/test

### 2. Configurer les métadonnées NuGet

dotnet add reference ../src/Seedwork.NewLib.csproj- **Scripts PowerShell** : Build, test, pack, publish│ │ ├── Seedwork.Core.csproj```sh

Éditez `packages/newlib/src/Seedwork.NewLib.csproj` :



```xml

<PropertyGroup># Ajouter à la solution- **Documentation complète** : Guides et exemples

  <!-- NuGet Package Metadata -->

  <PackageId>Seedwork.NewLib</PackageId>cd ../../..

  <Title>Seedwork New Library</Title>

  <Description>Description de votre bibliothèque</Description>dotnet sln add packages/newlib/src/Seedwork.NewLib.csproj- **Structure cohérente** : Organisation claire des projets│ │ └── Entity.csnpx nx add @nx/react

  <PackageTags>ddd;domain-driven-design;csharp</PackageTags>

  <IsPackable>true</IsPackable>dotnet sln add packages/newlib/test/Seedwork.NewLib.Tests.csproj

</PropertyGroup>

```- **Best practices** : Standards DDD intégrés

<ItemGroup>

  <None Include="README.md" Pack="true" PackagePath="\" />

</ItemGroup>

```### 2. Configurer les métadonnées NuGet│ ├── test/ # Tests unitaires```



### 3. C'est tout !



Le plugin `@nx/dotnet` détecte automatiquement le nouveau projet :Éditez `packages/newlib/src/Seedwork.NewLib.csproj` :---



```bash

npx nx show projects  # Devrait lister Seedwork.NewLib

``````xml│ │ └── Seedwork.Core.Tests.csproj



### 4. Créer la première version<PropertyGroup>



```bash  <!-- NuGet Package Metadata -->## 📦 Exemple : Seedwork.Core

# Créer le tag initial

git tag "Seedwork.NewLib@v0.1.0"  <PackageId>Seedwork.NewLib</PackageId>



# Puis faire des commits et releases normalement  <Title>Seedwork New Library</Title>│ └── project.json # Configuration NxUse the plugin's generator to create new projects. For example, to create a new React app or library:

git commit -m "feat(newlib): initial implementation"

npx nx release  <Description>Description de votre bibliothèque</Description>

```

  <PackageTags>ddd;domain-driven-design;csharp</PackageTags>Le workspace inclut une bibliothèque exemple complète :

## 🔄 CI/CD avec GitHub Actions

  <IsPackable>true</IsPackable>

Le workflow `.github/workflows/ci-cd.yml` s'exécute automatiquement :

</PropertyGroup>├── tools/ # Scripts de build/test/pack

### Sur chaque push/PR



- ✅ Compile tous les projets

- ✅ Exécute tous les tests<ItemGroup>````csharp

- ✅ Upload les artefacts

  <None Include="README.md" Pack="true" PackagePath="\" />

### Sur la branche main

</ItemGroup>using Seedwork.Core;│   ├── build.ps1```sh

- ✅ Crée automatiquement les releases avec nx release

- ✅ Génère les changelogs`````

- ✅ Crée les tags Git (format `{project}@v{version}`)

- ✅ Build et pack les packages avec la bonne version### 3. C'est tout !

- ✅ Publie sur NuGet.org

// Définir une entité│ ├── test.ps1# Generate an app

### Configuration requise

Le plugin `@nx/dotnet` détecte automatiquement les nouveaux projets. Vérifiez avec :

Ajoutez le secret `NUGET_API_KEY` dans GitHub :

public class Order : Entity<Guid>

1. Settings > Secrets and variables > Actions

2. New repository secret```bash

3. Name: `NUGET_API_KEY`

4. Value: votre clé API NuGetnpx nx show projects{│   ├── pack.ps1npx nx g @nx/react:app demo



## 📚 Documentation complète```



| Document | Description |    public decimal Total { get; private set; }

|----------|-------------|

| [📝 NX_RELEASE.md](docs/NX_RELEASE.md) | Guide complet d'utilisation de nx release |Puis utilisez les commandes Nx normalement :

| [🚀 GETTING_STARTED.md](GETTING_STARTED.md) | Guide pour démarrer |

| [🏗️ PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) | Architecture détaillée |    public OrderStatus Status { get; private set; }│   └── publish.ps1

| [✨ BEST_PRACTICES.md](BEST_PRACTICES.md) | Standards de code |

```bash

## 🔗 Ressources

npx nx build Seedwork.NewLib

- [Nx Documentation](https://nx.dev)

- [Plugin @nx/dotnet](https://nx.dev/docs/technologies/dotnet/introduction)npx nx test Seedwork.NewLib.Tests

- [Nx Release](https://nx.dev/features/manage-releases)

- [Conventional Commits](https://www.conventionalcommits.org/)npx nx pack Seedwork.NewLib    public Order(Guid id, decimal total) : base(id)├── .github/workflows/         # CI/CD GitHub Actions# Generate a library

- [NuGet Documentation](https://docs.microsoft.com/nuget/)

```

## 📄 Licence

    {

MIT

## 🏷️ Versioning sémantique

---

        Total = total;├── Directory.Build.props      # Propriétés communes .NETnpx nx g @nx/react:lib some-lib

**Prêt à créer vos bibliothèques .NET ? Consultez [GETTING_STARTED.md](GETTING_STARTED.md) !** 🚀

Le versioning est géré automatiquement par **GitVersion** basé sur les commits conventionnels :

        Status = OrderStatus.Pending;

### Format des commits

    }├── GitVersion.yml             # Configuration du versioning```

- `feat: nouvelle fonctionnalité` → incrémente la version mineure (1.0.0 → 1.1.0)

- `fix: correction de bug` → incrémente le patch (1.0.0 → 1.0.1)

- `BREAKING CHANGE:` dans le corps du commit → incrémente la version majeure (1.0.0 → 2.0.0)

  public void MarkAsPaid()├── SeedworkDotnet.sln # Solution .NET

### Branches et versions

    {

- **main** : versions de production (1.0.0, 1.0.1, etc.)

- **develop** : versions alpha (1.1.0-alpha.1, 1.1.0-alpha.2, etc.) Status = OrderStatus.Paid;└── nx.json # Configuration NxYou can use `npx nx list` to get a list of installed plugins. Then, run `npx nx list <plugin-name>` to learn about more specific capabilities of a particular plugin. Alternatively, [install Nx Console](https://nx.dev/getting-started/editor-setup?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) to browse plugins and generators in your IDE.

- **feature/\*** : versions avec nom de branche (1.1.0-alpha.feature-name.1)

- **release/\*** : versions beta (1.1.0-beta.1) }

- **hotfix/\*** : correctifs urgents

}```

### Vérifier la version actuelle

```bash

dotnet-gitversion// Utiliser[Learn more about Nx plugins &raquo;](https://nx.dev/concepts/nx-plugins?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) | [Browse the plugin registry &raquo;](https://nx.dev/plugin-registry?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

```

var order = new Order(Guid.NewGuid(), 99.99m);

## 🔄 CI/CD avec GitHub Actions

order.MarkAsPaid();## 🎯 Commandes principales

Le workflow `.github/workflows/ci-cd.yml` s'exécute automatiquement :

```````

### Sur chaque push/PR

## Set up CI!

- ✅ Compile tous les projets

- ✅ Exécute tous les tests---

- ✅ Crée les packages NuGet

- ✅ Upload les artefacts### Build

### Sur la branche main ou lors d'une release## 🏗️ Structure du projet

- ✅ Publie automatiquement sur NuGet.org### Step 1

### Configuration requise````

Ajoutez le secret `NUGET_API_KEY` dans GitHub :seedwork-dotnet/```bash

1. Settings > Secrets and variables > Actions├── packages/ # Vos bibliothèques .NET

2. New repository secret

3. Name: `NUGET_API_KEY`│ └── core/ # Exemple : Seedwork.Core# Compiler tous les projetsTo connect to Nx Cloud, run the following command:

4. Value: votre clé API NuGet

│ ├── src/ # Code source

## 📚 Documentation complète

│ ├── test/ # Tests unitairesnpm run build

| Guide | Description |

|-------|-------------|│ └── project.json # Config Nx

| **[🚀 Getting Started](GETTING_STARTED.md)** | Guide complet pour démarrer |

| **[🏗️ Project Structure](PROJECT_STRUCTURE.md)** | Architecture détaillée du workspace |│```sh

| **[✨ Best Practices](BEST_PRACTICES.md)** | Standards de code et conventions |

├── tools/ # Scripts PowerShell

## 🔗 Ressources

│ ├── build.ps1# Compiler un projet spécifiquenpx nx connect

- [Nx Documentation](https://nx.dev)

- [Plugin @nx/dotnet](https://nx.dev/docs/technologies/dotnet/introduction)│ ├── test.ps1

- [GitVersion Documentation](https://gitversion.net/)

- [Conventional Commits](https://www.conventionalcommits.org/)│ ├── pack.ps1npx nx build core```

- [NuGet Documentation](https://docs.microsoft.com/nuget/)

│ └── publish.ps1

## 📄 Licence

│```

MIT

├── .github/workflows/ # CI/CD GitHub Actions

---

├── Directory.Build.props # Propriétés communes .NETConnecting to Nx Cloud ensures a [fast and scalable CI](https://nx.dev/ci/intro/why-nx-cloud?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) pipeline. It includes features such as:

**Prêt à créer vos bibliothèques .NET ? Consultez [GETTING_STARTED.md](GETTING_STARTED.md) !** 🚀

├── GitVersion.yml # Configuration du versioning

└── nx.json # Configuration Nx### Tests

`````

- [Remote caching](https://nx.dev/ci/features/remote-cache?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

---

````bash- [Task distribution across multiple machines](https://nx.dev/ci/features/distribute-task-execution?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

## 🚀 Créer une nouvelle bibliothèque

# Exécuter tous les tests- [Automated e2e test splitting](https://nx.dev/ci/features/split-e2e-tasks?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

```bash

# 1. Créer les projets .NETnpm run test- [Task flakiness detection and rerunning](https://nx.dev/ci/features/flaky-tasks?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

dotnet new classlib -n Seedwork.MyLib -o packages/mylib/src -f net9.0

dotnet new xunit -n Seedwork.MyLib.Tests -o packages/mylib/test -f net9.0



# 2. Ajouter les références# Tester un projet spécifique### Step 2

cd packages/mylib/test

dotnet add reference ../src/Seedwork.MyLib.csprojnpx nx test core



# 3. Ajouter à la solution```Use the following command to configure a CI workflow for your workspace:

cd ../../..

dotnet sln add packages/mylib/src/Seedwork.MyLib.csproj

dotnet sln add packages/mylib/test/Seedwork.MyLib.Tests.csproj

### Package NuGet```sh

# 4. Créer project.json (voir Getting Started pour le template)

```npx nx g ci-workflow



Consultez [GETTING_STARTED.md](GETTING_STARTED.md) pour le guide complet.```bash```



---# Créer les packages NuGet pour tous les projets



## 🎯 Commandes principalesnpm run pack[Learn more about Nx on CI](https://nx.dev/ci/intro/ci-with-nx#ready-get-started-with-your-provider?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)



### Build et test



```bash# Créer le package pour un projet spécifique## Install Nx Console

# Build un projet spécifique

npx nx build corenpx nx pack core



# Test un projet spécifique```Nx Console is an editor extension that enriches your developer experience. It lets you run tasks, generate code, and improves code autocompletion in your IDE. It is available for VSCode and IntelliJ.

npx nx test core



# Build tous les projets

npm run buildLes packages sont créés dans `dist/packages/`.[Install Nx Console &raquo;](https://nx.dev/getting-started/editor-setup?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)



# Test tous les projets

npm run test

### Publication sur NuGet## Useful links

# Build uniquement les projets modifiés

npx nx affected --target=build

````

````bashLearn more:

### Packaging

# Définir la clé API NuGet

```bash

# Créer le package d'un projet$env:NUGET_API_KEY = "votre-clé-api"- [Learn more about this workspace setup](https://nx.dev/getting-started/intro#learn-nx?utm_source=nx_project&amp;utm_medium=readme&amp;utm_campaign=nx_projects)

npx nx pack core

- [Learn about Nx on CI](https://nx.dev/ci/intro/ci-with-nx?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

# Créer tous les packages

npm run pack# Publier tous les packages- [Releasing Packages with Nx release](https://nx.dev/features/manage-releases?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)



# Publier sur NuGet (nécessite NUGET_API_KEY)npm run publish- [What are Nx plugins?](https://nx.dev/concepts/nx-plugins?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

npm run publish

````

### Visualisation# Publier un package spécifiqueAnd join the Nx community:

````bashnpx nx publish core- [Discord](https://go.nx.dev/community)

# Voir le graphe de dépendances

npx nx graph```- [Follow us on X](https://twitter.com/nxdevtools) or [LinkedIn](https://www.linkedin.com/company/nrwl)



# Voir les projets affectés par vos changements- [Our Youtube channel](https://www.youtube.com/@nxdevtools)

npx nx affected:graph

```## 🔧 Ajouter une nouvelle bibliothèque- [Our blog](https://nx.dev/blog?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)



---

### 1. Créer les projets .NET

## 🏷️ Versioning sémantique

```bash

Le versioning est **automatique** avec GitVersion et Conventional Commits :# Créer la bibliothèque

dotnet new classlib -n Seedwork.NewLib -o packages/newlib/src -f net8.0

```bash

# Nouvelle fonctionnalité → version mineure (1.0.0 → 1.1.0)# Créer les tests

git commit -m "feat: add ValueObject base class"dotnet new xunit -n Seedwork.NewLib.Tests -o packages/newlib/test -f net8.0



# Correction de bug → patch (1.0.0 → 1.0.1)# Ajouter la référence au projet de tests

git commit -m "fix: correct Entity equality"cd packages/newlib/test

dotnet add reference ../src/Seedwork.NewLib.csproj

# Breaking change → version majeure (1.0.0 → 2.0.0)

git commit -m "feat: redesign Entity API# Ajouter à la solution

cd ../../..

BREAKING CHANGE: constructor signature changed"dotnet sln add packages/newlib/src/Seedwork.NewLib.csproj

```dotnet sln add packages/newlib/test/Seedwork.NewLib.Tests.csproj

````

### Branches et versions

### 2. Configurer le fichier .csproj

- **main** → `1.0.0`, `1.0.1` (stable)

- **develop** → `1.1.0-alpha.1` (alpha)Éditez `packages/newlib/src/Seedwork.NewLib.csproj` :

- **feature/\*** → `1.1.0-alpha.feature-name.1`

- **release/\*** → `1.1.0-beta.1` (beta)```xml

<Project Sdk="Microsoft.NET.Sdk">

--- <PropertyGroup>

    <TargetFramework>net8.0</TargetFramework>

## 🔄 CI/CD avec GitHub Actions <ImplicitUsings>enable</ImplicitUsings>

    <Nullable>enable</Nullable>

Le workflow `.github/workflows/ci-cd.yml` s'exécute automatiquement :

    <!-- NuGet Package Metadata -->

### Sur chaque push/PR <PackageId>Seedwork.NewLib</PackageId>

- ✅ Compile tous les projets <Title>Seedwork New Library</Title>

- ✅ Exécute tous les tests avec couverture <Description>Description de votre bibliothèque</Description>

- ✅ Crée les packages NuGet <PackageTags>tag1;tag2;tag3</PackageTags>

- ✅ Upload les artefacts <IsPackable>true</IsPackable>

  </PropertyGroup>

### Sur main ou release

- ✅ Publie automatiquement sur NuGet.org <ItemGroup>

    <None Include="README.md" Pack="true" PackagePath="\" />

### Configuration requise </ItemGroup>

</Project>

Ajoutez le secret `NUGET_API_KEY` dans votre repository GitHub :```

1. Settings > Secrets and variables > Actions

2. New repository secret : `NUGET_API_KEY`### 3. Créer la configuration Nx

3. Valeur : votre clé API NuGet

Créez `packages/newlib/project.json` :

---

````json

## 📖 En savoir plus{

  "name": "newlib",

### Guides complets  "$schema": "../../../node_modules/nx/schemas/project-schema.json",

- 📘 **[Getting Started](GETTING_STARTED.md)** - Créez votre première bibliothèque  "projectType": "library",

- 🏗️ **[Project Structure](PROJECT_STRUCTURE.md)** - Comprendre l'architecture  "sourceRoot": "packages/newlib/src",

- ✨ **[Best Practices](BEST_PRACTICES.md)** - Standards et conventions  "targets": {

- 🎉 **[Setup Complete](SETUP_COMPLETE.md)** - Vérifier votre configuration    "build": {

      "executor": "nx:run-commands",

### Technologies utilisées      "options": {

- **[Nx](https://nx.dev)** - Build system intelligent        "command": "pwsh -File {workspaceRoot}/tools/build.ps1 -ProjectPath {projectRoot}/src/Seedwork.NewLib.csproj -Configuration Release",

- **[.NET 9](https://dotnet.microsoft.com/)** - Framework de développement        "cwd": "{workspaceRoot}"

- **[GitVersion](https://gitversion.net/)** - Versioning sémantique      }

- **[xUnit](https://xunit.net/)** - Framework de tests    },

    "test": {

### Concepts Domain-Driven Design      "executor": "nx:run-commands",

- **Entity** : Objet avec identité unique      "options": {

- **Value Object** : Objet défini par ses valeurs        "command": "pwsh -File {workspaceRoot}/tools/test.ps1 -ProjectPath {projectRoot}/test/Seedwork.NewLib.Tests.csproj",

- **Aggregate Root** : Point d'entrée d'un cluster d'objets        "cwd": "{workspaceRoot}"

- **Domain Event** : Événement métier significatif      },

      "dependsOn": ["build"]

---    },

    "pack": {

## 🤝 Contribution      "executor": "nx:run-commands",

      "options": {

Les contributions sont les bienvenues ! Voici comment participer :        "command": "pwsh -File {workspaceRoot}/tools/pack.ps1 -ProjectPath {projectRoot}/src/Seedwork.NewLib.csproj -OutputPath {workspaceRoot}/dist/packages",

        "cwd": "{workspaceRoot}"

1. **Fork** le projet      },

2. **Créer** une branche feature (`git checkout -b feature/amazing-feature`)      "dependsOn": ["build", "test"]

3. **Commit** vos changements (`git commit -m 'feat: add amazing feature'`)    },

4. **Push** vers la branche (`git push origin feature/amazing-feature`)    "publish": {

5. **Ouvrir** une Pull Request      "executor": "nx:run-commands",

      "options": {

Consultez [BEST_PRACTICES.md](BEST_PRACTICES.md) pour les conventions de code.        "command": "pwsh -File {workspaceRoot}/tools/publish.ps1 -PackagePath {workspaceRoot}/dist/packages",

        "cwd": "{workspaceRoot}"

---      },

      "dependsOn": ["pack"]

## 📄 Licence    }

  },

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.  "tags": ["type:library"]

}

---```



## 🙏 Remerciements### 4. Créer un README pour le package



- [Nx Team](https://nx.dev) pour l'excellent build systemCréez `packages/newlib/src/README.md` avec la documentation de votre bibliothèque.

- [GitVersion](https://gitversion.net/) pour le versioning automatique

- La communauté .NET pour les outils et frameworks## 🏷️ Versioning sémantique



---Le versioning est géré automatiquement par **GitVersion** basé sur les commits conventionnels :



**Prêt à créer vos bibliothèques .NET ? Consultez [GETTING_STARTED.md](GETTING_STARTED.md) !** 🚀### Format des commits


- `feat: nouvelle fonctionnalité` → incrémente la version mineure (1.0.0 → 1.1.0)
- `fix: correction de bug` → incrémente le patch (1.0.0 → 1.0.1)
- `BREAKING CHANGE:` dans le corps du commit → incrémente la version majeure (1.0.0 → 2.0.0)

### Branches

- **main** : versions de production (1.0.0, 1.0.1, etc.)
- **develop** : versions alpha (1.1.0-alpha.1, 1.1.0-alpha.2, etc.)
- **feature/*** : versions avec nom de branche (1.1.0-alpha.feature-name.1)
- **release/*** : versions beta (1.1.0-beta.1)
- **hotfix/*** : correctifs urgents

### Vérifier la version actuelle

```bash
dotnet-gitversion
````

## 🔄 CI/CD avec GitHub Actions

Le workflow `.github/workflows/ci-cd.yml` s'exécute automatiquement :

### Sur chaque push/PR

- Compile tous les projets
- Exécute tous les tests
- Crée les packages NuGet
- Upload les artefacts

### Sur la branche main ou lors d'une release

- Publie automatiquement sur NuGet.org

### Configuration requise

Ajoutez le secret `NUGET_API_KEY` dans GitHub :

1. Settings > Secrets and variables > Actions
2. New repository secret
3. Name: `NUGET_API_KEY`
4. Value: votre clé API NuGet

## 📚 Ressources

- [Nx Documentation](https://nx.dev)
- [GitVersion Documentation](https://gitversion.net/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [NuGet Documentation](https://docs.microsoft.com/nuget/)

## 📄 Licence

MIT
`````
