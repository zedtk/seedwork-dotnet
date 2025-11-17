export interface NugetPublishExecutorSchema {
    projectPath: string;
    source?: string;
    apiKey?: string;
    dryRun?: boolean;
    configuration?: string;
    skipBuild?: boolean;
    outputPath?: string;
}