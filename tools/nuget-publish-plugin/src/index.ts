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
 * Source and API key are passed via NUGET_SOURCE and NUGET_API_KEY environment variables.
 * 
 * @example Usage with nx release
 * ```bash
 * # Publish to local
 * NUGET_SOURCE=local-feed nx release
 * 
 * # Publish to production
 * NUGET_SOURCE=https://api.nuget.org/v3/index.json NUGET_API_KEY=xxx nx release
 * ```
 * 
 * @example Direct target execution
 * ```bash
 * NUGET_SOURCE=local-feed nx run my-lib:nx-release-publish
 * NUGET_SOURCE=https://api.nuget.org/v3/index.json NUGET_API_KEY=xxx nx run my-lib:nx-release-publish
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
    const isWindows = process.platform === 'win32';
    const sourceArg = isWindows ? '%NUGET_SOURCE%' : '$NUGET_SOURCE';
    const apiKeyArg = isWindows ? '%NUGET_API_KEY%' : '$NUGET_API_KEY';

    const command = [
        `dotnet nuget push`,
        `*.nupkg`,
        `--source ${sourceArg}`,
        `--api-key ${apiKeyArg}`,
        `--skip-duplicate`,
    ].join(' ');

    const targetConfig: TargetConfiguration = {
        executor: 'nx:run-commands',
        options: {
            command,
            cwd: '{projectRoot}/bin/Release',
        },
        dependsOn: [options.packTargetName],
        inputs: [
            '{projectRoot}/bin/Release/**/*.nupkg'
        ],
        outputs: [],
    };

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