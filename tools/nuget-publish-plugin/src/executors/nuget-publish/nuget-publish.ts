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
