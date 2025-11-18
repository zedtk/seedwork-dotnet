import { ExecutorContext, logger } from '@nx/devkit';
import { execSync } from 'child_process';
import { join, basename, isAbsolute } from 'path';
import { existsSync, mkdirSync, readdirSync } from 'fs';
import { NugetPublishExecutorSchema } from './schema';

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_OPTIONS: ResolvedOptions = {
  configuration: 'Release',
  source: 'https://api.nuget.org/v3/index.json',
  dryRunSource: 'local-nuget-feed',
  dryRun: false,
  skipDuplicate: true,
} as const;

const NUGET_PACKAGE_EXTENSION = '.nupkg';
const NUGET_SYMBOLS_SUFFIX = '.symbols.nupkg';
const NUGET_API_KEY_ENV = 'NUGET_API_KEY';
const STANDARD_OUTPUT_PATH = 'bin';

// ============================================================================
// TYPES
// ============================================================================

interface ResolvedOptions extends Required<Omit<NugetPublishExecutorSchema, 'packagePath' | 'apiKey'>> {
  packagePath?: string;
  apiKey?: string;
}

interface PublishContext {
  source: string;
  apiKey?: string;
  packagePath: string;
}

// ============================================================================
// MAIN EXECUTOR
// ============================================================================

/**
 * Publishes a NuGet package to a feed or local directory.
 * 
 * @param options - Publishing configuration options
 * @param context - Nx executor context
 * @returns Promise resolving to success status
 */
export default async function runExecutor(
  options: NugetPublishExecutorSchema,
  context: ExecutorContext
): Promise<{ success: boolean }> {
  try {
    const resolvedOptions = resolveOptions(options);
    const projectInfo = validateAndGetProjectInfo(context);

    logger.info(`📦 Publishing NuGet package for ${projectInfo.projectName}...`);
    logger.info(`   Configuration: ${resolvedOptions.configuration}`);

    const packagePath = resolvePackagePath(
      resolvedOptions,
      projectInfo,
      context.root
    );

    await publishPackage(packagePath, context.root, resolvedOptions);

    return { success: true };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    logger.error('');
    logger.error('❌ Failed to publish NuGet package:');

    // Multi-line error messages
    errorMessage.split('\n').forEach(line => {
      logger.error(`   ${line}`);
    });

    return { success: false };
  }
}

// ============================================================================
// VALIDATION & RESOLUTION
// ============================================================================

/**
 * Resolves and validates options by merging with defaults.
 */
function resolveOptions(options: NugetPublishExecutorSchema): ResolvedOptions {
  const resolved = { ...DEFAULT_OPTIONS, ...options };

  // Validate dryRunSource path (prevent directory traversal)
  if (resolved.dryRunSource && !isUrl(resolved.dryRunSource)) {
    validateSafePath(resolved.dryRunSource, 'dryRunSource');
  }

  return resolved;
}

/**
 * Validates path is safe (no directory traversal attempts).
 */
function validateSafePath(path: string, fieldName: string): void {
  if (isAbsolute(path)) {
    throw new Error(
      `${fieldName} must be a relative path, got absolute path: ${path}`
    );
  }

  if (path.includes('..')) {
    throw new Error(
      `${fieldName} cannot contain '..' (directory traversal): ${path}`
    );
  }
}

/**
 * Validates executor context and extracts project information.
 */
function validateAndGetProjectInfo(context: ExecutorContext): {
  projectName: string;
  projectRoot: string;
} {
  const projectName = context.projectName;

  if (!projectName) {
    throw new Error('Project name not found in executor context');
  }

  const projectConfig = context.projectsConfigurations?.projects[projectName];

  if (!projectConfig) {
    throw new Error(`Project ${projectName} not found in workspace configuration`);
  }

  return {
    projectName,
    projectRoot: projectConfig.root,
  };
}

/**
 * Resolves the package path, either from options or by discovery.
 */
function resolvePackagePath(
  options: ResolvedOptions,
  projectInfo: { projectName: string; projectRoot: string },
  workspaceRoot: string
): string {
  if (options.packagePath) {
    validateSafePath(options.packagePath, 'packagePath');
    const packagePath = join(workspaceRoot, options.packagePath);

    if (!existsSync(packagePath)) {
      throw new Error(
        `Package file not found at: ${options.packagePath}\n` +
        `   Absolute path: ${packagePath}`
      );
    }

    return packagePath;
  }

  const discoveredPath = discoverPackageFile(
    workspaceRoot,
    projectInfo.projectRoot,
    options.configuration
  );

  if (!discoveredPath) {
    throw new Error(
      `No package file found for configuration: ${options.configuration}\n` +
      `   Expected location: ${projectInfo.projectRoot}/${STANDARD_OUTPUT_PATH}/${options.configuration}\n` +
      `   Did you run the 'pack' target first?\n` +
      `   Try: nx run ${projectInfo.projectName}:pack --configuration=${options.configuration}`
    );
  }

  return discoveredPath;
}

// ============================================================================
// PACKAGE DISCOVERY
// ============================================================================

/**
 * Discovers the package file in the standard output location.
 * Returns null if no package is found.
 */
