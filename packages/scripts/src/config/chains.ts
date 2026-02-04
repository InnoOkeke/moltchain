/**
 * ============================================
 * MOLTCHAIN - Chain Configuration
 * ============================================
 * 
 * This file defines the supported blockchain network (Base Mainnet).
 * 
 * MAINNET ONLY - Clanker + Neynar deploy to Base mainnet.
 */

import { defineChain } from 'viem';

// ============================================
// Chain Definition
// ============================================

/**
 * Base Mainnet
 * - Coinbase's L2, Ethereum-secured
 * - Chain ID: 8453
 */
export const baseMainnet = defineChain({
    id: 8453,
    name: 'Base',
    nativeCurrency: {
        name: 'Ether',
        symbol: 'ETH',
        decimals: 18,
    },
    rpcUrls: {
        default: {
            http: [process.env.BASE_RPC_URL || 'https://mainnet.base.org'],
        },
    },
    blockExplorers: {
        default: {
            name: 'BaseScan',
            url: 'https://basescan.org',
        },
    },
    testnet: false,
});

// ============================================
// Chain Registry
// ============================================

/**
 * Supported chain.
 * 
 * @example
 * pnpm deploy:token --chain base --name "My Token" --symbol "TKN"
 */
export const SUPPORTED_CHAINS = {
    base: baseMainnet,
} as const;

/**
 * Type for valid chain identifiers
 */
export type ChainId = keyof typeof SUPPORTED_CHAINS;

/**
 * Get chain configuration by identifier
 * 
 * @param chainId - The chain identifier ('base')
 * @returns The chain configuration object
 * @throws Error if chain is not supported
 * 
 * @example
 * const chain = getChain('base');
 * console.log(chain.name); // 'Base'
 */
export function getChain(chainId: string) {
    const chain = SUPPORTED_CHAINS[chainId as ChainId];

    if (!chain) {
        throw new Error(
            `Unsupported chain: "${chainId}". Only 'base' is supported.`
        );
    }

    return chain;
}

/**
 * Get block explorer URL for a transaction
 * 
 * @param chainId - The chain identifier
 * @param txHash - The transaction hash
 * @returns Full URL to view the transaction
 * 
 * @example
 * const url = getExplorerTxUrl('base', '0x123...');
 * // Returns: 'https://basescan.org/tx/0x123...'
 */
export function getExplorerTxUrl(chainId: ChainId, txHash: string): string {
    const chain = getChain(chainId);
    return `${chain.blockExplorers.default.url}/tx/${txHash}`;
}

/**
 * Get block explorer URL for a contract address
 * 
 * @param chainId - The chain identifier
 * @param address - The contract address
 * @returns Full URL to view the contract
 */
export function getExplorerAddressUrl(chainId: ChainId, address: string): string {
    const chain = getChain(chainId);
    return `${chain.blockExplorers.default.url}/address/${address}`;
}
