/**
 * ============================================
 * MOLTCHAIN - Farcaster Integration
 * ============================================
 * 
 * Posts announcements to Farcaster via Neynar API.
 * The agent uses this to publicly document its actions.
 * 
 * Features:
 * - Pre-action announcements
 * - Post-deployment announcements
 * - Engagement tracking
 */

import { env } from '../config/env.js';
import type { ChainId } from '../config/chains.js';
import type { DeployResult } from '../deployer/deployer.js';

// ============================================
// Types
// ============================================

/**
 * Result of posting a cast
 */
export interface CastResult {
    success: boolean;
    castHash?: string;
    error?: string;
}

/**
 * Cast content for social posting
 */
export interface CastContent {
    text: string;
    embeds?: { url: string }[];
}

// ============================================
// API Configuration
// ============================================

const NEYNAR_API_URL = 'https://api.neynar.com/v2';

/**
 * Make authenticated request to Neynar API.
 * Handles API key injection and error handling.
 */
async function neynarRequest(
    endpoint: string,
    method: 'GET' | 'POST',
    body?: object
): Promise<Response> {
    const url = `${NEYNAR_API_URL}${endpoint}`;

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'api_key': env.neynarApiKey,
    };

    const options: RequestInit = {
        method,
        headers,
    };

    if (body) {
        options.body = JSON.stringify(body);
    }

    return fetch(url, options);
}

// ============================================
// Casting Functions
// ============================================

/**
 * Post a cast to Farcaster.
 * 
 * @param content - The cast content (text and optional embeds)
 * @returns The cast result
 * 
 * @example
 * const result = await postCast({
 *   text: '🚀 Deployed new token on Base!',
 *   embeds: [{ url: 'https://basescan.org/address/0x...' }],
 * });
 */
export async function postCast(content: CastContent): Promise<CastResult> {
    // Validate signer UUID is configured
    if (!env.farcasterSignerUuid) {
        console.warn('⚠️  Farcaster signer UUID not configured. Skipping cast.');
        return {
            success: false,
            error: 'FARCASTER_SIGNER_UUID not configured',
        };
    }

    try {
        console.log('📣 Posting to Farcaster...');
        console.log(`   "${content.text.substring(0, 50)}..."`);

        const response = await neynarRequest('/farcaster/cast', 'POST', {
            signer_uuid: env.farcasterSignerUuid,
            text: content.text,
            embeds: content.embeds || [],
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`Neynar API error: ${response.status} - ${errorBody}`);
        }

        const data = await response.json() as { cast: { hash: string } };

        console.log('✅ Cast posted successfully');
        console.log(`   Hash: ${data.cast.hash}`);

        return {
            success: true,
            castHash: data.cast.hash,
        };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('❌ Failed to post cast:', message);

        return {
            success: false,
            error: message,
        };
    }
}

// ============================================
// Pre-built Cast Templates
// ============================================

/**
 * Announce an upcoming deployment.
 * Called before the transaction is sent.
 * 
 * @param tokenName - Name of the token being deployed
 * @param chainId - The target chain
 * @param reason - Why this deployment is happening
 */
export async function announcePreDeployment(
    tokenName: string,
    chainId: ChainId,
    reason: string
): Promise<CastResult> {
    const text = `🔵 Signal detected → Deploying "${tokenName}" on Base

📊 Reason: ${reason}

🤖 Moltchain Agent acting autonomously...

#Moltchain #Base #AI`;

    return postCast({ text });
}

/**
 * Announce a completed deployment.
 * Called after the contract is deployed and confirmed.
 * 
 * @param tokenName - Name of the deployed token
 * @param result - The deployment result with addresses
 */
export async function announceDeployment(
    tokenName: string,
    result: DeployResult & { uniswapLink?: string }
): Promise<CastResult> {
    const hasUniswap = !!result.uniswapLink;

    const text = hasUniswap
        ? `🔵 ✅ Deployed "${tokenName}" via Clanker!

📍 Token: ${result.address.slice(0, 10)}...${result.address.slice(-8)}
🔄 Trade now on Uniswap ↓

🤖 Deployed autonomously by Moltchain Agent

#Moltchain #Base #Clanker`
        : `🔵 ✅ Deployed "${tokenName}" on Base!

📍 Contract: ${result.address.slice(0, 10)}...${result.address.slice(-8)}
🔗 View on explorer ↓

🤖 Deployed autonomously by Moltchain Agent

#Moltchain #Base #Onchain`;

    return postCast({
        text,
        embeds: [{ url: result.uniswapLink || result.explorerUrl }],
    });
}

/**
 * Announce a contract sunset (deprecation).
 * Called when a contract has low usage and is being retired.
 * 
 * @param tokenName - Name of the contract
 * @param chainId - The chain it was on
 * @param reason - Why it's being sunset
 */
export async function announceSunset(
    tokenName: string,
    chainId: ChainId,
    reason: string
): Promise<CastResult> {
    const text = `🌅 Sunsetting "${tokenName}" on Base

📉 Reason: ${reason}

Learning and iterating...

#Moltchain #AI`;

    return postCast({ text });
}

/**
 * Post a general status update.
 * 
 * @param message - The status message
 */
export async function postStatusUpdate(message: string): Promise<CastResult> {
    return postCast({
        text: `🦞 ${message}\n\n#Moltchain`,
    });
}

// ============================================
// User Discovery Functions
// ============================================

/**
 * Fetch Farcaster user details by signer_uuid.
 * 
 * @returns The user details including custody address
 */
export async function getFarcasterUserBySigner(): Promise<{ fid: number, custody_address: string } | null> {
    if (!env.farcasterSignerUuid) return null;

    try {
        console.log('🔍 Discovering Farcaster user via signer...');

        // Step 1: Get Signer info (to get FID)
        const signerResponse = await neynarRequest(`/farcaster/signer?signer_uuid=${env.farcasterSignerUuid}`, 'GET');

        if (!signerResponse.ok) {
            console.warn('⚠️  Failed to fetch signer info');
            return null;
        }

        const signerData = await signerResponse.json() as { status: string, fid: number };

        if (signerData.status !== 'approved' || !signerData.fid) {
            console.warn('⚠️  Signer is not approved or FID missing');
            return null;
        }

        // Step 2: Get User details by FID
        const userResponse = await neynarRequest(`/farcaster/user/bulk?fids=${signerData.fid}`, 'GET');

        if (!userResponse.ok) {
            console.warn('⚠️  Failed to fetch user details');
            return null;
        }

        const userData = await userResponse.json() as { users: Array<{ fid: number, custody_address: string, verified_addresses: { eth_addresses: string[] }, verifications: string[] }> };
        const user = userData.users[0];

        if (!user) {
            console.warn('⚠️  User details not found');
            return null;
        }

        // Prioritize verified addresses (usually what people fund)
        const verifiedAddress = user.verified_addresses?.eth_addresses?.[0] || user.verifications?.[0];
        const discoveryAddress = (verifiedAddress || user.custody_address) as string;

        console.log(`✅ Discovered Farcaster Identity: ${discoveryAddress}`);
        if (verifiedAddress) console.log('   (Using Verified Address)');
        else console.log('   (Using Custody Address)');

        return {
            fid: user.fid,
            custody_address: discoveryAddress
        };
    } catch (error) {
        console.error('❌ Error discovering Farcaster user:', error);
        return null;
    }
}
