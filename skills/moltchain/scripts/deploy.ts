/**
 * Moltchain - Token Deployment via Neynar
 * 
 * Deploy tokens on Base with a single API call.
 * Neynar covers deployment fees - only API key needed!
 */

import { privateKeyToAccount } from 'viem/accounts';

/**
 * Get wallet address from private key
 */
export function getOwnerAddress(): string {
    const privateKey = process.env.PRIVATE_KEY;

    if (!privateKey) {
        throw new Error('PRIVATE_KEY not set in environment');
    }

    // Ensure 0x prefix
    const formattedKey = privateKey.startsWith('0x')
        ? privateKey as `0x${string}`
        : `0x${privateKey}` as `0x${string}`;

    const account = privateKeyToAccount(formattedKey);
    return account.address;
}

interface DeployConfig {
    name: string;
    symbol: string;
    description: string;
    ownerAddress: string;
}

interface DeployResult {
    tokenAddress: string;
    name: string;
    symbol: string;
    uniswapLink: string;
}

/**
 * Deploy a token using Neynar's API
 * 
 * Endpoint: POST https://api.neynar.com/fungible
 * Content-Type: multipart/form-data
 * Auth: Bearer NEYNAR_API_KEY
 */
export async function deployToken(config: DeployConfig): Promise<DeployResult> {
    const apiKey = process.env.NEYNAR_API_KEY;

    if (!apiKey) {
        throw new Error('NEYNAR_API_KEY not set');
    }

    console.log(`🦀 Deploying ${config.name} (${config.symbol}) via Neynar...`);
    console.log(`   Owner: ${config.ownerAddress}`);

    // Build FormData
    const formData = new FormData();
    formData.append('owner', config.ownerAddress);
    formData.append('symbol', config.symbol);
    formData.append('name', config.name);
    formData.append('metadata[description]', config.description);
    formData.append('metadata[nsfw]', 'false');
    formData.append('network', 'base');
    formData.append('factory', 'clanker');

    const response = await fetch('https://api.neynar.com/fungible', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
        },
        body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(`Deployment failed: ${JSON.stringify(data)}`);
    }

    const tokenAddress = data.contract.fungible.address;
    const uniswapLink = `https://app.uniswap.org/swap?outputCurrency=${tokenAddress}&chain=base`;

    console.log(`✅ Token deployed!`);
    console.log(`   Address: ${tokenAddress}`);
    console.log(`   Uniswap: ${uniswapLink}`);

    return {
        tokenAddress,
        name: data.contract.fungible.name,
        symbol: data.contract.fungible.symbol,
        uniswapLink,
    };
}

/**
 * Get BaseScan explorer link
 */
export function getExplorerLink(tokenAddress: string): string {
    return `https://basescan.org/token/${tokenAddress}`;
}

// Export for OpenClaw
export default {
    deployToken,
    getExplorerLink,
    getOwnerAddress,
};
