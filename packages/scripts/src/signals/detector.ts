/**
 * ============================================
 * MOLTCHAIN - Signal Detection Engine
 * ============================================
 * 
 * Detects trending narratives from onchain and social sources.
 * Returns structured signals for the agent to act on.
 * 
 * This runs AUTONOMOUSLY - no human input needed.
 */

import { env } from '../config/env.js';
import { createWallet } from '../wallet/wallet.js';
import { loadMemory } from '../memory/deployments.js';

// ============================================
// Types
// ============================================

/**
 * A detected signal/narrative that might warrant a deployment
 */
export interface DetectedSignal {
    /** Unique ID for this signal */
    id: string;

    /** Description of the narrative */
    narrative: string;

    /** Signal strength from 1-10 */
    strength: number;

    /** Source of the signal */
    source: 'farcaster' | 'onchain' | 'both';

    /** Suggested token if we should deploy */
    suggestedToken?: {
        name: string;
        symbol: string;
    };

    /** Whether the agent should deploy */
    shouldDeploy: boolean;

    /** Reason for the decision */
    reason: string;

    /** Timestamp when detected */
    timestamp: number;
}

// ============================================
// Farcaster Signal Detection
// ============================================

const NEYNAR_API_URL = 'https://api.neynar.com/v2';

/**
 * Fetch trending casts from Farcaster via Neynar
 */
async function fetchTrendingCasts(): Promise<string[]> {
    try {
        const response = await fetch(`${NEYNAR_API_URL}/farcaster/feed/trending?limit=20`, {
            headers: {
                'api_key': env.neynarApiKey,
            },
        });

        if (!response.ok) {
            console.warn('⚠️ Failed to fetch trending casts');
            return [];
        }

        const data = await response.json() as { casts: Array<{ text: string }> };
        return data.casts?.map(c => c.text) || [];
    } catch (error) {
        console.warn('⚠️ Error fetching Farcaster trends:', error);
        return [];
    }
}

/**
 * Fetch Base-related casts from Farcaster
 */
async function fetchBaseCasts(): Promise<string[]> {
    try {
        const response = await fetch(`${NEYNAR_API_URL}/farcaster/feed/channels?channel_ids=base&limit=20`, {
            headers: {
                'api_key': env.neynarApiKey,
            },
        });

        if (!response.ok) {
            return [];
        }

        const data = await response.json() as { casts: Array<{ text: string }> };
        return data.casts?.map(c => c.text) || [];
    } catch (error) {
        return [];
    }
}

// ============================================
// LLM-Powered Signal Analysis
// ============================================

/**
 * Use Groq LLM to analyze social signals and detect deployable narratives
 */
