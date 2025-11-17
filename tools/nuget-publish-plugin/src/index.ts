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

    // Check if it's a packable project
    if (!isPackableProject(configFilePath, context)) {
        return {};
    }

    // Get configuration from plugin options
    const targetName = options.targetName ?? 'nuget-publish';
    const source = options.source ?? 'https://api.nuget.org/v3/index.json';
    const dryRun = options.dryRun ?? false;
    const buildTargetName = options.buildTargetName ?? 'build';

    // Create the publish target
    const publishTarget: TargetConfiguration = {
        executor: '@zedtk/nuget-publish-plugin:nuget-publish',
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
 * Check if a .csproj file represents a packable project
 */
function isPackableProject(
    csprojPath: string,
    context: CreateNodesContextV2
): boolean {
    // Check if the csproj file contains <IsPackable>true</IsPackable>
    const fullPath = joinPathFragments(context.workspaceRoot, csprojPath);

    try {
        if (!existsSync(fullPath)) {
            return false;
        }

        const content = readFileSync(fullPath, 'utf-8');

        const isPackable = content.toLowerCase().includes('<ispackable>true</ispackable>');
        return isPackable;
    } catch (error) {
        // If we can't read the file, assume it's not packable
        return false;
    }
}
