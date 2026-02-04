/**
 * ============================================
 * MOLTCHAIN - Environment Configuration Loader
 * ============================================
 * 
 * Securely loads and validates environment variables.
 * All sensitive data (API keys, private keys) are loaded
 * from .env file and NEVER hardcoded.
 * 
 * SECURITY NOTES:
 * - Never log or expose these values
 * - Never commit .env to version control
 * - Use .env.example as a template
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env file
// Looks in project root (two levels up from this file)
config({ path: resolve(process.cwd(), '.env') });

// ============================================
// Environment Variable Helpers
// ============================================

/**
 * Get a required environment variable.
 * Throws an error if the variable is missing.
 * 
 * @param key - The environment variable name
 * @returns The environment variable value
 * @throws Error if the variable is not set
 */
function getRequired(key: string): string {
    const value = process.env[key];

    if (!value) {
        throw new Error(
            `Missing required environment variable: ${key}\n` +
            `Please add it to your .env file. See .env.example for reference.`
        );
    }

    return value;
}

/**
 * Get an optional environment variable with a default value.
 * 
 * @param key - The environment variable name
 * @param defaultValue - The default value if not set
 * @returns The environment variable value or default
 */
function getOptional(key: string, defaultValue: string): string {
    return process.env[key] || defaultValue;
}

// ============================================
// Exported Configuration
// ============================================

/**
 * All environment configuration in one place.
 * Import this object to access any config value.
 * 
 * @example
 * import { env } from './config/env';
 * 
 * const client = new Groq({ apiKey: env.groqApiKey });
 */
export const env = {
    // -----------------------
    // LLM Configuration
    // -----------------------

    /** Groq API key for LLM calls (required) */
    groqApiKey: getRequired('GROQ_API_KEY'),

    // -----------------------
    // Blockchain Configuration
    // -----------------------

    /** Base Sepolia RPC URL */
    baseSepoliaRpcUrl: getOptional('BASE_SEPOLIA_RPC_URL', 'https://sepolia.base.org'),

    /** Wallet private key (required for deployments) */
    privateKey: getRequired('PRIVATE_KEY'),

    // -----------------------
    // Social Configuration
    // -----------------------

    /** Neynar API key for Farcaster (required) */
    neynarApiKey: getRequired('NEYNAR_API_KEY'),

    /** Farcaster signer UUID from Neynar (required for posting) */
    farcasterSignerUuid: getOptional('FARCASTER_SIGNER_UUID', ''),

    // -----------------------
    // Optional APIs
    // -----------------------

    /** BaseScan API key for contract verification */
    basescanApiKey: getOptional('BASESCAN_API_KEY', ''),
} as const;

/**
 * Validate that all required environment variables are set.
 * Call this at application startup to fail fast.
 * 
 * @throws Error if any required variable is missing
 */
export function validateEnv(): void {
    console.log('🔐 Validating environment configuration...');

    // These will throw if not set (already validated by getRequired)
    // But we call them here to provide a clear startup check
    const requiredVars = [
        'GROQ_API_KEY',
        'PRIVATE_KEY',
        'NEYNAR_API_KEY',
    ];

    const missing = requiredVars.filter(key => !process.env[key]);

    if (missing.length > 0) {
        throw new Error(
            `Missing required environment variables:\n` +
            missing.map(k => `  - ${k}`).join('\n') +
            `\n\nPlease copy .env.example to .env and fill in your values.`
        );
    }

    console.log('✅ Environment configuration valid');
}
