/**
 * ============================================
 * MOLTCHAIN - Autonomous Agent Daemon
 * ============================================
 * 
 * The main autonomous loop that runs continuously.
 * 
 * NO HUMAN INTERACTION REQUIRED.
 * 
 * This daemon:
 * 1. Scans for trending narratives (Farcaster + onchain)
 * 2. Uses LLM to decide what to deploy (ERC20, ERC1155, micro-dApps)
 * 3. Deploys contracts automatically
 * 4. Announces all actions on Farcaster
 * 5. Tracks engagement on deployed contracts
 * 6. Sunsets low-usage contracts
 * 7. Repeats forever
 */

import { validateEnv } from '../config/env.js';
import { detectSignals, canDeploy } from '../signals/detector.js';
import { deployContract } from '../deployer/deployer.js';
import {
    announcePreDeployment,
    announceDeployment,
    postStatusUpdate,
} from '../social/farcaster.js';
import {
    SIMPLE_ERC20_ABI,
    SIMPLE_ERC20_BYTECODE,
    COMMON_SUPPLIES,
} from '../contracts/erc20-template.js';
import {
    ERC1155_ABI,
    ERC1155_BYTECODE,
} from '../contracts/erc1155-template.js';
import {
    MICRO_DAPP_CONTRACTS,
    getVoteConstructorArgs,
    getRegistryConstructorArgs,
} from '../contracts/micro-dapps.js';
import { getDeploymentStats, loadMemory } from '../memory/deployments.js';
import { createWallet } from '../wallet/wallet.js';
import { analyzeAllDeployments } from '../engagement/tracker.js';
import { runSunsetAutomation, getSunsetStats } from '../sunset/automation.js';

// ============================================
// Configuration
// ============================================

/** Time between signal scans (10 minutes) */
const SCAN_INTERVAL_MS = 10 * 60 * 1000;

/** Time between engagement checks (30 minutes) */
const ENGAGEMENT_CHECK_INTERVAL_MS = 30 * 60 * 1000;

/** Time between status updates (1 hour) */
const STATUS_UPDATE_INTERVAL_MS = 60 * 60 * 1000;

// ============================================
// Daemon State
// ============================================

let isRunning = false;
let lastStatusUpdate = 0;
let lastEngagementCheck = 0;
let iterationCount = 0;

// ============================================
// Contract Type Selection
// ============================================

type ContractType = 'erc20' | 'erc1155' | 'vote' | 'registry';

/**
 * Decide what type of contract to deploy based on signal
 */
function selectContractType(narrative: string): ContractType {
    const lowerNarrative = narrative.toLowerCase();

    // Vote contracts for community decisions
    if (lowerNarrative.includes('vote') || lowerNarrative.includes('decide') || lowerNarrative.includes('poll')) {
        return 'vote';
    }

    // Registry for collections/memes
    if (lowerNarrative.includes('registry') || lowerNarrative.includes('list') || lowerNarrative.includes('catalog')) {
        return 'registry';
    }

    // ERC1155 for NFT-like collections
    if (lowerNarrative.includes('nft') || lowerNarrative.includes('collection') || lowerNarrative.includes('badge')) {
        return 'erc1155';
    }

    // Default to ERC20 for meme tokens
    return 'erc20';
}

// ============================================
// Main Loop Functions
// ============================================

/**
 * Execute one iteration of the autonomous loop.
 */
