/**
 * Moltchain - Engagement Tracking
 * 
 * Track onchain and social engagement for deployed contracts.
 * Identify low-usage contracts for sunset.
 */

interface EngagementMetrics {
    tokenAddress: string;
    transfers: number;
    holders: number;
    mentions: number;
    lastActivity: number;
}

interface Deployment {
    address: string;
    name: string;
    timestamp: number;
    metrics?: EngagementMetrics;
}

/**
 * Fetch token transfer count from BaseScan API
 */
export async function getTransferCount(tokenAddress: string): Promise<number> {
    try {
        // Use BaseScan API (requires API key for production)
        const response = await fetch(
            `https://api.basescan.org/api?module=token&action=tokentx&contractaddress=${tokenAddress}&page=1&offset=100`
        );
        const data = await response.json();

        if (data.status === '1' && data.result) {
            return data.result.length;
        }
        return 0;
    } catch {
        return 0;
    }
}

/**
 * Fetch unique holder count
 */
export async function getHolderCount(tokenAddress: string): Promise<number> {
    try {
        const response = await fetch(
            `https://api.basescan.org/api?module=token&action=tokenholderlist&contractaddress=${tokenAddress}&page=1&offset=100`
        );
        const data = await response.json();

        if (data.status === '1' && data.result) {
            return data.result.length;
        }
        return 0;
    } catch {
        return 0;
    }
}

/**
 * Search for Farcaster mentions of a token
 */
export async function getMentionCount(
    tokenAddress: string,
    symbol: string
): Promise<number> {
    const apiKey = process.env.NEYNAR_API_KEY;
    if (!apiKey) return 0;

    try {
        const query = encodeURIComponent(`$${symbol} OR ${tokenAddress.slice(0, 10)}`);
        const response = await fetch(
            `https://api.neynar.com/v2/farcaster/cast/search?q=${query}&limit=25`,
            {
                headers: { 'x-api-key': apiKey },
            }
        );
        const data = await response.json();
        return data.result?.casts?.length || 0;
    } catch {
        return 0;
    }
}

/**
 * Get full engagement metrics for a token
 */
export async function getEngagement(
    tokenAddress: string,
    symbol: string
): Promise<EngagementMetrics> {
    const [transfers, holders, mentions] = await Promise.all([
        getTransferCount(tokenAddress),
        getHolderCount(tokenAddress),
        getMentionCount(tokenAddress, symbol),
    ]);

    return {
        tokenAddress,
        transfers,
        holders,
        mentions,
        lastActivity: Date.now(),
    };
}

/**
 * Check if a deployment should be sunset based on engagement
 */
export function shouldSunset(
    deployment: Deployment,
    minTransfers: number = 10,
    minDaysActive: number = 7
): { shouldSunset: boolean; reason: string } {
    const daysSinceDeployment = (Date.now() - deployment.timestamp) / (1000 * 60 * 60 * 24);

    if (daysSinceDeployment < minDaysActive) {
        return {
            shouldSunset: false,
            reason: `Only ${daysSinceDeployment.toFixed(1)} days old (min: ${minDaysActive})`
        };
    }

    const transfers = deployment.metrics?.transfers || 0;

    if (transfers < minTransfers) {
        return {
            shouldSunset: true,
            reason: `Low activity: only ${transfers} transfers in ${daysSinceDeployment.toFixed(1)} days`,
        };
    }

    return {
        shouldSunset: false,
        reason: `Healthy engagement: ${transfers} transfers`
    };
}

// Export for OpenClaw
export default {
    getTransferCount,
    getHolderCount,
    getMentionCount,
    getEngagement,
    shouldSunset,
};
