import { ExecutorContext, logger } from '@nx/devkit';
import { execSync } from 'child_process';
import { join, basename } from 'path';
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
  const configuration = options.configuration || 'Release';

  logger.info(`📦 Publishing NuGet package for ${projectName}...`);
  logger.info(`   Configuration: ${configuration}`);

  try {
    // Find the .nupkg file created by the pack target
    const packagePath = options.packagePath
      ? join(workspaceRoot, options.packagePath)
      : findPackageFile(workspaceRoot, projectRoot, configuration);

    if (!packagePath || !existsSync(packagePath)) {
      throw new Error(
        `❌ Package file not found.\n` +
        `   Expected location: ${packagePath || 'not specified'}\n` +
        `   Did you run the 'pack' target first?\n` +
        `   Try: nx run ${projectName}:pack`
      );
    }

    logger.info(`   Package: ${basename(packagePath)}`);

    await handlePublish(packagePath, workspaceRoot, options);

    return { success: true };

  } catch (error) {
    logger.error('');
    logger.error(`❌ Failed to publish NuGet package:`);
    logger.error(`   ${error.message}`);
    return { success: false };
  }
}

/**
 * Find the most recent .nupkg file in the standard output location
 */
function findPackageFile(
  workspaceRoot: string,
  projectRoot: string,
  configuration: string
): string | null {
  const outputPath = join(workspaceRoot, projectRoot, 'bin', configuration);

  if (!existsSync(outputPath)) {
    return null;
  }

  const nupkgFiles = readdirSync(outputPath)
    .filter((file: string) =>
      file.endsWith('.nupkg') && !file.endsWith('.symbols.nupkg')
    )
    .sort(); // Sort to get most recent if multiple exist

  if (nupkgFiles.length === 0) {
    return null;
  }

  // Return the most recent package
  return join(outputPath, nupkgFiles[nupkgFiles.length - 1]);
}

async function handlePublish(
  packagePath: string,
  workspaceRoot: string,
  options: NugetPublishExecutorSchema
): Promise<void> {
  let source: string;
  let apiKey: string | undefined;

  if (options.dryRun) {
    // Dry-run mode: publish to local feed
    const feedPath = options.dryRunSource || 'local-nuget-feed';
    source = join(workspaceRoot, feedPath);

    // Create local feed directory if it doesn't exist
    if (!existsSync(source)) {
      mkdirSync(source, { recursive: true });
    }

    logger.info('');
    logger.info('🧪 DRY RUN MODE');
    logger.info(`   Would publish to: ${options.source || 'https://api.nuget.org/v3/index.json'}`);
    logger.info(`   Publishing to local feed: ${source}`);
  } else {
    // Production mode: publish to remote feed
    source = options.source || 'https://api.nuget.org/v3/index.json';
    apiKey = options.apiKey || process.env.NUGET_API_KEY;

    if (!apiKey) {
      throw new Error(
        'API key is required for publishing.\n' +
        '   Provide via:\n' +
        '   - --apiKey flag\n' +
        '   - NUGET_API_KEY environment variable'
      );
    }

    logger.info('');
    logger.info(`📤 Publishing to: ${source}`);
  }

  const publishCommand = [
    'dotnet nuget push',
    `"${packagePath}"`,
    `--source "${source}"`,
    apiKey ? `--api-key ${apiKey}` : '',
    options.skipDuplicate ? '--skip-duplicate' : '',
  ].filter(Boolean).join(' ');

  logger.info(`   Running: dotnet nuget push...`);

  execSync(publishCommand, {
    stdio: 'inherit',
  });

  logger.info('');
  logger.info(options.dryRun
    ? '✅ Package published to local feed successfully'
    : '✅ Package published successfully!');
}