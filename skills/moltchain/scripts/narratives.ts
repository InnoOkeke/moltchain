/**
 * Moltchain - Narrative Detection
 * 
 * Analyze Farcaster trends to detect narratives worth deploying tokens for.
 */

interface Narrative {
    topic: string;
    strength: number; // 1-10
    reason: string;
    suggestedName: string;
    suggestedSymbol: string;
    keywords: string[];
}

interface Cast {
    text: string;
    reactions: {
        likes_count: number;
        recasts_count: number;
    };
    replies: {
        count: number;
    };
}

/**
 * Extract keywords and themes from trending casts
 */
function extractKeywords(casts: Cast[]): Map<string, number> {
    const keywords = new Map<string, number>();

    // Common words to ignore
    const stopWords = new Set([
        'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been',
        'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
        'could', 'should', 'may', 'might', 'must', 'shall', 'can',
        'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she',
        'it', 'we', 'they', 'my', 'your', 'his', 'her', 'its', 'our',
        'their', 'and', 'but', 'or', 'nor', 'for', 'yet', 'so', 'as',
        'if', 'of', 'in', 'on', 'at', 'to', 'from', 'by', 'with',
        'about', 'into', 'through', 'during', 'before', 'after',
        'above', 'below', 'up', 'down', 'out', 'off', 'over', 'under',
        'again', 'then', 'just', 'now', 'here', 'there', 'when', 'where',
        'why', 'how', 'all', 'each', 'every', 'both', 'few', 'more',
        'most', 'other', 'some', 'such', 'no', 'not', 'only', 'own',
        'same', 'than', 'too', 'very', 'just', 'also', 'even', 'still',
    ]);

    for (const cast of casts) {
        const words = cast.text.toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .split(/\s+/)
            .filter(w => w.length > 3 && !stopWords.has(w));

        const engagement = cast.reactions.likes_count +
            cast.reactions.recasts_count * 2 +
            cast.replies.count * 1.5;

        for (const word of words) {
            const current = keywords.get(word) || 0;
            keywords.set(word, current + engagement);
        }
    }

    return keywords;
}

/**
 * Analyze casts to detect narratives
 */
export function detectNarratives(casts: Cast[]): Narrative[] {
    const keywords = extractKeywords(casts);

    // Sort by weighted frequency
    const sorted = Array.from(keywords.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

    // Group into potential narratives
    const narratives: Narrative[] = [];

    for (const [keyword, score] of sorted) {
        // Calculate strength based on score distribution
        const maxScore = sorted[0][1];
        const strength = Math.min(10, Math.round((score / maxScore) * 10));

        if (strength >= 5) {
            narratives.push({
                topic: keyword,
                strength,
                reason: `High engagement around "${keyword}" (score: ${score.toFixed(0)})`,
                suggestedName: `${keyword.charAt(0).toUpperCase() + keyword.slice(1)} Token`,
                suggestedSymbol: keyword.toUpperCase().slice(0, 4),
                keywords: [keyword],
            });
        }
    }

    return narratives;
}

/**
 * Check if enough time has passed since last deployment
 */
export function canDeploy(lastDeploymentTime: number, minHours: number = 1): boolean {
    const hoursSince = (Date.now() - lastDeploymentTime) / (1000 * 60 * 60);
    return hoursSince >= minHours;
}

/**
 * Check if a similar token was recently deployed
 */
export function isDuplicate(
    topic: string,
    recentDeployments: string[],
    threshold: number = 0.7
): boolean {
    const normalize = (s: string) => s.toLowerCase().replace(/[^a-z]/g, '');
    const normalizedTopic = normalize(topic);

    for (const deployed of recentDeployments) {
        const normalizedDeployed = normalize(deployed);
        // Simple similarity check
        if (normalizedTopic.includes(normalizedDeployed) ||
            normalizedDeployed.includes(normalizedTopic)) {
            return true;
        }
    }

    return false;
}

// Export for OpenClaw
export default {
    detectNarratives,
    canDeploy,
    isDuplicate,
};
