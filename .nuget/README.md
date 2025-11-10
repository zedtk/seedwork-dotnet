# Configuration NuGet

## Variables d'environnement requises

Pour publier automatiquement sur NuGet, vous devez configurer la variable d'environnement suivante :

### NUGET_API_KEY

Votre clé API NuGet pour publier des packages.

**Obtenir une clé API :**

1. Connectez-vous sur [nuget.org](https://www.nuget.org)
2. Allez dans "API Keys" dans votre profil
3. Créez une nouvelle clé avec les permissions "Push"
4. Copiez la clé

**Configuration locale :**

```powershell
# PowerShell
$env:NUGET_API_KEY = "your-api-key-here"

# Pour persister dans le profil PowerShell
Add-Content $PROFILE "`n`$env:NUGET_API_KEY = 'your-api-key-here'"
```

**Configuration dans GitHub Actions :**

1. Allez dans Settings > Secrets and variables > Actions
2. Créez un nouveau secret nommé `NUGET_API_KEY`
3. Collez votre clé API NuGet

## Configuration du fichier nuget.config

Si vous utilisez un feed NuGet privé, créez un fichier `nuget.config` :

```xml
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <packageSources>
    <clear />
    <add key="nuget.org" value="https://api.nuget.org/v3/index.json" protocolVersion="3" />
    <!-- Ajoutez vos sources privées ici -->
  </packageSources>
</configuration>
```

## Publication manuelle

Pour publier manuellement un package :

```powershell
# Définir la clé API
$env:NUGET_API_KEY = "your-api-key-here"

# Publier tous les packages
npm run publish

# Ou publier un package spécifique
dotnet nuget push "dist/packages/YourPackage.1.0.0.nupkg" `
    --api-key $env:NUGET_API_KEY `
    --source https://api.nuget.org/v3/index.json
```

## Publication automatique via CI/CD

Le workflow GitHub Actions (`.github/workflows/ci-cd.yml`) publie automatiquement :

- Sur la branche `main` : packages de production
- Sur les tags de release : packages de production avec version finale
- Sur la branche `develop` : packages alpha/beta

Les packages sont publiés uniquement si tous les tests passent.
