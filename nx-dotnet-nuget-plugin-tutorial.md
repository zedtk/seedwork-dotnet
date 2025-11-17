# Create a Local Nx Plugin for .NET NuGet Publishing

This tutorial guides you through creating a local Nx plugin that automatically creates `nuget-publish` targets for all .NET projects (excluding test projects) in your workspace.

**✅ Tested with Nx 22.x**

## Prerequisites

- An existing Nx workspace with .NET projects
- Node.js 18.x or higher and npm/yarn/pnpm installed
- .NET SDK 8.0 or higher installed
- Basic knowledge of TypeScript

## Overview

By the end of this tutorial, your plugin will:
- ✅ Automatically detect all non-test .csproj files
- ✅ Create `nuget-publish` targets for each project
- ✅ Support dry-run mode for testing
- ✅ Handle API keys securely via environment variables
- ✅ Work alongside the `@nx/dotnet` plugin

---

## Step 1: Configure TypeScript for Plugin Development

Since your workspace is .NET-focused, you likely don't have TypeScript configured. Let's set it up for plugin development only.

### 1.1 Install Required Dependencies

```bash
npm install -D typescript @nx/js @nx/plugin @swc-node/register @swc/core @types/node
```

**What this installs:**
- `typescript`: TypeScript compiler
- `@nx/js`: Nx JavaScript/TypeScript support
- `@nx/plugin`: Nx plugin development tools
- `@swc-node/register`, `@swc/core`: Fast TypeScript transpilation
- `@types/node`: Node.js type definitions

### 1.2 Create Root TypeScript Configuration

Create `tsconfig.base.json` in your workspace root:

```json
{
  "compileOnSave": false,
  "compilerOptions": {
    "rootDir": ".",
    "sourceMap": true,
    "declaration": false,
    "moduleResolution": "node",
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "importHelpers": true,
    "target": "ES2021",
    "module": "commonjs",
    "lib": ["ES2021"],
    "skipLibCheck": true,
    "skipDefaultLibCheck": true,
    "baseUrl": ".",
    "paths": {}
  },
  "exclude": ["node_modules", "tmp"]
}
```

### ✅ Verification Step 1

**Check TypeScript installation:**

```bash
# Verify TypeScript is installed
npx tsc --version
```

**Expected output:** `Version 5.x.x` or higher

```bash
# Verify Nx plugin package is available
npx nx list @nx/plugin
```

**Expected output:** Shows `@nx/plugin` is installed

**Troubleshooting:**
- If `tsc` command not found: Run `npm install` again
- If `@nx/plugin` not found: Install it explicitly with `npm install -D @nx/plugin`

---

## Step 2: Generate the Plugin Structure

### 2.1 Generate the Plugin

Run the following command to create a new plugin:

```bash
npx nx g @nx/plugin:plugin tools/nuget-publish-plugin
```

**When prompted:**
- Project name: `nuget-publish-plugin`
- Which unit test runner would you like to use?: Choose `jest` (or skip with `none`)
- Which e2e test runner would you like to use?: Choose `none`

**What this creates:**
```
tools/
└── nuget-publish-plugin/
    ├── src/
    │   ├── index.ts
    │   ├── executors/
    │   └── generators/
    ├── package.json
    ├── project.json
    ├── tsconfig.json
    ├── tsconfig.lib.json
    ├── executors.json
    └── generators.json
```

### ✅ Verification Step 2

**Verify plugin structure:**

```bash
# Check plugin directory exists
ls -la tools/nuget-publish-plugin/

# Check package.json has correct name
cat tools/nuget-publish-plugin/package.json | grep name
```

**Expected output:**
```
drwxr-xr-x  src/
-rw-r--r--  package.json
-rw-r--r--  project.json
...
"name": "@<your-org>/nuget-publish-plugin"
```

**Check the plugin is recognized:**

```bash
npx nx list
```

**Expected output:** Your plugin should appear under "Local workspace plugins"

