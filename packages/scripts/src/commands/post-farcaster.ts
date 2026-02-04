/**
 * ============================================
 * MOLTCHAIN - Post Farcaster Command
 * ============================================
 * 
 * CLI command to post a cast to Farcaster.
 * This is called by OpenClaw skills or manually.
 * 
 * Usage:
 *   pnpm post:farcaster --message "Hello from Moltchain!"
 */

import { parseArgs } from 'util';
import { postStatusUpdate } from '../social/farcaster.js';
import { validateEnv } from '../config/env.js';

async function main(): Promise<void> {
    console.log('');
    console.log('🦞 MOLTCHAIN - Farcaster Posting');
    console.log('================================');
    console.log('');

    // Step 1: Validate environment
    try {
        validateEnv();
    } catch (error) {
        console.error('❌ Environment validation failed:');
        console.error(error instanceof Error ? error.message : error);
        process.exit(1);
    }

    // Step 2: Parse arguments
    const { values } = parseArgs({
        options: {
            message: { type: 'string', short: 'm' },
        },
    });

    if (!values.message) {
        console.error('❌ Missing required argument: --message "Your message"');
        process.exit(1);
    }

    // Step 3: Post the cast
    const result = await postStatusUpdate(values.message);

    // Step 4: Print summary
    if (result.success) {
        console.log('');
        console.log('✅ Cast posted successfully!');
        console.log(`   Hash: ${result.castHash}`);
        console.log('');
    } else {
        console.error('❌ Failed to post cast:', result.error);
        process.exit(1);
    }
}

// Run the command
main().catch((error) => {
    console.error('❌ Execution failed:', error);
    process.exit(1);
});
