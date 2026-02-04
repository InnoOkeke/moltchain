/**
 * ============================================
 * MOLTCHAIN - Wallet Management
 * ============================================
 * 
 * Provides secure wallet functionality for the agent.
 * Uses viem for Ethereum interactions.
 * 
 * SECURITY:
 * - Private key is loaded from environment variables
 * - Never logged or exposed in output
 * - Used only for signing transactions
 */

import {
    createWalletClient,
    createPublicClient,
    http,
    formatEther,
    parseEther,
    type WalletClient,
    type PublicClient,
    type Chain,
    type Address,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { env } from '../config/env.js';
import { SUPPORTED_CHAINS, type ChainId, getChain } from '../config/chains.js';

// ============================================
// Types
// ============================================

/**
 * Wallet instance with both signing and reading capabilities
 */
export interface MoltchainWallet {
    /** The wallet address */
    address: Address;

    /** The viem account for signing */
    account: ReturnType<typeof privateKeyToAccount>;

    /** Client for signing transactions */
    walletClient: WalletClient;

    /** Client for reading blockchain state */
    publicClient: PublicClient;

    /** The chain this wallet is connected to */
    chain: Chain;

    /** Get the wallet's balance in native tokens */
    getBalance: () => Promise<string>;

    /** Check if wallet has sufficient balance */
    hasSufficientBalance: (minBalance: string) => Promise<boolean>;
}

// ============================================
// Wallet Creation
// ============================================

/**
 * Create a wallet instance for a specific chain.
 * 
 * This is the main entry point for wallet operations.
 * The wallet can sign transactions and read blockchain state.
 * 
 * @param chainId - The chain to connect to ('base' or 'monad')
 * @returns A configured wallet instance
 * 
 * @example
 * // Create wallet for Base Sepolia
 * const wallet = createWallet('base');
 * console.log(`Address: ${wallet.address}`);
 * 
 * // Check balance
 * const balance = await wallet.getBalance();
 * console.log(`Balance: ${balance} ETH`);
 */
export function createWallet(chainId: ChainId): MoltchainWallet {
    // Get the chain configuration
    const chain = getChain(chainId);

    // Create account from private key (securely loaded from env)
    // The 0x prefix is added if not present
    const privateKey = env.privateKey.startsWith('0x')
        ? env.privateKey as `0x${string}`
        : `0x${env.privateKey}` as `0x${string}`;

    const account = privateKeyToAccount(privateKey);

    // Create the wallet client (for signing transactions)
    const walletClient = createWalletClient({
        account,
        chain,
        transport: http(),
    });

    // Create the public client (for reading state)
    const publicClient = createPublicClient({
        chain,
        transport: http(),
    });

    // ----------------------
    // Helper Functions
    // ----------------------

    /**
     * Get the wallet's balance in human-readable format
     */
    async function getBalance(): Promise<string> {
        const balance = await publicClient.getBalance({
            address: account.address,
        });
        return formatEther(balance);
    }

    /**
     * Check if wallet has at least the specified balance
     * @param minBalance - Minimum balance in ETH (e.g., '0.01')
     */
    async function hasSufficientBalance(minBalance: string): Promise<boolean> {
        const balance = await publicClient.getBalance({
            address: account.address,
        });
        const required = parseEther(minBalance);
        return balance >= required;
    }

    return {
        address: account.address,
        account,
        walletClient,
        publicClient,
        chain,
        getBalance,
        hasSufficientBalance,
    };
}

/**
 * Get wallet address without creating a full wallet instance.
 * Useful for display purposes without making RPC calls.
 * 
 * @returns The wallet address derived from the private key
 */
export function getWalletAddress(): Address {
    const privateKey = env.privateKey.startsWith('0x')
        ? env.privateKey as `0x${string}`
        : `0x${env.privateKey}` as `0x${string}`;

    const account = privateKeyToAccount(privateKey);
    return account.address;
}

/**
 * Display wallet info for all supported chains.
 * Useful for debugging and initial setup verification.
 */
export async function displayWalletInfo(): Promise<void> {
    const address = getWalletAddress();

    console.log('═══════════════════════════════════════');
    console.log('🦞 MOLTCHAIN WALLET');
    console.log('═══════════════════════════════════════');
    console.log(`Address: ${address}`);
    console.log('');
    console.log('Balances:');

    for (const [chainId, chain] of Object.entries(SUPPORTED_CHAINS)) {
        try {
            const wallet = createWallet(chainId as ChainId);
            const balance = await wallet.getBalance();
            console.log(`  ${chain.name}: ${balance} ${chain.nativeCurrency.symbol}`);
        } catch (error) {
            console.log(`  ${chain.name}: Error fetching balance`);
        }
    }

    console.log('═══════════════════════════════════════');
}