**Troubleshooting:**
- If plugin doesn't show up, check that `tsconfig.base.json` includes a path mapping
- Run `npx nx reset` to clear cache and try again

---

## Step 3: Create the NuGet Publish Executor

### 3.1 Generate the Executor

```bash
npx nx g @nx/plugin:executor nuget-publish --project=nuget-publish-plugin --directory=src/executors/nuget-publish
```

**When prompted:**
- Unit test runner: `jest` (or skip)

This creates:
```
tools/nuget-publish-plugin/src/executors/nuget-publish/
├── executor.ts
├── executor.spec.ts
├── schema.json
└── schema.d.ts
```

### 3.2 Update the Executor Schema

Replace the contents of `tools/nuget-publish-plugin/src/executors/nuget-publish/schema.json`:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "version": 2,
  "title": "NuGet Publish Executor",
  "description": "Publish a NuGet package to a feed",
  "type": "object",
  "properties": {
    "projectPath": {
      "type": "string",
      "description": "Path to the .csproj file (relative to workspace root)"
    },
    "source": {
      "type": "string",
      "description": "NuGet source URL",
      "default": "https://api.nuget.org/v3/index.json"
    },
    "apiKey": {
      "type": "string",
      "description": "NuGet API key (can be set via NUGET_API_KEY env variable)"
    },
    "dryRun": {
      "type": "boolean",
      "description": "If true, copy package to local test feed instead of publishing",
      "default": false
    },
    "configuration": {
      "type": "string",
      "description": "Build configuration (Debug or Release)",
      "default": "Release",
      "enum": ["Debug", "Release"]
    },
    "skipBuild": {
      "type": "boolean",
      "description": "Skip building the project before packing",
      "default": false
    },
    "outputPath": {
      "type": "string",
      "description": "Override the default output path for the package"
    }
  },
  "required": ["projectPath"]
}
```

### 3.3 Update the Schema TypeScript Interface

Replace `tools/nuget-publish-plugin/src/executors/nuget-publish/schema.d.ts`:

```typescript
export interface NugetPublishExecutorSchema {
  projectPath: string;
  source?: string;
  apiKey?: string;
  dryRun?: boolean;
  configuration?: string;
  skipBuild?: boolean;
  outputPath?: string;
}
```

### 3.4 Implement the Executor Logic

Replace `tools/nuget-publish-plugin/src/executors/nuget-publish/executor.ts`:

```typescript
import { ExecutorContext, logger } from '@nx/devkit';
import { execSync } from 'child_process';
import { join, dirname, basename } from 'path';
import { existsSync, mkdirSync, readdirSync, copyFileSync } from 'fs';
import { NugetPublishExecutorSchema } from './schema';

