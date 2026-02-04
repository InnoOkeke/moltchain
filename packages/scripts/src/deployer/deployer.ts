/**
 * ============================================
 * MOLTCHAIN - Contract Deployer
 * ============================================
 * 
 * Handles deployment of smart contracts to supported chains.
 * Uses viem for Ethereum interactions.
 * 
 * Supports:
 * - ERC20 token deployment
 * - Custom contract deployment
 * - Deployment tracking and logging
 */

import {
    encodeDeployData,
    type Abi,
    type Address,
    type Hash,
} from 'viem';
import { createWallet, type MoltchainWallet } from '../wallet/wallet.js';
import { type ChainId, getExplorerAddressUrl, getExplorerTxUrl } from '../config/chains.js';
import { saveDeployment, type DeploymentRecord } from '../memory/deployments.js';

// ============================================
// Types
// ============================================

/**
 * Configuration for deploying a contract
 */
export interface DeployConfig {
    /** Name for this deployment (for logging/tracking) */
    name: string;

    /** The chain to deploy to */
    chainId: ChainId;

    /** Contract bytecode (compiled) */
    bytecode: `0x${string}`;

    /** Contract ABI */
    abi: Abi;

    /** Constructor arguments (optional) */
    args?: unknown[];

    /** Reason for deployment (for social posts) */
    reason?: string;
}

/**
 * Result of a successful deployment
 */
export interface DeployResult {
    /** The deployed contract address */
    address: Address;

    /** The deployment transaction hash */
    transactionHash: Hash;

    /** Block explorer URL for the contract */
    explorerUrl: string;

    /** Block explorer URL for the transaction */
    txExplorerUrl: string;

    /** The chain it was deployed to */
    chainId: ChainId;

    /** Timestamp of deployment */
    timestamp: number;
}

// ============================================
// Deployment Functions
// ============================================

/**
 * Deploy a smart contract to a specified chain.
 * 
 * This function handles:
 * 1. Encoding constructor arguments
 * 2. Estimating gas
 * 3. Sending the deployment transaction
 * 4. Waiting for confirmation
 * 5. Recording the deployment
 * 
 * @param config - The deployment configuration
 * @returns The deployment result with addresses and URLs
 * 
 * @example
 * const result = await deployContract({
 *   name: 'MyToken',
 *   chainId: 'base',
 *   bytecode: '0x...',
 *   abi: tokenAbi,
 *   args: ['My Token', 'MTK', 1000000],
 *   reason: 'Detected trending narrative about cats',
 * });
 * 
 * console.log(`Deployed to: ${result.address}`);
 * console.log(`View on explorer: ${result.explorerUrl}`);
 */
export async function deployContract(config: DeployConfig): Promise<DeployResult> {
    const { name, chainId, bytecode, abi, args = [], reason } = config;

    console.log('');
    console.log('═══════════════════════════════════════');
    console.log(`🚀 DEPLOYING: ${name}`);
    console.log('═══════════════════════════════════════');
    console.log(`Chain: ${chainId}`);
    console.log(`Reason: ${reason || 'Manual deployment'}`);
    console.log('');

    // Step 1: Create wallet for the target chain
    console.log('📝 Creating wallet connection...');
    const wallet = await createWallet(chainId);

    // Step 2: Check balance
    console.log('💰 Checking wallet balance...');
    const balance = await wallet.getBalance();
    console.log(`   Balance: ${balance} ${wallet.chain.nativeCurrency.symbol}`);

    const hasFunds = await wallet.hasSufficientBalance('0.00001');
    if (!hasFunds) {
        throw new Error(
            `Insufficient balance for deployment. ` +
            `Need at least 0.00001 ${wallet.chain.nativeCurrency.symbol}. ` +
            `Current balance: ${balance}`
        );
    }

    // Step 3: Prepare deployment transaction
    console.log('🔧 Preparing deployment transaction...');

    // Step 4: Deploy the contract
    console.log('📤 Sending deployment transaction...');
    const hash = await wallet.walletClient.deployContract({
        abi,
        bytecode,
        args,
        account: wallet.account,
        chain: wallet.chain,
    });

    console.log(`   Transaction hash: ${hash}`);
    console.log('   Waiting for confirmation...');

    // Step 5: Wait for the transaction to be mined
    const receipt = await wallet.publicClient.waitForTransactionReceipt({
        hash,
        confirmations: 1,
    });

    if (!receipt.contractAddress) {
        throw new Error('Deployment failed: No contract address in receipt');
    }

    // Step 6: Generate explorer URLs
    const explorerUrl = getExplorerAddressUrl(chainId, receipt.contractAddress);
    const txExplorerUrl = getExplorerTxUrl(chainId, hash);

    // Step 7: Create result object
    const result: DeployResult = {
        address: receipt.contractAddress,
        transactionHash: hash,
        explorerUrl,
        txExplorerUrl,
        chainId,
        timestamp: Date.now(),
    };

    // Step 8: Save deployment to memory
    const deploymentRecord: DeploymentRecord = {
        name,
        ...result,
        reason: reason || 'Manual deployment',
    };
    await saveDeployment(deploymentRecord);

    // Step 9: Log success
    console.log('');
    console.log('✅ DEPLOYMENT SUCCESSFUL');
    console.log('═══════════════════════════════════════');
    console.log(`Contract: ${receipt.contractAddress}`);
    console.log(`Explorer: ${explorerUrl}`);
    console.log(`TX: ${txExplorerUrl}`);
    console.log('═══════════════════════════════════════');
    console.log('');

    return result;
}

/**
 * Estimate gas for a deployment without executing it.
 * Useful for dry-run mode or cost estimation.
 * 
 * @param chainId - The chain to estimate on
 * @param bytecode - The contract bytecode
 * @param abi - The contract ABI
 * @param args - Constructor arguments
 * @returns Estimated gas in wei
 */
export async function estimateDeploymentGas(
    chainId: ChainId,
    bytecode: `0x${string}`,
    abi: Abi,
    args: unknown[] = []
): Promise<bigint> {
    const wallet = await createWallet(chainId);

    const gas = await wallet.publicClient.estimateGas({
        account: wallet.address,
        data: encodeDeployData({ abi, bytecode, args }),
    });

    return gas;
}
