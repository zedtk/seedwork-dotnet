# Seedwork.Core

Bibliothèque de base contenant les building blocks pour le Domain-Driven Design (DDD).

## Installation

```bash
dotnet add package Seedwork.Core
```

## Utilisation

Cette bibliothèque fournit des abstractions et des classes de base pour implémenter des patterns DDD :

- **Entity** : Classe de base pour les entités du domaine
- **ValueObject** : Classe de base pour les value objects
- **AggregateRoot** : Classe de base pour les racines d'agrégats
- **DomainEvent** : Classe de base pour les événements de domaine

## Exemple

```csharp
using Seedwork.Core;

public class Product : Entity<Guid>
{
    public string Name { get; private set; }
    public Money Price { get; private set; }

    public Product(Guid id, string name, Money price) : base(id)
    {
        Name = name;
        Price = price;
    }
}
```

## Licence

MIT
