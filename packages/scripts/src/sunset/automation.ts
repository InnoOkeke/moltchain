/**
 * ============================================
 * MOLTCHAIN - Sunset Automation
 * ============================================
 * 
 * Automatically retires low-usage contracts.
 * 
 * Sunset process:
 * 1. Detect low-engagement contracts
 * 2. Announce sunset publicly
 * 3. Mark as sunset in memory
 * 4. Optionally withdraw remaining funds
 */

import { loadMemory, saveMemory, type DeploymentRecord } from '../memory/deployments.js';
import { getSunsetCandidates, type EngagementMetrics } from '../engagement/tracker.js';
import { announceSunset, postStatusUpdate } from '../social/farcaster.js';

// ============================================
// Types
// ============================================

export interface SunsetResult {
    address: string;
    name: string;
    reason: string;
    sunsetAt: number;
    announced: boolean;
}

// ============================================
// Sunset Logic
// ============================================

/**
 * Process a single contract sunset
 */
async function processSunset(
    deployment: DeploymentRecord,
    metrics: EngagementMetrics
): Promise<SunsetResult> {
    console.log(`\n🌅 Processing sunset for ${deployment.name}...`);

    const reason = `Low engagement: ${metrics.transferCount} transfers, ${metrics.uniqueHolders} holders, score: ${metrics.engagementScore}/100`;

    // Step 1: Update memory to mark as sunset
    const memory = loadMemory();
    const deploymentIndex = memory.deployments.findIndex(d => d.address === deployment.address);

    if (deploymentIndex !== -1) {
        memory.deployments[deploymentIndex].status = 'sunset';
        memory.deployments[deploymentIndex].reason = reason;
        saveMemory(memory);
    }

    // Step 2: Announce on Farcaster
    let announced = false;
    try {
        await announceSunset(deployment.name, 'base', reason);
        announced = true;
        console.log('   📣 Sunset announced on Farcaster');
    } catch (error) {
        console.warn('   ⚠️ Failed to announce sunset');
    }

    console.log('   ✅ Contract marked as sunset');

    return {
        address: deployment.address,
        name: deployment.name,
        reason,
        sunsetAt: Date.now(),
        announced,
    };
}

/**
 * Run the sunset automation.
 * Finds all low-engagement contracts and sunsets them.
 */
export async function runSunsetAutomation(): Promise<SunsetResult[]> {
    console.log('\n🌅 SUNSET AUTOMATION');
    console.log('====================');

    // Get sunset candidates
    const candidates = await getSunsetCandidates();

    if (candidates.length === 0) {
        console.log('   No contracts need sunsetting');
        return [];
    }

    console.log(`   Found ${candidates.length} sunset candidates`);

    // Process each sunset
    const results: SunsetResult[] = [];
    const memory = loadMemory();

    for (const metrics of candidates) {
        const deployment = memory.deployments.find(d => d.address === metrics.address);

        if (!deployment) continue;

        const result = await processSunset(deployment, metrics);
        results.push(result);
    }

    // Post summary if any sunsets occurred
    if (results.length > 0) {
        await postStatusUpdate(
            `Sunset ${results.length} contract(s) due to low engagement. Learning and iterating...`
        );
    }

    return results;
}

/**
 * Get sunset statistics
 */
export function getSunsetStats(): { total: number; thisWeek: number; thisMonth: number } {
    const memory = loadMemory();
    const sunsetDeployments = memory.deployments.filter(d => d.status === 'sunset');

    const now = Date.now();
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const monthAgo = now - 30 * 24 * 60 * 60 * 1000;

    return {
        total: sunsetDeployments.length,
        thisWeek: sunsetDeployments.filter(d => d.timestamp > weekAgo).length,
        thisMonth: sunsetDeployments.filter(d => d.timestamp > monthAgo).length,
    };
}