export default async function runExecutor(
  options: NugetPublishExecutorSchema,
  context: ExecutorContext
): Promise<{ success: boolean }> {
  const projectName = context.projectName;
  const projectConfig = context.projectsConfigurations?.projects[projectName];
  
  if (!projectConfig) {
    logger.error(`Project ${projectName} not found in workspace`);
    return { success: false };
  }

  const projectRoot = projectConfig.root;
  const workspaceRoot = context.root;
  const projectPath = join(workspaceRoot, options.projectPath);

  logger.info(`📦 Publishing NuGet package for ${projectName}...`);
  logger.info(`   Project: ${projectPath}`);
  logger.info(`   Configuration: ${options.configuration || 'Release'}`);

  try {
    // Step 1: Pack the project
    logger.info('');
    logger.info('Step 1/2: Creating NuGet package...');
    
    const configuration = options.configuration || 'Release';
    const packArgs = [
      'dotnet pack',
      `"${projectPath}"`,
      `-c ${configuration}`,
      options.skipBuild ? '--no-build' : '',
      options.outputPath ? `-o "${options.outputPath}"` : '',
    ].filter(Boolean);

    const packCommand = packArgs.join(' ');
    logger.info(`Running: ${packCommand}`);
    
    execSync(packCommand, {
      cwd: workspaceRoot,
      stdio: 'inherit',
    });

    // Step 2: Find the generated .nupkg file
    const outputPath = options.outputPath || join(workspaceRoot, projectRoot, 'bin', configuration);
    
    if (!existsSync(outputPath)) {
      throw new Error(`Package output path not found: ${outputPath}`);
    }

    const nupkgFiles = readdirSync(outputPath).filter((file: string) =>
      file.endsWith('.nupkg') && !file.endsWith('.symbols.nupkg')
    );

    if (nupkgFiles.length === 0) {
      throw new Error(`No .nupkg files found in ${outputPath}`);
    }

    // Use the most recent .nupkg file
    const nupkgPath = join(outputPath, nupkgFiles[nupkgFiles.length - 1]);
    logger.info(`✓ Package created: ${basename(nupkgPath)}`);

    // Step 3: Publish or dry-run
    logger.info('');
    logger.info('Step 2/2: Publishing package...');
    
    if (options.dryRun) {
      const localFeedPath = join(workspaceRoot, 'local-nuget-feed');
      
      if (!existsSync(localFeedPath)) {
        mkdirSync(localFeedPath, { recursive: true });
      }

      logger.info('🧪 DRY RUN MODE');
      logger.info(`   Would publish to: ${options.source || 'https://api.nuget.org/v3/index.json'}`);
      logger.info(`   Copying package to local feed: ${localFeedPath}`);
      
      copyFileSync(nupkgPath, join(localFeedPath, basename(nupkgPath)));
      
      logger.info('');
      logger.info('✅ Package copied to local feed successfully (dry-run mode)');
      logger.info(`   Local feed location: ${localFeedPath}`);
    } else {
      // Get API key from options or environment
      const apiKey = options.apiKey || process.env.NUGET_API_KEY;
      
      if (!apiKey) {
        throw new Error(
          '❌ API key is required for publishing.\n' +
          '   Provide via:\n' +
          '   - --apiKey flag\n' +
          '   - NUGET_API_KEY environment variable'
        );
      }

      const source = options.source || 'https://api.nuget.org/v3/index.json';
      
      const publishCommand = [
        'dotnet nuget push',
        `"${nupkgPath}"`,
        `--source ${source}`,
        `--api-key ${apiKey}`,
      ].join(' ');

      logger.info(`Publishing to: ${source}`);
      
      execSync(publishCommand, {
        cwd: workspaceRoot,
        stdio: 'inherit',
      });

      logger.info('');
      logger.info('✅ Package published successfully!');
    }

    return { success: true };
    
  } catch (error) {
    logger.error('');
    logger.error(`❌ Failed to publish NuGet package:`);
    logger.error(`   ${error.message}`);
    return { success: false };
  }
}
```

### 3.5 Build the Plugin

```bash
npx nx build nuget-publish-plugin
```

### ✅ Verification Step 3

**Check executor registration:**

```bash
# View executors.json
cat tools/nuget-publish-plugin/executors.json
```

**Expected output:**
```json
{
  "executors": {
    "nuget-publish": {
      "implementation": "./src/executors/nuget-publish/executor",
      "schema": "./src/executors/nuget-publish/schema.json",
      "description": "Publish a NuGet package to a feed"
    }
  }
}
```

**Check plugin builds without errors:**

```bash
npx nx build nuget-publish-plugin
```

**Expected output:** Build succeeds with no TypeScript errors

**Test executor directly (manual test):**

First, ensure you have at least one .NET library project. Then create a test target in one of your project's `project.json`:

```json
{
  "name": "my-test-library",
  "targets": {
    "test-nuget-publish": {
      "executor": "@<your-org>/nuget-publish-plugin:nuget-publish",
      "options": {
        "projectPath": "path/to/YourLibrary/YourLibrary.csproj",
        "dryRun": true,
        "configuration": "Debug"
      }
    }
  }
}
```

**Run the test:**

```bash
npx nx run my-test-library:test-nuget-publish
```

**Expected output:**
- ✓ Package created
- ✓ Package copied to local-nuget-feed/

**Troubleshooting:**
- If build fails: Check TypeScript errors in the output
- If executor not found: Run `npx nx reset` and rebuild
- If path errors: Verify the projectPath is relative to workspace root

---

## Step 4: Create the Project Inference Plugin

Now we'll create the plugin that automatically infers `nuget-publish` targets for all non-test .NET projects.

### 4.1 Update the Main Plugin File

Replace `tools/nuget-publish-plugin/src/index.ts` with:

```typescript
import {
  CreateNodesContextV2,
  CreateNodesV2,
  TargetConfiguration,
  createNodesFromFiles,
  joinPathFragments,
} from '@nx/devkit';
import { dirname } from 'path';
import { existsSync, readFileSync } from 'fs';

