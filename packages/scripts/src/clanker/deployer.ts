/**
 * ============================================
 * MOLTCHAIN - Clanker Token Deployment via Neynar
 * ============================================
 * 
 * Deploy ERC20 tokens on Base via Neynar's API.
 * Uses the Clanker factory for automatic Uniswap liquidity.
 * 
 * API: POST https://api.neynar.com/fungible
 * Auth: Bearer NEYNAR_API_KEY
 * Content-Type: multipart/form-data
 * 
 * Neynar covers deployment fees - only API key needed!
 */

// ============================================
// Types
// ============================================

export interface ClankerDeployConfig {
    /** Token name */
    name: string;

    /** Token symbol (ticker) */
    symbol: string;

    /** Token description */
    description: string;

    /** Owner address - who will own the token */
    ownerAddress: string;

    /** Optional: media URL for token image */
    mediaUrl?: string;
}

export interface ClankerDeployResult {
    /** Deployed token contract address */
    tokenAddress: string;

    /** Token name */
    name: string;

    /** Token symbol */
    symbol: string;

    /** Token decimals (usually 18) */
    decimals: number;

    /** Uniswap swap link */
    uniswapLink: string;

    /** BaseScan explorer link */
    explorerLink: string;

    /** Chain ID (Base = 8453) */
    chainId: number;

    /** Deployment timestamp */
    timestamp: number;
}

// ============================================
// Deployment Function
// ============================================

/**
 * Deploy a token using Neynar's API with Clanker factory.
 * 
 * @param config - Token configuration
 * @returns Deployment result with addresses and links
 * 
 * @example
 * const result = await deployClankerToken({
 *     name: 'My Token',
 *     symbol: 'MTK',
 *     description: 'A token based on trending narrative',
 *     ownerAddress: '0x...'
 * });
 */
export async function deployClankerToken(
    config: ClankerDeployConfig
): Promise<ClankerDeployResult> {
    const apiKey = process.env.NEYNAR_API_KEY;

    if (!apiKey) {
        throw new Error('NEYNAR_API_KEY environment variable is not set');
    }

    console.log('🦀 Deploying token via Neynar + Clanker...');
    console.log(`   Name: ${config.name}`);
    console.log(`   Symbol: ${config.symbol}`);
    console.log(`   Owner: ${config.ownerAddress}`);

    // Build multipart form data
    const formData = new FormData();
    formData.append('owner', config.ownerAddress);
    formData.append('symbol', config.symbol);
    formData.append('name', config.name);
    formData.append('metadata[description]', config.description);
    formData.append('metadata[nsfw]', 'false');
    formData.append('network', 'base');
    formData.append('factory', 'clanker');

    if (config.mediaUrl) {
        formData.append('metadata[media]', config.mediaUrl);
    }

    // Make API request
    const response = await fetch('https://api.neynar.com/fungible', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
        },
        body: formData,
    });

    const data = await response.json() as {
        contract: {
            fungible: {
                address: string;
                name: string;
                symbol: string;
                decimals?: number;
            };
        };
    };

    if (!response.ok) {
        console.error('❌ Deployment failed:', data);
        throw new Error(`Neynar deployment failed: ${JSON.stringify(data)}`);
    }

    const tokenAddress = data.contract.fungible.address;
    const uniswapLink = `https://app.uniswap.org/swap?outputCurrency=${tokenAddress}&chain=base`;
    const explorerLink = `https://basescan.org/token/${tokenAddress}`;

    console.log('✅ Token deployed successfully!');
    console.log(`   Address: ${tokenAddress}`);
    console.log(`   Uniswap: ${uniswapLink}`);
    console.log(`   Explorer: ${explorerLink}`);

    return {
        tokenAddress,
        name: data.contract.fungible.name,
        symbol: data.contract.fungible.symbol,
        decimals: data.contract.fungible.decimals || 18,
        uniswapLink,
        explorerLink,
        chainId: 8453, // Base mainnet
        timestamp: Date.now(),
    };
}

// ============================================
// Helper Functions
// ============================================

/**
 * Get Uniswap swap link for a token
 */
export function getUniswapLink(tokenAddress: string): string {
    return `https://app.uniswap.org/swap?outputCurrency=${tokenAddress}&chain=base`;
}

/**
 * Get BaseScan explorer link for a token
 */
export function getExplorerLink(tokenAddress: string): string {
    return `https://basescan.org/token/${tokenAddress}`;
}

// Default export
export default {
    deployClankerToken,
    getUniswapLink,
    getExplorerLink,
};