async function runIteration(): Promise<void> {
    iterationCount++;

    console.log('');
    console.log('═══════════════════════════════════════');
    console.log(`🦞 MOLTCHAIN DAEMON - Iteration #${iterationCount}`);
    console.log(`   Time: ${new Date().toISOString()}`);
    console.log('═══════════════════════════════════════');

    try {
        // Step 1: Check if we CAN deploy
        const { allowed, reason } = await canDeploy();
        if (!allowed) {
            console.log(`⏸️  Cannot deploy: ${reason}`);
            return;
        }

        // Step 2: Detect signals
        const signal = await detectSignals();

        if (!signal || !signal.shouldDeploy) {
            console.log('💤 No actionable signals. Waiting for next scan...');
            return;
        }

        // Step 3: Determine contract type
        const contractType = selectContractType(signal.narrative);
        const contractName = signal.suggestedToken?.name || 'Moltchain Contract';
        const contractSymbol = signal.suggestedToken?.symbol || 'MOLT';

        console.log('');
        console.log('🚀 AUTONOMOUS DEPLOYMENT TRIGGERED');
        console.log(`   Narrative: ${signal.narrative}`);
        console.log(`   Type: ${contractType.toUpperCase()}`);
        console.log(`   Name: ${contractName}`);
        console.log('');

        // Step 4: Announce pre-deployment
        await announcePreDeployment(contractName, 'base', signal.reason);

        // Step 5: Deploy based on contract type
        let result;

        switch (contractType) {
            case 'erc20':
                // Use Clanker for ERC20 - creates Uniswap pair automatically
                const { deployClankerToken, getUniswapLink } = await import('../clanker/deployer.js');
                const clankerResult = await deployClankerToken({
                    name: contractName,
                    symbol: contractSymbol,
                    description: signal.reason,
                    ownerAddress: (await import('../wallet/wallet.js')).getWalletAddress(),
                });
                result = {
                    address: clankerResult.tokenAddress as `0x${string}`,
                    transactionHash: '0x' as `0x${string}`, // Neynar doesn't return tx hash
                    explorerUrl: clankerResult.explorerLink,
                    txExplorerUrl: clankerResult.explorerLink,
                    chainId: 'base' as const,
                    timestamp: Date.now(),
                    uniswapLink: clankerResult.uniswapLink,
                };
                console.log(`   🔄 Uniswap: ${result.uniswapLink}`);
                break;

            case 'erc1155':
                result = await deployContract({
                    name: contractName,
                    chainId: 'base',
                    bytecode: ERC1155_BYTECODE,
                    abi: ERC1155_ABI,
                    args: [`https://moltchain.io/metadata/${Date.now()}/`],
                    reason: signal.reason,
                });
                break;

            case 'vote':
                result = await deployContract({
                    name: contractName,
                    chainId: 'base',
                    bytecode: MICRO_DAPP_CONTRACTS.vote.bytecode,
                    abi: MICRO_DAPP_CONTRACTS.vote.abi,
                    args: getVoteConstructorArgs({
                        title: contractName,
                        description: signal.reason,
                        durationSeconds: 86400, // 24 hours
                    }),
                    reason: signal.reason,
                });
                break;

            case 'registry':
                result = await deployContract({
                    name: contractName,
                    chainId: 'base',
                    bytecode: MICRO_DAPP_CONTRACTS.registry.bytecode,
                    abi: MICRO_DAPP_CONTRACTS.registry.abi,
                    args: getRegistryConstructorArgs({ name: contractName }),
                    reason: signal.reason,
                });
                break;
        }

        // Step 6: Announce success
        await announceDeployment(contractName, result);

        console.log('');
        console.log('✅ Autonomous deployment complete!');
        console.log(`   Type: ${contractType}`);
        console.log(`   Address: ${result.address}`);
        console.log('');

    } catch (error) {
        console.error('❌ Iteration error:', error);
    }
}

/**
 * Run engagement tracking and sunset automation
 */
async function runEngagementCheck(): Promise<void> {
    const now = Date.now();

    if (now - lastEngagementCheck < ENGAGEMENT_CHECK_INTERVAL_MS) {
        return;
    }

    lastEngagementCheck = now;

    console.log('');
    console.log('📊 ENGAGEMENT CHECK');
    console.log('===================');

    try {
        // Analyze all deployments
        const metrics = await analyzeAllDeployments();

        if (metrics.length > 0) {
            console.log(`   Analyzed ${metrics.length} contracts`);

            const highPerformers = metrics.filter(m => m.recommendation === 'promote');
            const sunsetCandidates = metrics.filter(m => m.recommendation === 'sunset');

            console.log(`   High performers: ${highPerformers.length}`);
            console.log(`   Sunset candidates: ${sunsetCandidates.length}`);
        }

        // Run sunset automation
        const sunsets = await runSunsetAutomation();

        if (sunsets.length > 0) {
            console.log(`   🌅 Sunset ${sunsets.length} contracts`);
        }

    } catch (error) {
        console.warn('⚠️ Engagement check error:', error);
    }
}

/**
 * Post periodic status updates
 */
