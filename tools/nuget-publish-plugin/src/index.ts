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

export interface PluginOptions {
    /**
     * Name of the target to create for publishing.
     * @default 'nx-release-publish'
     */
    targetName?: string;

    /**
     * Name of the pack target to depend on.
     * @default 'pack'
     */
    packTargetName?: string;

    /**
     * Build configuration to use when publishing.
     * @default 'Release'
     */
    buildConfiguration?: string;

    /**
     * NuGet source name or URL to publish to.
     * @default nuget.org
     */
    sourceName?: string;
}

interface ResolvedPluginOptions extends Required<PluginOptions> { }

// ============================================================================
// PLUGIN EXPORTS
// ============================================================================

/**
 * Nx plugin that automatically creates publish targets for packable .csproj projects.
 * 
 * Source resolution order:
 * 1. NUGET_SOURCE_NAME environment variable (at graph generation time)
 * 2. sourceName plugin option (from nx.json)
 * 3. Default: 'nuget.org'
 * 
 * Note: Environment variable is checked when the project graph is created,
 * not when the task executes. For runtime configuration, use nx configurations.
 * 
 * @example Usage with nx release
 * ```bash
 * # Publish to local
 * NUGET_SOURCE_NAME=local
 * nx release
 * 
 * # Publish to production
 * dotnet nuget setapikey xxx
 * nx release
 * ```
 * 
 * @example Direct target execution
 * ```bash
 * NUGET_SOURCE_NAME=local
 * nx run my-lib:nx-release-publish
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

export const createNodes = createNodesV2;

// ============================================================================
// CORE LOGIC
// ============================================================================

async function createNodesInternal(
    configFilePath: string,
    options: PluginOptions,
    context: CreateNodesContextV2
) {
    const resolvedOptions = resolveOptions(options, context.workspaceRoot);
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
            `[nx-release-publish] Failed to process ${configFilePath}: ${error instanceof Error ? error.message : String(error)}\nTarget will not be created for this project.`
        );
        return {};
    }
}

// ============================================================================
// OPTION RESOLUTION
// ============================================================================

function resolveOptions(options: PluginOptions, workspaceRoot: string): ResolvedPluginOptions {
    const resolved = { ...DEFAULT_OPTIONS, ...options };

    return resolved;
}

// ============================================================================
// TARGET CREATION
// ============================================================================

/**
 * Creates a publish target with configurations for each defined source.
 * 
 * The command runs from bin/[<options.buildConfiguration>] directory to simplify package discovery.
 * Uses Nx option interpolation ({options.source}) for runtime configuration.
 */
function createPublishTarget(options: ResolvedPluginOptions): TargetConfiguration {
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
        cache: false,
        inputs: [],
        outputs: [],
    };

    return targetConfig;
}

// ============================================================================
// CSPROJ ANALYSIS
// ============================================================================

/**
 * Determines if a .csproj file is packable by checking for the <IsPackable>true</IsPackable> tag.
 * @throws Error if the file does not exist.
 * @returns true if the project is packable, false otherwise.
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