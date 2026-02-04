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
import { getFarcasterUserBySigner } from '../social/farcaster.js';

let cachedFarcasterAddress: Address | null = null;

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
export async function createWallet(chainId: ChainId): Promise<MoltchainWallet> {
    // Get the chain configuration
    const chain = getChain(chainId);

    // 1. Get the identity address (discovered or derived)
    const identityAddress = await getWalletAddress();

    // 2. Create account from private key (if available)
    let account: ReturnType<typeof privateKeyToAccount> | null = null;
    if (env.privateKey) {
        const pk = env.privateKey.startsWith('0x') ? env.privateKey : `0x${env.privateKey}`;
        account = privateKeyToAccount(pk as `0x${string}`);
    }

    // Create the public client (for reading state)
    const publicClient = createPublicClient({
        chain,
        transport: http(),
    });

    // Create the wallet client (if account available)
    const walletClient = createWalletClient({
        account: account || undefined,
        chain,
        transport: http(),
    });

    // ----------------------
    // Helper Functions
    // ----------------------

    /**
     * Get the identity wallet's balance in human-readable format
     */
    async function getBalance(): Promise<string> {
        const balance = await publicClient.getBalance({
            address: identityAddress,
        });
        return formatEther(balance);
    }

    /**
     * Check if identity wallet has at least the specified balance
     * @param minBalance - Minimum balance in ETH (e.g., '0.01')
     */
    async function hasSufficientBalance(minBalance: string): Promise<boolean> {
        const balance = await publicClient.getBalance({
            address: identityAddress,
        });
        const required = parseEther(minBalance);
        return balance >= required;
    }

    return {
        address: identityAddress,
        account: account as any, // Cast for compatibility, but check for null before signing
        walletClient,
        publicClient,
        chain,
        getBalance,
        hasSufficientBalance,
    };
}

/**
 * Get wallet address derived from the private key or discovered from Farcaster.
 * 
 * @returns The wallet address
 */
export async function getWalletAddress(): Promise<Address> {
    // 1. Try cached Farcaster address first (Primary Identity)
    if (cachedFarcasterAddress) return cachedFarcasterAddress;

    // 2. Try to discover from Farcaster if signer is available
    if (env.farcasterSignerUuid) {
        const user = await getFarcasterUserBySigner();
        if (user?.custody_address) {
            cachedFarcasterAddress = user.custody_address as Address;
            return cachedFarcasterAddress;
        }
    }

    // 3. Fallback to Private Key derivation
    if (env.privateKey) {
        try {
            const privateKey = env.privateKey.startsWith('0x')
                ? env.privateKey as `0x${string}`
                : `0x${env.privateKey}` as `0x${string}`;

            const account = privateKeyToAccount(privateKey);
            return account.address;
        } catch (error) {
            console.warn('⚠️  Failed to derive address from PRIVATE_KEY');
        }
    }

    console.warn('⚠️  No identity address found (missing signer and private key)');
    return '0x0000000000000000000000000000000000000000' as Address;
}

/**
 * Display wallet info for all supported chains.
 * Useful for debugging and initial setup verification.
 */
export async function displayWalletInfo(): Promise<void> {
    const address = await getWalletAddress();

    console.log('═══════════════════════════════════════');
    console.log('🦞 MOLTCHAIN WALLET');
    console.log('═══════════════════════════════════════');
    console.log(`Address: ${address}`);
    console.log('');
    console.log('Balances:');

    for (const [chainId, chain] of Object.entries(SUPPORTED_CHAINS)) {
        try {
            const wallet = await createWallet(chainId as ChainId);
            const balance = await wallet.getBalance();
            console.log(`  ${chain.name}: ${balance} ${chain.nativeCurrency.symbol}`);
        } catch (error) {
            console.log(`  ${chain.name}: Error fetching balance`);
        }
    }

    console.log('═══════════════════════════════════════');
}