async function postPeriodicStatus(): Promise<void> {
    const now = Date.now();

    if (now - lastStatusUpdate < STATUS_UPDATE_INTERVAL_MS) {
        return;
    }

    lastStatusUpdate = now;

    try {
        const stats = getDeploymentStats();
        const sunsetStats = getSunsetStats();
        const wallet = createWallet('base');
        const balance = await wallet.getBalance();

        const message = `Autonomous Agent Status

📊 Deployments: ${stats.total} total, ${stats.active} active, ${sunsetStats.total} sunset
💰 Wallet: ${balance} ETH
🔄 Iterations: ${iterationCount}
⏰ Uptime: Running continuously

Monitoring for Base narratives...`;

        await postStatusUpdate(message);
    } catch (error) {
        console.warn('⚠️ Failed to post status:', error);
    }
}

// ============================================
// Daemon Control
// ============================================

/**
 * Start the autonomous daemon.
 * This runs FOREVER until stopped.
 */
export async function startDaemon(): Promise<void> {
    console.log('');
    console.log('╔══════════════════════════════════════════════════════════╗');
    console.log('║           🦞 MOLTCHAIN AUTONOMOUS AGENT                  ║');
    console.log('║                                                          ║');
    console.log('║  Running autonomously. No human interaction required.    ║');
    console.log('║                                                          ║');
    console.log('║  Features:                                               ║');
    console.log('║  • Detects narratives from Farcaster                     ║');
    console.log('║  • Deploys ERC20, ERC1155, Vote, Registry contracts      ║');
    console.log('║  • Tracks engagement on all deployments                  ║');
    console.log('║  • Sunsets low-usage contracts automatically             ║');
    console.log('║  • Announces all actions publicly                        ║');
    console.log('║                                                          ║');
    console.log('║  Press Ctrl+C to stop                                    ║');
    console.log('╚══════════════════════════════════════════════════════════╝');
    console.log('');

    // Validate environment
    validateEnv();

    // Show wallet info
    const wallet = createWallet('base');
    const balance = await wallet.getBalance();
    const stats = getDeploymentStats();

    console.log(`📍 Wallet: ${wallet.address}`);
    console.log(`💰 Balance: ${balance} ETH`);
    console.log(`📊 Past deployments: ${stats.total} (${stats.active} active)`);
    console.log('');

    // Post startup announcement
    await postStatusUpdate(`Agent starting up! Running autonomously on Base. Full feature set active: ERC20, ERC1155, Vote contracts, Registries, Engagement tracking, Sunset automation. 🦞`);

    isRunning = true;
    lastStatusUpdate = Date.now();
    lastEngagementCheck = Date.now() - ENGAGEMENT_CHECK_INTERVAL_MS + 60000; // Check 1 min after start

    // Main loop
    while (isRunning) {
        await runIteration();
        await runEngagementCheck();
        await postPeriodicStatus();

        console.log(`⏳ Next scan in ${SCAN_INTERVAL_MS / 60000} minutes...`);
        await sleep(SCAN_INTERVAL_MS);
    }
}

/**
 * Stop the daemon gracefully
 */
export function stopDaemon(): void {
    console.log('');
    console.log('🛑 Stopping daemon...');
    isRunning = false;
}

/**
 * Sleep helper
 */
function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================
// Entry Point
// ============================================

import { parseArgs } from 'util';

async function main() {
    const { values } = parseArgs({
        options: {
            task: { type: 'string', short: 't' },
            once: { type: 'boolean', short: 'o', default: false }
        }
    });

    // Handle graceful shutdown
    process.on('SIGINT', () => {
        stopDaemon();
        process.exit(0);
    });

    process.on('SIGTERM', () => {
        stopDaemon();
        process.exit(0);
    });

    if (values.task) {
        console.log(`🚀 Executing one-time task: ${values.task}`);
        validateEnv();

        switch (values.task) {
            case 'narrative':
                await runIteration();
                break;
            case 'engagement':
                await runEngagementCheck();
                break;
            case 'status':
                await postPeriodicStatus();
                break;
            default:
                console.error(`❌ Unknown task: ${values.task}`);
                process.exit(1);
        }
        process.exit(0);
    } else {
        // Start the daemon if run directly without task
        startDaemon().catch(console.error);
    }
}

main().catch(console.error);