function discoverPackageFile(
  workspaceRoot: string,
  projectRoot: string,
  configuration: string
): string | null {
  const outputPath = join(workspaceRoot, projectRoot, STANDARD_OUTPUT_PATH, configuration);

  if (!existsSync(outputPath)) {
    return null;
  }

  const packages = findNuGetPackages(outputPath);

  if (packages.length === 0) {
    return null;
  }

  if (packages.length > 1) {
    logger.warn(`⚠️  Multiple packages found in ${outputPath}:`);
    packages.forEach(pkg => logger.warn(`     - ${basename(pkg)}`));
    logger.warn(`   Using: ${basename(packages[packages.length - 1])}`);
  }

  return packages[packages.length - 1];
}

/**
 * Finds all non-symbol NuGet packages in a directory.
 * Returns sorted array of absolute paths.
 */
function findNuGetPackages(directory: string): string[] {
  return readdirSync(directory)
    .filter(file =>
      file.endsWith(NUGET_PACKAGE_EXTENSION) &&
      !file.endsWith(NUGET_SYMBOLS_SUFFIX)
    )
    .sort()
    .map(file => join(directory, file));
}

// ============================================================================
// PUBLISHING
// ============================================================================

/**
 * Publishes the package to either a remote feed or local directory.
 */
async function publishPackage(
  packagePath: string,
  workspaceRoot: string,
  options: ResolvedOptions
): Promise<void> {
  const publishContext = options.dryRun
    ? prepareDryRunPublish(packagePath, workspaceRoot, options)
    : prepareRemotePublish(packagePath, options);

  executePublish(publishContext, options);

  logger.info('');
  if (options.dryRun) {
    logger.info('✅ Package published to local feed successfully');
    logger.info(`   Location: ${publishContext.source}`);
  } else {
    logger.info('✅ Package published successfully!');
  }
}

/**
 * Prepares context for dry-run publishing to local directory.
 */
function prepareDryRunPublish(
  packagePath: string,
  workspaceRoot: string,
  options: ResolvedOptions
): PublishContext {
  const { dryRunSource, source: targetSource, apiKey: optApiKey } = options;
  const isRemoteFeed = isUrl(dryRunSource);

  const source = isRemoteFeed
    ? dryRunSource
    : join(workspaceRoot, dryRunSource);

  const apiKey = isRemoteFeed
    ? (optApiKey || process.env[NUGET_API_KEY_ENV])
    : undefined;

  if (!isRemoteFeed) {
    ensureDirectoryExists(source);
  }

  logger.info('');
  logger.info(`🧪 DRY RUN MODE`);
  logger.info(`   Would publish to: ${targetSource}`);
  logger.info(`   Publishing to: ${source}`);

  if (isRemoteFeed && !apiKey) {
    logger.warn('   ⚠️  No API key provided - publish may fail if feed requires authentication');
  }

  return {
    source,
    apiKey,
    packagePath
  };
}

/**
 * Prepares context for remote feed publishing.
 */
function prepareRemotePublish(
  packagePath: string,
  options: ResolvedOptions
): PublishContext {
  const apiKey = options.apiKey || process.env[NUGET_API_KEY_ENV];

  if (!apiKey) {
    throw new Error(
      'API key is required for publishing.\n' +
      '   Provide via:\n' +
      `   - --apiKey flag\n` +
      `   - ${NUGET_API_KEY_ENV} environment variable`
    );
  }

  logger.info('');
  logger.info(`📤 Publishing to: ${options.source}`);

  return {
    source: options.source,
    apiKey,
    packagePath
  };
}

/**
 * Executes the dotnet nuget push command.
 */
function executePublish(context: PublishContext, options: ResolvedOptions): void {
  const args = buildPublishCommandArgs(context, options);
  const command = `dotnet nuget push ${args.join(' ')}`;

  logger.info(`   Running: dotnet nuget push...`);

  try {
    execSync(command, {
      stdio: 'inherit',
      // Hide command from logs if API key is present
      windowsHide: true,
    });
  } catch (error) {
    throw new Error(
      `Failed to execute dotnet nuget push.\n` +
      `   Command failed with exit code: ${(error as any).status || 'unknown'}\n` +
      `   See output above for details.`
    );
  }
}

/**
 * Builds command line arguments for dotnet nuget push.
 */
function buildPublishCommandArgs(
  context: PublishContext,
  options: ResolvedOptions
): string[] {
  const args = [
    `"${context.packagePath}"`,
    `--source "${context.source}"`,
  ];

  if (context.apiKey) {
    args.push(`--api-key "${context.apiKey}"`);
  }

  if (options.skipDuplicate) {
    args.push('--skip-duplicate');
  }

  return args;
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Ensures a directory exists, creating it if necessary.
 */
function ensureDirectoryExists(path: string): void {
  if (!existsSync(path)) {
    try {
      mkdirSync(path, { recursive: true });
    } catch (error) {
      throw new Error(
        `Failed to create directory: ${path}\n` +
        `   Error: ${(error as Error).message}`
      );
    }
  }
}

/**
 * Determines if a string is a URL.
 */
function isUrl(path: string): boolean {
  try {
    const url = new URL(path);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}