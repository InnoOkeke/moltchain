/**
 * ============================================
 * MOLTCHAIN - Scripts Package Index
 * ============================================
 * 
 * Main entry point that exports all modules.
 * Use this for programmatic access to Moltchain functions.
 */

// Configuration
export { env, validateEnv } from './config/env.js';
export {
    SUPPORTED_CHAINS,
    baseMainnet,
    getChain,
    getExplorerTxUrl,
    getExplorerAddressUrl,
    type ChainId,
} from './config/chains.js';

// Wallet
export {
    createWallet,
    getWalletAddress,
    displayWalletInfo,
    type MoltchainWallet,
} from './wallet/wallet.js';

// Deployer
export {
    deployContract,
    estimateDeploymentGas,
    type DeployConfig,
    type DeployResult,
} from './deployer/deployer.js';

// Memory
export {
    loadMemory,
    saveMemory,
    saveDeployment,
    getDeploymentsByChain,
    getLatestDeployment,
    getActiveDeployments,
    sunsetDeployment,
    getDeploymentStats,
    type DeploymentRecord,
    type DeploymentMemory,
} from './memory/deployments.js';

// Social
export {
    postCast,
    announcePreDeployment,
    announceDeployment,
    announceSunset,
    postStatusUpdate,
    type CastResult,
    type CastContent,
} from './social/farcaster.js';

// Contracts
export {
    SIMPLE_ERC20_ABI,
    SIMPLE_ERC20_BYTECODE,
    COMMON_SUPPLIES,
    getTokenConstructorArgs,
    type TokenConfig,
} from './contracts/erc20-template.js';
