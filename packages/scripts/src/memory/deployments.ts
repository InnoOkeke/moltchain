/**
 * ============================================
 * MOLTCHAIN - Deployment Memory
 * ============================================
 * 
 * Tracks all deployments made by the agent.
 * Stores deployment history in a JSON file for:
 * - Audit trail
 * - Decision context
 * - Social post references
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import type { Address, Hash } from 'viem';
import type { ChainId } from '../config/chains.js';

// ============================================
// Types
// ============================================

/**
 * Record of a single deployment
 */
export interface DeploymentRecord {
    /** Friendly name of the deployment */
    name: string;

    /** Token symbol */
    symbol?: string;

    /** The deployed contract address */
    address: string;

    /** The deployment transaction hash */
    transactionHash?: string;
    txHash?: string;

    /** Block explorer URL for the contract */
    explorerUrl?: string;

    /** Block explorer URL for the transaction */
    txExplorerUrl?: string;

    /** The chain it was deployed to */
    chainId: string;

    /** Timestamp of deployment (ms since epoch) */
    timestamp: number;

    /** Why this was deployed */
    reason: string;

    /** Deployment status */
    status?: 'active' | 'sunset';

    /** Deployment type */
    type?: 'clanker' | 'direct' | string;

    /** Additional metadata */
    metadata?: Record<string, unknown>;

    /** Engagement metrics (updated over time) */
    engagement?: {
        transactions: number;
        uniqueUsers: number;
        lastActivity: number;
    };

    /** Whether this contract has been sunset (deprecated, use status) */
    sunset?: boolean;
}

/**
 * The full deployment history
 */
export interface DeploymentMemory {
    /** Schema version for migrations */
    version: number;

    /** When this memory was last updated */
    lastUpdated: number;

    /** All deployments, newest first */
    deployments: DeploymentRecord[];
}

// ============================================
// File Path
// ============================================

/**
 * Path to the deployments.json file.
 * Located in the memory/ folder in project root.
 */
const MEMORY_FILE = resolve(process.cwd(), 'memory', 'deployments.json');

// ============================================
// Memory Operations
// ============================================

/**
 * Load the deployment memory from disk.
 * Creates a new empty memory if file doesn't exist.
 * 
 * @returns The deployment memory
 */
export function loadMemory(): DeploymentMemory {
    if (!existsSync(MEMORY_FILE)) {
        return {
            version: 1,
            lastUpdated: Date.now(),
            deployments: [],
        };
    }

    try {
        const content = readFileSync(MEMORY_FILE, 'utf-8');
        return JSON.parse(content) as DeploymentMemory;
    } catch (error) {
        console.warn('Warning: Could not load memory file, starting fresh');
        return {
            version: 1,
            lastUpdated: Date.now(),
            deployments: [],
        };
    }
}

/**
 * Save the deployment memory to disk.
 * Creates the memory directory if it doesn't exist.
 * 
 * @param memory - The memory to save
 */
export function saveMemory(memory: DeploymentMemory): void {
    // Ensure the directory exists
    const dir = dirname(MEMORY_FILE);
    if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
    }

    // Update the lastUpdated timestamp
    memory.lastUpdated = Date.now();

    // Write with pretty formatting for readability
    writeFileSync(MEMORY_FILE, JSON.stringify(memory, null, 2), 'utf-8');
}

/**
 * Save a new deployment to memory.
 * Adds the deployment to the front of the list.
 * 
 * @param deployment - The deployment to record
 */
export async function saveDeployment(deployment: DeploymentRecord): Promise<void> {
    const memory = loadMemory();

    // Add to front of list (newest first)
    memory.deployments.unshift(deployment);

    saveMemory(memory);

    console.log(`📦 Deployment saved to memory: ${deployment.name}`);
}

/**
 * Get all deployments for a specific chain.
 * 
 * @param chainId - The chain to filter by
 * @returns Deployments for that chain
 */
export function getDeploymentsByChain(chainId: ChainId): DeploymentRecord[] {
    const memory = loadMemory();
    return memory.deployments.filter(d => d.chainId === chainId);
}

/**
 * Get the most recent deployment.
 * 
 * @returns The most recent deployment, or undefined if none
 */
export function getLatestDeployment(): DeploymentRecord | undefined {
    const memory = loadMemory();
    return memory.deployments[0];
}

/**
 * Get all active (non-sunset) deployments.
 * 
 * @returns Active deployments
 */
export function getActiveDeployments(): DeploymentRecord[] {
    const memory = loadMemory();
    return memory.deployments.filter(d => !d.sunset);
}

/**
 * Mark a deployment as sunset (deprecated).
 * Used when a contract has low usage and is being retired.
 * 
 * @param address - The contract address to sunset
 */
export function sunsetDeployment(address: Address): void {
    const memory = loadMemory();

    const deployment = memory.deployments.find(d => d.address === address);
    if (deployment) {
        deployment.sunset = true;
        saveMemory(memory);
        console.log(`🌅 Deployment sunset: ${deployment.name} (${address})`);
    }
}

/**
 * Get deployment statistics.
 * Useful for social posts and reporting.
 */
export function getDeploymentStats(): {
    total: number;
    active: number;
    sunset: number;
    byChain: Record<string, number>;
} {
    const memory = loadMemory();

    const byChain: Record<string, number> = {};
    for (const d of memory.deployments) {
        byChain[d.chainId] = (byChain[d.chainId] || 0) + 1;
    }

    return {
        total: memory.deployments.length,
        active: memory.deployments.filter(d => !d.sunset).length,
        sunset: memory.deployments.filter(d => d.sunset).length,
        byChain,
    };
}