export interface NugetPublishPluginOptions {
  targetName?: string;
  source?: string;
  dryRun?: boolean;
  buildTargetName?: string;
}

// Glob pattern to find all .csproj files
const csprojGlob = '**/*.csproj';

// For Nx 22 compatibility: export both createNodes and createNodesV2
export const createNodesV2: CreateNodesV2<NugetPublishPluginOptions> = [
  csprojGlob,
  async (configFiles, options, context) => {
    return await createNodesFromFiles(
      (configFile, options, context) =>
        createNodesInternal(configFile, options, context),
      configFiles,
      options,
      context
    );
  },
];

// Nx 22 compatibility: createNodes uses v2 signature
export const createNodes = createNodesV2;

async function createNodesInternal(
  configFilePath: string,
  options: NugetPublishPluginOptions,
  context: CreateNodesContextV2
) {
  const projectRoot = dirname(configFilePath);
  
  // Skip if this is a test project
  if (isTestProject(configFilePath, context)) {
    return {};
  }

  // Check if this is an Nx project (has project.json or package.json)
  const hasProjectJson = existsSync(
    joinPathFragments(context.workspaceRoot, projectRoot, 'project.json')
  );
  const hasPackageJson = existsSync(
    joinPathFragments(context.workspaceRoot, projectRoot, 'package.json')
  );

  if (!hasProjectJson && !hasPackageJson) {
    // Not an Nx project, skip
    return {};
  }

  // Check if it's a library project (not an executable)
  if (!isLibraryProject(configFilePath, context)) {
    // Skip executables/web projects - they don't produce packages
    return {};
  }

  // Get configuration from plugin options
  const targetName = options.targetName ?? 'nuget-publish';
  const source = options.source ?? 'https://api.nuget.org/v3/index.json';
  const dryRun = options.dryRun ?? false;
  const buildTargetName = options.buildTargetName ?? 'build';

  // Create the publish target
  const publishTarget: TargetConfiguration = {
    executor: '@<your-org>/nuget-publish-plugin:nuget-publish',
    options: {
      projectPath: configFilePath,
      source: source,
      dryRun: dryRun,
    },
    configurations: {
      production: {
        configuration: 'Release',
        skipBuild: false,
        dryRun: false,
      },
      development: {
        configuration: 'Debug',
        dryRun: true,
      },
    },
    dependsOn: [buildTargetName],
    cache: true,
    inputs: [
      '{projectRoot}/**/*.cs',
      '{projectRoot}/**/*.csproj',
      '!{projectRoot}/bin/**',
      '!{projectRoot}/obj/**',
    ],
    outputs: ['{projectRoot}/bin/{options.configuration}/**/*.nupkg'],
  };

  return {
    projects: {
      [projectRoot]: {
        targets: {
          [targetName]: publishTarget,
        },
      },
    },
  };
}

/**
 * Check if a .csproj file represents a test project
 */
