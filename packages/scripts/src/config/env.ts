import { config } from 'dotenv';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

/**
 * Finds the project root by looking for pnpm-workspace.yaml or package.json
 */
function findProjectRoot(startDir: string): string {
    let current = startDir;
    while (current !== dirname(current)) {
        if (fs.existsSync(join(current, 'pnpm-workspace.yaml')) || fs.existsSync(join(current, 'pnpm-lock.yaml'))) {
            return current;
        }
        current = dirname(current);
    }
    return startDir;
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = findProjectRoot(__dirname);
const envPath = join(root, '.env');

console.log(`🔍 Project Root: ${root}`);
console.log(`🔍 Loading .env from: ${envPath}`);

if (fs.existsSync(envPath)) {
    config({ path: envPath });
    console.log('✅ .env loaded');
} else {
    // Fallback to current working directory
    config();
}

export const env = {
    groqApiKey: process.env.GROQ_API_KEY || '',
    neynarApiKey: process.env.NEYNAR_API_KEY || '',
    privateKey: process.env.PRIVATE_KEY || '',
    farcasterSignerUuid: process.env.FARCASTER_SIGNER_UUID || '',
    basescanApiKey: process.env.BASESCAN_API_KEY || '',
} as const;

export function validateEnv(): void {
    const required = ['GROQ_API_KEY', 'NEYNAR_API_KEY'];
    const missing = required.filter(k => !process.env[k]);

    if (missing.length > 0) {
        console.error(`❌ Missing Required Env Variables: ${missing.join(', ')}`);
        console.error('💡 Ensure these are set in your .env file or as Fly.io secrets.');
        process.exit(1);
    }

    // Check for common interpolation errors (literal "${VAR}")
    const suspicious = Object.entries(process.env).filter(([k, v]) => v?.startsWith('${') && v?.endsWith('}'));
    if (suspicious.length > 0) {
        console.warn('⚠️  Suspicious environment variables detected (looks like literal interpolation):');
        suspicious.forEach(([k, v]) => console.warn(`   - ${k}=${v}`));
        console.warn('💡 This usually means your config file is trying to interpolate variables that aren\'t set.');
    }

    if (!process.env.PRIVATE_KEY && !process.env.FARCASTER_SIGNER_UUID) {
        console.error('❌ Identity Error: Must provide either PRIVATE_KEY or FARCASTER_SIGNER_UUID.');
        console.error('💡 For Farcaster identity, ensure FARCASTER_SIGNER_UUID is set correctly.');
        process.exit(1);
    }

    console.log('✅ Environment Validation Complete');
}
