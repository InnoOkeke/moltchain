/**
 * Moltchain - Farcaster Integration
 * 
 * Post announcements and interact with the Farcaster community via Neynar API.
 */

interface CastResult {
    hash: string;
    url: string;
}

/**
 * Post a cast to Farcaster
 */
export async function postCast(text: string): Promise<CastResult> {
    const apiKey = process.env.NEYNAR_API_KEY;
    const signerUuid = process.env.FARCASTER_SIGNER_UUID;

    if (!apiKey || !signerUuid) {
        throw new Error('NEYNAR_API_KEY or FARCASTER_SIGNER_UUID not set');
    }

    const response = await fetch('https://api.neynar.com/v2/farcaster/cast', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
        },
        body: JSON.stringify({
            signer_uuid: signerUuid,
            text,
        }),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(`Cast failed: ${JSON.stringify(data)}`);
    }

    return {
        hash: data.cast.hash,
        url: `https://warpcast.com/${data.cast.author.username}/${data.cast.hash.slice(0, 10)}`,
    };
}

/**
 * Announce pre-deployment
 */
export async function announcePreDeployment(
    name: string,
    narrative: string
): Promise<CastResult> {
    const text = `🚀 Deploying ${name} on Base

Detected narrative: ${narrative}

Deploying via Clanker for instant Uniswap liquidity...

🦞 Powered by Moltchain`;

    return postCast(text);
}

/**
 * Announce successful deployment
 */
export async function announceDeployment(
    name: string,
    symbol: string,
    tokenAddress: string,
    uniswapLink: string
): Promise<CastResult> {
    const text = `✅ ${name} ($${symbol}) is now live on Base!

📍 Contract: ${tokenAddress.slice(0, 10)}...${tokenAddress.slice(-8)}
🔄 Trade: ${uniswapLink}

Deployed via Clanker 🦀

🦞 Moltchain`;

    return postCast(text);
}

/**
 * Announce sunset
 */
export async function announceSunset(
    name: string,
    reason: string
): Promise<CastResult> {
    const text = `📊 ${name} sunset notice

${reason}

Thanks to everyone who participated!

🦞 Moltchain`;

    return postCast(text);
}

/**
 * Fetch trending casts for narrative detection
 */
export async function fetchTrending(limit: number = 25): Promise<any[]> {
    const apiKey = process.env.NEYNAR_API_KEY;

    if (!apiKey) {
        throw new Error('NEYNAR_API_KEY not set');
    }

    const response = await fetch(
        `https://api.neynar.com/v2/farcaster/feed/trending?limit=${limit}`,
        {
            headers: {
                'x-api-key': apiKey,
            },
        }
    );

    const data = await response.json();
    return data.casts || [];
}

// Export for OpenClaw
export default {
    postCast,
    announcePreDeployment,
    announceDeployment,
    announceSunset,
    fetchTrending,
};
