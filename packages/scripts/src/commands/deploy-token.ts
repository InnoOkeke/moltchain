/**
 * ============================================
 * MOLTCHAIN - Deploy Token Command
 * ============================================
 * 
 * CLI command to deploy an ERC20 token to a chain.
 * This is called by OpenClaw skills or manually.
 * 
 * Usage:
 *   pnpm deploy:token --chain base --name "My Token" --symbol "MTK"
 *   pnpm deploy:token --chain monad --name "Monad Meme" --symbol "MEME"
 */

import { parseArgs } from 'util';
import { deployContract } from '../deployer/deployer.js';
import { announcePreDeployment, announceDeployment } from '../social/farcaster.js';
import {
    SIMPLE_ERC20_ABI,
    SIMPLE_ERC20_BYTECODE,
    COMMON_SUPPLIES,
    type TokenConfig,
} from '../contracts/erc20-template.js';
import { type ChainId, SUPPORTED_CHAINS } from '../config/chains.js';
import { validateEnv } from '../config/env.js';

// ============================================
// CLI Argument Parsing
// ============================================

interface DeployTokenArgs {
    chain: ChainId;
    name: string;
    symbol: string;
    supply?: string;
    reason?: string;
    announce?: boolean;
}

/**
 * Parse command line arguments for token deployment.
 */
function parseDeployArgs(): DeployTokenArgs {
    const { values } = parseArgs({
        options: {
            chain: { type: 'string', short: 'c' },
            name: { type: 'string', short: 'n' },
            symbol: { type: 'string', short: 's' },
            supply: { type: 'string', default: '1000000' },
            reason: { type: 'string', short: 'r' },
            announce: { type: 'boolean', short: 'a', default: true },
        },
    });

    // Validate required arguments
    if (!values.chain) {
        console.error('❌ Missing required argument: --chain (base or monad)');
        process.exit(1);
    }

    if (!Object.keys(SUPPORTED_CHAINS).includes(values.chain)) {
        console.error(`❌ Invalid chain: ${values.chain}. Use: base or monad`);
        process.exit(1);
    }

    if (!values.name) {
        console.error('❌ Missing required argument: --name "Token Name"');
        process.exit(1);
    }

    if (!values.symbol) {
        console.error('❌ Missing required argument: --symbol "TKN"');
        process.exit(1);
    }

    return {
        chain: values.chain as ChainId,
        name: values.name,
        symbol: values.symbol.toUpperCase(),
        supply: values.supply,
        reason: values.reason,
        announce: values.announce,
    };
}

// ============================================
// Main Execution
// ============================================

async function main(): Promise<void> {
    console.log('');
    console.log('🦞 MOLTCHAIN - Token Deployment');
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
    const args = parseDeployArgs();

    console.log('📋 Deployment Configuration:');
    console.log(`   Chain:  ${args.chain}`);
    console.log(`   Name:   ${args.name}`);
    console.log(`   Symbol: ${args.symbol}`);
    console.log(`   Supply: ${args.supply}`);
    console.log(`   Reason: ${args.reason || 'Manual deployment'}`);
    console.log('');

    // Step 3: Calculate total supply
    // Convert supply string to BigInt with 18 decimals
    const supplyNumber = parseInt(args.supply || '1000000', 10);
    const totalSupply = BigInt(supplyNumber) * BigInt(10 ** 18);

    // Step 4: Announce pre-deployment (if enabled)
    if (args.announce) {
        await announcePreDeployment(
            args.name,
            args.chain,
            args.reason || 'Autonomous deployment triggered'
        );
    }

    // Step 5: Deploy the token
    const result = await (await import('../deployer/deployer.js')).deployContract({
        name: args.name,
        chainId: args.chain,
        bytecode: SIMPLE_ERC20_BYTECODE,
        abi: SIMPLE_ERC20_ABI,
        args: [args.name, args.symbol, totalSupply],
        reason: args.reason,
    });

    // Step 6: Announce successful deployment
    if (args.announce) {
        await announceDeployment(args.name, result);
    }

    // Step 7: Print summary
    console.log('');
    console.log('🎉 Token deployment complete!');
    console.log('');
    console.log('Next steps:');
    console.log(`1. View contract: ${result.explorerUrl}`);
    console.log(`2. Add to wallet: ${result.address}`);
    console.log('');
}

// Run the command
main().catch((error) => {
    console.error('❌ Deployment failed:', error);
    process.exit(1);
});