function isTestProject(
  csprojPath: string,
  context: CreateNodesContextV2
): boolean {
  const fullPath = joinPathFragments(context.workspaceRoot, csprojPath);
  
  // Check filename patterns
  const fileName = csprojPath.toLowerCase();
  if (
    fileName.includes('.test.') ||
    fileName.includes('.tests.') ||
    fileName.includes('.unittest.') ||
    fileName.includes('.integrationtest.')
  ) {
    return true;
  }

  // Check directory patterns
  const dirName = dirname(csprojPath).toLowerCase();
  if (
    dirName.includes('/test/') ||
    dirName.includes('/tests/') ||
    dirName.includes('\\test\\') ||
    dirName.includes('\\tests\\')
  ) {
    return true;
  }

  // Check .csproj content for test SDK
  try {
    if (!existsSync(fullPath)) {
      return false;
    }

    const content = readFileSync(fullPath, 'utf-8');
    
    // Check for common test project indicators
    const testIndicators = [
      'Microsoft.NET.Test.Sdk',
      'xunit',
      'nunit',
      'mstest',
      'NUnit',
      'MSTest',
      '<IsTestProject>true</IsTestProject>',
      '<IsPackable>false</IsPackable>',
    ];

    return testIndicators.some((indicator) =>
      content.toLowerCase().includes(indicator.toLowerCase())
    );
  } catch (error) {
    // If we can't read the file, assume it's not a test project
    return false;
  }
}

/**
 * Check if a .csproj file represents a library project (packable)
 */
function isLibraryProject(
  csprojPath: string,
  context: CreateNodesContextV2
): boolean {
  const fullPath = joinPathFragments(context.workspaceRoot, csprojPath);
  
  try {
    if (!existsSync(fullPath)) {
      return false;
    }

    const content = readFileSync(fullPath, 'utf-8');
    
    // Check for explicit IsPackable setting
    if (content.includes('<IsPackable>false</IsPackable>')) {
      return false;
    }
    
    // Check for library output type
    const outputTypeMatch = /<OutputType>(.*?)<\/OutputType>/i.exec(content);
    if (outputTypeMatch) {
      const outputType = outputTypeMatch[1].toLowerCase();
      // Exe and WinExe are executable projects
      if (outputType === 'exe' || outputType === 'winexe') {
        return false;
      }
    }
    
    // Check SDK type
    const sdkMatch = /<Project Sdk="(.*?)">/i.exec(content);
    if (sdkMatch) {
      const sdk = sdkMatch[1].toLowerCase();
      // Web projects typically shouldn't be packaged
      if (sdk.includes('microsoft.net.sdk.web')) {
        return false;
      }
    }
    
    // If we get here, assume it's a library
    return true;
    
  } catch (error) {
    // If we can't read the file, be conservative
    return false;
  }
}
```

**⚠️ Important:** Replace `@<your-org>/nuget-publish-plugin` with your actual plugin name from `tools/nuget-publish-plugin/package.json`.

### 4.2 Build the Plugin

```bash
npx nx build nuget-publish-plugin
```

### ✅ Verification Step 4

**Check the plugin exports:**

```bash
# Check the compiled output
cat tools/nuget-publish-plugin/src/index.js | head -20
```

**Expected output:** Should show both `createNodes` and `createNodesV2` exports

**Verify no TypeScript errors:**

```bash
npx nx build nuget-publish-plugin --verbose
```

**Expected output:** Build completes successfully

**Check plugin capabilities:**

```bash
npx nx list
```

**Expected output:** Your plugin should show `(project-inference)` capability

**Troubleshooting:**
- If TypeScript errors: Check all imports are correct
- If build fails: Look for syntax errors in index.ts
- If exports missing: Ensure both `createNodes` and `createNodesV2` are exported

---

## Step 5: Register the Plugin in nx.json

### 5.1 Add Plugin to nx.json

Open your `nx.json` file and add your plugin to the `plugins` array. Make sure it comes **after** `@nx/dotnet` so both plugins can work together:

```json
{
  "plugins": [
    {
      "plugin": "@nx/dotnet",
      "options": {
        "build": {
          "targetName": "build"
        },
        "test": {
          "targetName": "test"
        }
      }
    },
    {
      "plugin": "@<your-org>/nuget-publish-plugin",
      "options": {
        "targetName": "nuget-publish",
        "source": "https://api.nuget.org/v3/index.json",
        "dryRun": false,
        "buildTargetName": "build"
      }
    }
  ]
}
```

**⚠️ Important:** Replace `@<your-org>` with your organization name from `package.json`.

### 5.2 Clear Cache

```bash
npx nx reset
```

### ✅ Verification Step 5

**Verify plugin registration:**

```bash
# Check plugin is listed
npx nx list
```

**Expected output:**
```
NX   Local workspace plugins:

