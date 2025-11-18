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

// ============================================================================
// CONSTANTS
// ============================================================================

const CSPROJ_GLOB = '**/*.csproj';

const IS_PACKABLE_REGEX = /<IsPackable(?:\s+[^>]*)?>(\s*true\s*)<\/IsPackable>/i;

const DEFAULT_OPTIONS: ResolvedPluginOptions = {
    targetName: 'nx-release-publish',
    sources: {
        local: 'local-nuget-feed',
        nuget: 'https://api.nuget.org/v3/index.json',
    },
    defaultSource: 'local',
    packTargetName: 'pack',
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
     * Named NuGet sources configuration.
     * Maps source name to NuGet feed URL.
     * 
     * @example
     * ```json
     * {
     *   "sources": {
     *     "local": "local-nuget-feed",
     *     "nuget": "https://api.nuget.org/v3/index.json"
     *   }
     * }
     * ```
     * 
     * @default { local: 'local-nuget-feed' }
     */
    sources?: Record<string, string>;

    /**
     * Default source name to use when no configuration is specified.
     * @default 'local'
     */
    defaultSource?: string;

    /**
     * Name of the pack target to depend on.
     * @default 'pack'
     */
    packTargetName?: string;
}

interface ResolvedPluginOptions extends Required<PluginOptions> { }

// ============================================================================
// PLUGIN EXPORTS
// ============================================================================

/**
 * Nx plugin that automatically creates publish targets for packable .csproj projects.
 * 
 * The plugin creates targets with multiple configurations for different NuGet sources.
 * API keys are passed via NUGET_API_KEY environment variable.
 * 
 * @example Usage with nx release
 * ```bash
 * # Publish to default source (local, no API key needed)
 * nx release
 * 
 * # Publish to staging
 * NUGET_API_KEY=xxx nx release --configuration=staging
 * 
 * # Publish to production
 * NUGET_API_KEY=xxx nx release --configuration=production
 * ```
 * 
 * @example Direct target execution
 * ```bash
 * nx run my-lib:nx-release-publish
 * nx run my-lib:nx-release-publish:staging
 * NUGET_API_KEY=xxx nx run my-lib:nx-release-publish:production
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
    const resolvedOptions = resolveOptions(options);
    const projectRoot = dirname(configFilePath);

    try {
        const isPackable = isProjectPackable(configFilePath, context);

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
            `Failed to process ${configFilePath}: ${error instanceof Error ? error.message : String(error)}`
        );
        return {};
    }
}

// ============================================================================
// OPTION RESOLUTION
// ============================================================================

function resolveOptions(options: PluginOptions): ResolvedPluginOptions {
    const resolved = { ...DEFAULT_OPTIONS, ...options };

    // Validate that default source exists
    if (!resolved.sources[resolved.defaultSource]) {
        throw new Error(
            `Default source "${resolved.defaultSource}" not found in sources configuration. ` +
            `Available sources: ${Object.keys(resolved.sources).join(', ')}`
        );
    }

    // Validate all source URLs
    for (const [name, url] of Object.entries(resolved.sources)) {
        if (!isValidNuGetSource(url)) {
            throw new Error(
                `Invalid NuGet source URL for "${name}": ${url}. ` +
                `Must be a valid URL (http:// or https://) or a local path.`
            );
        }
    }

    return resolved;
}

function isValidNuGetSource(source: string): boolean {
    try {
        const url = new URL(source);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
        // Allow local paths and relative paths
        return !source.includes('<') && !source.includes('>');
    }
}

// ============================================================================
// TARGET CREATION
// ============================================================================

/**
 * Creates a publish target with configurations for each defined source.
 * 
 * The command runs from bin/Release directory to simplify package discovery.
 * Uses Nx option interpolation ({options.source}) for runtime configuration.
 */
function createPublishTarget(options: ResolvedPluginOptions): TargetConfiguration {
    // Simple command that runs from the package directory
    const command = [
        `dotnet nuget push`,
        `*.nupkg`,
        `--source {options.source}`,
        `--api-key \${NUGET_API_KEY}`,
        `--skip-duplicate`,
    ].join(' ');

    const targetConfig: TargetConfiguration = {
        executor: 'nx:run-commands',
        options: {
            command,
            cwd: '{projectRoot}/bin/Release',
            source: options.sources[options.defaultSource],
        },
        dependsOn: [options.packTargetName],
        cache: true,
        inputs: [
            '{projectRoot}/bin/Release/**/*.nupkg'
        ],
        outputs: [],
        configurations: {},
    };

    // Create a configuration for each named source
    for (const [sourceName, sourceUrl] of Object.entries(options.sources)) {
        if (sourceName !== options.defaultSource) {
            targetConfig.configurations![sourceName] = {
                source: sourceUrl,
            };
        }
    }

    return targetConfig;
}

// ============================================================================
// CSPROJ ANALYSIS
// ============================================================================

function isProjectPackable(
    csprojPath: string,
    context: CreateNodesContextV2
): boolean {
    const fullPath = joinPathFragments(context.workspaceRoot, csprojPath);

    if (!existsSync(fullPath)) {
        throw new Error(`File not found: ${csprojPath}`);
    }

    const content = readFileSync(fullPath, 'utf-8');

    return IS_PACKABLE_REGEX.test(content);
}