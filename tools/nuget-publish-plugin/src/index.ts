import {
    CreateNodesContextV2,
    CreateNodesV2,
    TargetConfiguration,
    createNodesFromFiles,
    joinPathFragments,
    logger,
} from '@nx/devkit';
import { dirname, resolve } from 'path';
import { existsSync, readFileSync } from 'fs';

// ============================================================================
// CONSTANTS
// ============================================================================

const CSPROJ_GLOB = '**/*.csproj';

const IS_PACKABLE_REGEX = /<IsPackable(?:\s+[^>]*)?>(\s*true\s*)<\/IsPackable>/i;

const DEFAULT_OPTIONS: ResolvedPluginOptions = {
    targetName: 'nx-release-publish',
    sources: {
        local: './local-nuget-feed',
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
     *     "local": "./local-nuget-feed",
     *     "nuget": "https://api.nuget.org/v3/index.json"
     *   }
     * }
     * ```
     * 
     * @default
     * ```json
     * {
     *   "local": "./local-nuget-feed",
     *   "nuget": "https://api.nuget.org/v3/index.json"
     * }
     * ```
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
            `Failed to process ${configFilePath}: ${error instanceof Error ? error.message : String(error)}`
        );
        return {};
    }
}

// ============================================================================
// OPTION RESOLUTION
// ============================================================================

function resolveOptions(options: PluginOptions, workspaceRoot: string): ResolvedPluginOptions {
    const resolved = { ...DEFAULT_OPTIONS, ...options };

    // Validate that default source exists
    if (!resolved.sources[resolved.defaultSource]) {
        throw new Error(
            `Default source "${resolved.defaultSource}" not found in sources configuration. ` +
            `Available sources: ${Object.keys(resolved.sources).join(', ')}`
        );
    }

    // Normalize all source URLs
    for (const name of Object.keys(resolved.sources)) {
        try {
            resolved.sources[name] = normalizeNuGetSource(resolved.sources[name], workspaceRoot);
        }
        catch (error) {
            throw new Error(
                `Failed to normalize NuGet source "${name}": ${error instanceof Error ? error.message : String(error)}`
            );
        }
    }

    return resolved;
}

function normalizeNuGetSource(source: string, workspaceRoot: string): string {
    if (!source || !source.trim()) {
        throw new Error('NuGet source cannot be empty');
    }

    const trimmed = source.trim();

    // UNC network path
    if (/^\\\\[^\\]+\\[^\\]+/.test(trimmed)) {
        return trimmed;
    }

    // Absolute paths
    // Windows: C:\path or C:/path
    if (/^[a-zA-Z]:[/\\]/.test(trimmed)) {
        return trimmed;
    }
    // Unix: /path
    if (/^\//.test(trimmed)) {
        return trimmed;
    }

    // Check for URL using URL constructor
    try {
        const url = new URL(trimmed);
        if (url.protocol === 'http:' || url.protocol === 'https:') {
            return url.href;
        }

        throw new Error(`Unsupported URL protocol in ${trimmed}: ${url.protocol}. Only http:// and https:// are supported.`);
    } catch (error) {
        if (error instanceof Error && error.message.startsWith('Unsupported URL protocol')) {
            throw error;
        }
    }

    // Invalid characters check
    if (/[<>"|?*\x00-\x1F]/.test(trimmed)) {
        throw new Error(`Invalid characters in NuGet source path: ${trimmed}`);
    }

    // Relative path - convert to absolute
    return resolve(workspaceRoot, trimmed);
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
    const command = [
        `dotnet nuget push`,
        `*.nupkg`,
        `--source {args.source}`,
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
    workspaceRoot: string
): boolean {
    const fullPath = joinPathFragments(workspaceRoot, csprojPath);

    if (!existsSync(fullPath)) {
        throw new Error(`File not found: ${csprojPath}`);
    }

    const content = readFileSync(fullPath, 'utf-8');

    return IS_PACKABLE_REGEX.test(content);
}