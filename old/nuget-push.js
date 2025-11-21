#!/usr/bin/env node
const { execSync } = require('child_process');
const path = require('path');

const source = process.env.NUGET_SOURCE || process.argv[2];
const apiKey = process.env.NUGET_API_KEY || 'no-key';
const cwd = process.argv[3] || process.cwd();

if (!source) {
    console.error('Error: No NuGet source specified');
    process.exit(1);
}

const command = [
    'dotnet nuget push',
    '*.nupkg',
    `--source ${source}`,
    `--api-key ${apiKey}`,
    '--skip-duplicate',
].join(' ');

console.log(`Publishing to: ${source}`);
execSync(command, { cwd, stdio: 'inherit' });

// In the plugin configuration:
// command: `node tools/scripts/nuget-push.js "${defaultSourceUrl}" "{projectRoot}/bin/Release"`