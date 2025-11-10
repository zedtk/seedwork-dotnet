# Meilleures Pratiques - Seedwork .NET

Guide des meilleures pratiques pour le développement et la maintenance de bibliothèques .NET dans ce workspace.

## 🎯 Philosophie

### Principes DDD (Domain-Driven Design)

Les bibliothèques Seedwork fournissent des **building blocks** réutilisables pour implémenter le DDD :

- **Entity** : Objets avec identité
- **Value Object** : Objets sans identité, définis par leurs valeurs
- **Aggregate Root** : Point d'entrée d'un agrégat
- **Domain Event** : Événements métier
- **Repository** : Abstraction pour la persistance

### Design API-First

Avant d'écrire du code :

1. Définissez l'API publique
2. Écrivez la documentation
3. Créez les tests
4. Implémentez le code

## 📝 Code Quality

### 1. Types nullables

Toujours activer les nullable reference types :

```xml
<!-- Dans le .csproj -->
<PropertyGroup>
  <Nullable>enable</Nullable>
</PropertyGroup>
```

```csharp
// ✅ Bon
public class Entity<TId> where TId : notnull
{
    public TId Id { get; protected set; }

    protected Entity(TId id)
    {
        Id = id ?? throw new ArgumentNullException(nameof(id));
    }
}

// ❌ Mauvais
public class Entity<TId>
{
    public TId Id; // Pas de protection contre null
}
```

### 2. Immutabilité

Préférez l'immutabilité quand c'est possible :

```csharp
// ✅ Bon - Value Object immutable
public class Money : ValueObject
{
    public decimal Amount { get; }
    public string Currency { get; }

    public Money(decimal amount, string currency)
    {
        Amount = amount;
        Currency = currency;
    }

    public Money Add(Money other)
    {
        if (Currency != other.Currency)
            throw new InvalidOperationException("Cannot add different currencies");

        return new Money(Amount + other.Amount, Currency);
    }
}

// ❌ Mauvais - Value Object mutable
public class Money
{
    public decimal Amount { get; set; } // Mutable !
    public string Currency { get; set; }
}
```

### 3. Validation

Validez toujours dans le constructeur :

```csharp
// ✅ Bon
public class Email : ValueObject
{
    public string Value { get; }

    public Email(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
            throw new ArgumentException("Email cannot be empty", nameof(value));

        if (!value.Contains("@"))
            throw new ArgumentException("Invalid email format", nameof(value));

        Value = value.Trim().ToLowerInvariant();
    }
}

// ❌ Mauvais - Pas de validation
public class Email
{
    public string Value { get; set; }
}
```

### 4. Documentation XML

Documentez toutes les API publiques :

```csharp
/// <summary>
/// Represents a domain entity with a strongly-typed identifier.
/// </summary>
/// <typeparam name="TId">The type of the entity identifier.</typeparam>
/// <remarks>
/// Entities are objects that have a distinct identity that runs through time and different states.
/// Two entities with the same identifier are considered the same entity, even if their properties differ.
/// </remarks>
/// <example>
/// <code>
/// public class Order : Entity&lt;OrderId&gt;
/// {
///     public Order(OrderId id) : base(id) { }
/// }
/// </code>
/// </example>
public abstract class Entity<TId> : IEquatable<Entity<TId>>
    where TId : notnull
{
    /// <summary>
    /// Gets the unique identifier of the entity.
    /// </summary>
    public TId Id { get; protected set; }

    /// <summary>
    /// Initializes a new instance of the entity with the specified identifier.
    /// </summary>
    /// <param name="id">The unique identifier. Cannot be null.</param>
    /// <exception cref="ArgumentNullException">Thrown when <paramref name="id"/> is null.</exception>
    protected Entity(TId id)
    {
        Id = id ?? throw new ArgumentNullException(nameof(id));
    }
}
```

## 🧪 Tests

### Structure des tests

```csharp
[Fact]
public void MethodName_Scenario_ExpectedResult()
{
    // Arrange - Préparer les données
    var id = Guid.NewGuid();
    var entity = new TestEntity(id);

    // Act - Exécuter l'action
    var result = entity.DoSomething();

    // Assert - Vérifier le résultat
    Assert.NotNull(result);
    Assert.Equal(expected, result);
}
```

### Couverture de code

Visez au minimum 80% de couverture :