@<your-org>/nuget-publish-plugin (project-inference)
```

**Check that targets are inferred:**

```bash
# List all your .NET projects
npx nx show projects

# Pick a library project (not a test project) and check its targets
npx nx show project <your-library-name>
```

**Expected output:** Should show a `nuget-publish` target with configurations

**Example output:**
```
my-library

Root: libs/my-library

Targets:
  - build
  - test
  - nuget-publish     <-- Your new target!
    executor: @myorg/nuget-publish-plugin:nuget-publish
    configurations:
      - production
      - development
```

**Verify target details:**

```bash
npx nx show project <your-library-name> --json | grep -A 20 nuget-publish
```

**Expected output:** Should show the full target configuration with executor, options, and configurations

**Troubleshooting:**
- If plugin not listed: Check plugin name in `package.json` matches `nx.json`
- If targets not created: 
  1. Check your .csproj files are not test projects
  2. Verify they have `project.json` or `package.json` in their directory
  3. Run with debug: `NX_DAEMON=false npx nx show project <project-name>`
- If "module not found" error: Run `npx nx build nuget-publish-plugin` and `npx nx reset`

---

## Step 6: Test the Plugin

### 6.1 Test with Dry Run

First, test with a library project using dry-run mode:

```bash
# Find a library project
npx nx show projects | grep -v test

# Test with dry-run (development configuration)
npx nx run <your-library>:nuget-publish --configuration=development
```

### ✅ Verification Step 6.1

**Expected output:**
```
📦 Publishing NuGet package for <your-library>...
   Project: libs/<your-library>/<your-library>.csproj
   Configuration: Debug

Step 1/2: Creating NuGet package...
Running: dotnet pack "..." -c Debug
  ... (build output) ...
✓ Package created: YourLibrary.1.0.0.nupkg

Step 2/2: Publishing package...
🧪 DRY RUN MODE
   Would publish to: https://api.nuget.org/v3/index.json
   Copying package to local feed: .../local-nuget-feed

✅ Package copied to local feed successfully (dry-run mode)
   Local feed location: .../local-nuget-feed
```

**Check the local feed:**

```bash
ls -la local-nuget-feed/
```

**Expected output:** Should show your .nupkg file

### 6.2 Test Multiple Projects

```bash
# Test all publishable projects at once (dry-run)
npx nx run-many -t nuget-publish --configuration=development
```

### ✅ Verification Step 6.2

**Expected output:**
- ✓ All library projects build and pack successfully
- ✓ All packages appear in `local-nuget-feed/`
- ✓ Test projects are skipped (not executed)

**Verify test projects are excluded:**

```bash
# This should NOT have a nuget-publish target
npx nx show project <your-test-project>
```

**Expected output:** No `nuget-publish` target listed

### 6.3 Test Actual Publishing (Optional)

**⚠️ Warning:** This will publish to the actual NuGet feed. Only do this when ready!

```bash
# Set your API key
export NUGET_API_KEY="your-actual-api-key-here"

# Publish one project
npx nx run <your-library>:nuget-publish --configuration=production
```

### ✅ Verification Step 6.3

**Expected output:**
```
📦 Publishing NuGet package for <your-library>...
   Configuration: Release

Step 1/2: Creating NuGet package...
✓ Package created: YourLibrary.1.0.0.nupkg

