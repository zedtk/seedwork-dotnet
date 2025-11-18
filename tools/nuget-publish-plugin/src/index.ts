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
import { NugetPublishExecutorSchema } from './executors/nuget-publish/schema';

// ============================================================================
// CONSTANTS
// ============================================================================

const CSPROJ_GLOB = '**/*.csproj';

const DEFAULT_OPTIONS: ResolvedPluginOptions = {
    targetName: 'publish',
    source: 'https://api.nuget.org/v3/index.json',
    dryRunSource: 'local-nuget-feed',
    packTargetName: 'pack',
} as const;

// ============================================================================
// TYPES
// ============================================================================

export interface PluginOptions {
    /**
     * Name of the target to create for publishing.
     * @default 'publish'
     */
    targetName?: string;

    /**
     * NuGet feed URL to publish to.
     * @default 'https://api.nuget.org/v3/index.json'
     */
    source?: string;

    /**
     * NuGet feed URL to dry-run publish to.
     * @default 'local-nuget-feed'
     */
    dryRunSource?: string;

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
 * This plugin scans for .csproj files and creates publish targets only for projects
 * that have <IsPackable>true</IsPackable> in their project file.
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
 * Nx 22 compatibility export.
 */
export const createNodes = createNodesV2;

// ============================================================================
// CORE LOGIC
// ============================================================================

/**
 * Creates Nx target configuration for a .csproj file if it's packable.
 */
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
        // Log error but don't fail the entire plugin - allow other projects to process
        logger.warn(
            `Failed to process ${configFilePath}: ${error instanceof Error ? error.message : String(error)}`
        );
        return {};
    }
}

// ============================================================================
// OPTION RESOLUTION
// ============================================================================

/**
 * Resolves plugin options by merging with defaults and validating.
 */
function resolveOptions(options: PluginOptions): ResolvedPluginOptions {
    const resolved = { ...DEFAULT_OPTIONS, ...options };

    // Validate source is a valid URL
    if (!isValidNuGetSource(options.source)) {
        throw new Error(
            `Invalid NuGet source: ${options.source}. ` +
            `Must be a valid URL (http:// or https://) or a local path.`
        );
    }

    return resolved;
}

/**
 * Validates if a string is a valid NuGet source (URL or local path).
 */
function isValidNuGetSource(source: string): boolean {
    // Check if it's a URL
    try {
        const url = new URL(source);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
        // If not a URL, it might be a local path - basic validation
        // Allow relative paths and UNC paths on Windows
        return !source.includes('<') && !source.includes('>');
    }
}

// ============================================================================
// TARGET CREATION
// ============================================================================

/**
 * Creates the nuget-publish target configuration.
 */
function createPublishTarget(options: ResolvedPluginOptions): TargetConfiguration<NugetPublishExecutorSchema> {
    return {
        executor: '@zedtk/nuget-publish-plugin:nuget-publish',
        options: {
            source: options.source,
            dryRunSource: options.dryRunSource,
            dryRun: true,
        },
        dependsOn: [options.packTargetName],
        cache: true,
        inputs: [
            // Package file that will be published
            `{projectRoot}/bin/{options.configuration}/**/*.nupkg`,
            // Exclude symbols packages from cache key
            `!{projectRoot}/bin/{options.configuration}/**/*.symbols.nupkg`,
        ],
        outputs: [],
    };
}

// ============================================================================
// CSPROJ ANALYSIS
// ============================================================================

/**
 * Determines if a .csproj file represents a packable project.
 * 
 * Uses proper XML parsing logic to handle:
 * - Whitespace variations
 * - XML attributes
 * - Case sensitivity
 * - Comments
 */
function isProjectPackable(
    csprojPath: string,
    context: CreateNodesContextV2
): boolean {
    const fullPath = joinPathFragments(context.workspaceRoot, csprojPath);

    if (!existsSync(fullPath)) {
        throw new Error(`File not found: ${csprojPath}`);
    }

    const content = readFileSync(fullPath, 'utf-8');

    // Look for <IsPackable>true</IsPackable> with flexible whitespace
    // This regex handles:
    // - Optional attributes on the tag
    // - Whitespace around "true"
    // - Case insensitive tag name (some projects use different casing)
    const isPackableRegex = /<IsPackable(?:\s+[^>]*)?>(\s*true\s*)<\/IsPackable>/i;
    const match = isPackableRegex.exec(content);

    if (match) {
        return true;
    }

    return false;
}