```bash
# Exécuter avec couverture
npx nx test core --coverage

# Voir le rapport
start packages/core/test/TestResults/coverage/index.html
```

### Tests paramétrés

Utilisez `[Theory]` pour tester plusieurs cas :

```csharp
[Theory]
[InlineData("", false)]
[InlineData("invalid", false)]
[InlineData("test@example.com", true)]
[InlineData("test@example.co.uk", true)]
public void Email_Validation_Should_Work(string email, bool isValid)
{
    // Act & Assert
    if (isValid)
    {
        var result = new Email(email);
        Assert.NotNull(result);
    }
    else
    {
        Assert.Throws<ArgumentException>(() => new Email(email));
    }
}
```

## 📦 Packages NuGet

### Métadonnées

Remplissez toutes les métadonnées importantes :

```xml
<PropertyGroup>
  <!-- Identité -->
  <PackageId>Seedwork.Core</PackageId>
  <Version>1.0.0</Version>
  <Title>Seedwork Core Library</Title>

  <!-- Description -->
  <Description>
    Core building blocks for Domain-Driven Design applications.
    Provides base classes for Entities, Value Objects, and more.
  </Description>
  <PackageTags>ddd;domain-driven-design;seedwork;patterns;entity;value-object</PackageTags>

  <!-- Auteur et licence -->
  <Authors>Your Name</Authors>
  <Company>Your Company</Company>
  <Copyright>Copyright © Your Company 2024</Copyright>
  <PackageLicenseExpression>MIT</PackageLicenseExpression>

  <!-- Liens -->
  <PackageProjectUrl>https://github.com/yourorg/seedwork-dotnet</PackageProjectUrl>
  <RepositoryUrl>https://github.com/yourorg/seedwork-dotnet</RepositoryUrl>
  <RepositoryType>git</RepositoryType>
  <PackageReadmeFile>README.md</PackageReadmeFile>

  <!-- Documentation -->
  <GenerateDocumentationFile>true</GenerateDocumentationFile>

  <!-- Symboles pour debugging -->
  <IncludeSymbols>true</IncludeSymbols>
  <SymbolPackageFormat>snupkg</SymbolPackageFormat>
  <EmbedUntrackedSources>true</EmbedUntrackedSources>
</PropertyGroup>
```

### README du package

Chaque package doit avoir un README.md complet :

```markdown
# Seedwork.Core

Brief description of what this package does.

## Installation

\`\`\`bash
dotnet add package Seedwork.Core
\`\`\`

## Quick Start

\`\`\`csharp
using Seedwork.Core;

public class MyEntity : Entity<Guid>
{
public MyEntity(Guid id) : base(id) { }
}
\`\`\`

## Features

- Feature 1
- Feature 2
- Feature 3

## Documentation

Full documentation: https://your-docs-site.com

## License

MIT
```

### Versioning sémantique

