/**
 * ============================================
 * MOLTCHAIN - Engagement Tracking
 * ============================================
 * 
 * Tracks onchain usage and social engagement of deployed contracts.
 * Uses this data to decide on iterations and sunsets.
 * 
 * Metrics tracked:
 * - Transfer count (ERC20/ERC1155)
 * - Unique holders
 * - Social mentions
 */

import { createPublicClient, http, parseAbiItem, type Address } from 'viem';
import { baseMainnet } from '../config/chains.js';
import { loadMemory, type DeploymentRecord } from '../memory/deployments.js';
import { env } from '../config/env.js';

// ============================================
// Types
// ============================================

export interface EngagementMetrics {
    /** Contract address */
    address: Address;

    /** Deployment name */
    name: string;

    /** Number of transfers since deployment */
    transferCount: number;

    /** Number of unique holders */
    uniqueHolders: number;

    /** Engagement score (0-100) */
    engagementScore: number;

    /** Whether this contract is performing well */
    isPerforming: boolean;

    /** Recommendation: 'keep' | 'sunset' | 'promote' */
    recommendation: 'keep' | 'sunset' | 'promote';

    /** Last checked timestamp */
    checkedAt: number;
}

// ============================================
// Onchain Metrics
// ============================================

const publicClient = createPublicClient({
    chain: baseMainnet,
    transport: http(),
});

// ERC20 Transfer event signature
const TRANSFER_EVENT = parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 value)');

/**
 * Get transfer count for an ERC20 contract
 */
async function getTransferCount(contractAddress: Address, fromBlock: bigint): Promise<number> {
    try {
        const logs = await publicClient.getLogs({
            address: contractAddress,
            event: TRANSFER_EVENT,
            fromBlock,
            toBlock: 'latest',
        });
        return logs.length;
    } catch (error) {
        console.warn(`⚠️ Could not fetch transfers for ${contractAddress}`);
        return 0;
    }
}

/**
 * Get unique holder count for an ERC20 contract
 */
async function getUniqueHolders(contractAddress: Address, fromBlock: bigint): Promise<number> {
    try {
        const logs = await publicClient.getLogs({
            address: contractAddress,
            event: TRANSFER_EVENT,
            fromBlock,
            toBlock: 'latest',
        });

        const holders = new Set<string>();
        for (const log of logs) {
            if (log.args && 'to' in log.args) {
                holders.add(log.args.to as string);
            }
        }
        return holders.size;
    } catch (error) {
        return 0;
    }
}

// ============================================
// Social Metrics
// ============================================

/**
 * Check Farcaster mentions of a contract
 */
async function getSocialMentions(contractAddress: string): Promise<number> {
    try {
        // Search for casts mentioning this address
        const response = await fetch(
            `https://api.neynar.com/v2/farcaster/cast/search?q=${contractAddress.slice(0, 10)}&limit=50`,
            {
                headers: { 'api_key': env.neynarApiKey },
            }
        );

        if (!response.ok) return 0;

        const data = await response.json() as { result: { casts: unknown[] } };
        return data.result?.casts?.length || 0;
    } catch {
        return 0;
    }
}

// ============================================
// Engagement Analysis
// ============================================

/**
 * Calculate engagement score from metrics
 */
function calculateEngagementScore(
    transferCount: number,
    uniqueHolders: number,
    socialMentions: number,
    daysSinceDeployment: number
): number {
    // Weight factors
    const transferWeight = 0.4;
    const holderWeight = 0.3;
    const socialWeight = 0.3;

    // Normalize metrics (expect ~10 transfers, 5 holders, 3 mentions per day)
    const expectedDaily = {
        transfers: 10,
        holders: 5,
        mentions: 3,
    };

    const days = Math.max(daysSinceDeployment, 1);

    const normalizedTransfers = Math.min(transferCount / (expectedDaily.transfers * days), 1);
    const normalizedHolders = Math.min(uniqueHolders / (expectedDaily.holders * days), 1);
    const normalizedSocial = Math.min(socialMentions / (expectedDaily.mentions * days), 1);

    const score = (
        normalizedTransfers * transferWeight +
        normalizedHolders * holderWeight +
        normalizedSocial * socialWeight
    ) * 100;

    return Math.round(score);
}

/**
 * Analyze engagement for a single deployment
 */
export async function analyzeEngagement(deployment: DeploymentRecord): Promise<EngagementMetrics> {
    console.log(`📊 Analyzing engagement for ${deployment.name}...`);

    const contractAddress = deployment.address as Address;
    const deployBlock = BigInt(1); // Would need to store block number in deployment

    // Get onchain metrics
    const [transferCount, uniqueHolders] = await Promise.all([
        getTransferCount(contractAddress, deployBlock),
        getUniqueHolders(contractAddress, deployBlock),
    ]);

    // Get social metrics
    const socialMentions = await getSocialMentions(deployment.address);

    // Calculate score
    const daysSinceDeployment = (Date.now() - deployment.timestamp) / (1000 * 60 * 60 * 24);
    const engagementScore = calculateEngagementScore(
        transferCount,
        uniqueHolders,
        socialMentions,
        daysSinceDeployment
    );

    // Determine recommendation
    let recommendation: 'keep' | 'sunset' | 'promote';
    let isPerforming: boolean;

    if (engagementScore >= 50) {
        recommendation = 'promote';
        isPerforming = true;
    } else if (engagementScore >= 20) {
        recommendation = 'keep';
        isPerforming = true;
    } else {
        recommendation = 'sunset';
        isPerforming = false;
    }

    // Don't sunset contracts less than 24 hours old
    if (daysSinceDeployment < 1 && recommendation === 'sunset') {
        recommendation = 'keep';
    }

    return {
        address: contractAddress,
        name: deployment.name,
        transferCount,
        uniqueHolders,
        engagementScore,
        isPerforming,
        recommendation,
        checkedAt: Date.now(),
    };
}

/**
 * Analyze all active deployments
 */
export async function analyzeAllDeployments(): Promise<EngagementMetrics[]> {
    const memory = loadMemory();
    const activeDeployments = memory.deployments.filter(d => d.status === 'active');

    console.log(`\n📊 Analyzing ${activeDeployments.length} active deployments...`);

    const results: EngagementMetrics[] = [];

    for (const deployment of activeDeployments) {
        const metrics = await analyzeEngagement(deployment);
        results.push(metrics);
    }

    return results;
}

/**
 * Get contracts recommended for sunset
 */
export async function getSunsetCandidates(): Promise<EngagementMetrics[]> {
    const allMetrics = await analyzeAllDeployments();
    return allMetrics.filter(m => m.recommendation === 'sunset');
}

/**
 * Get high-performing contracts
 */
export async function getHighPerformers(): Promise<EngagementMetrics[]> {
    const allMetrics = await analyzeAllDeployments();
    return allMetrics.filter(m => m.recommendation === 'promote');
}
