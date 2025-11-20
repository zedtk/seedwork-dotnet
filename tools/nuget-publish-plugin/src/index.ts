import {
    CreateNodesContextV2,
    CreateNodesV2,
    TargetConfiguration,
    createNodesFromFiles,
    joinPathFragments,
    logger,
} from '@nx/devkit';
import { dirname } from 'path';
import { existsSync, readFileSync } from 'fs';
import { env } from 'process';

// ============================================================================
// CONSTANTS
// ============================================================================

const CSPROJ_GLOB = '**/*.csproj';

const IS_PACKABLE_REGEX = /<IsPackable(?:\s+[^>]*)?>(\s*true\s*)<\/IsPackable>/i;

const DEFAULT_OPTIONS: ResolvedPluginOptions = {
    targetName: 'nx-release-publish',
    packTargetName: 'pack',
    buildConfiguration: 'Release',
    sourceName: 'nuget.org',
} as const;

// ============================================================================
// TYPES
// ============================================================================

/**
 * Configuration options for the NuGet publish plugin.
 * @see {@link README.md} for detailed setup and usage instructions.
 */
export interface PluginOptions {
    /**
     * Name of the target to create for publishing.
     * @default 'nx-release-publish'
     */
    targetName?: string;

    /**
     * Name of the pack target that this publish target depends on.
     * The pack target should create .nupkg files before publishing.
     * @default 'pack'
     */
    packTargetName?: string;

    /**
     * Build configuration directory where .nupkg files are located.
     * Must match the configuration used by your pack target.
     * @default 'Release'
     */
    buildConfiguration?: string;

    /**
     * NuGet source name to publish to.
     * This should reference a source configured in nuget.config or via `dotnet nuget add source`.
     * Can be overridden at graph generation time using the NUGET_SOURCE_NAME environment variable.
     * @default 'nuget.org'
     */
    sourceName?: string;
}

/**
 * Internal type representing fully resolved plugin options with all defaults applied.
 * @internal
 */
type ResolvedPluginOptions = Required<PluginOptions>;

// ============================================================================
// PLUGIN EXPORTS
// ============================================================================

/**
 * Nx plugin that creates publish targets for packable .NET projects.
 * 
 * Automatically scans for .csproj files with `<IsPackable>true</IsPackable>` and adds
 * publish targets that integrate with `nx release`.
 * 
 * **Source Resolution Priority:**
 * 1. `NUGET_SOURCE_NAME` environment variable (read at graph generation time)
 * 2. `sourceName` plugin option
 * 3. Default: `'nuget.org'`
 * 
 * **Important:** The `NUGET_SOURCE_NAME` environment variable is read when the project
 * graph is generated, not when tasks execute. Run `nx reset` after changing it to clear
 * the graph cache.
 * 
 * @see {@link README.md} for complete setup, configuration, and usage guide.
 * 
 * @example
 * ```json
 * // nx.json
 * {
 *   "plugins": [
 *     {
 *       "plugin": "@zedtk/nuget-publish-plugin",
 *       "options": {
 *         "sourceName": "local-feed"
 *     }
 *   }
 *   ],
 * }
 * ```
 */
export const createNodesV2: CreateNodesV2<PluginOptions> = [
    CSPROJ_GLOB,
    async (configFiles, options, context) => {
        return await createNodesFromFiles(
            (configFile, options, context) =>
                createNodesInternal(configFile, options || {}, context),
            configFiles,
            options || {},
            context
        );
    },
];

/**
 * Backwards compatibility export for Nx < 19.
 * @see {@link createNodesV2}
 */
export const createNodes = createNodesV2;

// ============================================================================
// CORE LOGIC
// ============================================================================

/**
 * Processes a .csproj file and creates project configuration if packable.
 * @internal
 */
async function createNodesInternal(
    configFilePath: string,
    options: PluginOptions,
    context: CreateNodesContextV2
) {
    const resolvedOptions: ResolvedPluginOptions = { ...DEFAULT_OPTIONS, ...options };
    const projectRoot = dirname(configFilePath);

    try {
        const isPackable = isProjectPackable(configFilePath, context.workspaceRoot);

        if (!isPackable) {
            return {};
        }

        const publishTarget = createPublishTarget(resolvedOptions);

        return {
            projects: {
                [projectRoot]: {
                    targets: {
                        [resolvedOptions.targetName]: publishTarget,
                    },
                },
            },
        };
    } catch (error) {
        logger.warn(
            `[nx-release-publish] Failed to process ${configFilePath}: ${error instanceof Error ? error.message : String(error)
            }\nTarget will not be created for this project.`
        );
        return {};
    }
}

// ============================================================================
// TARGET CREATION
// ============================================================================

/**
 * Creates an Nx target for publishing NuGet packages.
 * 
 * Source is resolved from NUGET_SOURCE_NAME env var (if set) or options.sourceName.
 * @internal
 */
function createPublishTarget(options: ResolvedPluginOptions): TargetConfiguration {
    // Env var is read at graph generation time, not execution time
    const sourceName = env.NUGET_SOURCE_NAME || options.sourceName;

    const command = [
        `dotnet nuget push`,
        `*.nupkg`,
        `--source ${sourceName}`,
        `--skip-duplicate`,
    ].join(' ');

    const targetConfig: TargetConfiguration = {
        executor: 'nx:run-commands',
        options: {
            command,
            cwd: `{projectRoot}/bin/${options.buildConfiguration}`,
        },
        dependsOn: [options.packTargetName],
        cache: false, // Publishing has side effects and should never be cached
        inputs: [], // Not applicable when cache is disabled
        outputs: [], // Publishing doesn't create local artifacts
    };

    return targetConfig;
}

// ============================================================================
// CSPROJ ANALYSIS
// ============================================================================

/**
 * Checks if a .csproj is packable by looking for `<IsPackable>true</IsPackable>`.
 * @throws {Error} If file does not exist
 * @internal
 */
function isProjectPackable(
    csprojPath: string,
    workspaceRoot: string
): boolean {
    const fullPath = joinPathFragments(workspaceRoot, csprojPath);

    if (!existsSync(fullPath)) {
        throw new Error(`File not found: ${csprojPath}`);
    }

    const content = readFileSync(fullPath, 'utf-8');

    return IS_PACKABLE_REGEX.test(content);
}