Respectez [Semantic Versioning 2.0](https://semver.org/) :

- **MAJOR** (1.0.0 → 2.0.0) : Breaking changes
- **MINOR** (1.0.0 → 1.1.0) : Nouvelles fonctionnalités (backward compatible)
- **PATCH** (1.0.0 → 1.0.1) : Corrections de bugs

### Changelog

Maintenez un CHANGELOG.md par package :

```markdown
# Changelog

## [1.1.0] - 2024-01-15

### Added

- New ValueObject base class
- Support for multi-valued properties

### Changed

- Entity.Id is now protected set instead of private set

### Fixed

- Fixed equality comparison when Id is null

## [1.0.0] - 2024-01-01

### Added

- Initial release
- Entity base class
```

## 🔒 Sécurité

### 1. Ne jamais committer de secrets

```bash
# .gitignore doit contenir
*.user
*.suo
appsettings.*.json
.env
*.pfx
*.key
```

### 2. Dépendances

Gardez les dépendances à jour :

```bash
# Vérifier les packages obsolètes
dotnet list package --outdated

# Mettre à jour
dotnet add package PackageName
```

### 3. Vulnérabilités

Utilisez l'analyse de sécurité :

```bash
# Analyser les vulnérabilités
dotnet list package --vulnerable
```

## 🚀 Performance

### 1. Éviter les allocations inutiles

```csharp
// ✅ Bon - Réutilise le tableau
private static readonly object[] EmptyArray = Array.Empty<object>();

protected override IEnumerable<object> GetEqualityComponents()
{
    if (HasNoProperties)
        return EmptyArray;

    return GetEqualityComponentsCore();
}

// ❌ Mauvais - Nouvelle allocation à chaque appel
protected override IEnumerable<object> GetEqualityComponents()
{
    return new object[0]; // Allocation !
}
```

### 2. Utiliser Span<T> pour les performances

```csharp
// ✅ Bon - Pas d'allocation
public bool StartsWith(ReadOnlySpan<char> prefix)
{
    return Value.AsSpan().StartsWith(prefix);
}

// ❌ Moins performant
public bool StartsWith(string prefix)
{
    return Value.StartsWith(prefix); // Peut créer des sous-chaînes
}
```

### 3. Benchmark

Utilisez BenchmarkDotNet pour mesurer :

```csharp
[MemoryDiagnoser]
public class EntityBenchmarks
{
    private Entity<Guid> _entity1;
    private Entity<Guid> _entity2;

    [GlobalSetup]
    public void Setup()
    {
        var id = Guid.NewGuid();
        _entity1 = new TestEntity(id);
        _entity2 = new TestEntity(id);
    }

    [Benchmark]
    public bool CompareEntities()
    {
        return _entity1.Equals(_entity2);
    }
}
```

## 🔄 Workflow Git

### Branches

```
main              ← Production (versions stables)
  │
  ├─ develop      ← Développement (versions alpha)
  │   │
  │   ├─ feature/add-value-object  ← Nouvelles fonctionnalités
  │   ├─ feature/add-aggregate
  │   └─ bugfix/fix-entity-equality
  │
  └─ release/1.0  ← Préparation release (versions beta)
      └─ hotfix/security-fix       ← Correctifs urgents
```

### Commits

Format Conventional Commits :

```bash
# Nouvelle fonctionnalité
git commit -m "feat(core): add ValueObject base class"

# Correction de bug
git commit -m "fix(core): correct Entity equality comparison"

# Breaking change
git commit -m "feat(core): change Entity constructor signature

BREAKING CHANGE: Entity now requires Id to be non-null at construction"

# Documentation
git commit -m "docs(core): improve Entity XML documentation"

# Tests
git commit -m "test(core): add tests for Entity equality"

# Refactoring
git commit -m "refactor(core): simplify Entity GetHashCode implementation"

# Performance
git commit -m "perf(core): optimize Entity equality check"
```

### Pull Requests

Template de PR :

```markdown
## Description

Brief description of changes

## Type of change

- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Checklist

- [ ] My code follows the style guidelines of this project
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
- [ ] Any dependent changes have been merged and published

## Related Issues

Closes #123
```

## 📊 Monitoring

### Build Health

Surveillez la santé de vos builds :

```bash
# Temps de build
npx nx build core --verbose

# Cache hits
# Regardez les logs Nx pour voir les % de cache

# Tests flaky
# Identifiez les tests instables dans les rapports CI
```

### Package Health

- **Download counts** : Suivez sur NuGet.org
- **Dependencies** : Minimisez les dépendances externes
- **Size** : Gardez les packages légers

## 🎓 Formation continue

### Resources

- **Documentation .NET** : https://docs.microsoft.com/dotnet/
- **DDD Reference** : https://www.domainlanguage.com/ddd/reference/
- **Clean Architecture** : https://blog.cleancoder.com/
- **Nx Docs** : https://nx.dev

### Code Reviews

Checklist pour les revues de code :

- [ ] Le code suit les conventions du projet
- [ ] Tests unitaires présents et passants
- [ ] Documentation XML à jour
- [ ] README mis à jour si nécessaire
- [ ] Pas de breaking changes sans version majeure
- [ ] Pas de dépendances inutiles
- [ ] Performance acceptable
- [ ] Sécurité vérifiée

## 📋 Checklist avant release

- [ ] Tous les tests passent
- [ ] Documentation à jour
- [ ] CHANGELOG.md mis à jour
- [ ] README.md vérifié
- [ ] Pas de TODOs dans le code
- [ ] Version correcte dans GitVersion
- [ ] Build CI/CD passé
- [ ] Code review approuvée
- [ ] Breaking changes documentés

## 🆘 Support

- **Issues** : Utilisez GitHub Issues pour les bugs
- **Discussions** : GitHub Discussions pour les questions
- **Pull Requests** : Contributions bienvenues !

Bon développement ! 💪