Step 2/2: Publishing package...
Publishing to: https://api.nuget.org/v3/index.json
  ... (nuget push output) ...

✅ Package published successfully!
```

**Verify on NuGet.org:**
- Go to https://www.nuget.org/packages/YourLibrary
- Confirm your package appears

---

## Step 7: Customize Per-Project Settings (Optional)

If you need different settings for specific projects, you can override them in the project's `project.json`:

### 7.1 Create or Edit project.json

In your library's directory, create/edit `project.json`:

```json
{
  "name": "my-special-library",
  "targets": {
    "nuget-publish": {
      "options": {
        "source": "https://my-private-nuget-feed.com/v3/index.json"
      },
      "configurations": {
        "production": {
          "dryRun": false
        }
      }
    }
  }
}
```

### ✅ Verification Step 7

**Check merged configuration:**

```bash
npx nx show project my-special-library --json
```

**Expected output:** The `nuget-publish` target should show your custom source URL

---

## Complete Example Workflow

### Daily Development Workflow

```bash
# 1. Make changes to your library
# 2. Build and test
npx nx run my-library:build
npx nx run my-library:test

# 3. Test package creation (dry-run)
npx nx run my-library:nuget-publish --configuration=development

# 4. Check the package locally
ls -la local-nuget-feed/
```

### Release Workflow

```bash
# 1. Update version in .csproj
# 2. Build all affected projects
npx nx affected -t build

# 3. Test all affected packages (dry-run)
npx nx affected -t nuget-publish --configuration=development

# 4. Publish all affected packages
export NUGET_API_KEY="your-key"
npx nx affected -t nuget-publish --configuration=production
```

### CI/CD Example (GitHub Actions)

```yaml
name: Publish NuGet Packages

on:
  push:
    tags:
      - 'v*'

jobs:
  publish:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      
      - name: Setup .NET
        uses: actions/setup-dotnet@v4
        with:
          dotnet-version: '8.0.x'
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build Nx plugin
        run: npx nx build nuget-publish-plugin
      
      - name: Publish affected packages
        env:
          NUGET_API_KEY: ${{ secrets.NUGET_API_KEY }}
        run: |
          npx nx affected -t nuget-publish \
            --configuration=production \
            --base=origin/main~1 \
            --head=HEAD
```

---

## Troubleshooting Guide

### Plugin Not Showing Up

**Symptoms:**
- `npx nx list` doesn't show your plugin
- Targets not inferred

**Solutions:**

1. **Rebuild the plugin:**
   ```bash
   npx nx build nuget-publish-plugin
   npx nx reset
   ```

2. **Check plugin name:**
   ```bash
   # Compare these two
   cat tools/nuget-publish-plugin/package.json | grep name
   cat nx.json | grep nuget-publish-plugin
   ```
   They should match!

3. **Verify TypeScript paths:**
   ```bash
   cat tsconfig.base.json | grep nuget-publish-plugin
   ```
   Should show a path mapping

4. **Check for build errors:**
   ```bash
   npx nx build nuget-publish-plugin --verbose
   ```

### Targets Not Created

**Symptoms:**
- Plugin shows up but targets aren't created for your projects

**Solutions:**

1. **Check project type:**
   ```bash
   # Verify it's a library, not a test or executable
   cat libs/your-library/YourLibrary.csproj | grep -i "outputtype\|ispackable\|test"
   ```

2. **Run with debug logging:**
   ```bash
   NX_DAEMON=false npx nx show project your-library --verbose
   ```

3. **Verify .csproj location:**
   Your .csproj file should be in a directory with `project.json` or `package.json`

4. **Add manual logging:**
   Edit `tools/nuget-publish-plugin/src/index.ts` and add:
   ```typescript
   async function createNodesInternal(...) {
     console.log('🔍 Processing:', configFilePath);
     const isTest = isTestProject(configFilePath, context);
     console.log('   Is test project:', isTest);
     const isLib = isLibraryProject(configFilePath, context);
     console.log('   Is library:', isLib);
     // ... rest of code
   }
   ```
   Then rebuild and run with `NX_DAEMON=false`

### Executor Fails

**Symptoms:**
- Error: "Cannot find module"
- Executor not found errors

**Solutions:**

1. **Rebuild and reset:**
   ```bash
   npx nx build nuget-publish-plugin
   npx nx reset
   ```

2. **Check executor registration:**
   ```bash
   cat tools/nuget-publish-plugin/executors.json
   ```

3. **Verify build output:**
   ```bash
   ls -la dist/tools/nuget-publish-plugin/
   ```

### API Key Issues

**Symptoms:**
- "API key is required" error

**Solutions:**

1. **Set environment variable:**
   ```bash
   export NUGET_API_KEY="your-key-here"
   # Or for single command:
   NUGET_API_KEY="your-key" npx nx run my-lib:nuget-publish
   ```

2. **Pass as parameter:**
   ```bash
   npx nx run my-lib:nuget-publish --apiKey=your-key
   ```

3. **Use .env file (NOT for CI):**
   Create `.env` in workspace root:
   ```
   NUGET_API_KEY=your-key-here
   ```
   **⚠️ Add `.env` to `.gitignore`!**

---

## Best Practices

### 1. **Always Test with Dry-Run First**
```bash
npx nx run my-lib:nuget-publish --configuration=development
```

### 2. **Use Semantic Versioning**
In your .csproj:
```xml
<PropertyGroup>
  <Version>1.2.3</Version>
  <PackageVersion>1.2.3</PackageVersion>
