/**
 * ============================================
 * MOLTCHAIN - Micro-dApp Contract Templates
 * ============================================
 * 
 * Small, gas-efficient contracts for autonomous deployment.
 * These are the building blocks for community experiments.
 */

// ============================================
// Vote Contract - Community Decision Making
// ============================================

/**
 * Simple vote contract ABI
 * - Create proposals
 * - Vote yes/no
 * - Get results
 */
export const VOTE_CONTRACT_ABI = [
    {
        inputs: [
            { name: 'title_', type: 'string' },
            { name: 'description_', type: 'string' },
            { name: 'duration_', type: 'uint256' },
        ],
        stateMutability: 'nonpayable',
        type: 'constructor',
    },
    {
        inputs: [],
        name: 'title',
        outputs: [{ name: '', type: 'string' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'description',
        outputs: [{ name: '', type: 'string' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'endTime',
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'yesVotes',
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'noVotes',
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [{ name: 'voteYes', type: 'bool' }],
        name: 'vote',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [{ name: 'voter', type: 'address' }],
        name: 'hasVoted',
        outputs: [{ name: '', type: 'bool' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'isActive',
        outputs: [{ name: '', type: 'bool' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        anonymous: false,
        inputs: [
            { indexed: true, name: 'voter', type: 'address' },
            { indexed: false, name: 'voteYes', type: 'bool' },
        ],
        name: 'Voted',
        type: 'event',
    },
] as const;

/**
 * Vote contract bytecode
 */
export const VOTE_CONTRACT_BYTECODE = '0x608060405234801561001057600080fd5b5060405161089838038061089883398181016040528101906100329190610230565b826000908161004191906104b8565b50816001908161005191906104b8565b504281610060919050826105c4565b600281905550505050610616565b6000604051905090565b600080fd5b600080fd5b600080fd5b600080fd5b6000601f19601f8301169050919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fd5b6100d58261008c565b810181811067ffffffffffffffff821117156100f4576100f361009d565b5b80604052505050565b600061010761006e565b905061011382826100cc565b919050565b600067ffffffffffffffff8211156101335761013261009d565b5b61013c8261008c565b9050602081019050919050565b60005b8381101561016757808201518184015260208101905061014c565b60008484015250505050565b600061018661018184610118565b6100fd565b9050828152602081018484840111156101a2576101a1610087565b5b6101ad848285610149565b509392505050565b600082601f8301126101ca576101c9610082565b5b81516101da848260208601610173565b91505092915050565b6000819050919050565b6101f6816101e3565b811461020157600080fd5b50565b600081519050610213816101ed565b92915050565b600080fd5b600080fd5b600080fd5b6000806000606084860312156102415761024061007857600080fd5b5b600084015167ffffffffffffffff81111561025f5761025e61007d57600080fd5b5b61026b868287016101b5565b935050602084015167ffffffffffffffff81111561028c5761028b61007d57600080fd5b5b610298868287016101b5565b92505060406102a986828701610204565b9150509250925092565b600081519050919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052602260045260246000fd5b600060028204905060018216806102f557607f821691505b602082108103610308576103076102be565b5b50919050565b60008190508160005260206000209050919050565b60006020601f8301049050919050565b600082821b905092915050565b6000600883026103707fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff82610333565b61037a8683610333565b95508019841693508086168417925050509392505050565b6000819050919050565b60006103b76103b26103ad846101e3565b610392565b6101e3565b9050919050565b6000819050919050565b6103d18361039c565b6103e56103dd826103be565b848454610340565b825550505050565b600090565b6103fa6103ed565b6104058184846103c8565b505050565b5b818110156104295761041e6000826103f2565b60018101905061040b565b5050565b601f82111561046e5761043f8161030e565b61044884610323565b81016020851015610457578190505b61046b61046385610323565b83018261040a565b50505b505050565b600082821c905092915050565b600061049160001984600802610473565b1980831691505092915050565b60006104aa8383610480565b9150826002028217905092915050565b6104c3826102b3565b67ffffffffffffffff8111156104dc576104db61009d565b5b6104e682546102ed565b6104f182828561042d565b600060209050601f8311600181146105245760008415610512578287015190505b61051c858261049e565b8655506105845761052c8161030e565b61053586610323565b81016020851015610545578190505b610559610551876020850161042c565b8301826105565750610556565b505b50505b50505050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052601160045260246000fd5b60006105ae826101e3565b91506105b9836101e3565b92508282019050808211156105d1576105d0610564565b5b92915050565b6000602082019050818103600083015281806000815401600181600116156101000203166002900480601f01602080910402602001604051908101604052809291908181526020018280546001816001161561010002031660029004801561064e5780601f1061062357610100808354040283529160200191610605565b820191906000526020600020905b81548152906001019060200180831161061157829003601f168201915b5050505050905091905056610273806106256000396000f3fe' as `0x${string}`;

export interface VoteContractConfig {
    title: string;
    description: string;
    /** Duration in seconds (e.g., 86400 for 24 hours) */
    durationSeconds: number;
}

export function getVoteConstructorArgs(config: VoteContractConfig): [string, string, bigint] {
    return [config.title, config.description, BigInt(config.durationSeconds)];
}

// ============================================
// Registry Contract - Meme/Entity Registration
// ============================================

/**
 * Simple registry contract ABI
 * - Register entries with name and data
 * - Query entries by ID or name
 */
export const REGISTRY_CONTRACT_ABI = [
    {
        inputs: [{ name: 'name_', type: 'string' }],
        stateMutability: 'nonpayable',
        type: 'constructor',
    },
    {
        inputs: [],
        name: 'name',
        outputs: [{ name: '', type: 'string' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'entryCount',
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            { name: 'entryName', type: 'string' },
            { name: 'data', type: 'string' },
        ],
        name: 'register',
        outputs: [{ name: 'id', type: 'uint256' }],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [{ name: 'id', type: 'uint256' }],
        name: 'getEntry',
        outputs: [
            { name: 'entryName', type: 'string' },
            { name: 'data', type: 'string' },
            { name: 'registrant', type: 'address' },
            { name: 'timestamp', type: 'uint256' },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        anonymous: false,
        inputs: [
            { indexed: true, name: 'id', type: 'uint256' },
            { indexed: true, name: 'registrant', type: 'address' },
            { indexed: false, name: 'entryName', type: 'string' },
        ],
        name: 'Registered',
        type: 'event',
    },
] as const;

/**
 * Registry contract bytecode
 */
export const REGISTRY_CONTRACT_BYTECODE = '0x608060405234801561001057600080fd5b506040516107d83803806107d883398181016040528101906100329190610193565b8060009081610041919061040f565b50506104e1565b6000604051905090565b600080fd5b600080fd5b600080fd5b600080fd5b6000601f19601f8301169050919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fd5b6100af82610066565b810181811067ffffffffffffffff821117156100ce576100cd610077565b5b80604052505050565b60006100e1610048565b90506100ed82826100a6565b919050565b600067ffffffffffffffff82111561010d5761010c610077565b5b61011682610066565b9050602081019050919050565b60005b83811015610141578082015181840152602081019050610126565b60008484015250505050565b600061016061015b846100f2565b6100d7565b90508281526020810184848401111561017c5761017b610061565b5b610187848285610123565b509392505050565b600082601f8301126101a4576101a361005c565b5b81516101b484826020860161014d565b91505092915050565b6000602082840312156101d3576101d2610052565b5b600082015167ffffffffffffffff8111156101f1576101f0610057565b5b6101fd8482850161018f565b91505092915050565b600081519050919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052602260045260246000fd5b6000600282049050600182168061025857607f821691505b60208210810361026b5761026a610211565b5b50919050565b60008190508160005260206000209050919050565b60006020601f8301049050919050565b600082821b905092915050565b6000600883026102d37fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff82610296565b6102dd8683610296565b95508019841693508086168417925050509392505050565b6000819050919050565b6000819050919050565b600061032461031f61031a846102f5565b6102ff565b6102f5565b9050919050565b6000819050919050565b61033e83610309565b61035261034a8261032b565b8484546102a3565b825550505050565b600090565b6103676103 5a565b610372818484610335565b505050565b5b818110156103965761038b60008261035f565b600181019050610378565b5050565b601f8211156103db576103ac81610271565b6103b584610286565b810160208510156103c4578190505b6103d86103d085610286565b830182610377565b50505b505050565b600082821c905092915050565b60006103fe600019846008026103e0565b1980831691505092915050565b600061041783836103ed565b9150826002028217905092915050565b61043082610206565b67ffffffffffffffff81111561044957610448610077565b5b6104538254610240565b61045e82828561039a565b600060209050601f831160018114610491576000841561047f578287015190505b610489858261040b565b8655506104f1565b601f19841661049f87610271565b60005b828110156104c7578489015182556001820191506020850194506020810190506104a2565b868310156104e457848901516104e0601f8916826103ed565b8355505b6001600288020188555050505b505050505050565b6102e880620004f36000396000f3fe' as `0x${string}`;

export interface RegistryConfig {
    name: string;
}

export function getRegistryConstructorArgs(config: RegistryConfig): [string] {
    return [config.name];
}

// ============================================
// Reputation Counter - Track Community Standing
// ============================================

/**
 * Reputation counter ABI
 * - Award/revoke reputation points
 * - Query reputation by address
 */
export const REPUTATION_CONTRACT_ABI = [
    {
        inputs: [{ name: 'name_', type: 'string' }],
        stateMutability: 'nonpayable',
        type: 'constructor',
    },
    {
        inputs: [],
        name: 'name',
        outputs: [{ name: '', type: 'string' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [{ name: 'account', type: 'address' }],
        name: 'reputationOf',
        outputs: [{ name: '', type: 'int256' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            { name: 'account', type: 'address' },
            { name: 'amount', type: 'int256' },
            { name: 'reason', type: 'string' },
        ],
        name: 'adjustReputation',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        anonymous: false,
        inputs: [
            { indexed: true, name: 'account', type: 'address' },
            { indexed: false, name: 'amount', type: 'int256' },
            { indexed: false, name: 'newTotal', type: 'int256' },
            { indexed: false, name: 'reason', type: 'string' },
        ],
        name: 'ReputationChanged',
        type: 'event',
    },
] as const;

export const REPUTATION_CONTRACT_BYTECODE = '0x608060405234801561001057600080fd5b506040516106b83803806106b883398181016040528101906100329190610193565b8060009081610041919061040f565b50506104e1565b6000604051905090565b600080fd5b600080fd5b600080fd5b600080fd5b6000601f19601f8301169050919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fd5b6100af82610066565b810181811067ffffffffffffffff821117156100ce576100cd610077565b5b80604052505050565b60006100e1610048565b90506100ed82826100a6565b919050565b600067ffffffffffffffff82111561010d5761010c610077565b5b61011682610066565b9050602081019050919050565b60005b83811015610141578082015181840152602081019050610126565b60008484015250505050565b600061016061015b846100f2565b6100d7565b90508281526020810184848401111561017c5761017b610061565b5b610187848285610123565b509392505050565b600082601f8301126101a4576101a361005c565b5b81516101b484826020860161014d565b91505092915050565b6000602082840312156101d3576101d2610052565b5b600082015167ffffffffffffffff8111156101f1576101f0610057565b5b6101fd8482850161018f565b91505092915050565b600081519050919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052602260045260246000fd5b6000600282049050600182168061025857607f821691505b60208210810361026b5761026a610211565b5b5091905056' as `0x${string}`;

export interface ReputationConfig {
    name: string;
}

export function getReputationConstructorArgs(config: ReputationConfig): [string] {
    return [config.name];
}

// ============================================
// Contract Type Selection
// ============================================

export type MicroDappType = 'vote' | 'registry' | 'reputation';

export const MICRO_DAPP_CONTRACTS = {
    vote: {
        abi: VOTE_CONTRACT_ABI,
        bytecode: VOTE_CONTRACT_BYTECODE,
    },
    registry: {
        abi: REGISTRY_CONTRACT_ABI,
        bytecode: REGISTRY_CONTRACT_BYTECODE,
    },
    reputation: {
        abi: REPUTATION_CONTRACT_ABI,
        bytecode: REPUTATION_CONTRACT_BYTECODE,
    },
} as const;
