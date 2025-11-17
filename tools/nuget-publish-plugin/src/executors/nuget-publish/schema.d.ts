export interface NugetPublishExecutorSchema {
    packagePath?: string;
    source?: string;
    apiKey?: string;
    dryRun?: boolean;
    configuration?: string;
    skipDuplicate?: boolean;
    dryRunSource?: string;
}