</PropertyGroup>
```

### 3. **Tag Publishable Projects**
Add tags to help filter:
```json
{
  "name": "my-library",
  "tags": ["publishable", "nuget"]
}
```

Then publish only tagged projects:
```bash
npx nx run-many -t nuget-publish --projects=tag:publishable
```

### 4. **Never Commit API Keys**
- Use environment variables
- Use CI secrets
- Add `.env` to `.gitignore`

### 5. **Set Up Package Metadata**
In your .csproj:
```xml
<PropertyGroup>
  <PackageId>MyCompany.MyLibrary</PackageId>
  <Version>1.0.0</Version>
  <Authors>Your Name</Authors>
  <Company>Your Company</Company>
  <Description>Library description</Description>
  <PackageLicenseExpression>MIT</PackageLicenseExpression>
  <PackageProjectUrl>https://github.com/yourorg/yourrepo</PackageProjectUrl>
  <RepositoryUrl>https://github.com/yourorg/yourrepo</RepositoryUrl>
  <PackageTags>nx;dotnet;library</PackageTags>
</PropertyGroup>
```

---

## Summary

You've successfully created an Nx plugin that:

✅ Automatically detects non-test .NET library projects  
✅ Creates `nuget-publish` targets with configurations  
✅ Supports dry-run testing mode  
✅ Handles API keys securely  
✅ Works alongside `@nx/dotnet` plugin  
✅ Integrates with Nx caching and task dependencies  
✅ Compatible with Nx 22  

### Quick Command Reference

```bash
# Build plugin
npx nx build nuget-publish-plugin

# Clear cache
npx nx reset

# View plugin
npx nx list

# Check project targets
npx nx show project <project-name>

# Test with dry-run
npx nx run <library>:nuget-publish --configuration=development

# Publish for real
NUGET_API_KEY="key" npx nx run <library>:nuget-publish --configuration=production

# Publish multiple
npx nx run-many -t nuget-publish --configuration=production
```

### Next Steps

- Set up CI/CD pipeline
- Add version management
- Create package documentation
- Configure private NuGet feeds
- Add automated testing for the plugin

---

## Support

If you encounter issues:

1. Check the [Troubleshooting Guide](#troubleshooting-guide)
2. Run verification steps for each section
3. Check [Nx documentation](https://nx.dev)
4. Review [.NET CLI documentation](https://learn.microsoft.com/en-us/dotnet/core/tools/)

Happy publishing! 🚀