async function analyzeSignalsWithLLM(
    trendingCasts: string[],
    pastDeployments: string[]
): Promise<DetectedSignal | null> {
    const Groq = (await import('groq-sdk')).default;
    const groq = new Groq({ apiKey: env.groqApiKey });

    const prompt = `You are an autonomous AI agent called Moltchain that deploys onchain primitives on Base blockchain.

Analyze these trending Farcaster casts and identify if there's a strong narrative worth deploying a contract for.

TRENDING CASTS:
${trendingCasts.slice(0, 10).map((c, i) => `${i + 1}. ${c.substring(0, 200)}`).join('\n')}

CONTRACTS ALREADY DEPLOYED (avoid duplicates):
${pastDeployments.length > 0 ? pastDeployments.join(', ') : 'None yet'}

CONTRACT TYPES YOU CAN DEPLOY:
- ERC20: Meme tokens (default for most narratives)
- ERC1155: Multi-token collections, badges, NFT-like
- Vote: Community polls and decisions (use when people are debating/deciding something)
- Registry: Lists, catalogs, meme registries

RULES:
- Only suggest deployment if there's a CLEAR, STRONG narrative (strength >= 7)
- Name should be catchy and related to the narrative
- Symbol should be 3-5 characters, memorable
- For "vote" or "decide" topics → suggest Vote contract
- For "collection" or "nft" topics → suggest ERC1155
- For "list" or "registry" topics → suggest Registry
- Default to ERC20 for meme/token narratives
- Don't deploy for generic topics
- Don't duplicate past deployments

Respond in JSON format ONLY:
{
  "shouldDeploy": true/false,
  "narrative": "description of the narrative",
  "strength": 1-10,
  "contractType": "erc20|erc1155|vote|registry",
  "suggestedToken": { "name": "Contract Name", "symbol": "SYM" },
  "reason": "why you made this decision"
}

If no strong narrative found, set shouldDeploy to false.`;

    try {
        const completion = await groq.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'llama-3.1-70b-versatile',
            temperature: 0.7,
            max_tokens: 500,
        });

        const responseText = completion.choices[0]?.message?.content || '';

        // Extract JSON from response
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            console.log('⚠️ Could not parse LLM response');
            return null;
        }

        const analysis = JSON.parse(jsonMatch[0]) as {
            shouldDeploy: boolean;
            narrative: string;
            strength: number;
            suggestedToken?: { name: string; symbol: string };
            reason: string;
        };

        return {
            id: `signal-${Date.now()}`,
            narrative: analysis.narrative,
            strength: analysis.strength,
            source: 'farcaster',
            suggestedToken: analysis.suggestedToken,
            shouldDeploy: analysis.shouldDeploy && analysis.strength >= 7,
            reason: analysis.reason,
            timestamp: Date.now(),
        };
    } catch (error) {
        console.error('❌ LLM analysis error:', error);
        return null;
    }
}

// ============================================
// Main Signal Detection
// ============================================

/**
 * Detect signals from all sources.
 * This is called periodically by the autonomous daemon.
 * 
 * @returns The strongest detected signal, or null if none found
 */
export async function detectSignals(): Promise<DetectedSignal | null> {
    console.log('');
    console.log('🔍 Scanning for narratives...');

    // Step 1: Gather social signals
    console.log('   📱 Fetching Farcaster trends...');
    const [trendingCasts, baseCasts] = await Promise.all([
        fetchTrendingCasts(),
        fetchBaseCasts(),
    ]);

    const allCasts = [...trendingCasts, ...baseCasts];
    console.log(`   Found ${allCasts.length} casts to analyze`);

    if (allCasts.length === 0) {
        console.log('   No social signals found');
        return null;
    }

    // Step 2: Get past deployments to avoid duplicates
    const memory = loadMemory();
    const pastDeployments = memory.deployments.map(d => d.name);

    // Step 3: Analyze with LLM
    console.log('   🧠 Analyzing with LLM...');
    const signal = await analyzeSignalsWithLLM(allCasts, pastDeployments);

    if (signal) {
        if (signal.shouldDeploy) {
            console.log(`   ✅ Strong signal detected: "${signal.narrative}" (strength: ${signal.strength})`);
        } else {
            console.log(`   ⚪ No actionable signal: ${signal.reason}`);
        }
    }

    return signal;
}

/**
 * Check if we can deploy (balance check, rate limits, etc.)
 */
export async function canDeploy(): Promise<{ allowed: boolean; reason: string }> {
    // Check wallet balance
    const wallet = createWallet('base');
    const hasFunds = await wallet.hasSufficientBalance('0.005');

    if (!hasFunds) {
        return {
            allowed: false,
            reason: 'Insufficient wallet balance (need at least 0.005 ETH)'
        };
    }

    // Check rate limit (max 1 deployment per hour)
    const memory = loadMemory();
    const lastDeployment = memory.deployments[0];

    if (lastDeployment) {
        const hourAgo = Date.now() - 60 * 60 * 1000;
        if (lastDeployment.timestamp > hourAgo) {
            const minutesAgo = Math.floor((Date.now() - lastDeployment.timestamp) / 60000);
            return {
                allowed: false,
                reason: `Rate limited: Last deployment was ${minutesAgo} minutes ago (wait 60 min)`,
            };
        }
    }

    return { allowed: true, reason: 'Ready to deploy' };
}
